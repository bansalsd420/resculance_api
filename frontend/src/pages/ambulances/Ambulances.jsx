import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Ambulance as AmbulanceIcon, MapPin, User, Trash2, X, UserPlus, UserMinus, Users, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import Select from '../../components/ui/Select';
import { ambulanceService, organizationService, userService } from '../../services';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';
import useWithGlobalLoader from '../../hooks/useWithGlobalLoader';
import { hasPermission, PERMISSIONS } from '../../utils/permissions';
import { formatRoleName } from '../../utils/roleUtils';

const DEVICE_TYPES = [
  { value: 'CAMERA', label: 'Camera' },
  { value: 'LIVE_LOCATION', label: 'Live Location' },
  { value: 'ECG', label: 'ECG Monitor' },
  { value: 'VITAL_MONITOR', label: 'Vital Monitor' },
  { value: 'GPS_TRACKER', label: 'GPS Tracker' },
];

export const Ambulances = () => {
  const [ambulances, setAmbulances] = useState([]);
  const [ambulancesCache, setAmbulancesCache] = useState({});
  const AMB_CACHE_TTL = 1000 * 60 * 5; // 5 minutes TTL for cache entries

  // Load cache from sessionStorage on mount (non-blocking)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('ambulancesCache');
      if (raw) {
        const parsed = JSON.parse(raw || '{}');
        setAmbulancesCache(parsed);
      }
    } catch (err) {
      // non-fatal
      console.warn('Failed to load ambulances cache from sessionStorage', err);
    }
  }, []);
  const [organizations, setOrganizations] = useState([]);
  const [orgTypeFilter, setOrgTypeFilter] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [selectedOrgInfo, setSelectedOrgInfo] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAmbulance, setSelectedAmbulance] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [devices, setDevices] = useState([]);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [assignmentAmbulance, setAssignmentAmbulance] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [ambulanceAssignments, setAmbulanceAssignments] = useState({});
  const [assigningUserId, setAssigningUserId] = useState(null);
  const [unassigningUserId, setUnassigningUserId] = useState(null);
  const { user } = useAuthStore();
  const { toast } = useToast();
  const runWithLoader = useWithGlobalLoader();

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    defaultValues: {
      devices: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'devices'
  });

  useEffect(() => {
    // load organizations with global loader
    runWithLoader(async () => {
      await fetchOrganizations();
    }, 'Loading organizations...').catch(err => console.error(err));
  }, []);

  // Helper: ensure a superadmin has selected an organization before attempting network calls
  const ensureOrgSelected = () => {
    if (user?.role === 'superadmin' && !selectedOrgId) {
      toast.info('Please select an Organization Type and an Organization before loading ambulances.');
      return false;
    }
    return true;
  };

  // Listen for global cache reset events and force refresh
  useEffect(() => {
    const handler = async () => {
      try {
        // clear in-memory and sessionStorage cache for ambulances
        setAmbulancesCache({});
        try { sessionStorage.removeItem('ambulancesCache'); } catch (err) {}
        // Only fetch if org selected (superadmin must pick org)
        if (ensureOrgSelected()) await fetchAmbulances(true);
      } catch (err) {
        console.error('Global reset handler failed for ambulances', err);
      } finally {
        window.dispatchEvent(new CustomEvent('global:cache-reset-done', { detail: { page: 'ambulances' } }));
      }
    };
    window.addEventListener('global:cache-reset', handler);
    return () => window.removeEventListener('global:cache-reset', handler);
  }, [selectedOrgId, activeTab, user]);

  useEffect(() => {
    // Fetch ambulances when filters change. For superadmin require an organization selected first.
    if (user?.role === 'superadmin' && !selectedOrgId) {
      setAmbulances([]);
      return;
    }

    runWithLoader(async () => {
      await fetchAmbulances();
    }, 'Loading ambulances...').catch(err => console.error(err));
  }, [filterStatus, selectedOrgId, activeTab]);

  const fetchOrganizations = async () => {
    try {
      const response = await organizationService.getAll();
      const raw = response.data?.data?.organizations || response.data?.organizations || response.data || [];
      // Normalize organization type to lowercase canonical values used by this UI
      const normalized = raw.map(org => ({
        ...org,
        type: (org.type || org.type === 0) ? org.type.toString().toLowerCase() : '',
        // keep backwards-compatible name/code fields
        name: org.name || org.org_name || org.organization_name,
        code: org.code || org.organization_code || org.org_code
      }));
      setOrganizations(normalized);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      toast.error('Failed to load organizations');
    }
  };

  const fetchAmbulances = async (force = false) => {
    setLoading(true);
    try {
      // Build cache key similar to Users page: scope by organization + activeTab
      const scopeKey = user?.role === 'superadmin'
        ? `org:${selectedOrgId || 'none'}`
        : `org:${user?.organizationId || 'own'}`;
      const cacheKey = `${scopeKey}|tab:${activeTab}`;

      // If cache exists and not forcing, use it and avoid network call
      if (!force && ambulancesCache[cacheKey]) {
        const cached = ambulancesCache[cacheKey];
        const age = cached.ts ? (Date.now() - cached.ts) : Infinity;
        if (age < AMB_CACHE_TTL) {
          setAmbulances(cached.ambulances || []);
          setAmbulanceAssignments(cached.assignments || {});
          setLoading(false);
          return;
        } else {
          // expired: remove from memory and sessionStorage then continue to fetch
          const next = { ...ambulancesCache };
          delete next[cacheKey];
          setAmbulancesCache(next);
          try { sessionStorage.setItem('ambulancesCache', JSON.stringify(next)); } catch (err) { /* ignore */ }
        }
      }
  // Determine status filter from activeTab
  let statusParam = null;
  if (activeTab === 'approvals') statusParam = 'pending_approval';
  else if (activeTab === 'available') statusParam = 'available';
  else if (activeTab === 'maintenance') statusParam = 'maintenance';
  else if (activeTab === 'active') statusParam = 'active';
  else if (activeTab === 'inactive') statusParam = 'inactive';
  else if (activeTab === 'partnered') statusParam = null;

      const params = {};
      if (statusParam) params.status = statusParam;
      // include organizationId for superadmin or use user's organization
      if (activeTab === 'partnered') {
        // partnered view: request ambulances belonging to fleets partnered with the selected hospital
  params.partnered = 'true';
        if (user?.role === 'superadmin') {
          if (selectedOrgId) params.hospitalId = selectedOrgId;
        } else if (user?.organizationType === 'hospital') {
          // hospital users will see their partnered fleets
          // backend will infer hospital from the token
        }
      } else {
        if (user?.role === 'superadmin') {
          if (selectedOrgId) params.organizationId = selectedOrgId;
        } else {
          params.organizationId = user?.organizationId;
        }
      }

  const response = await ambulanceService.getAll(params);
  const ambulancesData = response.data?.data?.ambulances || response.data?.ambulances || response.data || [];
  setAmbulances(ambulancesData);

      // Fetch assigned users in parallel (tolerate individual failures)
      const assignmentPromises = ambulancesData.map(a => (
        ambulanceService.getAssignedUsers(a.id)
          .then(res => ({ id: a.id, users: res.data?.data?.users || res.data?.users || [] }))
          .catch(err => {
            console.error(`Failed to fetch assigned users for ambulance ${a.id}:`, err);
            return { id: a.id, users: [] };
          })
      ));

      const settled = await Promise.allSettled(assignmentPromises);
      const assignments = {};
      for (const s of settled) {
        if (s.status === 'fulfilled' && s.value) {
          assignments[s.value.id] = s.value.users || [];
        }
      }
      setAmbulanceAssignments(assignments);

      // Cache the result (ambulances list + assignments) for this scope/tab with timestamp
      const entry = { ambulances: ambulancesData, assignments, ts: Date.now() };
      setAmbulancesCache(prev => {
        const next = { ...prev, [cacheKey]: entry };
        try { sessionStorage.setItem('ambulancesCache', JSON.stringify(next)); } catch (err) { console.warn('Failed to persist ambulances cache', err); }
        return next;
      });
    } catch (error) {
      console.error('Failed to fetch ambulances:', error);
      toast.error('Failed to load ambulances');
      setAmbulances([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDevices = async (ambulanceId) => {
    try {
      const response = await ambulanceService.getDevices(ambulanceId);
      // backend returns { success: true, data: [devices] }
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Failed to fetch devices:', error);
      return [];
    }
  };

  const handleOpenModal = async (ambulance = null) => {
    setSelectedAmbulance(ambulance);
    
    if (ambulance) {
      // Fetch devices for existing ambulance
      const ambulanceDevices = await fetchDevices(ambulance.id);
      setDevices(ambulanceDevices);
      
      // Map backend ambulance fields to form field names
      reset({
        registrationNumber: ambulance.registration_number || ambulance.vehicleNumber || ambulance.registrationNumber,
        vehicleModel: ambulance.vehicle_model || ambulance.vehicleModel,
        vehicleType: ambulance.vehicle_type || ambulance.vehicleType,
        status: ambulance.status,
        organizationId: ambulance.organization_id || ambulance.organizationId,
        devices: ambulanceDevices.map(d => ({
          id: d.id,
          deviceName: d.device_name || d.deviceName,
          deviceType: d.device_type || d.deviceType,
          deviceId: d.device_id || d.deviceId,
          deviceUsername: d.device_username || d.deviceUsername,
          devicePassword: d.device_password || d.devicePassword,
          deviceApi: d.device_api || d.deviceApi,
          manufacturer: d.manufacturer,
          model: d.model
        }))
      });
    } else {
      const defaultData = user?.role === 'superadmin' ? {} : { organizationId: user?.organizationId };
      // If the page has an organization selected, preload it into the create form
      if (user?.role === 'superadmin' && selectedOrgId) {
        defaultData.organizationId = selectedOrgId;
      }
      else {
        // no-op: we intentionally don't show organization inputs in the modal anymore
      }

      reset({ ...defaultData, devices: [] });
      setDevices([]);
    }
    
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAmbulance(null);
    setDevices([]);
    reset({ devices: [] });
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
  // Separate devices from ambulance data
  const { devices: deviceData, ...ambulanceData } = data;

      let ambulanceId;

  if (selectedAmbulance) {
        // For update, backend expects vehicleModel, vehicleType and status.
        // Map registrationNumber -> vehicleNumber if present in the form but update endpoint doesn't require it.
        const updatePayload = {
          vehicleModel: ambulanceData.vehicleModel,
          vehicleType: ambulanceData.vehicleType,
          status: ambulanceData.status,
        };

        const updateResp = await ambulanceService.update(selectedAmbulance.id, updatePayload);
        ambulanceId = selectedAmbulance.id;
        const warning = updateResp?.data?.warning;
        if (warning) {
          toast.warn(warning.message || 'Ambulance updated with warning');
        } else {
          toast.success('Ambulance updated successfully');
        }
      } else {
        // Create: backend expects vehicleNumber, vehicleModel, vehicleType, organizationId
        // For superadmin, organizationId is taken from the page selection (`selectedOrgId`).
        const orgIdForCreate = user?.role === 'superadmin' ? selectedOrgId : user?.organizationId;
        if (user?.role === 'superadmin' && !orgIdForCreate) {
          toast.info('Please select an Organization Type and an Organization before creating an ambulance.');
          setSubmitting(false);
          return;
        }

        const createPayload = {
          vehicleNumber: ambulanceData.registrationNumber || ambulanceData.vehicleNumber,
          vehicleModel: ambulanceData.vehicleModel,
          vehicleType: ambulanceData.vehicleType,
          organizationId: orgIdForCreate,
        };

        const response = await ambulanceService.create(createPayload);
        // backend responds with { success:true, data: { ambulanceId } }
        ambulanceId = response.data?.data?.ambulanceId || response.data?.ambulanceId || response.data;
        toast.success('Ambulance created successfully');
      }

      // Handle devices
      if (deviceData && deviceData.length > 0) {
        // Delete existing devices that are not in the new list
        const existingDeviceIds = devices.map(d => d.id);
        const newDeviceIds = deviceData.filter(d => d.id).map(d => d.id);
        const devicesToDelete = existingDeviceIds.filter(id => !newDeviceIds.includes(id));
        
        for (const deviceId of devicesToDelete) {
          try {
            await ambulanceService.deleteDevice(deviceId);
          } catch (error) {
            console.error('Failed to delete device:', error);
          }
        }

        // Create or update devices
        for (const device of deviceData) {
          try {
            if (device.id) {
              // Update existing device
              await ambulanceService.updateDevice(device.id, device);
            } else {
              // Create new device
              await ambulanceService.createDevice(ambulanceId, device);
            }
          } catch (error) {
            console.error('Failed to save device:', error);
            const msg = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to save device';
            toast.error(`Failed to save device ${device.deviceName}: ${msg}`);
          }
        }
      }

      if (ensureOrgSelected()) runWithLoader(async () => { await fetchAmbulances(true); }, 'Refreshing ambulances...').catch(err => console.error(err));
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save ambulance:', error);
      const msg = error?.response?.data?.error || error?.response?.data?.message || error?.message || (selectedAmbulance ? 'Failed to update ambulance' : 'Failed to create ambulance');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await ambulanceService.approve(id);
  toast.success('Ambulance approved successfully');
  if (ensureOrgSelected()) runWithLoader(async () => { await fetchAmbulances(true); }, 'Refreshing ambulances...').catch(err => console.error(err));
      handleCloseModal();
    } catch (error) {
      console.error('Failed to approve ambulance:', error);
      const msg = error?.response?.data?.message || 'Failed to approve ambulance';
      toast.error(msg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this ambulance? All associated devices will also be deleted.')) {
      try {
        await ambulanceService.delete(id);
  toast.success('Ambulance deleted successfully');
  if (ensureOrgSelected()) runWithLoader(async () => { await fetchAmbulances(true); }, 'Refreshing ambulances...').catch(err => console.error(err));
      } catch (error) {
        console.error('Failed to delete ambulance:', error);
        toast.error('Failed to delete ambulance');
      }
    }
  };

  const handleDeactivate = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this ambulance? All assigned staff will be unassigned and active patients will be offboarded.')) {
      try {
        await ambulanceService.deactivate(id);
        toast.success('Ambulance deactivated successfully');
        if (ensureOrgSelected()) runWithLoader(async () => { await fetchAmbulances(true); }, 'Refreshing ambulances...').catch(err => console.error(err));
      } catch (error) {
        console.error('Failed to deactivate ambulance:', error);
        const msg = error?.response?.data?.message || 'Failed to deactivate ambulance';
        toast.error(msg);
      }
    }
  };

  const handleActivate = async (id) => {
    if (window.confirm('Are you sure you want to activate this ambulance?')) {
      try {
        await ambulanceService.activate(id);
        toast.success('Ambulance activated successfully');
        if (ensureOrgSelected()) runWithLoader(async () => { await fetchAmbulances(true); }, 'Refreshing ambulances...').catch(err => console.error(err));
      } catch (error) {
        console.error('Failed to activate ambulance:', error);
        const msg = error?.response?.data?.message || 'Failed to activate ambulance';
        toast.error(msg);
      }
    }
  };

  const handleAddDevice = () => {
    append({
      deviceName: '',
      deviceType: '',
      deviceId: '',
      deviceUsername: '',
      devicePassword: '',
      deviceApi: '',
      manufacturer: '',
      model: ''
    });
  };

  const handleOpenAssignmentModal = async (ambulance) => {
    setAssignmentAmbulance(ambulance);
    
    try {
      // Fetch assigned users for this ambulance
      const assignedResponse = await ambulanceService.getAssignedUsers(ambulance.id);
      const assigned = assignedResponse.data?.data?.users || assignedResponse.data?.users || [];
      setAssignedUsers(assigned);

      // Fetch available users for assignment. Rules:
      // - If superadmin and a hospital is selected in the page (selectedOrgId), fetch that hospital's staff so superadmin can assign hospital staff.
      // - If the requester is a hospital user, fetch the hospital's staff (they assign their own staff to partnered ambulances).
      // - Otherwise (fleet view), fetch staff from the ambulance's owning organization (fleet owner).
      let orgIdForUsers = null;
      const selectedIsHospital = selectedOrgInfo && selectedOrgInfo.type === 'hospital';
      if (user?.role === 'superadmin' && selectedOrgId && selectedIsHospital) {
        orgIdForUsers = selectedOrgId;
      } else if (user?.organizationType === 'hospital') {
        orgIdForUsers = user.organizationId;
      } else {
        orgIdForUsers = ambulance.organization_id || ambulance.organizationId || selectedOrgId || user?.organizationId;
      }
      const usersResponse = await userService.getAll({
        organizationId: orgIdForUsers,
      });
      const allUsers = usersResponse.data?.data?.users || usersResponse.data?.users || usersResponse.data || [];
      
      // Filter for doctors, paramedics, and drivers only, AND must have status 'active' (approved users only).
      // Roles in the backend may be namespaced (e.g. 'hospital_doctor' or 'fleet_doctor'),
      // so match by substring to include those variants.
      const staffUsers = allUsers.filter(u => {
        const r = (u.role || '').toString().toLowerCase();
        const s = (u.status || '').toString().toLowerCase();
        const isStaff = r.includes('doctor') || r.includes('paramedic') || r.includes('driver');
        const isApproved = s === 'active';
        return isStaff && isApproved;
      }).map(u => ({
        ...u,
        // normalize role label for display (e.g. 'fleet_doctor' -> 'Doctor')
        roleLabel: (u.role || '').toString().toLowerCase().includes('doctor') ? 'Doctor'
          : (u.role || '').toString().toLowerCase().includes('paramedic') ? 'Paramedic'
          : (u.role || '').toString().toLowerCase().includes('driver') ? 'Driver'
          : (u.role || '').toString()
      }));
      
      // Filter out already assigned users
      const assignedUserIds = assigned.map(u => u.id);
      const available = staffUsers.filter(u => !assignedUserIds.includes(u.id));
      // For UI convenience map to expected frontend fields and show roleLabel
      const availableMapped = available.map(u => ({
        id: u.id,
        firstName: u.firstName || u.first_name || u.first_name || '',
        lastName: u.lastName || u.last_name || u.last_name || '',
        role: u.roleLabel || u.role || '',
        roleKey: u.role || ''
      }));
      setAvailableUsers(availableMapped);
      
      console.log('Assignment Modal: Fetched users', { 
        assigned: assigned.length, 
        available: availableMapped.length,
        staffUsers: staffUsers.length 
      });
      
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users for assignment');
      setAvailableUsers([]);
      setAssignedUsers([]);
    }
    
    setIsAssignmentModalOpen(true);
  };

  const handleCloseAssignmentModal = () => {
    setIsAssignmentModalOpen(false);
    setAssignmentAmbulance(null);
    setAvailableUsers([]);
    setAssignedUsers([]);
  };

  const handleAssignUser = async (userId, role) => {
    setAssigningUserId(userId);
    try {
      // If superadmin is acting on a selected hospital, send assigningOrganizationId so backend records the correct assigning org
      const assigningOrganizationId = (user?.role === 'superadmin' && selectedOrgId && selectedOrgInfo?.type === 'hospital') ? selectedOrgId : null;
      
      console.log('[handleAssignUser] Assigning user:', { 
        userId, 
        role, 
        assigningOrganizationId,
        selectedOrgId,
        selectedOrgInfo,
        userRole: user?.role
      });
      
      await ambulanceService.assign(assignmentAmbulance.id, userId, role, assigningOrganizationId);
      toast.success('User assigned successfully');
      
  // Refresh assigned users
      const assignedResponse = await ambulanceService.getAssignedUsers(assignmentAmbulance.id);
      const assigned = assignedResponse.data?.data?.users || assignedResponse.data?.users || [];
      setAssignedUsers(assigned);
      
      // Update ambulanceAssignments state
      setAmbulanceAssignments(prev => ({
        ...prev,
        [assignmentAmbulance.id]: assigned
      }));
      
      // Remove from available users
      setAvailableUsers(prev => prev.filter(u => u.id !== userId));
      
    } catch (error) {
      console.error('Failed to assign user:', error);
      const msg = error?.response?.data?.message || error?.message || 'Failed to assign user';
      toast.error(msg);
    } finally {
      setAssigningUserId(null);
    }
  };

  const handleUnassignUser = async (userId) => {
    setUnassigningUserId(userId);
    try {
      await ambulanceService.unassign(assignmentAmbulance.id, userId);
      toast.success('User unassigned successfully');
      
      // Refresh assigned users
      const assignedResponse = await ambulanceService.getAssignedUsers(assignmentAmbulance.id);
      const assigned = assignedResponse.data?.data?.users || assignedResponse.data?.users || [];
      setAssignedUsers(assigned);
      
      // Update ambulanceAssignments state
      setAmbulanceAssignments(prev => ({
        ...prev,
        [assignmentAmbulance.id]: assigned
      }));
      
      // Add back to available users
      const orgIdForAllUsers = assignmentAmbulance.organization_id || assignmentAmbulance.organizationId || selectedOrgId || user?.organizationId;
      const allUsersResponse = await userService.getAll({
        organizationId: orgIdForAllUsers,
      });
      const allUsers = allUsersResponse.data?.data?.users || allUsersResponse.data?.users || allUsersResponse.data || [];
      const staffUsers = allUsers.filter(u => {
        const r = (u.role || '').toString().toLowerCase();
        return r.includes('doctor') || r.includes('paramedic') || r.includes('driver');
      });
      const assignedUserIds = assigned.map(u => u.id);
      const available = staffUsers.filter(u => !assignedUserIds.includes(u.id));
      setAvailableUsers(available);
      
    } catch (error) {
      console.error('Failed to unassign user:', error);
      const msg = error?.response?.data?.message || error?.message || 'Failed to unassign user';
      toast.error(msg);
    } finally {
      setUnassigningUserId(null);
    }
  };

  const columns = [
    {
      header: 'Vehicle',
      accessor: 'registration_number',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <AmbulanceIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium">{row.registration_number || row.vehicleNumber}</p>
            <p className="text-sm text-secondary">{row.vehicle_model || row.vehicleModel}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: 'vehicle_type',
      render: (row) => {
        const type = row.vehicle_type || row.vehicleType;
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            type === 'BLS' ? 'bg-blue-100 text-blue-800' :
            type === 'ALS' ? 'bg-purple-100 text-purple-800' :
            'bg-green-100 text-green-800'
          }`}>
            {type}
          </span>
        );
      },
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          row.status === 'available' ? 'bg-green-100 text-green-800' :
          row.status === 'on-duty' || row.status === 'active' ? 'bg-blue-100 text-blue-800' :
          row.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {row.status}
        </span>
      ),
    },
    // Organization column removed — page is scoped by selected organization
    {
      header: 'Paramedic',
      accessor: 'paramedicId',
      render: (row) => {
        const assigned = ambulanceAssignments[row.id] || [];
        const paramedic = Array.isArray(assigned) ? assigned.find(u => u.role === 'PARAMEDIC') : null;
        return (
          <div className="flex items-center gap-2 text-sm">
            {paramedic ? (
              <>
                <User className="w-4 h-4 text-secondary" />
                <span>{paramedic.firstName} {paramedic.lastName}</span>
              </>
            ) : (
              <span className="text-secondary">Not assigned</span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Location',
      accessor: 'currentLatitude',
      render: (row) => (
        <div className="flex items-center gap-2 text-sm">
          {row.currentLatitude && row.currentLongitude ? (
            <>
              <MapPin className="w-4 h-4 text-secondary" />
              <span>
                {row.currentLatitude.toFixed(4)}, {row.currentLongitude.toFixed(4)}
              </span>
            </>
          ) : (
            <span className="text-secondary">No location</span>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      render: (row) => {
        const status = (row.status || row.status === 0) ? String(row.status).toLowerCase() : '';
        const isPending = status === 'pending_approval';
        const isInactive = status === 'inactive';
        const isMaintenance = status === 'maintenance';
        const isSuperadmin = user?.role === 'superadmin';
        const isAdmin = user?.role?.toLowerCase().includes('admin');
        const isDoctor = user?.role?.toLowerCase().includes('doctor');
        const isParamedic = user?.role?.toLowerCase().includes('paramedic');
        const isMedicalStaff = isDoctor || isParamedic;
        
        return (
          <div className="flex items-center gap-2">
            {/* Edit - Only superadmin and admins can edit */}
            {(isSuperadmin || isAdmin) && (
              <Button size="sm" variant="secondary" onClick={() => handleOpenModal(row)}>
                Edit
              </Button>
            )}

            {/* Approve - Only superadmin, only for pending ambulances */}
            {isPending && isSuperadmin && (
              <Button size="sm" variant="success" onClick={() => handleApprove(row.id)}>
                Approve
              </Button>
            )}

            {/* Assign Staff - Everyone except when pending or maintenance */}
            {!isPending && !isMaintenance ? (
              <Button size="sm" variant="success" onClick={() => handleOpenAssignmentModal(row)}>
                <UserPlus className="w-4 h-4 mr-1" />
                Assign Staff
              </Button>
            ) : isMaintenance ? (
              <Button size="sm" variant="outline" disabled title="Cannot assign staff to ambulances in maintenance">
                <UserPlus className="w-4 h-4 mr-1" />
                Assign Staff
              </Button>
            ) : (
              <Button size="sm" variant="outline" disabled>
                <UserPlus className="w-4 h-4 mr-1" />
                Assign Staff
              </Button>
            )}

            {/* Deactivate/Activate - Superadmin only */}
            {isSuperadmin && !isPending && (
              <>
                {isInactive ? (
                  <Button size="sm" variant="success" onClick={() => handleActivate(row.id)}>
                    Activate
                  </Button>
                ) : (
                  <Button size="sm" variant="danger" onClick={() => handleDeactivate(row.id)}>
                    Deactivate
                  </Button>
                )}
              </>
            )}
          </div>
        );
      },
    },
  ];

  const filteredAmbulances = ambulances.filter(ambulance => 
    (ambulance.registration_number || ambulance.vehicleNumber || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ambulance.vehicle_model || ambulance.vehicleModel || '')?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-text mb-2">Ambulances</h1>
          <p className="text-text-secondary">Manage your fleet of ambulances</p>
        </div>
        {hasPermission(user?.role, PERMISSIONS.CREATE_AMBULANCE) && (
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-5 h-5 mr-2" />
            Add Ambulance
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
                activeTab === 'all' ? 'bg-primary text-white shadow-sm' : 'bg-background-card text-text-secondary hover:bg-background'
              }`}
            >
              All
            </button>
            {hasPermission(user?.role, PERMISSIONS.APPROVE_AMBULANCE) && (
              <button
                onClick={() => setActiveTab('approvals')}
                className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
                  activeTab === 'approvals' ? 'bg-primary text-white shadow-sm' : 'bg-background-card text-text-secondary hover:bg-background'
                }`}
              >
                Approvals
              </button>
            )}
            {(
              user?.role === 'superadmin' ||
              hasPermission(user?.role, PERMISSIONS.VIEW_PARTNERED_AMBULANCES) ||
              (user?.role && (user.role.toString().toLowerCase().includes('doctor') || user.role.toString().toLowerCase().includes('paramedic'))) ||
              user?.organizationType === 'hospital'
            ) && (
              <button
                onClick={() => setActiveTab('partnered')}
                className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
                  activeTab === 'partnered' ? 'bg-primary text-white shadow-sm' : 'bg-background-card text-text-secondary hover:bg-background'
                }`}
              >
                Partnered
              </button>
            )}
            <button
              onClick={() => setActiveTab('available')}
              className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
                activeTab === 'available' ? 'bg-primary text-white shadow-sm' : 'bg-background-card text-text-secondary hover:bg-background'
              }`}
            >
              Available
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
                activeTab === 'active' ? 'bg-primary text-white shadow-sm' : 'bg-background-card text-text-secondary hover:bg-background'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
                activeTab === 'maintenance' ? 'bg-primary text-white shadow-sm' : 'bg-background-card text-text-secondary hover:bg-background'
              }`}
            >
              Maintenance
            </button>
            <button
              onClick={() => setActiveTab('inactive')}
              className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
                activeTab === 'inactive' ? 'bg-primary text-white shadow-sm' : 'bg-background-card text-text-secondary hover:bg-background'
              }`}
            >
              Inactive
            </button>
          </div>

          <div className="w-full md:flex-1 md:max-w-md md:ml-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <input
              type="text"
              placeholder="Search ambulances..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-12 w-full"
            />
          </div>
        </div>
      </Card>

      {/* Organization filters (superadmin only) with selected org info on the right */}
      {user?.role === 'superadmin' && (
        <Card className="p-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
            <div>
                <label className="block text-xs font-medium text-text mb-0">Organization Type</label>
              <Select
                isClearable
                value={orgTypeFilter ? { value: orgTypeFilter, label: orgTypeFilter === 'hospital' ? 'Hospital' : 'Fleet Owner' } : null}
                onChange={(opt) => { const v = opt?.value || ''; setOrgTypeFilter(v); setSelectedOrgId(null); setSelectedOrgInfo(null); }}
                options={[{ value: '', label: 'All Types' }, { value: 'hospital', label: 'Hospital' }, { value: 'fleet_owner', label: 'Fleet Owner' }]}
                styles={{
                  control: (base, state) => ({ ...base, minHeight: 30, borderRadius: 6, borderColor: state.isFocused ? '#34d399' : '#e6eef9', boxShadow: 'none', paddingLeft: 6 }),
                  option: (base) => ({ ...base, padding: '4px 6px' })
                }}
              />
            </div>

            <div className="w-full">
              <label className="block text-xs font-medium text-text mb-0">Select Organization</label>
              <div title={!orgTypeFilter ? 'Please select an Organization Type first' : ''}>
                <Select
                  isDisabled={!orgTypeFilter}
                  placeholder={orgTypeFilter ? 'Type to search or pick an organization' : 'Select an organization type first'}
                  options={organizations.filter(o => (!orgTypeFilter || o.type === orgTypeFilter)).map(o => ({ value: o.id, label: `${o.name} (${o.code})` }))}
                  value={selectedOrgId ? { value: selectedOrgId, label: `${selectedOrgInfo?.name || ''} (${selectedOrgInfo?.code || ''})` } : null}
                  onChange={(opt) => {
                    if (opt) {
                      setSelectedOrgId(opt.value);
                      const info = organizations.find(o => o.id === opt.value) || null;
                      setSelectedOrgInfo(info);
                    } else {
                      setSelectedOrgId(null);
                      setSelectedOrgInfo(null);
                    }
                  }}
                  classNamePrefix="react-select"
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  menuPosition="fixed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <div className="text-right">
                {selectedOrgInfo ? (
                  <>
                    <p className="font-semibold">{selectedOrgInfo.name} <span className="text-sm text-secondary">({selectedOrgInfo.code})</span></p>
                    <p className="text-sm text-secondary">Type: {selectedOrgInfo.type}</p>
                    <div>
                      <button onClick={() => { setSelectedOrgId(null); setOrgTypeFilter(''); setSelectedOrgInfo(null); }} className="text-sm text-primary underline">Clear selection</button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-secondary">Select an organization to view details here</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* If superadmin and no organization selected, prompt selection */}
      {user?.role === 'superadmin' && !selectedOrgId && (
        <Card>
          <div className="py-3 text-center">
              <p className="text-sm text-secondary">Please select an Organization Type and an Organization above to load ambulances for that organization.</p>
            </div>
          </Card>
      )}

      {/* Ambulances Table */}
      {activeTab === 'partnered' ? (
        // Single table grouped by fleet owner (organization header rows)
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.accessor || col.header}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(() => {
                if (!filteredAmbulances || filteredAmbulances.length === 0) {
                  return (
                    <tr>
                      <td colSpan={columns.length} className="px-6 py-8 text-center text-sm text-text-secondary">
                        No partnered ambulances found.
                      </td>
                    </tr>
                  );
                }

                const groups = new Map();
                filteredAmbulances.forEach((a) => {
                  const key = a.organization_id || 'unknown';
                  if (!groups.has(key)) groups.set(key, []);
                  groups.get(key).push(a);
                });

                const getOrgName = (orgId) => {
                  const org = (organizations || []).find((o) => String(o.id) === String(orgId));
                  return org ? org.name : (orgId === 'unknown' ? 'Unknown owner' : `Org ${orgId}`);
                };

                const rows = [];
                groups.forEach((groupAmbs, orgId) => {
                  rows.push(
                    <tr key={`org-${orgId}`} className="bg-gray-100">
                      <td colSpan={columns.length} className="px-6 py-2 font-semibold text-gray-700">
                        {getOrgName(orgId)}
                      </td>
                    </tr>
                  );

                  groupAmbs.forEach((amb) => {
                    rows.push(
                      <tr key={`amb-${amb.id}`} className="hover:bg-gray-50">
                        {columns.map((col) => {
                          const cellKey = (col.accessor || col.header) + '-' + amb.id;
                          const value = col.accessor ? (typeof col.accessor === 'function' ? col.accessor(amb) : amb[col.accessor]) : null;
                          if (col.render) {
                            return (
                              <td key={cellKey} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {col.render(amb)}
                              </td>
                            );
                          }
                          return (
                            <td key={cellKey} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{value}</td>
                          );
                        })}
                      </tr>
                    );
                  });
                });

                return rows;
              })()}
            </tbody>
          </table>
        </div>
      ) : (
        <Table
          columns={columns}
          data={filteredAmbulances}
          onRefresh={() => {
            if (ensureOrgSelected()) runWithLoader(async () => { await fetchAmbulances(true); }, 'Refreshing ambulances...').catch(err => console.error(err));
          }}
          isRefreshing={loading}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedAmbulance ? 'Edit Ambulance' : 'Add Ambulance'}
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            {selectedAmbulance && user?.role === 'superadmin' && selectedAmbulance.status === 'pending_approval' && (
              <Button variant="success" onClick={() => handleApprove(selectedAmbulance.id)}>
                Approve
              </Button>
            )}
            <Button loading={submitting} onClick={handleSubmit(onSubmit)}>
              {selectedAmbulance ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Registration Number"
              {...register('registrationNumber', { required: 'Registration number is required' })}
              error={errors.registrationNumber?.message}
              placeholder="AMB-2025-001"
            />
            <Input
              label="Vehicle Model"
              {...register('vehicleModel', { required: 'Vehicle model is required' })}
              error={errors.vehicleModel?.message}
              placeholder="Mercedes Sprinter"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">Vehicle Type</label>
              <Controller
                name="vehicleType"
                control={control}
                defaultValue={''}
                rules={{ required: 'Type is required' }}
                render={({ field }) => {
                  const options = [
                    { value: 'BLS', label: 'BLS (Basic Life Support)' },
                    { value: 'ALS', label: 'ALS (Advanced Life Support)' },
                    { value: 'SCU', label: 'SCU (Special Care Unit)' },
                  ];
                  const value = options.find(o => o.value === field.value) || null;
                  return (
                    <Select
                      classNamePrefix="react-select"
                      options={options}
                      value={value}
                      onChange={(opt) => field.onChange(opt ? opt.value : '')}
                      placeholder="Select Type"
                    />
                  );
                }}
              />
              {errors.vehicleType && <p className="mt-1 text-sm text-red-500">{errors.vehicleType.message}</p>}
            </div>

            {selectedAmbulance && (
              <div>
                <label className="block text-sm font-medium text-text mb-2">Status</label>
                <Controller
                  name="status"
                  control={control}
                  defaultValue={''}
                  render={({ field }) => {
                    // Available statuses for selection; pending_approval and inactive are not selectable here
                    const options = [
                      { value: 'available', label: 'Available' },
                      { value: 'active', label: 'Active' },
                      { value: 'maintenance', label: 'Maintenance' },
                    ];
                    const value = options.find(o => o.value === field.value) || null;
                    return (
                      <Select
                        classNamePrefix="react-select"
                        options={options}
                        value={value}
                        onChange={(opt) => field.onChange(opt ? opt.value : '')}
                        placeholder="Select Status"
                      />
                    );
                  }}
                />
              </div>
            )}
          </div>

          {/* Organization selection is intentionally removed from the modal.
              OrganizationId is taken from the page selection (`selectedOrgId`) for superadmins
              and from the current user's organization for other roles. */}

          {/* Devices Section */}
          <div className="border-t pt-4 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Devices</h3>
              <Button type="button" size="sm" onClick={handleAddDevice}>
                <Plus className="w-4 h-4 mr-1" />
                Add Device
              </Button>
            </div>

            {fields.length === 0 && (
              <p className="text-sm text-secondary text-center py-4">
                No devices added. Click "Add Device" to add devices to this ambulance.
              </p>
            )}

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 bg-background-card relative">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <h4 className="font-medium mb-3">Device {index + 1}</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      label="Device Name *"
                      {...register(`devices.${index}.deviceName`, { required: 'Device name is required' })}
                      error={errors.devices?.[index]?.deviceName?.message}
                      placeholder="Front Camera"
                    />

                    <div>
                      <label className="block text-sm font-medium text-text mb-2">Device Type *</label>
                      <Controller
                        name={`devices.${index}.deviceType`}
                        control={control}
                        defaultValue={field.deviceType || ''}
                        rules={{ required: 'Device type is required' }}
                        render={({ field: f }) => {
                          const options = DEVICE_TYPES.map(t => ({ value: t.value, label: t.label }));
                          const value = options.find(o => o.value === f.value) || null;
                          return (
                            <Select
                              classNamePrefix="react-select"
                              options={options}
                              value={value}
                              onChange={(opt) => f.onChange(opt ? opt.value : '')}
                              placeholder="Select Type"
                            />
                          );
                        }}
                      />
                      {errors.devices?.[index]?.deviceType && (
                        <p className="mt-1 text-sm text-red-500">{errors.devices[index].deviceType.message}</p>
                      )}
                    </div>

                    <Input
                      label="Device ID *"
                      {...register(`devices.${index}.deviceId`, { required: 'Device ID is required' })}
                      error={errors.devices?.[index]?.deviceId?.message}
                      placeholder="100000000001"
                    />

                    <Input
                      label="Device Username"
                      {...register(`devices.${index}.deviceUsername`)}
                      placeholder="testing"
                    />

                    <Input
                      label="Device Password"
                      type="password"
                      {...register(`devices.${index}.devicePassword`)}
                      placeholder="Testing@123"
                    />

                    <Input
                      label="Device API URL"
                      {...register(`devices.${index}.deviceApi`)}
                      placeholder="http://205.147.109.152"
                    />

                    <Input
                      label="Manufacturer"
                      {...register(`devices.${index}.manufacturer`)}
                      placeholder="Sony"
                    />

                    <Input
                      label="Model"
                      {...register(`devices.${index}.model`)}
                      placeholder="XYZ-2000"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* Assignment Modal - Enhanced Design */}
      <Modal
        isOpen={isAssignmentModalOpen}
        onClose={handleCloseAssignmentModal}
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Assign Staff</h3>
              <p className="text-sm text-text-secondary font-normal">
                {assignmentAmbulance?.registration_number || assignmentAmbulance?.vehicleNumber}
              </p>
            </div>
          </div>
        }
        size="xl"
      >
        <div className="space-y-6">
          {assignmentAmbulance?.current_hospital_id && assignmentAmbulance?.current_hospital_id !== user?.organizationId && (
            <div className="p-4 bg-warning/10 border-2 border-warning/30 rounded-xl flex items-start gap-3">
              <div className="w-8 h-8 bg-warning/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium text-text">Ambulance Currently In Use</p>
                <p className="text-sm text-text-secondary mt-1">
                  This ambulance is active for <strong>{assignmentAmbulance.current_hospital_name || 'another hospital'}</strong> and cannot be assigned until it becomes available.
                </p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assigned staff section - Enhanced */}
            <div className="bg-background-card rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-text flex items-center gap-2">
                  <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-success" />
                  </div>
                  Currently Assigned
                </h3>
                <span className="text-xs px-2.5 py-1 bg-success/10 text-success font-semibold rounded-full">
                  {assignedUsers.length} staff
                </span>
              </div>
              {assignedUsers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <UserMinus className="w-8 h-8 text-text-secondary opacity-30" />
                  </div>
                  <p className="text-text-secondary text-sm font-medium">No staff assigned</p>
                  <p className="text-text-secondary text-xs mt-1">Assign team members from available staff</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-2">
                  {assignedUsers.map(u => (
                    <motion.div
                      key={u.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 bg-background rounded-xl border border-border hover:border-primary/50 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-gradient-to-br from-success to-success/80 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg">
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-text truncate">{u.firstName} {u.lastName}</div>
                            <div className="text-xs text-text-secondary truncate">{formatRoleName(u.role || u.roleKey)}</div>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="danger" 
                          loading={unassigningUserId === u.id} 
                          onClick={() => handleUnassignUser(u.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Available staff section - Enhanced */}
            <div className="bg-background-card rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-text flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  Available Staff
                </h3>
                <span className="text-xs px-2.5 py-1 bg-primary/10 text-primary font-semibold rounded-full">
                  {availableUsers.length} available
                </span>
              </div>
              {availableUsers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <UserPlus className="w-8 h-8 text-text-secondary opacity-30" />
                  </div>
                  <p className="text-text-secondary text-sm font-medium">No staff available</p>
                  <p className="text-text-secondary text-xs mt-1">All team members are assigned</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-2">
                  {availableUsers.map(u => (
                    <motion.div
                      key={u.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 bg-background rounded-xl border border-border hover:border-primary/50 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg">
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-text truncate">{u.firstName} {u.lastName}</div>
                            <div className="text-xs text-text-secondary truncate">{formatRoleName(u.role)}</div>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="success" 
                          loading={assigningUserId === u.id} 
                          onClick={() => handleAssignUser(u.id, u.role)} 
                          disabled={!!(assignmentAmbulance?.current_hospital_id && assignmentAmbulance?.current_hospital_id !== user?.organizationId)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
