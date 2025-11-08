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
  Users,
  MessageCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import ChatPanel from '../../components/ChatPanel';
import VideoCallPanel from '../../components/VideoCallPanel';
import { patientService, ambulanceService } from '../../services';
import socketService from '../../services/socketService';
import { useToast } from '../../hooks/useToast';
import { useAuthStore } from '../../store/authStore';

export const OnboardingDetail = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, token } = useAuthStore();
  
  const [session, setSession] = useState(null);
  const [ambulance, setAmbulance] = useState(null);
  const [devices, setDevices] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    if (token) {
      socketService.connect(token);
    }
    
    fetchSessionDetails();

    return () => {
      // Cleanup: leave session room when component unmounts
      if (sessionId) {
        socketService.leaveSession(sessionId);
      }
    };
  }, [sessionId, token]);

  const fetchSessionDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching session details for sessionId:', sessionId);
      
      const sessionRes = await patientService.getSessionById(sessionId);
      console.log('Session response:', sessionRes);
      
      const sessionData = sessionRes.data?.data?.session || sessionRes.data?.session || sessionRes.data;
      console.log('Session data:', sessionData);
      
      if (!sessionData || !sessionData.id) {
        throw new Error('Session data not found or invalid');
      }
      
      setSession(sessionData);
      
      if (sessionData.ambulance_id || sessionData.ambulanceId) {
        const ambulanceId = sessionData.ambulance_id || sessionData.ambulanceId;
        console.log('Fetching ambulance data for ambulanceId:', ambulanceId);
        
        try {
          const devicesRes = await ambulanceService.getDevices(ambulanceId);
          const devicesData = devicesRes.data || [];
          console.log('Fetched devices:', devicesData);
          setDevices(Array.isArray(devicesData) ? devicesData : []);
        } catch (error) {
          console.error('Failed to fetch devices:', error);
          // Don't fail the whole page if devices fail
        }
      }
    } catch (error) {
      console.error('Failed to fetch session details:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const handleEndTrip = async () => {
    if (window.confirm('Are you sure you want to offboard this patient?')) {
      try {
        await patientService.offboard(sessionId, {
          treatmentNotes: 'Patient offboarded from detail view'
        });
        toast.success('Patient offboarded successfully');
        navigate('/onboarding');
      } catch (error) {
        console.error('Failed to offboard patient:', error);
        toast.error('Failed to offboard patient');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'onboarded':
      case 'in_transit':
        return 'bg-gray-100 text-gray-900 border-gray-300';
      case 'completed':
      case 'offboarded':
        return 'bg-gray-200 text-gray-900 border-gray-400';
      case 'cancelled':
        return 'bg-gray-300 text-gray-900 border-gray-500';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertCircle className="w-16 h-16 text-gray-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Session Not Found</h2>
        <p className="text-secondary mb-4">The requested session could not be found.</p>
        <Button onClick={() => navigate('/onboarding')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Onboarding
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
      
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/onboarding')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold mt-5">Onboarding Session</h1>
            <p className="text-secondary">
              Session Code: <span className="font-mono font-semibold">{session.session_code || session.sessionCode}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {(session.status?.toLowerCase() === 'active' || 
            session.status?.toLowerCase() === 'onboarded' || 
            session.status?.toLowerCase() === 'in_transit') ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => setShowVideoCall(true)}
                className="flex items-center gap-2"
              >
                <Video className="w-4 h-4" />
                Video Call
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowChat(true)}
                className="flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Group Chat
              </Button>
              <Button variant="danger" onClick={handleEndTrip}>
                Offboard Patient
              </Button>
            </>
          ) : (
            <div className="text-sm text-secondary flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Archived Session - Video & Chat not available
            </div>
          )}
          <span className={`px-4 py-2 rounded-xl border-2 text-sm font-medium flex items-center gap-2 ${getStatusColor(session.status)}`}>
            <Activity className="w-4 h-4" />
            {session.status}
          </span>
        </div>
      </div>

      {/* Camera Feeds Section - Only show for active sessions */}
      {(session.status?.toLowerCase() === 'active' || 
        session.status?.toLowerCase() === 'onboarded' || 
        session.status?.toLowerCase() === 'in_transit') && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Camera className="w-6 h-6 text-gray-900" />
              Ambulance Camera Feeds
              <span className="text-sm font-normal text-gray-500">({devices.length} devices)</span>
            </h2>
          </div>
          
          {devices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {devices.filter(d => d.device_type === 'camera').map((device) => (
                <motion.div
                  key={device.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden group"
                >
                  <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/70 px-3 py-1.5 rounded-full backdrop-blur-sm z-10">
                    <span className={`w-2 h-2 rounded-full ${device.status === 'active' ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></span>
                    <span className="text-white text-sm font-medium">{device.status === 'active' ? 'LIVE' : 'OFFLINE'}</span>
                  </div>
                  
                  <div className="absolute bottom-3 left-3 bg-black/70 px-3 py-1.5 rounded-full backdrop-blur-sm z-10">
                    <span className="text-white text-sm font-medium">
                      {device.device_name || device.deviceName || `Camera ${device.id}`}
                    </span>
                  </div>

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60">
                    <Camera className="w-16 h-16 mb-3" />
                    <p className="text-sm">
                      {device.status === 'active' ? 'Stream connecting...' : 'Camera offline'}
                    </p>
                    {device.device_api && (
                      <p className="text-xs mt-2 font-mono">{device.device_api}</p>
                    )}
                  </div>

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black"></div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Camera className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No camera devices found</p>
              <p className="text-sm">Camera devices will appear here when connected to the ambulance</p>
            </div>
          )}
        </Card>
      )}
      
      {/* Notice for completed sessions */}
      {(session.status?.toLowerCase() === 'completed' || 
        session.status?.toLowerCase() === 'offboarded' || 
        session.status?.toLowerCase() === 'cancelled') && (
        <Card className="p-4 bg-gray-50 border-gray-300">
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <AlertCircle className="w-5 h-5" />
            <div>
              <p className="font-semibold">Session Archived</p>
              <p className="text-xs">Live features (camera feeds, chat, video call) are only available for active sessions</p>
            </div>
          </div>
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
                <p className="font-semibold text-gray-900">
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
                  <MapPin className="w-4 h-4 text-gray-900" />
                  Pickup Location
                </label>
                <p className="font-semibold">{session.pickup_location || session.pickupLocation || 'N/A'}</p>
                {(session.pickup_latitude || session.pickupLatitude) && (
                  <p className="text-sm text-secondary font-mono">
                    {Number(session.pickup_latitude || session.pickupLatitude).toFixed(6)}, {Number(session.pickup_longitude || session.pickupLongitude).toFixed(6)}
                  </p>
                )}
              </div>
              
              <div className="border-t pt-4">
                <label className="text-sm text-secondary flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-gray-900" />
                  Destination Hospital
                </label>
                <p className="font-semibold">{session.destination_hospital_name || session.destinationHospital?.name || 'N/A'}</p>
                {(session.destination_latitude || session.destinationLatitude) && (
                  <p className="text-sm text-secondary font-mono">
                    {Number(session.destination_latitude || session.destinationLatitude).toFixed(6)}, {Number(session.destination_longitude || session.destinationLongitude).toFixed(6)}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Live Location */}
          {(session.status?.toLowerCase() === 'active' || 
            session.status?.toLowerCase() === 'onboarded' || 
            session.status?.toLowerCase() === 'in_transit') && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-primary" />
                Live Location
              </h2>
              <div className="space-y-4">
                {/* Map Placeholder */}
                <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Navigation className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-secondary">Live GPS tracking</p>
                      <p className="text-xs text-secondary mt-1 font-mono">
                        {Number(session.pickup_latitude || session.pickupLatitude).toFixed(6)}, {Number(session.pickup_longitude || session.pickupLongitude).toFixed(6)}
                      </p>
                    </div>
                  </div>
                  {/* TODO: Integrate actual map service (Google Maps, Mapbox, etc) */}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-secondary">Speed</label>
                    <p className="font-semibold">-- km/h</p>
                  </div>
                  <div>
                    <label className="text-secondary">ETA</label>
                    <p className="font-semibold">-- min</p>
                  </div>
                  <div>
                    <label className="text-secondary">Distance</label>
                    <p className="font-semibold">-- km</p>
                  </div>
                  <div>
                    <label className="text-secondary">Last Update</label>
                    <p className="font-semibold text-xs">Just now</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

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
              Session Timeline
            </h2>
            <div className="space-y-4">
              {session.onboarded_at && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-900 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Patient Onboarded</p>
                    <p className="text-xs text-secondary">
                      {new Date(session.onboarded_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              
              {session.status === 'in_transit' && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-500 rounded-full mt-2 animate-pulse"></div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">In Transit</p>
                    <p className="text-xs text-secondary">Currently active</p>
                  </div>
                </div>
              )}
              
              {session.offboarded_at && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-900 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Patient Offboarded</p>
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
                        ? 'bg-gray-200 text-gray-900' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {device.status || 'Unknown'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Assigned Staff */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Assigned Staff
            </h2>
            {assignedUsers.length > 0 ? (
              <div className="space-y-3">
                {assignedUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-3 bg-background-card rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {user.first_name || user.firstName} {user.last_name || user.lastName}
                      </p>
                      <p className="text-xs text-secondary capitalize">
                        {(user.role || '').replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-secondary">No staff assigned yet</p>
            )}
          </Card>
        </div>
      </div>

      {/* Chat and Video Call Panels */}
      <ChatPanel 
        sessionId={sessionId}
        isOpen={showChat}
        onClose={() => setShowChat(false)}
      />
      
      <VideoCallPanel 
        sessionId={sessionId}
        isOpen={showVideoCall}
        onClose={() => setShowVideoCall(false)}
      />
    </div>
  );
};
