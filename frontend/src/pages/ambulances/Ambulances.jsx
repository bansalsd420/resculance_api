import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Ambulance as AmbulanceIcon, MapPin, User, Trash2, X, UserPlus, UserMinus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { ToastContainer } from '../../components/ui/Toast';
import { useForm, useFieldArray } from 'react-hook-form';
import { ambulanceService, organizationService, userService } from '../../services';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';

const DEVICE_TYPES = [
  { value: 'CAMERA', label: 'Camera' },
  { value: 'LIVE_LOCATION', label: 'Live Location' },
  { value: 'ECG', label: 'ECG Monitor' },
  { value: 'VITAL_MONITOR', label: 'Vital Monitor' },
  { value: 'GPS_TRACKER', label: 'GPS Tracker' },
];

export const Ambulances = () => {
  const [ambulances, setAmbulances] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAmbulance, setSelectedAmbulance] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [devices, setDevices] = useState([]);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [assignmentAmbulance, setAssignmentAmbulance] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [ambulanceAssignments, setAmbulanceAssignments] = useState({});
  const { user } = useAuthStore();
  const { toasts, toast, removeToast } = useToast();

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
    fetchAmbulances();
    fetchOrganizations();
  }, [filterStatus]);

  const fetchOrganizations = async () => {
    try {
      const response = await organizationService.getAll();
      setOrganizations(response.data?.data?.organizations || response.data?.organizations || response.data || []);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      toast.error('Failed to load organizations');
    }
  };

  const fetchAmbulances = async () => {
    setLoading(true);
    try {
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const response = await ambulanceService.getAll(params);
      const ambulancesData = response.data?.data?.ambulances || response.data?.ambulances || response.data || [];
      setAmbulances(ambulancesData);

      // Fetch assigned users for each ambulance
      const assignments = {};
      for (const ambulance of ambulancesData) {
        try {
          const assignedResponse = await ambulanceService.getAssignedUsers(ambulance.id);
          assignments[ambulance.id] = assignedResponse.data?.data?.users || assignedResponse.data?.users || [];
        } catch (error) {
          console.error(`Failed to fetch assigned users for ambulance ${ambulance.id}:`, error);
          assignments[ambulance.id] = [];
        }
      }
      setAmbulanceAssignments(assignments);
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
    try {
      // Ensure organizationId is set for non-superadmins
      const submitData = user?.role === 'superadmin' ? data : { ...data, organizationId: user?.organizationId };

      // Separate devices from ambulance data
      const { devices: deviceData, ...ambulanceData } = submitData;

      let ambulanceId;

      if (selectedAmbulance) {
        // For update, backend expects vehicleModel, vehicleType and status.
        // Map registrationNumber -> vehicleNumber if present in the form but update endpoint doesn't require it.
        const updatePayload = {
          vehicleModel: ambulanceData.vehicleModel,
          vehicleType: ambulanceData.vehicleType,
          status: ambulanceData.status,
        };

        await ambulanceService.update(selectedAmbulance.id, updatePayload);
        ambulanceId = selectedAmbulance.id;
        toast.success('Ambulance updated successfully');
      } else {
        // Create: backend expects vehicleNumber, vehicleModel, vehicleType, organizationId
        const createPayload = {
          vehicleNumber: ambulanceData.registrationNumber || ambulanceData.vehicleNumber,
          vehicleModel: ambulanceData.vehicleModel,
          vehicleType: ambulanceData.vehicleType,
          organizationId: ambulanceData.organizationId,
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
            toast.error(`Failed to save device: ${device.deviceName}`);
          }
        }
      }

      fetchAmbulances();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save ambulance:', error);
      toast.error(selectedAmbulance ? 'Failed to update ambulance' : 'Failed to create ambulance');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this ambulance? All associated devices will also be deleted.')) {
      try {
        await ambulanceService.delete(id);
        toast.success('Ambulance deleted successfully');
        fetchAmbulances();
      } catch (error) {
        console.error('Failed to delete ambulance:', error);
        toast.error('Failed to delete ambulance');
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

      // Fetch available users (doctors, paramedics, drivers from same organization)
      // Backend doesn't support array of roles, so we fetch all and filter on frontend
      const usersResponse = await userService.getAll({
        organizationId: ambulance.organization_id || ambulance.organizationId,
      });
      const allUsers = usersResponse.data?.data?.users || usersResponse.data?.users || usersResponse.data || [];
      
      // Filter for doctors, paramedics, and drivers only
      const staffUsers = allUsers.filter(u => 
        ['doctor', 'paramedic', 'driver'].includes(u.role?.toLowerCase())
      );
      
      // Filter out already assigned users
      const assignedUserIds = assigned.map(u => u.id);
      const available = staffUsers.filter(u => !assignedUserIds.includes(u.id));
      setAvailableUsers(available);
      
      console.log('Assignment Modal: Fetched users', { 
        assigned: assigned.length, 
        available: available.length,
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
    try {
      await ambulanceService.assign(assignmentAmbulance.id, userId, role);
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
      toast.error('Failed to assign user');
    }
  };

  const handleUnassignUser = async (userId) => {
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
      const allUsersResponse = await userService.getAll({
        organizationId: assignmentAmbulance.organization_id || assignmentAmbulance.organizationId,
      });
      const allUsers = allUsersResponse.data?.data?.users || allUsersResponse.data?.users || allUsersResponse.data || [];
      const staffUsers = allUsers.filter(u => 
        ['doctor', 'paramedic', 'driver'].includes(u.role?.toLowerCase())
      );
      const assignedUserIds = assigned.map(u => u.id);
      const available = staffUsers.filter(u => !assignedUserIds.includes(u.id));
      setAvailableUsers(available);
      
    } catch (error) {
      console.error('Failed to unassign user:', error);
      toast.error('Failed to unassign user');
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
      header: 'Organization',
      accessor: 'organization_name',
      render: (row) => (
        <div>
          <p className="text-sm font-medium">{row.organization_name || 'N/A'}</p>
          <p className="text-xs text-secondary">{row.organization_code || ''}</p>
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
    {
      header: 'Driver',
      accessor: 'driverId',
      render: (row) => {
        const assigned = ambulanceAssignments[row.id] || [];
        const driver = Array.isArray(assigned) ? assigned.find(u => u.role === 'DRIVER') : null;
        return (
          <div className="flex items-center gap-2 text-sm">
            {driver ? (
              <>
                <User className="w-4 h-4 text-secondary" />
                <span>{driver.firstName} {driver.lastName}</span>
              </>
            ) : (
              <span className="text-secondary">Not assigned</span>
            )}
          </div>
        );
      },
    },
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
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => handleOpenModal(row)}>
            Edit
          </Button>
          <Button size="sm" variant="success" onClick={() => handleOpenAssignmentModal(row)}>
            <UserPlus className="w-4 h-4 mr-1" />
            Assign Staff
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const filteredAmbulances = ambulances.filter(ambulance => 
    (ambulance.registration_number || ambulance.vehicleNumber || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ambulance.vehicle_model || ambulance.vehicleModel || '')?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Ambulances</h1>
          <p className="text-secondary">Manage your fleet of ambulances</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-5 h-5 mr-2" />
          Add Ambulance
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary" />
            <input
              type="text"
              placeholder="Search ambulances..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-12"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-2xl font-medium transition-all ${
                filterStatus === 'all' ? 'bg-primary text-white' : 'bg-background-card'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('available')}
              className={`px-4 py-2 rounded-2xl font-medium transition-all ${
                filterStatus === 'available' ? 'bg-primary text-white' : 'bg-background-card'
              }`}
            >
              Available
            </button>
            <button
              onClick={() => setFilterStatus('on-duty')}
              className={`px-4 py-2 rounded-2xl font-medium transition-all ${
                filterStatus === 'on-duty' ? 'bg-primary text-white' : 'bg-background-card'
              }`}
            >
              On Duty
            </button>
            <button
              onClick={() => setFilterStatus('maintenance')}
              className={`px-4 py-2 rounded-2xl font-medium transition-all ${
                filterStatus === 'maintenance' ? 'bg-primary text-white' : 'bg-background-card'
              }`}
            >
              Maintenance
            </button>
          </div>
        </div>
      </Card>

      {/* Ambulances Table */}
      <Table columns={columns} data={filteredAmbulances} />

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
            <Button onClick={handleSubmit(onSubmit)}>
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
              <select {...register('vehicleType', { required: 'Type is required' })} className="input">
                <option value="">Select Type</option>
                <option value="BLS">BLS (Basic Life Support)</option>
                <option value="ALS">ALS (Advanced Life Support)</option>
                <option value="SCU">SCU (Special Care Unit)</option>
              </select>
              {errors.vehicleType && <p className="mt-1 text-sm text-red-500">{errors.vehicleType.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Status</label>
              <select {...register('status')} className="input">
                <option value="">Select Status</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          {user?.role === 'superadmin' && (
            <div>
              <label className="block text-sm font-medium text-text mb-2">Organization *</label>
              <select {...register('organizationId', { required: 'Organization is required' })} className="input">
                <option value="">Select Organization</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.type})
                  </option>
                ))}
              </select>
              {errors.organizationId && <p className="mt-1 text-sm text-red-500">{errors.organizationId.message}</p>}
            </div>
          )}

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
                      <select
                        {...register(`devices.${index}.deviceType`, { required: 'Device type is required' })}
                        className="input"
                      >
                        <option value="">Select Type</option>
                        {DEVICE_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
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

      {/* Assignment Modal */}
      <Modal
        isOpen={isAssignmentModalOpen}
        onClose={handleCloseAssignmentModal}
        title={`Assign Staff to ${assignmentAmbulance?.registration_number || assignmentAmbulance?.vehicleNumber}`}
        size="lg"
      >
        <div className="space-y-6">
          {/* Currently Assigned Users */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Currently Assigned</h3>
            {assignedUsers.length === 0 ? (
              <p className="text-secondary text-sm">No staff currently assigned to this ambulance.</p>
            ) : (
              <div className="space-y-2">
                {assignedUsers.map((assignedUser) => (
                  <div key={assignedUser.id} className="flex items-center justify-between p-3 bg-background-card rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {assignedUser.firstName?.[0]}{assignedUser.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-medium">{assignedUser.firstName} {assignedUser.lastName}</p>
                        <p className="text-sm text-secondary">{assignedUser.role}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleUnassignUser(assignedUser.id)}
                    >
                      <UserMinus className="w-4 h-4 mr-1" />
                      Unassign
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Users */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Available Staff</h3>
            {availableUsers.length === 0 ? (
              <p className="text-secondary text-sm">No staff available for assignment.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableUsers.map((availableUser) => (
                  <div key={availableUser.id} className="flex items-center justify-between p-3 bg-background-card rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {availableUser.firstName?.[0]}{availableUser.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-medium">{availableUser.firstName} {availableUser.lastName}</p>
                        <p className="text-sm text-secondary">{availableUser.role}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => handleAssignUser(availableUser.id, availableUser.role)}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Assign
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
