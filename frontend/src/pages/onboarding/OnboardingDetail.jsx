import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  User,
  Activity,
  Phone,
  AlertCircle,
  Camera,
  Video,
  MessageCircle,
  Power,
  Lightbulb,
  Volume2,
  Wind,
  Heart,
  Navigation,
  Clock,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import ChatPanel from '../../components/ChatPanel';
import VideoCallPanel from '../../components/VideoCallPanel';
import { patientService, ambulanceService } from '../../services';
import socketService from '../../services/socketService';
import { useToast } from '../../hooks/useToast';
import { useAuthStore } from '../../store/authStore';
import { CameraFeedModal } from './CameraFeedModal';

export const OnboardingDetail = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, token } = useAuthStore();
  
  const [session, setSession] = useState(null);
  const [ambulance, setAmbulance] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [activeTab, setActiveTab] = useState('notes');
  
  // Ambulance controls state
  const [controls, setControls] = useState({
    mainPower: false,
    emergencyLights: false,
    siren: false,
    airConditioning: false,
    oxygenSupply: false,
    cabinCamera: false,
  });

  // Mock vital signs - in production, these would come from real-time sensors
  const [vitals, setVitals] = useState({
    heartRate: 98,
    bloodPressure: '120/78',
    spo2: 94,
    temp: 37.1,
  });

  // Mock SOS data
  const [sosAlerts, setSosAlerts] = useState([
    { id: 1012, time: '10:22', level: 'Critical', note: 'Patient seizure detected', action: 'Ack' },
    { id: 1011, time: '10:09', level: 'Warning', note: 'O2 below threshold', action: 'Ack' },
    { id: 1010, time: '09:55', level: 'Info', note: 'Door opened', action: 'Ack' },
  ]);

  useEffect(() => {
    // Dispatch event to collapse sidebar when this page loads
    window.dispatchEvent(new CustomEvent('collapse-sidebar'));

    if (token) {
      socketService.connect(token);
    }
    
    fetchSessionDetails();

    return () => {
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
      const sessionData = sessionRes.data?.data?.session || sessionRes.data?.session || sessionRes.data;
      
      if (!sessionData || !sessionData.id) {
        throw new Error('Session data not found or invalid');
      }
      
      setSession(sessionData);
      
      if (sessionData.ambulance_id || sessionData.ambulanceId) {
        const ambulanceId = sessionData.ambulance_id || sessionData.ambulanceId;
        
        try {
          const devicesRes = await ambulanceService.getDevices(ambulanceId);
          const devicesData = devicesRes.data || [];
          setDevices(Array.isArray(devicesData) ? devicesData : []);
        } catch (error) {
          console.error('Failed to fetch devices:', error);
        }
      }
    } catch (error) {
      console.error('Failed to fetch session details:', error);
      toast.error(error.response?.data?.message || 'Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const handleOffboardPatient = async () => {
    if (window.confirm('Are you sure you want to offboard this patient?')) {
      try {
        await patientService.offboard(sessionId, {
          treatmentNotes: 'Patient offboarded from Command Console'
        });
        toast.success('Patient offboarded successfully');
        navigate('/onboarding');
      } catch (error) {
        console.error('Failed to offboard patient:', error);
        toast.error('Failed to offboard patient');
      }
    }
  };

  const toggleControl = (controlName) => {
    setControls(prev => ({
      ...prev,
      [controlName]: !prev[controlName]
    }));
    // In production, this would send command to ambulance via socket
    toast.info(`${controlName.replace(/([A-Z])/g, ' $1').trim()} ${controls[controlName] ? 'disabled' : 'enabled'}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertCircle className="w-16 h-16 text-error mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-text">Session Not Found</h2>
        <p className="text-text-secondary mb-4">The requested session could not be found.</p>
        <Button onClick={() => navigate('/onboarding')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Onboarding
        </Button>
      </div>
    );
  }

  const isActive = session.status?.toLowerCase() === 'active' || 
                   session.status?.toLowerCase() === 'onboarded' || 
                   session.status?.toLowerCase() === 'in_transit';

  const cameraDevices = devices.filter(d => {
    const deviceType = (d.device_type || d.deviceType || '').toLowerCase();
    return deviceType.includes('camera');
  });

  // Ensure we have at least 4 camera slots
  const cameraSlots = [
    { id: 'front', name: 'Front Cam', device: cameraDevices[0] || null },
    { id: 'cabin', name: 'Cabin Cam', device: cameraDevices[1] || null },
    { id: 'rear', name: 'Rear Cam', device: cameraDevices[2] || null },
    { id: 'side', name: 'Side Cam', device: cameraDevices[3] || null },
  ];

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-background-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/onboarding')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-text">Ambulance Command Console</h1>
            <p className="text-sm text-text-secondary">
              Live operations • {session.ambulance_code || 'City EMS'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-lg bg-error/10 text-error text-sm font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
            {session.ambulance_code || 'AMB-204'}
          </span>
          <span className="px-3 py-1 rounded-lg bg-success/10 text-success text-sm font-medium">
            82% Battery
          </span>
          <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-sm font-medium">
            On-duty
          </span>
        </div>
      </div>

      <div className="px-6 pt-6 space-y-6">
        {/* Main Grid: Camera Feeds + Live Meeting */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera Feeds - 2/3 width */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Camera Feeds
                <span className="text-sm font-normal text-text-secondary">All onboard camera streams</span>
              </h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Refresh</Button>
                <Button size="sm" variant="outline">Layouts</Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {cameraSlots.map((slot) => (
                <motion.div
                  key={slot.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden group cursor-pointer"
                  onClick={() => slot.device && setSelectedCamera(slot.device)}
                >
                  {/* Live badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-error/90 px-2 py-1 rounded-md backdrop-blur-sm z-10">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                    <span className="text-white text-xs font-bold">LIVE</span>
                  </div>
                  
                  {/* Camera label */}
                  <div className="absolute bottom-2 left-2 bg-black/70 px-2.5 py-1 rounded-md backdrop-blur-sm z-10">
                    <span className="text-white text-xs font-medium">{slot.name}</span>
                  </div>

                  {/* Resolution */}
                  <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded backdrop-blur-sm z-10">
                    <span className="text-white text-[10px] font-mono">1080p · 30fps</span>
                  </div>

                  {/* Placeholder content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
                    <Camera className="w-12 h-12 mb-2" />
                    <p className="text-xs">
                      {slot.device ? 'Stream connecting...' : 'Camera offline'}
                    </p>
                  </div>

                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black"></div>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Live Meeting - 1/3 width */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text flex items-center gap-2">
                <Video className="w-5 h-5" />
                Live Meeting
              </h2>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">Telemedicine & dispatch bridge</p>
              
              {/* Meeting placeholder */}
              <div className="aspect-video bg-gray-900 rounded-xl flex flex-col items-center justify-center text-white/60">
                <Video className="w-16 h-16 mb-3" />
                <p className="text-sm font-medium mb-1">No active session</p>
                <Button 
                  size="sm" 
                  onClick={() => setShowVideoCall(true)}
                  className="mt-2"
                >
                  Join Session
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Second Row: Patient Flow, Medical Reports, Live Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Patient Flow */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Patient Flow
            </h2>
            <p className="text-xs text-text-secondary mb-4">Onboard / Offboard</p>
            
            <div className="space-y-3">
              <Button 
                variant="primary" 
                className="w-full justify-center"
                disabled={!isActive}
              >
                <User className="w-4 h-4 mr-2" />
                Onboard Patient
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-center"
                onClick={handleOffboardPatient}
                disabled={!isActive}
              >
                Offboard Patient
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm font-semibold text-text mb-3">Current Patient</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">ID:</span>
                  <span className="font-mono font-medium text-text">PT-88912</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">HR</span>
                    <span className="font-medium text-text">{vitals.heartRate} bpm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">SpO₂</span>
                    <span className="font-medium text-text">{vitals.spo2} %</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">BP</span>
                    <span className="font-medium text-text">{vitals.bloodPressure} mmHg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Temp</span>
                    <span className="font-medium text-text">{vitals.temp} °C</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Medical Reports */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Medical Reports
            </h2>
            <p className="text-xs text-text-secondary mb-4">Incident & treatment notes</p>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-border mb-4">
              {['Notes', 'Meds', 'Files'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.toLowerCase()
                      ? 'border-primary text-primary'
                      : 'border-transparent text-text-secondary hover:text-text'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="space-y-3">
              {activeTab === 'notes' && (
                <div className="text-sm text-text-secondary">
                  <p className="mb-2">No notes available</p>
                </div>
              )}
              {activeTab === 'meds' && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center p-2 bg-background rounded">
                    <div>
                      <p className="font-medium text-text">Aspirin</p>
                      <p className="text-xs text-text-secondary">150 mg</p>
                    </div>
                    <span className="text-text-secondary">Salbutamol</span>
                    <span className="text-text-secondary">2.5 mg neb</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-background rounded">
                    <div>
                      <p className="font-medium text-text">Nitro</p>
                      <p className="text-xs text-text-secondary">0.4 mg</p>
                    </div>
                    <span className="text-text-secondary">Ondansetron</span>
                    <span className="text-text-secondary">4 mg</span>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-secondary">Medication</span>
                      <span className="text-text-secondary">Dose</span>
                      <Button size="sm" variant="link" className="text-primary">Add</Button>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'files' && (
                <div className="text-sm text-text-secondary">
                  <p>No files uploaded</p>
                </div>
              )}
            </div>
          </Card>

          {/* Live Location */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Live Location
            </h2>
            <p className="text-xs text-text-secondary mb-4">Device GPS & route</p>

            {/* Map placeholder */}
            <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden mb-4 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-text-secondary">
                  <Navigation className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">GPS tracking</p>
                </div>
              </div>
            </div>

            {/* Location stats */}
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div>
                <p className="text-text-secondary text-xs mb-1">Speed</p>
                <p className="font-bold text-text">42 km/h</p>
              </div>
              <div>
                <p className="text-text-secondary text-xs mb-1">Heading</p>
                <p className="font-bold text-text">NE 45°</p>
              </div>
              <div>
                <p className="text-text-secondary text-xs mb-1">Signal</p>
                <p className="font-bold text-text">4/5</p>
              </div>
            </div>

            <div className="mt-4 text-right">
              <p className="text-xs text-text-secondary">ETA 08 min</p>
            </div>
          </Card>
        </div>

        {/* Third Row: Ambulance Controls + SOS Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ambulance Controls */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Ambulance Controls
            </h2>
            <p className="text-xs text-text-secondary mb-6">Switches & power systems</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { key: 'mainPower', icon: Power, label: 'Main Power', color: 'green' },
                { key: 'emergencyLights', icon: Lightbulb, label: 'Emergency Lights', color: 'yellow' },
                { key: 'siren', icon: Volume2, label: 'Siren', color: 'red' },
                { key: 'airConditioning', icon: Wind, label: 'Air Conditioning', color: 'blue' },
                { key: 'oxygenSupply', icon: Heart, label: 'Oxygen Supply', color: 'green' },
                { key: 'cabinCamera', icon: Camera, label: 'Cabin Camera', color: 'purple' },
              ].map(({ key, icon: Icon, label, color }) => (
                <motion.button
                  key={key}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleControl(key)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    controls[key]
                      ? `bg-${color}-50 dark:bg-${color}-900/20 border-${color}-500`
                      : 'bg-background border-border hover:border-border-hover'
                  }`}
                >
                  <Icon className={`w-6 h-6 mb-2 mx-auto ${controls[key] ? `text-${color}-600 dark:text-${color}-400` : 'text-text-secondary'}`} />
                  <p className={`text-xs font-medium text-center ${controls[key] ? 'text-text' : 'text-text-secondary'}`}>
                    {label}
                  </p>
                  <p className="text-[10px] text-center mt-1 text-text-secondary">Manual</p>
                </motion.button>
              ))}
            </div>
          </Card>

          {/* SOS Data */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              SOS Data
            </h2>
            <p className="text-xs text-text-secondary mb-6">System alerts & anomalies</p>

            <div className="space-y-2">
              {/* Table header */}
              <div className="grid grid-cols-5 gap-2 text-xs font-semibold text-text-secondary pb-2 border-b border-border">
                <div>#</div>
                <div>Time</div>
                <div>Level</div>
                <div className="col-span-2">Note</div>
              </div>

              {/* Table rows */}
              {sosAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className="grid grid-cols-5 gap-2 text-xs py-2 hover:bg-background rounded transition-colors items-center"
                >
                  <div className="font-mono text-text">{alert.id}</div>
                  <div className="text-text">{alert.time}</div>
                  <div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      alert.level === 'Critical' 
                        ? 'bg-error/20 text-error'
                        : alert.level === 'Warning'
                        ? 'bg-warning/20 text-warning'
                        : 'bg-info/20 text-info'
                    }`}>
                      {alert.level}
                    </span>
                  </div>
                  <div className="text-text">{alert.note}</div>
                  <div className="text-right">
                    <Button size="sm" variant="link" className="text-primary text-xs">
                      {alert.action}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-text-secondary">All data is for demo only</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Chat and Video Call Panels */}
      {isActive && (
        <>
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
        </>
      )}

      {/* Camera Modal */}
      {selectedCamera && (
        <CameraFeedModal
          camera={selectedCamera}
          onClose={() => setSelectedCamera(null)}
        />
      )}
    </div>
  );
};
