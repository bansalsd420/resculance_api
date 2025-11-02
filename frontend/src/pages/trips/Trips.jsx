import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
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
import { ToastContainer } from '../../components/ui/Toast';
import { patientService, ambulanceService, organizationService } from '../../services';
import { useToast } from '../../hooks/useToast';
import { CameraFeedModal } from './CameraFeedModal';
import { useAuthStore } from '../../store/authStore';

const sessionSchema = yup.object({
  patientId: yup.number().required('Patient is required'),
  ambulanceId: yup.number().required('Ambulance is required'),
  pickupLocation: yup.string().required('Pickup location is required'),
  pickupLatitude: yup.number().required('Pickup latitude is required'),
  pickupLongitude: yup.number().required('Pickup longitude is required'),
  destinationHospitalId: yup.number().required('Destination hospital is required'),
  chiefComplaint: yup.string().required('Chief complaint is required'),
  initialAssessment: yup.string(),
});

export const Trips = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraSession, setCameraSession] = useState(null);
  const { toasts, toast, removeToast } = useToast();
  const { user } = useAuthStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(sessionSchema),
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [patientsRes, ambulancesRes, orgsRes, sessionsRes] = await Promise.all([
        patientService.getAll(),
        ambulanceService.getAll(),
        organizationService.getAll({ type: 'HOSPITAL' }),
        patientService.getAllSessions(),
      ]);
      
      const patientsList = patientsRes.data?.data?.patients || patientsRes.data?.patients || patientsRes.data || [];
      const ambulancesList = ambulancesRes.data?.data?.ambulances || ambulancesRes.data?.ambulances || ambulancesRes.data || [];
      const hospitalsList = orgsRes.data?.data?.organizations || orgsRes.data?.organizations || orgsRes.data || [];
      const sessionsList = sessionsRes.data?.data?.sessions || sessionsRes.data?.sessions || sessionsRes.data || [];
      
      console.log('Trips: Fetched data', { 
        patients: patientsList.length, 
        ambulances: ambulancesList.length, 
        hospitals: hospitalsList.length,
        sessions: sessionsList.length
      });
      
      setPatients(patientsList);
      setAmbulances(ambulancesList);
      setHospitals(hospitalsList);
      setSessions(sessionsList);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load trip data');
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
      await patientService.onboard(data.patientId, {
        ambulanceId: data.ambulanceId,
        pickupLocation: data.pickupLocation,
        pickupLatitude: data.pickupLatitude,
        pickupLongitude: data.pickupLongitude,
        destinationHospitalId: data.destinationHospitalId,
        chiefComplaint: data.chiefComplaint,
        initialAssessment: data.initialAssessment,
      });
      toast.success('Trip created successfully');
      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to create trip:', error);
      toast.error('Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  const handleEndTrip = async (session) => {
    if (window.confirm('Are you sure you want to end this trip?')) {
      try {
        setLoading(true);
        // backend expects PATCH /patients/sessions/:sessionId/offboard with { treatmentNotes }
        await patientService.offboard(session.id, {
          treatmentNotes: 'Trip completed'
        });
        toast.success('Trip ended successfully');
        await fetchData();
      } catch (error) {
        console.error('Failed to end trip:', error);
        toast.error('Failed to end trip');
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
        return 'bg-green-50 text-green-700';
      case 'completed':
        return 'bg-blue-50 text-blue-700';
      case 'cancelled':
        return 'bg-red-50 text-red-700';
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
            onClick={() => navigate(`/trips/${session.id}`)}
            title="View full trip details"
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
                End
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Trips & Dispatch</h1>
          <p className="text-secondary">Manage ambulance trips and patient transport</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Start New Trip
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-2xl">
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-secondary">Total Trips</p>
              <p className="text-2xl font-bold">{statsData.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-2xl">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-secondary">Active</p>
              <p className="text-2xl font-bold">{statsData.active}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-2xl">
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-secondary">Completed</p>
              <p className="text-2xl font-bold">{statsData.completed}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-2xl">
              <XCircle className="w-8 h-8 text-red-600" />
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
                  ? 'bg-primary text-white'
                  : 'text-secondary hover:bg-background-card'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </Card>

      {/* Trips Table */}
      <Card>
        <div className="p-6">
          <Table
            columns={columns}
            data={filteredSessions}
            loading={loading}
          />
        </div>
      </Card>

      {/* Start Trip Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title="Start New Trip"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Patient</label>
            <select
              {...register('patientId')}
              className="w-full px-4 py-2 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select Patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName} - {patient.phone}
                </option>
              ))}
            </select>
            {errors.patientId && (
              <p className="mt-1 text-sm text-red-600">{errors.patientId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Ambulance</label>
            <select
              {...register('ambulanceId')}
              className="w-full px-4 py-2 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select Ambulance</option>
              {ambulances
                .filter((a) => a.status === 'available' || a.status === 'active')
                .map((ambulance) => (
                  <option key={ambulance.id} value={ambulance.id}>
                    {ambulance.registration_number || ambulance.vehicleNumber || ambulance.registrationNumber || ambulance.ambulance_code} - {ambulance.vehicle_type || ambulance.vehicleType}
                  </option>
                ))}
            </select>
            {errors.ambulanceId && (
              <p className="mt-1 text-sm text-red-600">{errors.ambulanceId.message}</p>
            )}
          </div>

          <Input
            label="Pickup Location"
            {...register('pickupLocation')}
            error={errors.pickupLocation?.message}
            placeholder="Enter pickup address"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Pickup Latitude"
              type="number"
              step="any"
              {...register('pickupLatitude')}
              error={errors.pickupLatitude?.message}
              placeholder="40.7128"
            />
            <Input
              label="Pickup Longitude"
              type="number"
              step="any"
              {...register('pickupLongitude')}
              error={errors.pickupLongitude?.message}
              placeholder="-74.0060"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Destination Hospital *</label>
            <select
              {...register('destinationHospitalId')}
              className="w-full px-4 py-2 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select Hospital</option>
              {hospitals.map((hospital) => (
                <option key={hospital.id} value={hospital.id}>
                  {hospital.name} - {hospital.city}, {hospital.state}
                </option>
              ))}
            </select>
            {errors.destinationHospitalId && (
              <p className="mt-1 text-sm text-red-600">{errors.destinationHospitalId.message}</p>
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
              className="w-full px-4 py-2 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter initial patient assessment..."
            />
            {errors.initialAssessment && (
              <p className="mt-1 text-sm text-red-600">{errors.initialAssessment.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Start Trip
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
