import { useState, useEffect } from 'react';
import useWithGlobalLoader from '../../hooks/useWithGlobalLoader';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import Select from '../../components/ui/Select';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Activity,
  Plus,
  MapPin,
  Clock,
  User,
  Ambulance as AmbulanceIcon,
  CheckCircle,
  AlertCircle,
  XCircle,
  Navigation,
  Camera,
  Eye,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Table } from '../../components/ui/Table';
import { Card } from '../../components/ui/Card';
import { patientService, ambulanceService, organizationService } from '../../services';
import { useToast } from '../../hooks/useToast';
import getErrorMessage from '../../utils/getErrorMessage';
import { CameraFeedModal } from './CameraFeedModal';
import { useAuthStore } from '../../store/authStore';

const sessionSchema = yup.object({
  // Only require patient, ambulance and destination hospital per UX
  patientId: yup.number().required('Patient is required'),
  ambulanceId: yup.number().required('Ambulance is required'),
  destinationHospitalId: yup.number().required('Destination hospital is required'),
  // Relax chief complaint and initial assessment
  chiefComplaint: yup.string().nullable().notRequired(),
  initialAssessment: yup.string().nullable().notRequired(),
});

export const Onboarding = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [orgTypeFilter, setOrgTypeFilter] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [selectedOrgInfo, setSelectedOrgInfo] = useState(null);
  // modal-level org state (separate from page filters)
  const [modalOrgTypeFilter, setModalOrgTypeFilter] = useState('');
  const [modalSelectedOrgId, setModalSelectedOrgId] = useState(null);
  const [modalSelectedOrgInfo, setModalSelectedOrgInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraSession, setCameraSession] = useState(null);
  const { toast } = useToast();
  const { user } = useAuthStore();
  const runWithLoader = useWithGlobalLoader();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(sessionSchema),
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    // Only fetch onboarding data if superadmin has selected an org, or if non-superadmin
    const doFetch = async () => {
      // clear current sessions while loading to avoid stale data
      setSessions([]);
      await runWithLoader(async () => {
        if (user?.role === 'superadmin') {
          if (selectedOrgId) {
            await fetchData();
          }
        } else {
          await fetchData();
        }
      }, 'Loading onboardings...');
    };

    doFetch().catch((err) => {
      console.error('Error fetching onboarding data with loader', err);
    });
  }, [selectedOrgId, user]);

  // Global cache reset handler
  useEffect(() => {
    const handler = async () => {
      try {
        await fetchData();
      } catch (err) {
        console.error('Global reset handler failed for onboarding', err);
      } finally {
        window.dispatchEvent(new CustomEvent('global:cache-reset-done', { detail: { page: 'onboarding' } }));
      }
    };
    window.addEventListener('global:cache-reset', handler);
    return () => window.removeEventListener('global:cache-reset', handler);
  }, []);

  const fetchOrganizations = async () => {
    try {
      const resp = await organizationService.getAll();
      const raw = resp.data?.data?.organizations || resp.data?.organizations || resp.data || [];
      setOrganizations(raw);
    } catch (err) {
      console.error('Failed to load organizations', err);
      setOrganizations([]);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      const params = {};
      if (user?.role === 'superadmin' && selectedOrgId) {
        params.organizationId = selectedOrgId;
      }

      // clear lists to avoid stale UI
      setPatients([]);
      setAmbulances([]);
      setHospitals([]);

      const [patientsRes, ambulancesRes, orgsRes, sessionsRes] = await Promise.all([
        patientService.getAll(params),
        ambulanceService.getAll(params),
        organizationService.getAll({ type: 'HOSPITAL' }),
        patientService.getAllSessions(params),
      ]);

      const patientsList = patientsRes.data?.data?.patients || patientsRes.data?.patients || patientsRes.data || [];
      const ambulancesList = ambulancesRes.data?.data?.ambulances || ambulancesRes.data?.ambulances || ambulancesRes.data || [];
      const hospitalsList = orgsRes.data?.data?.organizations || orgsRes.data?.organizations || orgsRes.data || [];
      const sessionsList = sessionsRes.data?.data?.sessions || sessionsRes.data?.sessions || sessionsRes.data || [];

      setPatients(patientsList);
      setAmbulances(ambulancesList);
      setHospitals(hospitalsList);
      setSessions(Array.isArray(sessionsList) ? sessionsList : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      const msg = getErrorMessage(error, 'Failed to load onboarding data');
      toast.error(msg);
      setSessions([]);
      setPatients([]);
      setAmbulances([]);
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      // Determine organization for this onboarding
      const orgIdForOnboard = user?.role === 'superadmin'
        ? (modalSelectedOrgId || selectedOrgId)
        : (user?.organizationId || selectedOrgId);

      if (user?.role === 'superadmin' && !orgIdForOnboard) {
        toast.error('Please select an Organization before onboarding a patient');
        setLoading(false);
        return;
      }

      await patientService.onboard(data.patientId, {
        ambulanceId: data.ambulanceId,
        destinationHospitalId: data.destinationHospitalId,
        chiefComplaint: data.chiefComplaint,
        initialAssessment: data.initialAssessment,
        organizationId: orgIdForOnboard,
      });
      toast.success('Patient onboarded successfully');
      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to onboard patient:', error);
  const msg = getErrorMessage(error, 'Failed to onboard patient');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEndTrip = async (session) => {
    if (window.confirm('Are you sure you want to offboard this patient?')) {
      try {
        setLoading(true);
        // backend expects PATCH /patients/sessions/:sessionId/offboard with { treatmentNotes }
        await patientService.offboard(session.id, {
          treatmentNotes: 'Patient offboarded'
        });
        toast.success('Patient offboarded successfully');
        await fetchData();
      } catch (error) {
        console.error('Failed to offboard patient:', error);
    const msg = getErrorMessage(error, 'Failed to offboard patient');
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    reset();
  };

  const handleOpenCameraFeed = (session) => {
    const ambulance = ambulances.find(
      (a) => a.id === session.ambulance_id || a.id === session.ambulanceId
    );
    setCameraSession({ session, ambulance });
    setShowCameraModal(true);
  };

  const handleCloseCameraModal = () => {
    setShowCameraModal(false);
    setCameraSession(null);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-gray-100 text-gray-900';
      case 'completed':
        return 'bg-gray-200 text-gray-900';
      case 'cancelled':
        return 'bg-gray-300 text-gray-900';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <Activity className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredSessions = sessions.filter((session) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') {
      return ['active', 'onboarded', 'in_transit'].includes(session.status?.toLowerCase());
    }
    if (activeTab === 'completed') {
      return session.status?.toLowerCase() === 'offboarded' || session.status?.toLowerCase() === 'completed';
    }
    return session.status?.toLowerCase() === activeTab;
  });

  const statsData = {
    total: sessions.length,
    active: sessions.filter((s) => ['active', 'onboarded', 'in_transit'].includes(s.status?.toLowerCase())).length,
    completed: sessions.filter((s) => s.status?.toLowerCase() === 'offboarded' || s.status?.toLowerCase() === 'completed').length,
    cancelled: sessions.filter((s) => s.status?.toLowerCase() === 'cancelled').length,
  };

  const columns = [
    {
      header: 'Patient',
      accessor: 'patient',
      render: (session) => (
        <div>
          <div className="font-medium">
            {session.patient_first_name || session.patient?.firstName || session.patient?.first_name} {session.patient_last_name || session.patient?.lastName || session.patient?.last_name}
          </div>
          <div className="text-sm text-secondary">{session.chief_complaint || session.chiefComplaint}</div>
        </div>
      ),
    },
    {
      header: 'Ambulance',
      accessor: 'ambulance',
      render: (session) => {
        const ambulance = ambulances.find((a) => a.id === session.ambulance_id || a.id === session.ambulanceId);
        return (
          <div>
            <div className="font-medium">{session.ambulance_code || ambulance?.ambulance_code || ambulance?.registration_number || ambulance?.vehicleNumber || 'N/A'}</div>
            <div className="text-sm text-secondary">{ambulance?.vehicle_type || ambulance?.vehicleType || ''}</div>
          </div>
        );
      },
    },
    ...(user?.role === 'superadmin' ? [{
      header: 'Organization',
      accessor: 'organization',
      render: (session) => {
        const ambulance = ambulances.find((a) => a.id === session.ambulance_id || a.id === session.ambulanceId);
        return (
          <div>
            <div className="text-sm font-medium">{ambulance?.organization_name || 'N/A'}</div>
            <div className="text-xs text-secondary">{ambulance?.organization_code || ''}</div>
          </div>
        );
      },
    }] : []),
    {
      header: 'Pickup Location',
      accessor: 'pickupLocation',
      render: (session) => (
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-secondary mt-1" />
          <div>
            <div>{session.pickup_location || session.pickupLocation || 'N/A'}</div>
            {(session.pickup_lat || session.pickupLatitude) && (
              <div className="text-xs text-secondary">
                {(session.pickup_lat || session.pickupLatitude)?.toFixed(4)}, {(session.pickup_lng || session.pickupLongitude)?.toFixed(4)}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Start Time',
      accessor: 'startTime',
      render: (session) => (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-secondary" />
          <span>{(session.onboarded_at || session.start_time || session.startTime) ? new Date(session.onboarded_at || session.start_time || session.startTime).toLocaleString() : 'N/A'}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (session) => (
        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 w-fit ${getStatusColor(session.status)}`}>
          {getStatusIcon(session.status)}
          {session.status || 'Unknown'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (session) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/onboarding/${session.id}`)}
            title="View full details"
          >
            <Eye className="w-4 h-4 mr-1" />
            View Details
          </Button>
          {(session.status?.toLowerCase() === 'active' || session.status?.toLowerCase() === 'onboarded' || session.status?.toLowerCase() === 'in_transit') && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenCameraFeed(session)}
                title="View live camera feeds"
              >
                <Camera className="w-4 h-4" />
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleEndTrip(session)}
              >
                Offboard
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold mt-5 mb-2">Patient Onboarding</h1>
          <p className="text-secondary">Manage patient transport and ambulance assignments</p>
        </div>
        <Button onClick={() => {
          // prepare modal org defaults without touching page-level selectedOrg
          if (user?.role !== 'superadmin') {
            setModalSelectedOrgId(user?.organizationId || null);
            const info = organizations.find(o => String(o.id) === String(user?.organizationId));
            setModalSelectedOrgInfo(info || null);
            setModalOrgTypeFilter(info?.type || '');
          } else {
            // prefer the page-level selected org as default for modal
            setModalSelectedOrgId(selectedOrgId || null);
            setModalSelectedOrgInfo(selectedOrgInfo || null);
            setModalOrgTypeFilter(orgTypeFilter || '');
          }
          setShowModal(true);
        }}>
          <Plus className="w-5 h-5 mr-2" />
          Onboard Patient
        </Button>
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

      {/* If superadmin and no organization chosen, prompt and skip table/stats */}
      {user?.role === 'superadmin' && !selectedOrgId && (
        <Card className="p-6">
          <div className="text-center">
            <p className="text-lg font-medium">Please select an Organization Type and Organization to view onboardings.</p>
            <p className="text-sm text-secondary mt-2">Choose an organization above to load patients, ambulances and sessions for that organization.</p>
          </div>
        </Card>
      )}

      {/* Stats Cards (only show when not superadmin or when an organization is selected) */}
      {(user?.role !== 'superadmin' || selectedOrgId) && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded-2xl">
              <Activity className="w-8 h-8 text-gray-900" />
            </div>
            <div>
              <p className="text-sm text-secondary">Total Sessions</p>
              <p className="text-2xl font-bold">{statsData.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-200 rounded-2xl">
              <CheckCircle className="w-8 h-8 text-gray-900" />
            </div>
            <div>
              <p className="text-sm text-secondary">Active</p>
              <p className="text-2xl font-bold">{statsData.active}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-300 rounded-2xl">
              <CheckCircle className="w-8 h-8 text-gray-900" />
            </div>
            <div>
              <p className="text-sm text-secondary">Completed</p>
              <p className="text-2xl font-bold">{statsData.completed}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-400 rounded-2xl">
              <XCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-secondary">Cancelled</p>
              <p className="text-2xl font-bold">{statsData.cancelled}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-2">
        <div className="flex gap-2">
          {['all', 'active', 'completed', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-2xl font-medium transition-all ${
                activeTab === tab
                  ? 'bg-black text-white'
                  : 'text-secondary hover:bg-background-card'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
          </Card>

          {/* Onboarding Table */}
          <Card>
            <div className="p-6">
              <Table
                columns={columns}
                data={filteredSessions}
                loading={loading}
              />
            </div>
          </Card>
        </>
      )}

      {/* Onboard Patient Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title="Onboard Patient"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Modal-level organization selectors for superadmin */}
          {user?.role === 'superadmin' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Organization Type</label>
                <Select
                  isClearable
                  value={modalOrgTypeFilter ? { value: modalOrgTypeFilter, label: modalOrgTypeFilter === 'hospital' ? 'Hospital' : 'Fleet Owner' } : null}
                  onChange={(opt) => {
                    const v = opt?.value || '';
                    setModalOrgTypeFilter(v);
                    setModalSelectedOrgId(null);
                    setModalSelectedOrgInfo(null);
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
                  isDisabled={!modalOrgTypeFilter}
                  isClearable
                  placeholder={modalOrgTypeFilter ? 'Select an organization' : 'Select a type first'}
                  options={organizations
                    .filter(o => !modalOrgTypeFilter || o.type === modalOrgTypeFilter)
                    .map(o => ({ value: o.id, label: `${o.name} (${o.code})` }))}
                  value={modalSelectedOrgId ? {
                    value: modalSelectedOrgId,
                    label: `${modalSelectedOrgInfo?.name || ''} (${modalSelectedOrgInfo?.code || ''})`
                  } : null}
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
          )}
          <div>
            <label className="block text-sm font-medium mb-2">Patient</label>
            <Controller
              name="patientId"
              control={control}
              defaultValue={''}
              render={({ field }) => {
                const options = patients.map(p => ({ value: p.id, label: `${p.firstName} ${p.lastName} - ${p.phone}` }));
                const value = options.find(o => o.value === field.value) || null;
                return (
                  <Select
                    classNamePrefix="react-select"
                    options={options}
                    value={value}
                    onChange={(opt) => field.onChange(opt ? opt.value : '')}
                    placeholder="Select Patient"
                  />
                );
              }}
            />
            {errors.patientId && (
              <p className="mt-1 text-sm text-red-500">{errors.patientId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Ambulance</label>
            <Controller
              name="ambulanceId"
              control={control}
              defaultValue={''}
              render={({ field }) => {
                const options = ambulances
                  .filter(a => a.status === 'available' || a.status === 'active')
                  .map(a => ({ value: a.id, label: `${a.registration_number || a.vehicleNumber || a.registrationNumber || a.ambulance_code} - ${a.vehicle_type || a.vehicleType}` }));
                const value = options.find(o => o.value === field.value) || null;
                return (
                  <Select
                    classNamePrefix="react-select"
                    options={options}
                    value={value}
                    onChange={(opt) => field.onChange(opt ? opt.value : '')}
                    placeholder="Select Ambulance"
                  />
                );
              }}
            />
            {errors.ambulanceId && (
              <p className="mt-1 text-sm text-red-500">{errors.ambulanceId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Destination Hospital *</label>
            <Controller
              name="destinationHospitalId"
              control={control}
              defaultValue={''}
              render={({ field }) => {
                const options = hospitals.map(h => ({ value: h.id, label: `${h.name} - ${h.city}, ${h.state}` }));
                const value = options.find(o => o.value === field.value) || null;
                return (
                  <Select
                    classNamePrefix="react-select"
                    options={options}
                    value={value}
                    onChange={(opt) => field.onChange(opt ? opt.value : '')}
                    placeholder="Select Hospital"
                  />
                );
              }}
            />
            {errors.destinationHospitalId && (
              <p className="mt-1 text-sm text-red-500">{errors.destinationHospitalId.message}</p>
            )}
          </div>

          <Input
            label="Chief Complaint"
            {...register('chiefComplaint')}
            error={errors.chiefComplaint?.message}
            placeholder="e.g., Chest pain, difficulty breathing"
          />

          <div>
            <label className="block text-sm font-medium mb-2">Initial Assessment</label>
            <textarea
              {...register('initialAssessment')}
              rows="3"
              className="input w-full"
              placeholder="Enter initial patient assessment..."
            />
            {errors.initialAssessment && (
              <p className="mt-1 text-sm text-red-500">{errors.initialAssessment.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Onboard Patient
            </Button>
          </div>
        </form>
      </Modal>

      {/* Camera Feed Modal */}
      {showCameraModal && cameraSession && (
        <CameraFeedModal
          isOpen={showCameraModal}
          onClose={handleCloseCameraModal}
          session={cameraSession.session}
          ambulance={cameraSession.ambulance}
        />
      )}
    </div>
  );
};
