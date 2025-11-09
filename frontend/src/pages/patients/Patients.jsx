import { useState, useEffect } from 'react';
import useWithGlobalLoader from '../../hooks/useWithGlobalLoader';
import { motion } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import Select from '../../components/ui/Select';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  UserSquare2,
  Plus,
  Edit,
  Trash2,
  Search,
  Activity,
  Heart,
  Thermometer,
  Phone,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Table } from '../../components/ui/Table';
import { Card } from '../../components/ui/Card';
import { patientService, organizationService } from '../../services';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';
import { hasPermission, PERMISSIONS } from '../../utils/permissions';
import getErrorMessage from '../../utils/getErrorMessage';

const patientSchema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().nullable(),
  dateOfBirth: yup.date().nullable(),
  gender: yup.string().nullable(),
  bloodGroup: yup.string().nullable(),
  phone: yup.string().nullable(),
  email: yup.string().email('Invalid email').nullable(),
  address: yup.string().nullable(),
  emergencyContactName: yup.string().nullable(),
  emergencyContactPhone: yup.string().nullable(),
  emergencyContactRelation: yup.string().nullable(),
});

const vitalSignsSchema = yup.object({
  heartRate: yup.number().positive().nullable(),
  bloodPressureSystolic: yup.number().positive().nullable(),
  bloodPressureDiastolic: yup.number().positive().nullable(),
  temperature: yup.number().positive().nullable(),
  oxygenSaturation: yup.number().min(0).max(100).nullable(),
  respiratoryRate: yup.number().positive().nullable(),
});

