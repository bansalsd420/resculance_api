import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Clock,
  User,
  Activity,
  Phone,
  AlertCircle,
  Camera,
  Video,
  Heart,
  Thermometer,
  Wind,
  Droplets,
  Navigation,
  Calendar,
  Building2,
  Ambulance as AmbulanceIcon,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ToastContainer } from '../../components/ui/Toast';
import { patientService, ambulanceService } from '../../services';
import { useToast } from '../../hooks/useToast';

export const TripDetail = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { toasts, toast, removeToast } = useToast();
  
  const [session, setSession] = useState(null);
  const [ambulance, setAmbulance] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCamera, setSelectedCamera] = useState(null);

  useEffect(() => {
    fetchTripDetails();
  }, [sessionId]);

  const fetchTripDetails = async () => {
    try {
      setLoading(true);
      const sessionRes = await patientService.getSessionById(sessionId);
      const sessionData = sessionRes.data?.data?.session || sessionRes.data?.session || sessionRes.data;
      
      setSession(sessionData);
      
      if (sessionData.ambulance_id || sessionData.ambulanceId) {
        const ambulanceId = sessionData.ambulance_id || sessionData.ambulanceId;
        const [ambulanceRes, devicesRes] = await Promise.all([
          ambulanceService.getById(ambulanceId),
          ambulanceService.getDevices(ambulanceId),
        ]);
        
        const ambulanceData = ambulanceRes.data?.data?.ambulance || ambulanceRes.data?.ambulance || ambulanceRes.data;
        // Backend returns { success: true, data: [devices] } directly
        const devicesData = devicesRes.data?.data || devicesRes.data?.devices || devicesRes.data || [];
        
        console.log('Trip Detail: Fetched ambulance and devices', { ambulanceData, devicesData });
        
        setAmbulance(ambulanceData);
        setDevices(Array.isArray(devicesData) ? devicesData : []);
      }
    } catch (error) {
      console.error('Failed to fetch trip details:', error);
      toast.error('Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };

  const handleEndTrip = async () => {
    if (window.confirm('Are you sure you want to end this trip?')) {
      try {
        await patientService.offboard(sessionId, {
          treatmentNotes: 'Trip completed from detail view'
        });
        toast.success('Trip ended successfully');
        navigate('/trips');
      } catch (error) {
        console.error('Failed to end trip:', error);
        toast.error('Failed to end trip');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'onboarded':
      case 'in_transit':
        return 'bg-green-50 text-green-700 border-green-300';
      case 'completed':
      case 'offboarded':
        return 'bg-blue-50 text-blue-700 border-blue-300';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Trip Not Found</h2>
        <p className="text-secondary mb-4">The requested trip could not be found.</p>
        <Button onClick={() => navigate('/trips')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Trips
        </Button>
      </div>
    );
  }

  const cameraDevices = devices.filter(d => {
    const deviceType = (d.device_type || d.deviceType || '').toLowerCase();
    return deviceType.includes('camera');
  });

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/trips')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold">Trip Details</h1>
            <p className="text-secondary">
              Session Code: <span className="font-mono font-semibold">{session.session_code || session.sessionCode}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {(session.status?.toLowerCase() === 'active' || 
            session.status?.toLowerCase() === 'onboarded' || 
            session.status?.toLowerCase() === 'in_transit') && (
            <Button variant="danger" onClick={handleEndTrip}>
              End Trip
            </Button>
          )}
          <span className={`px-4 py-2 rounded-xl border-2 text-sm font-medium flex items-center gap-2 ${getStatusColor(session.status)}`}>
            <Activity className="w-4 h-4" />
            {session.status}
          </span>
        </div>
      </div>

      {/* Camera Feeds Grid */}
      {cameraDevices.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Camera className="w-6 h-6 text-primary" />
              Live Camera Feeds
            </h2>
            <Button variant="outline" size="sm">
              <Video className="w-4 h-4 mr-2" />
              Full Screen
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cameraDevices.map((device) => (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden group cursor-pointer"
                onClick={() => setSelectedCamera(device)}
              >
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm z-10">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  <span className="text-white text-sm font-medium">LIVE</span>
                </div>
                
                <div className="absolute bottom-3 left-3 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm z-10">
                  <span className="text-white text-sm font-medium capitalize">
                    {device.device_name || device.deviceName || 'Camera'}
                  </span>
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera className="w-12 h-12 text-white/30" />
                  <p className="text-white/60 text-sm absolute bottom-8">
                    {device.status === 'active' ? 'Stream Active' : 'No Signal'}
                  </p>
                </div>

                {/* Placeholder for actual video stream */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"></div>
              </motion.div>
            ))}
          </div>

          {cameraDevices.length === 0 && (
            <div className="text-center py-12 text-secondary">
              <Camera className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No camera feeds available for this trip</p>
            </div>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Information */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Patient Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-secondary">Name</label>
                <p className="font-semibold">
                  {session.patient_first_name || session.patient?.firstName} {session.patient_last_name || session.patient?.lastName}
                </p>
              </div>
              <div>
                <label className="text-sm text-secondary">Age</label>
                <p className="font-semibold">{session.patient_age || session.patient?.age || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-secondary">Gender</label>
                <p className="font-semibold capitalize">{session.patient_gender || session.patient?.gender || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-secondary">Phone</label>
                <p className="font-semibold flex items-center gap-2">
                  <Phone className="w-4 h-4 text-secondary" />
                  {session.patient_phone || session.patient?.phone || 'N/A'}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-secondary">Chief Complaint</label>
                <p className="font-semibold text-red-600">
                  {session.chief_complaint || session.chiefComplaint || 'N/A'}
                </p>
              </div>
              {(session.initial_assessment || session.initialAssessment) && (
                <div className="md:col-span-2">
                  <label className="text-sm text-secondary">Initial Assessment</label>
                  <p className="text-sm">{session.initial_assessment || session.initialAssessment}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Location & Route */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-primary" />
              Location & Route
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-secondary flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  Pickup Location
                </label>
                <p className="font-semibold">{session.pickup_location || session.pickupLocation || 'N/A'}</p>
                {(session.pickup_latitude || session.pickupLatitude) && (
                  <p className="text-sm text-secondary font-mono">
                    {(session.pickup_latitude || session.pickupLatitude)?.toFixed(6)}, {(session.pickup_longitude || session.pickupLongitude)?.toFixed(6)}
                  </p>
                )}
              </div>
              
              <div className="border-t pt-4">
                <label className="text-sm text-secondary flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  Destination Hospital
                </label>
                <p className="font-semibold">{session.destination_hospital_name || session.destinationHospital?.name || 'N/A'}</p>
                {(session.destination_latitude || session.destinationLatitude) && (
                  <p className="text-sm text-secondary font-mono">
                    {(session.destination_latitude || session.destinationLatitude)?.toFixed(6)}, {(session.destination_longitude || session.destinationLongitude)?.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Treatment Notes */}
          {(session.treatment_notes || session.treatmentNotes) && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Treatment Notes
              </h2>
              <p className="text-sm whitespace-pre-wrap">
                {session.treatment_notes || session.treatmentNotes}
              </p>
            </Card>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Ambulance Info */}
          {ambulance && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <AmbulanceIcon className="w-5 h-5 text-primary" />
                Ambulance Details
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-secondary">Vehicle Number</label>
                  <p className="font-semibold font-mono">
                    {ambulance.registration_number || ambulance.vehicle_number || ambulance.ambulance_code}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-secondary">Type</label>
                  <p className="font-semibold capitalize">
                    {ambulance.vehicle_type || ambulance.vehicleType || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-secondary">Organization</label>
                  <p className="font-semibold">
                    {ambulance.organization_name || session.organization_name || 'N/A'}
                  </p>
                  <p className="text-xs text-secondary">{ambulance.organization_code || session.organization_code || ''}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Timeline */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Trip Timeline
            </h2>
            <div className="space-y-4">
              {session.onboarded_at && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Trip Started</p>
                    <p className="text-xs text-secondary">
                      {new Date(session.onboarded_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              
              {session.status === 'in_transit' && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 animate-pulse"></div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">In Transit</p>
                    <p className="text-xs text-secondary">Currently active</p>
                  </div>
                </div>
              )}
              
              {session.offboarded_at && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Trip Completed</p>
                    <p className="text-xs text-secondary">
                      {new Date(session.offboarded_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Attached Devices */}
          {devices.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Attached Devices
              </h2>
              <div className="space-y-3">
                {devices.map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-3 bg-background-card rounded-xl">
                    <div className="flex items-center gap-3">
                      {device.device_type?.toLowerCase().includes('camera') ? (
                        <Camera className="w-5 h-5 text-secondary" />
                      ) : (
                        <Activity className="w-5 h-5 text-secondary" />
                      )}
                      <div>
                        <p className="font-medium text-sm capitalize">
                          {device.device_name || device.deviceName || 'Unknown'}
                        </p>
                        <p className="text-xs text-secondary capitalize">
                          {device.device_type || device.deviceType}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      device.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {device.status || 'Unknown'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
