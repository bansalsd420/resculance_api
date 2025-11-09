import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  User,
  Activity,
  Phone,
  Camera,
  Video,
  MessageCircle,
  Video as VideoIcon,
  AlertCircle,
  Lightbulb,
  Power,
  Volume2,
  Wind,
  Heart,
  Navigation
} from 'lucide-react';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import ChatPanel from '../../components/ChatPanel';
import VideoCallPanel from '../../components/VideoCallPanel';
import { LiveCameraFeed } from '../../components/LiveCameraFeed';
import { patientService, ambulanceService } from '../../services';
import socketService from '../../services/socketService';
import { useToast } from '../../hooks/useToast';
import { useAuthStore } from '../../store/authStore';
import { CameraFeedModal } from './CameraFeedModal';

export default function OnboardingDetail() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, token } = useAuthStore();

  const [session, setSession] = useState(null);
  const [ambulance, setAmbulance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [activeTab, setActiveTab] = useState('notes');
  const [controls, setControls] = useState({
    mainPower: false,
    emergencyLights: false,
    siren: false,
    airConditioning: false,
    oxygenSupply: false,
    cabinCamera: false,
  });

  // Mock vitals & sos for demo (replace with real data in production)
  const [vitals, setVitals] = useState({ heartRate: 98, bloodPressure: '120/78', spo2: 94, temp: 37.1 });
  const [sosAlerts, setSosAlerts] = useState([
    { id: 1012, time: '10:22', level: 'Critical', note: 'Patient seizure detected', action: 'Ack' },
    { id: 1011, time: '10:09', level: 'Warning', note: 'O2 below threshold', action: 'Ack' },
    { id: 1010, time: '09:55', level: 'Info', note: 'Door opened', action: 'Ack' },
  ]);

  const isActive = ['active', 'onboarded', 'in_transit'].includes((session?.status || '').toLowerCase());

  useEffect(() => {
    // connect sockets when token available
    if (token) socketService.connect(token);
    if (sessionId) fetchSessionDetails();

    return () => {
      if (sessionId) socketService.leaveSession(sessionId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, token]);

  async function fetchSessionDetails() {
    setLoading(true);
    try {
      const sessionRes = await patientService.getSessionById(sessionId);
      const sessionData = sessionRes?.data?.data?.session || sessionRes?.data?.session || sessionRes?.data;
      if (!sessionData || !sessionData.id) throw new Error('Session data not found or invalid');
      setSession(sessionData);

      const ambulanceId = sessionData.ambulance_id || sessionData.ambulanceId;
      if (ambulanceId) {
        try {
          const ambulanceRes = await ambulanceService.getById(ambulanceId);
          const ambulanceData = ambulanceRes?.data?.data?.ambulance || ambulanceRes?.data?.ambulance || ambulanceRes?.data;
          setAmbulance(ambulanceData || null);
        } catch (err) {
          console.error('Failed to fetch ambulance details:', err);
          setAmbulance(null);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message || 'Failed to load session details');
    } finally {
      setLoading(false);
    }
  }

  async function handleOffboardPatient() {
    if (!sessionId) return;
    if (!window.confirm('Are you sure you want to offboard this patient?')) return;
    try {
      await patientService.offboard(sessionId, { treatmentNotes: 'Patient offboarded from Command Console' });
      toast.success('Patient offboarded successfully');
      navigate('/onboarding');
    } catch (error) {
      console.error('Failed to offboard patient:', error);
      toast.error('Failed to offboard patient');
    }
  }

  function toggleControl(controlName) {
    setControls(prev => ({ ...prev, [controlName]: !prev[controlName] }));
    toast.info(`${controlName.replace(/([A-Z])/g, ' $1').trim()} ${controls[controlName] ? 'disabled' : 'enabled'}`);
    // In production, this would emit a socket command to the ambulance
    // socketService.emit('toggle-control', { sessionId, control: controlName, value: !controls[controlName] });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4" />
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
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Onboarding
        </Button>
      </div>
    );
  }

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
            <p className="text-sm text-text-secondary">Live operations • {session.ambulance_code || session.ambulanceCode || 'Unknown'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-lg bg-error/10 text-error text-sm font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-error animate-pulse" /> {session.ambulance_code || 'AMB-204'}
          </span>

          <span className="px-3 py-1 rounded-lg bg-success/10 text-success text-sm font-medium">82% Battery</span>
          <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-sm font-medium">On-duty</span>
        </div>
      </div>

      <div className="px-6 pt-6 space-y-6">
        {/* Main Grid: Camera Feeds + Live Meeting */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera Feeds - 2/3 width */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text flex items-center gap-2">
                <Camera className="w-5 h-5" /> Live Camera Feeds
              </h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowCameraModal(true)}>
                  <Camera className="w-4 h-4 mr-1" /> View All
                </Button>
                <Button size="sm" variant="outline" onClick={fetchSessionDetails}>
                  Refresh
                </Button>
              </div>
            </div>

            <LiveCameraFeed 
              ambulance={ambulance}
              session={session}
              onCameraClick={(device) => {
                setSelectedCamera(device);
                setShowCameraModal(true);
              }}
            />
          </Card>

          {/* Live Meeting - 1/3 width */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text flex items-center gap-2"><Video className="w-5 h-5" /> Live Meeting</h2>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">Telemedicine & dispatch bridge</p>

              <div className="aspect-video bg-gray-900 rounded-xl flex flex-col items-center justify-center text-white/60">
                <VideoIcon className="w-16 h-16 mb-3" />
                <p className="text-sm font-medium mb-1">{isActive ? 'Active session' : 'No active session'}</p>
                <Button size="sm" onClick={() => setShowVideoCall(true)} className="mt-2">Join Session</Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Second Row: Patient Flow, Medical Reports, Live Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Patient Flow */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2"><Activity className="w-5 h-5" /> Patient Status</h2>
            <p className="text-xs text-text-secondary mb-4">Session: {session.session_code || session.sessionCode}</p>

            <div className="mb-4">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium ${
                session.status?.toLowerCase() === 'onboarded' ? 'bg-primary/10 text-primary' : session.status?.toLowerCase() === 'in_transit' ? 'bg-warning/10 text-warning' : session.status?.toLowerCase() === 'offboarded' ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-700'
              }`}>
                <span className="w-2 h-2 rounded-full mr-2 animate-pulse" style={{ backgroundColor: session.status?.toLowerCase() === 'onboarded' ? 'var(--color-primary)' : session.status?.toLowerCase() === 'in_transit' ? 'var(--color-warning)' : session.status?.toLowerCase() === 'offboarded' ? 'var(--color-success)' : 'gray' }} />
                {session.status?.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>

            <div className="space-y-3">
              {session.status?.toLowerCase() === 'offboarded' ? (
                <div className="text-center p-4 bg-success/10 rounded-lg">
                  <p className="text-sm text-success font-medium">Patient Offboarded</p>
                  <p className="text-xs text-text-secondary mt-1">Session completed</p>
                </div>
              ) : (
                <Button variant="outline" className="w-full justify-center" onClick={handleOffboardPatient} disabled={!isActive}>Offboard Patient</Button>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm font-semibold text-text mb-3">Patient Vitals</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background rounded-lg p-3 border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-secondary">Heart Rate</span>
                    <Heart className="w-4 h-4 text-error" />
                  </div>
                  <p className="text-lg font-bold text-text">{vitals.heartRate} <span className="text-sm font-normal text-text-secondary">bpm</span></p>
                </div>
                
                <div className="bg-background rounded-lg p-3 border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-secondary">SpO₂</span>
                    <Activity className="w-4 h-4 text-success" />
                  </div>
                  <p className="text-lg font-bold text-text">{vitals.spo2}<span className="text-sm font-normal text-text-secondary">%</span></p>
                </div>
                
                <div className="bg-background rounded-lg p-3 border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-secondary">Blood Pressure</span>
                    <Activity className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-lg font-bold text-text">{vitals.bloodPressure}</p>
                </div>
                
                <div className="bg-background rounded-lg p-3 border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-secondary">Temperature</span>
                    <Activity className="w-4 h-4 text-warning" />
                  </div>
                  <p className="text-lg font-bold text-text">{vitals.temp}<span className="text-sm font-normal text-text-secondary">°C</span></p>
                </div>
              </div>
            </div>
          </Card>

          {/* Medical Reports */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2"><Activity className="w-5 h-5" /> Medical Reports</h2>
            <p className="text-xs text-text-secondary mb-4">Incident & treatment notes</p>

            <div className="flex gap-4 border-b border-border mb-4">
              {['Notes', 'Meds', 'Files'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab.toLowerCase())} className={`pb-2 text-sm font-medium border-b-2 transition-colors ${ activeTab === tab.toLowerCase() ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text' }`}>
                  {tab}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {activeTab === 'notes' && <div className="text-sm text-text-secondary"><p className="mb-2">No notes available</p></div>}

              {activeTab === 'meds' && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center p-2 bg-background rounded">
                    <div><p className="font-medium text-text">Aspirin</p><p className="text-xs text-text-secondary">150 mg</p></div>
                    <div className="text-text-secondary">Salbutamol</div>
                    <div className="text-text-secondary">2.5 mg neb</div>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-background rounded">
                    <div><p className="font-medium text-text">Nitro</p><p className="text-xs text-text-secondary">0.4 mg</p></div>
                    <div className="text-text-secondary">Ondansetron</div>
                    <div className="text-text-secondary">4 mg</div>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between items-center text-xs"><span className="text-text-secondary">Medication</span><span className="text-text-secondary">Dose</span><Button size="sm" variant="link" className="text-primary">Add</Button></div>
                  </div>
                </div>
              )}

              {activeTab === 'files' && <div className="text-sm text-text-secondary"><p>No files uploaded</p></div>}
            </div>
          </Card>

          {/* Live Location */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2"><MapPin className="w-5 h-5" /> Live Location</h2>
            <p className="text-xs text-text-secondary mb-4">Device GPS & route</p>

            <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden mb-4 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-text-secondary">
                  <Navigation className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">GPS tracking</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div><p className="text-text-secondary text-xs mb-1">Speed</p><p className="font-bold text-text">42 km/h</p></div>
              <div><p className="text-text-secondary text-xs mb-1">Heading</p><p className="font-bold text-text">NE 45°</p></div>
              <div><p className="text-text-secondary text-xs mb-1">Signal</p><p className="font-bold text-text">4/5</p></div>
            </div>

            <div className="mt-4 text-right"><p className="text-xs text-text-secondary">ETA 08 min</p></div>
          </Card>
        </div>

        {/* Third Row: Ambulance Controls + SOS Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ambulance Controls */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2"><Activity className="w-5 h-5" /> Ambulance Controls</h2>
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
                <motion.button key={key} whileTap={{ scale: 0.95 }} onClick={() => toggleControl(key)} className={`p-4 rounded-xl border-2 transition-all ${controls[key] ? 'bg-opacity-100 border-opacity-100' : 'bg-background border-border hover:border-border-hover'}`}>
                  <Icon className={`w-6 h-6 mb-2 mx-auto ${controls[key] ? 'text-text' : 'text-text-secondary'}`} />
                  <p className={`text-xs font-medium text-center ${controls[key] ? 'text-text' : 'text-text-secondary'}`}>{label}</p>
                  <p className="text-[10px] text-center mt-1 text-text-secondary">Manual</p>
                </motion.button>
              ))}
            </div>
          </Card>

          {/* SOS Data */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2"><AlertCircle className="w-5 h-5" /> SOS Data</h2>
            <p className="text-xs text-text-secondary mb-6">System alerts & anomalies</p>

            <div className="space-y-2">
              {/* Mobile-friendly header - hidden on larger screens */}
              <div className="hidden md:grid md:grid-cols-5 gap-2 text-xs font-semibold text-text-secondary pb-2 border-b border-border">
                <div>#</div>
                <div>Time</div>
                <div>Level</div>
                <div className="col-span-2">Note</div>
              </div>

              {sosAlerts.map((alert) => (
                <div key={alert.id} className="border border-border rounded-lg p-3 hover:bg-background transition-colors">
                  {/* Mobile layout */}
                  <div className="md:hidden space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-text">#{alert.id}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${alert.level === 'Critical' ? 'bg-error/20 text-error' : alert.level === 'Warning' ? 'bg-warning/20 text-warning' : 'bg-info/20 text-info'}`}>{alert.level}</span>
                    </div>
                    <div className="text-sm text-text">{alert.note}</div>
                    <div className="flex items-center justify-between text-xs text-text-secondary">
                      <span>{alert.time}</span>
                      <Button size="sm" variant="link" className="text-primary text-xs p-0 h-auto">{alert.action}</Button>
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden md:grid md:grid-cols-5 gap-2 text-xs items-center">
                    <div className="font-mono text-text">{alert.id}</div>
                    <div className="text-text">{alert.time}</div>
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${alert.level === 'Critical' ? 'bg-error/20 text-error' : alert.level === 'Warning' ? 'bg-warning/20 text-warning' : 'bg-info/20 text-info'}`}>{alert.level}</span>
                    </div>
                    <div className="text-text col-span-1">{alert.note}</div>
                    <div className="text-right"><Button size="sm" variant="link" className="text-primary text-xs">{alert.action}</Button></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-center"><p className="text-xs text-text-secondary">All data is for demo only</p></div>
          </Card>
        </div>
      </div>

      {/* Chat and Video Call Panels */}
      <ChatPanel sessionId={sessionId} isOpen={showChat} onClose={() => setShowChat(false)} />
      <VideoCallPanel sessionId={sessionId} isOpen={showVideoCall} onClose={() => setShowVideoCall(false)} />

      {/* Floating Action Buttons - Chat and Video only */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-[9999]">
        <motion.button 
          whileHover={{ scale: 1.1 }} 
          whileTap={{ scale: 0.9 }} 
          onClick={() => setShowChat(true)} 
          className="w-16 h-16 rounded-full bg-primary hover:bg-primary-hover text-white shadow-2xl flex items-center justify-center relative group transition-all"
          title="Open Group Chat"
          aria-label="Open Group Chat"
        >
          <MessageCircle className="w-7 h-7" />
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-error text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">3</span>
          <span className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">Group Chat</span>
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.1 }} 
          whileTap={{ scale: 0.9 }} 
          onClick={() => setShowVideoCall(true)} 
          className="w-16 h-16 rounded-full bg-success hover:bg-success-hover text-white shadow-2xl flex items-center justify-center relative group transition-all"
          title="Start Video Call"
          aria-label="Start Video Call"
        >
          <Video className="w-7 h-7" />
          <span className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">Video Call</span>
        </motion.button>
      </div>

      {/* Camera Modal */}
      <CameraFeedModal isOpen={showCameraModal} onClose={() => setShowCameraModal(false)} session={session} ambulance={ambulance} selectedCamera={selectedCamera} />
    </div>
  );
}