export const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [vitalSigns, setVitalSigns] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [orgTypeFilter, setOrgTypeFilter] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [selectedOrgInfo, setSelectedOrgInfo] = useState(null);
  // Separate state for modal organization selection
  const [modalOrgTypeFilter, setModalOrgTypeFilter] = useState('');
  const [modalSelectedOrgId, setModalSelectedOrgId] = useState(null);
  const [modalSelectedOrgInfo, setModalSelectedOrgInfo] = useState(null);
  const { user } = useAuthStore();
  const { toast } = useToast();
  const runWithLoader = useWithGlobalLoader();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(patientSchema),
  });

  const {
    register: registerVitals,
    handleSubmit: handleSubmitVitals,
    reset: resetVitals,
    formState: { errors: vitalsErrors },
  } = useForm({
    resolver: yupResolver(vitalSignsSchema),
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    // Only fetch patients if superadmin has selected an org, or if non-superadmin
    const doFetch = async () => {
      // clear current patients while loading to avoid stale data
      setPatients([]);
      await runWithLoader(async () => {
        if (user?.role === 'superadmin') {
          if (selectedOrgId) {
            await fetchPatients();
          }
        } else {
          await fetchPatients();
        }
      }, 'Loading patients...');
    };

    doFetch().catch((err) => {
      // error already handled in fetchPatients but ensure loader hidden
      console.error('Error fetching patients with loader', err);
    });
  }, [selectedOrgId, user]);

  const fetchOrganizations = async () => {
    try {
      const resp = await organizationService.getAll();
      const raw = resp.data?.data?.organizations || resp.data?.organizations || resp.data || [];
      setOrganizations(raw);
    } catch (err) {
      console.error('Failed to load organizations', err);
    }
  };

  // Global cache reset handler
  useEffect(() => {
    const handler = async () => {
      try {
        // No persistent cache used here, just force refetch
        await fetchPatients();
      } catch (err) {
        console.error('Global reset handler failed for patients', err);
      } finally {
        window.dispatchEvent(new CustomEvent('global:cache-reset-done', { detail: { page: 'patients' } }));
      }
    };
    window.addEventListener('global:cache-reset', handler);
    return () => window.removeEventListener('global:cache-reset', handler);
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const params = {};
      // For superadmin: pass organizationId to scope the query
      if (user?.role === 'superadmin' && selectedOrgId) {
        params.organizationId = selectedOrgId;
      }
      const response = await patientService.getAll(params);
      // API returns { success: true, data: { patients: [...] } }
      setPatients(response.data?.data?.patients || response.data?.patients || response.data || []);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
  const msg = getErrorMessage(error, 'Failed to load patients');
      toast.error(msg);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVitalSigns = async (patientId) => {
    try {
      const response = await patientService.getVitalSigns(patientId);
      // Backend: { success: true, data: { vitalSigns: [...], sessionId } }
      const vitals = response.data?.data?.vitalSigns || response.data?.vitalSigns || response.data || [];
      setVitalSigns(vitals);
    } catch (error) {
      console.error('Failed to fetch vital signs:', error);
  const msg = getErrorMessage(error, 'Failed to load vital signs');
      toast.error(msg);
      setVitalSigns([]);
    }
  };

  const fetchSessions = async (patientId) => {
    try {
      const response = await patientService.getSessions(patientId);
      // Backend returns sessions array directly or nested in .data
      const sessionsData = response.data?.data?.sessions || response.data?.sessions || response.data || [];
      // Some endpoints return an object or an error; guard against non-array
      setSessions(Array.isArray(sessionsData) ? sessionsData : (Array.isArray(response.data?.data) ? response.data.data : []));
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
  const msg = getErrorMessage(error, 'Failed to load sessions');
      toast.error(msg);
      setSessions([]);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      // Ensure an organization is associated with the patient
      if (user?.role === 'superadmin') {
        // prefer organization selected in the modal, or fallback to data.organizationId
        data.organizationId = data.organizationId || modalSelectedOrgId || null;
        if (!data.organizationId) {
          toast.error('Please select an Organization for this patient');
          setLoading(false);
          return;
        }
      } else {
        // non-superadmins: backend will attach req.user.organizationId, but include for clarity
        data.organizationId = user?.organizationId || data.organizationId || null;
      }

      if (editingPatient) {
        await patientService.update(editingPatient.id, data);
        toast.success('Patient updated successfully');
      } else {
        await patientService.create(data);
        toast.success('Patient created successfully');
      }
      await fetchPatients();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save patient:', error);
  const msg = getErrorMessage(error, editingPatient ? 'Failed to update patient' : 'Failed to create patient');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitVitals = async (data) => {
    try {
      setLoading(true);
      await patientService.addVitalSigns(selectedPatient.id, data);
      toast.success('Vital signs added successfully');
      await fetchVitalSigns(selectedPatient.id);
      resetVitals();
    } catch (error) {
      console.error('Failed to save vital signs:', error);
  const msg = getErrorMessage(error, 'Failed to add vital signs');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (patient) => {
    setEditingPatient(patient);
    // Pre-fill organization selection if present
    reset(patient);
    const orgId = patient.organization_id || patient.organizationId || null;
    setModalSelectedOrgId(orgId);
    if (orgId) {
      const info = organizations.find(o => String(o.id) === String(orgId));
      setModalSelectedOrgInfo(info || null);
      setModalOrgTypeFilter(info?.type || '');
    } else {
      setModalSelectedOrgInfo(null);
      setModalOrgTypeFilter('');
    }
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await patientService.delete(id);
        toast.success('Patient deleted successfully');
        await fetchPatients();
      } catch (error) {
        console.error('Failed to delete patient:', error);
  const msg = getErrorMessage(error, 'Failed to delete patient');
        toast.error(msg);
      }
    }
  };

  const handleViewDetails = async (patient) => {
    setSelectedPatient(patient);
    await fetchVitalSigns(patient.id);
    await fetchSessions(patient.id);
    setShowVitalsModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPatient(null);
    reset();
    setModalSelectedOrgId(null);
    setModalSelectedOrgInfo(null);
    setModalOrgTypeFilter('');
  };

  const filteredPatients = patients.filter((patient) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      patient.firstName?.toLowerCase().includes(searchLower) ||
      patient.lastName?.toLowerCase().includes(searchLower) ||
      patient.phone?.includes(searchQuery) ||
      patient.email?.toLowerCase().includes(searchLower)
    );
  });

  const columns = [
    {
      header: 'Patient Name',
      accessor: 'name',
      render: (patient) => (
        <div>
          <div className="font-medium">
            {patient.firstName || patient.first_name} {patient.lastName || patient.last_name}
          </div>
          <div className="text-sm text-secondary">{patient.email || patient.contact_phone || ''}</div>
        </div>
      ),
    },
    {
      header: 'Age/Gender',
      accessor: 'age',
      render: (patient) => {
        const dob = patient.dateOfBirth || patient.date_of_birth;
        const age = dob
          ? new Date().getFullYear() - new Date(dob).getFullYear()
          : patient.age || 'N/A';
        return `${age} / ${patient.gender || 'N/A'}`;
      },
    },
    {
      header: 'Blood Group',
      accessor: 'bloodGroup',
      render: (patient) => (
        <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium">
          {patient.bloodGroup || patient.blood_group || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Phone',
      accessor: 'phone',
      render: (patient) => patient.phone || patient.contact_phone || 'N/A',
    },
    {
      header: 'Emergency Contact',
      accessor: 'emergency',
      render: (patient) => (
        <div>
          <div className="font-medium text-sm">
            {patient.emergencyContactName || patient.emergency_contact_name || 'N/A'}
          </div>
          <div className="text-xs text-secondary">
            {patient.emergencyContactPhone || patient.emergency_contact_phone || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (patient) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewDetails(patient)}
          >
            <Activity className="w-4 h-4 mr-1" />
            Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(patient)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDelete(patient.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold mt-5 mb-2">Patients Management</h1>
          <p className="text-secondary">Manage patient records and medical history</p>
        </div>
        {hasPermission(user?.role, PERMISSIONS.CREATE_PATIENT) && (
        <Button onClick={() => {
          // prepare modal for create
          reset();
          setEditingPatient(null);
          if (user?.role !== 'superadmin') {
            setModalSelectedOrgId(user?.organizationId || null);
            const info = organizations.find(o => String(o.id) === String(user?.organizationId));
            setModalSelectedOrgInfo(info || null);
          } else {
            setModalSelectedOrgId(null);
            setModalSelectedOrgInfo(null);
            setModalOrgTypeFilter('');
          }
          setShowModal(true);
        }}>
          <Plus className="w-5 h-5 mr-2" />
          Add Patient
        </Button>
        )}
      </div>

      {/* Organization Filters (Superadmin only) */}
      {user?.role === 'superadmin' && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Organization Type</label>
              <Select
                isClearable
                value={orgTypeFilter ? { value: orgTypeFilter, label: orgTypeFilter === 'hospital' ? 'Hospital' : 'Fleet Owner' } : null}
                onChange={(opt) => {
                  const v = opt?.value || '';
                  setOrgTypeFilter(v);
                  setSelectedOrgId(null);
                  setSelectedOrgInfo(null);
                }}
                options={[
                  { value: '', label: 'All Types' },
                  { value: 'hospital', label: 'Hospital' },
                  { value: 'fleet_owner', label: 'Fleet Owner' }
                ]}
                placeholder="Select organization type"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Organization</label>
              <Select
                isDisabled={!orgTypeFilter}
                isClearable
                placeholder={orgTypeFilter ? 'Select an organization' : 'Select a type first'}
                options={organizations
                  .filter(o => !orgTypeFilter || o.type === orgTypeFilter)
                  .map(o => ({ value: o.id, label: `${o.name} (${o.code})` }))}
                value={selectedOrgId ? {
                  value: selectedOrgId,
                  label: `${selectedOrgInfo?.name || ''} (${selectedOrgInfo?.code || ''})`
                } : null}
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
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-2xl">
              <UserSquare2 className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-secondary">Total Patients</p>
              <p className="text-2xl font-bold">{patients.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-2xl">
              <Activity className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-secondary">Active Sessions</p>
              <p className="text-2xl font-bold">
                {Array.isArray(sessions) ? sessions.filter(s => s.status === 'active').length : 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-2xl">
              <Heart className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-secondary">Critical Cases</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 rounded-2xl">
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-secondary">Pending Reviews</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Show message if superadmin hasn't selected org yet */}
      {user?.role === 'superadmin' && !selectedOrgId && (
        <Card className="p-8 text-center">
          <UserSquare2 className="w-12 h-12 text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Select an Organization</h3>
          <p className="text-secondary">
            Please select an organization type and organization above to view patients.
          </p>
        </Card>
      )}

      {/* Search Bar */}
      {(user?.role !== 'superadmin' || selectedOrgId) && (
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary" />
            <input
              type="text"
              placeholder="Search patients by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full pl-10 pr-4 py-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-secondary"
            />
          </div>
        </Card>
      )}

      {/* Patients Table */}
      {(user?.role !== 'superadmin' || selectedOrgId) && (
        <Card>
          <div className="p-6">
            <Table
              columns={columns}
              data={filteredPatients}
              loading={loading}
              onRowClick={handleViewDetails}
            />
          </div>
        </Card>
      )}

      {/* Add/Edit Patient Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingPatient ? 'Edit Patient' : 'Add New Patient'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Organization selectors: superadmin can pick org; others are scoped to their org */}
          {user?.role === 'superadmin' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Organization Type</label>
                <Select
                  isClearable
                  value={modalOrgTypeFilter ? { value: modalOrgTypeFilter, label: modalOrgTypeFilter === 'hospital' ? 'Hospital' : 'Fleet Owner' } : null}
                  onChange={(opt) => { const v = opt?.value || ''; setModalOrgTypeFilter(v); setModalSelectedOrgId(null); setModalSelectedOrgInfo(null); }}
                  options={[{ value: '', label: 'All Types' }, { value: 'hospital', label: 'Hospital' }, { value: 'fleet_owner', label: 'Fleet Owner' }]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Organization</label>
                <Select
                  isDisabled={!modalOrgTypeFilter}
                  placeholder={modalOrgTypeFilter ? 'Type to search or pick an organization' : 'Select an organization type first'}
                  options={organizations.filter(o => (!modalOrgTypeFilter || o.type === modalOrgTypeFilter)).map(o => ({ value: o.id, label: `${o.name} (${o.code})` }))}
                  value={modalSelectedOrgId ? { value: modalSelectedOrgId, label: `${modalSelectedOrgInfo?.name || ''} (${modalSelectedOrgInfo?.code || ''})` } : null}
                  onChange={(opt) => {
                    if (opt) {
                      setModalSelectedOrgId(opt.value);
                      const info = organizations.find(o => o.id === opt.value) || null;
                      setModalSelectedOrgInfo(info);
                    } else {
                      setModalSelectedOrgId(null);
                      setModalSelectedOrgInfo(null);
                    }
                  }}
                  classNamePrefix="react-select"
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  menuPosition="fixed"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-2">Organization</label>
              <div className="py-2 text-sm text-secondary">{modalSelectedOrgInfo?.name || organizations.find(o => String(o.id) === String(user?.organizationId))?.name || '—'}</div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              {...register('firstName')}
              error={errors.firstName?.message}
            />
            <Input
              label="Last Name"
              {...register('lastName')}
              error={errors.lastName?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date of Birth"
              type="date"
              {...register('dateOfBirth')}
              error={errors.dateOfBirth?.message}
            />
            <div>
              <label className="block text-sm font-medium mb-2">Gender</label>
              <Controller
                name="gender"
                control={control}
                defaultValue={''}
                render={({ field }) => {
                  const options = [
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' },
                  ];
                  const value = options.find(o => o.value === field.value) || null;
                  return (
                    <Select
                      classNamePrefix="react-select"
                      options={options}
                      value={value}
                      onChange={(opt) => field.onChange(opt ? opt.value : '')}
                      placeholder="Select Gender"
                    />
                  );
                }}
              />
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Blood Group</label>
              <Controller
                name="bloodGroup"
                control={control}
                defaultValue={''}
                render={({ field }) => {
                  const options = [
                    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
                  ].map(v => ({ value: v, label: v }));
                  const value = options.find(o => o.value === field.value) || null;
                  return (
                    <Select
                      classNamePrefix="react-select"
                      options={options}
                      value={value}
                      onChange={(opt) => field.onChange(opt ? opt.value : '')}
                      placeholder="Select Blood Group"
                    />
                  );
                }}
              />
              {errors.bloodGroup && (
                <p className="mt-1 text-sm text-red-600">{errors.bloodGroup.message}</p>
              )}
            </div>
            <Input
              label="Phone"
              {...register('phone')}
              error={errors.phone?.message}
            />
          </div>

          <Input
            label="Email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
          />

          <Input
            label="Address"
            {...register('address')}
            error={errors.address?.message}
          />

          <div className="border-t border-border pt-4">
            <h3 className="font-semibold mb-4">Emergency Contact</h3>
            <div className="space-y-4">
              <Input
                label="Contact Name"
                {...register('emergencyContactName')}
                error={errors.emergencyContactName?.message}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Contact Phone"
                  {...register('emergencyContactPhone')}
                  error={errors.emergencyContactPhone?.message}
                />
                <Input
                  label="Relation"
                  {...register('emergencyContactRelation')}
                  error={errors.emergencyContactRelation?.message}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="font-semibold mb-4">Medical Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Medical History</label>
                <textarea
                  {...register('medicalHistory')}
                  rows="3"
                  className="w-full px-4 py-2 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter medical history..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Allergies</label>
                <textarea
                  {...register('allergies')}
                  rows="2"
                  className="w-full px-4 py-2 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter allergies..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Current Medications</label>
                <textarea
                  {...register('currentMedications')}
                  rows="2"
                  className="w-full px-4 py-2 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter current medications..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {editingPatient ? 'Update Patient' : 'Add Patient'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Patient Details & Vitals Modal */}
      <Modal
        isOpen={showVitalsModal}
        onClose={() => setShowVitalsModal(false)}
        size="xl"
      >
        <div className="space-y-4">
          {user?.role === 'superadmin' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Organization Type</label>
                <Select
                  isClearable
                  value={orgTypeFilter ? { value: orgTypeFilter, label: orgTypeFilter === 'hospital' ? 'Hospital' : 'Fleet Owner' } : null}
                  onChange={(opt) => { const v = opt?.value || ''; setOrgTypeFilter(v); setSelectedOrgId(null); setSelectedOrgInfo(null); }}
                  options={[{ value: '', label: 'All Types' }, { value: 'hospital', label: 'Hospital' }, { value: 'fleet_owner', label: 'Fleet Owner' }]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Organization</label>
                <div>
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
            </div>
          )}
        {selectedPatient && (
          <div className="space-y-6">
            {/* Patient Info */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-background-card rounded-2xl">
              <div>
                <p className="text-sm text-secondary">Blood Group</p>
                <p className="font-semibold">{selectedPatient.bloodGroup}</p>
              </div>
              <div>
                <p className="text-sm text-secondary">Age/Gender</p>
                <p className="font-semibold">
                  {new Date().getFullYear() - new Date(selectedPatient.dateOfBirth).getFullYear()} / {selectedPatient.gender}
                </p>
              </div>
              <div>
                <p className="text-sm text-secondary">Phone</p>
                <p className="font-semibold">{selectedPatient.phone}</p>
              </div>
            </div>

            {/* Add Vital Signs */}
            <div className="border border-border rounded-2xl p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-600" />
                Add Vital Signs
              </h3>
              <form onSubmit={handleSubmitVitals(onSubmitVitals)} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Heart Rate (bpm)"
                    type="number"
                    {...registerVitals('heartRate')}
                    error={vitalsErrors.heartRate?.message}
                  />
                  <Input
                    label="Systolic BP (mmHg)"
                    type="number"
                    {...registerVitals('bloodPressureSystolic')}
                    error={vitalsErrors.bloodPressureSystolic?.message}
                  />
                  <Input
                    label="Diastolic BP (mmHg)"
                    type="number"
                    {...registerVitals('bloodPressureDiastolic')}
                    error={vitalsErrors.bloodPressureDiastolic?.message}
                  />
                  <Input
                    label="Temperature (°F)"
                    type="number"
                    step="0.1"
                    {...registerVitals('temperature')}
                    error={vitalsErrors.temperature?.message}
                  />
                  <Input
                    label="Oxygen Sat. (%)"
                    type="number"
                    {...registerVitals('oxygenSaturation')}
                    error={vitalsErrors.oxygenSaturation?.message}
                  />
                  <Input
                    label="Resp. Rate (bpm)"
                    type="number"
                    {...registerVitals('respiratoryRate')}
                    error={vitalsErrors.respiratoryRate?.message}
                  />
                </div>
                <Button type="submit" loading={loading}>
                  Save Vital Signs
                </Button>
              </form>
            </div>

            {/* Vital Signs History */}
            <div>
              <h3 className="font-semibold mb-4">Vital Signs History</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {vitalSigns.length === 0 ? (
                  <p className="text-secondary text-center py-8">No vital signs recorded yet</p>
                ) : (
                  vitalSigns.map((vital, index) => (
                    <div
                      key={index}
                      className="p-4 border border-border rounded-2xl hover:bg-background-card transition-colors"
                    >
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-secondary">HR</p>
                          <p className="font-semibold">{vital.heartRate} bpm</p>
                        </div>
                        <div>
                          <p className="text-secondary">BP</p>
                          <p className="font-semibold">
                            {vital.bloodPressureSystolic}/{vital.bloodPressureDiastolic}
                          </p>
                        </div>
                        <div>
                          <p className="text-secondary">Temp</p>
                          <p className="font-semibold">{vital.temperature}°F</p>
                        </div>
                        <div>
                          <p className="text-secondary">SpO2</p>
                          <p className="font-semibold">{vital.oxygenSaturation}%</p>
                        </div>
                      </div>
                      <p className="text-xs text-secondary mt-2">
                        {new Date(vital.recordedAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sessions History */}
            <div>
              <h3 className="font-semibold mb-4">Ambulance Sessions</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(!Array.isArray(sessions) || sessions.length === 0) ? (
                  <p className="text-secondary text-center py-8">No sessions found</p>
                ) : (
                  sessions.map((session, index) => (
                    <div
                      key={index}
                      className="p-4 border-2 border-border rounded-2xl hover:bg-background-card transition-colors space-y-3"
                    >
                      {/* Session Header */}
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-lg">{session.chiefComplaint || session.chief_complaint || 'N/A'}</p>
                          <p className="text-sm text-secondary mt-1">
                            📍 Pickup: {session.pickupLocation || session.pickup_location || 'N/A'}
                          </p>
                          {(session.destination_hospital_name || session.destinationHospitalName) && (
                            <p className="text-sm text-secondary">
                              🏥 Destination: {session.destination_hospital_name || session.destinationHospitalName}
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            session.status === 'active' || session.status === 'onboarded' || session.status === 'in_transit'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : session.status === 'offboarded'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                          }`}
                        >
                          {session.status}
                        </span>
                      </div>

                      {/* Ambulance Info */}
                      <div className="bg-background rounded-xl p-3 border border-border">
                        <p className="text-xs font-medium text-secondary mb-2">🚑 Ambulance Details</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-secondary">Registration:</span>
                            <span className="ml-2 font-medium text-text">
                              {session.registration_number || session.ambulance_code || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-secondary">Model:</span>
                            <span className="ml-2 font-medium text-text">
                              {session.vehicle_model || session.vehicleModel || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-secondary">Type:</span>
                            <span className="ml-2 font-medium text-text">
                              {session.vehicle_type || session.vehicleType || 'Basic'}
                            </span>
                          </div>
                          <div>
                            <span className="text-secondary">Owner:</span>
                            <span className="ml-2 font-medium text-text">
                              {session.organization_name || session.organizationName || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Crew Information */}
                      {(session.crew && session.crew.length > 0) && (
                        <div className="bg-background rounded-xl p-3 border border-border">
                          <p className="text-xs font-medium text-secondary mb-2">👥 Crew Members</p>
                          <div className="space-y-2">
                            {session.doctors && session.doctors.length > 0 && (
                              <div>
                                <span className="text-xs text-secondary">Doctors:</span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {session.doctors.map((doc, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-medium">
                                      Dr. {doc.first_name} {doc.last_name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {session.paramedics && session.paramedics.length > 0 && (
                              <div>
                                <span className="text-xs text-secondary">Paramedics:</span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {session.paramedics.map((para, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-xs font-medium">
                                      {para.first_name} {para.last_name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {session.drivers && session.drivers.length > 0 && (
                              <div>
                                <span className="text-xs text-secondary">Drivers:</span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {session.drivers.map((driver, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg text-xs font-medium">
                                      {driver.first_name} {driver.last_name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Session Timestamp */}
                      <p className="text-xs text-secondary flex items-center gap-1">
                        <span>⏰</span>
                        {session.startTime || session.start_time || session.createdAt || session.created_at 
                          ? new Date(session.startTime || session.start_time || session.createdAt || session.created_at).toLocaleString()
                          : 'N/A'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      </Modal>
    </div>
  );
};
