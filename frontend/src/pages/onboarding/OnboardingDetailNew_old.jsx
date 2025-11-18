import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Video,
  MessageCircle,
  FileText,
  Pill,
  Trash2,
  Paperclip,
  Power
} from 'lucide-react';

import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import ChatPanel from '../../components/ChatPanel';
import VideoCallPanelSFU from '../../components/VideoCallPanelSFU';
import { patientService, ambulanceService, sessionService } from '../../services';
import socketService from '../../services/socketService';
import { useToast } from '../../hooks/useToast';
import { useAuthStore } from '../../store/authStore';
import { CameraFeedModal } from './CameraFeedModal';
import VitalsCard from '../../components/onboarding/VitalsCard';
import MedicalReportsCard from '../../components/onboarding/MedicalReportsCard';
import LiveMeetingCard from '../../components/onboarding/LiveMeetingCard';
import DevicesCard from '../../components/onboarding/DevicesCard';
import ControlsCard from '../../components/onboarding/ControlsCard';
import DetailsCard from '../../components/onboarding/DetailsCard';

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
  const [controls, setControls] = useState({
    mainPower: false,
    emergencyLights: false,
    siren: false,
    airConditioning: false,
    oxygenSupply: false,
    cabinCamera: false,
  });

  // Session data state
  const [sessionData, setSessionData] = useState({ notes: [], medications: [], files: [], counts: {} });
  const [loadingData, setLoadingData] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newMedication, setNewMedication] = useState({ name: '', dosage: '', route: 'oral' });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [loadingNote, setLoadingNote] = useState(false);
  const [loadingMedication, setLoadingMedication] = useState(false);

  // Confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOffboardModal, setShowOffboardModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

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
    if (sessionId) {
      fetchSessionDetails();
      fetchSessionData();
      // Join the session room to receive socket events
      console.log('🔌 Joining session room:', sessionId);
      socketService.joinSession(sessionId);
    }

    return () => {
      if (sessionId) {
        console.log('👋 Leaving session room:', sessionId);
        socketService.leaveSession(sessionId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, token]);

  // Listen for session data updates (no longer listen for video calls - video room model)
  useEffect(() => {
    if (!sessionId) return;

    // Listen for session data updates
    const handleSessionDataAdded = (data) => {
      try {
        if (!data) return;
        const eventSessionId = data.sessionId || data.data?.sessionId || data.data?.session_id;
        if (String(eventSessionId) !== String(sessionId)) return;
        console.log('📝 Session data added (merging):', data);

        const item = data.data || data;
        const type = item.dataType || item.type || item.data_type;
        const id = item.id || item.dataId || item._id || item.data?.id;

        setSessionData((prev) => {
          const notes = prev.notes || [];
          const medications = prev.medications || [];
          const files = prev.files || [];

          if (!type) return prev;

          if (type === 'note' || type === 'notes') {
            if (notes.some(n => String(n.id) === String(id))) return prev;
            const newNotes = [item, ...notes];
            toast.success('New note added');
            return { ...prev, notes: newNotes, counts: { ...(prev.counts || {}), notes: newNotes.length } };
          }

          if (type === 'medication' || type === 'medications') {
            if (medications.some(m => String(m.id) === String(id))) return prev;
            const newMeds = [item, ...medications];
            toast.success('New medication added');
            return { ...prev, medications: newMeds, counts: { ...(prev.counts || {}), medications: newMeds.length } };
          }

          if (type === 'file' || type === 'files') {
            if (files.some(f => String(f.id) === String(id))) return prev;
            const newFiles = [item, ...files];
            toast.success('New file uploaded');
            return { ...prev, files: newFiles, counts: { ...(prev.counts || {}), files: newFiles.length } };
          }

          return prev;
        });
      } catch (err) {
        console.error('Error in handleSessionDataAdded merge:', err);
      }
    };

    const handleSessionDataDeleted = (data) => {
      try {
        if (!data) return;
        const eventSessionId = data.sessionId || data.data?.sessionId || data.data?.session_id;
        if (String(eventSessionId) !== String(sessionId)) return;
        console.log('🗑️ Session data deleted (merging):', data);
        const id = data.id || data.dataId || data.deletedId || data.data?.id;
        if (!id) return;
        setSessionData((prev) => {
          const notes = (prev.notes || []).filter(i => String(i.id) !== String(id));
          const medications = (prev.medications || []).filter(i => String(i.id) !== String(id));
          const files = (prev.files || []).filter(i => String(i.id) !== String(id));
          toast.success('Entry deleted');
          return { ...prev, notes, medications, files, counts: { notes: notes.length, medications: medications.length, files: files.length } };
        });
      } catch (err) {
        console.error('Error in handleSessionDataDeleted merge:', err);
      }
    };

    socketService.socket?.on('session_data_added', handleSessionDataAdded);
    socketService.socket?.on('session_data_deleted', handleSessionDataDeleted);

    // Join the session room for real-time updates
    socketService.joinSession(sessionId);

    return () => {
      socketService.socket?.off('session_data_added', handleSessionDataAdded);
      socketService.socket?.off('session_data_deleted', handleSessionDataDeleted);
      // Leave the session room when component unmounts
      socketService.leaveSession(sessionId);
    };
  }, [sessionId, user?.id, toast]);

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

  async function fetchSessionData() {
    if (!sessionId) return;
    setLoadingData(true);
    try {
      const response = await sessionService.getData(sessionId);
      const data = response?.data?.data || response?.data || {};
      setSessionData({
        notes: data.notes || [],
        medications: data.medications || [],
        files: data.files || [],
        counts: data.counts || { notes: 0, medications: 0, files: 0 }
      });
    } catch (error) {
      console.error('Failed to fetch session data:', error);
      // Don't show error toast for initial load
    } finally {
      setLoadingData(false);
    }
  }

  async function handleAddNote() {
    console.log('handleAddNote called with:', newNote);
    if (!newNote.trim()) {
      toast.error('Please enter a note');
      return;
    }

    setLoadingNote(true);
    console.log('Calling sessionService.addNote...');
    try {
      const response = await sessionService.addNote(sessionId, { text: newNote });
      console.log('sessionService.addNote response:', response);
      setNewNote('');
      toast.success('Note added successfully');
      // Data will be refreshed via socket event
    } catch (error) {
      console.error('Failed to add note:', error);
      toast.error(error.response?.data?.message || 'Failed to add note');
    } finally {
      setLoadingNote(false);
    }
  }

  async function handleAddMedication() {
    console.log('handleAddMedication called with:', newMedication);
    if (!newMedication.name.trim() || !newMedication.dosage.trim()) {
      toast.error('Please enter medication name and dosage');
      return;
    }

    setLoadingMedication(true);
    console.log('Calling sessionService.addMedication...');
    try {
      const response = await sessionService.addMedication(sessionId, newMedication);
      console.log('sessionService.addMedication response:', response);
      setNewMedication({ name: '', dosage: '', route: 'oral' });
      toast.success('Medication added successfully');
      // Data will be refreshed via socket event
    } catch (error) {
      console.error('Failed to add medication:', error);
      toast.error(error.response?.data?.message || 'Failed to add medication');
    } finally {
      setLoadingMedication(false);
    }
  }

  async function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploadingFile(true);
    try {
      await sessionService.uploadFile(sessionId, file);
      toast.success('File uploaded successfully');
      event.target.value = ''; // Reset file input
      // Data will be refreshed via socket event
    } catch (error) {
      console.error('Failed to upload file:', error);
      toast.error(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  }

  async function handleDeleteData(dataId) {
    // Find the data entry to show in modal
    const allData = [...sessionData.notes, ...sessionData.medications, ...sessionData.files];
    const dataEntry = allData.find(item => item.id === dataId);
    if (dataEntry) {
      setDeleteTarget(dataEntry);
      setShowDeleteModal(true);
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await sessionService.deleteData(sessionId, deleteTarget.id);
      toast.success('Entry deleted successfully');
      // Data will be refreshed via socket event
    } catch (error) {
      console.error('Failed to delete data:', error);
      toast.error(error.response?.data?.message || 'Failed to delete entry');
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  async function handleDownloadFile(dataId) {
    try {
      const response = await sessionService.downloadFile(sessionId, dataId);
      // Create a blob from the response data
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      // Get filename from content-disposition header or use a default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'download';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) filename = filenameMatch[1];
      }
      // Create download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Failed to download file:', error);
      toast.error(error.response?.data?.message || 'Failed to download file');
    }
  }

  async function handleOffboardPatient() {
    setShowOffboardModal(true);
  }

  const handleConfirmOffboard = async () => {
    try {
      await patientService.offboard(sessionId, { treatmentNotes: 'Patient offboarded from Command Console' });
      toast.success('Patient offboarded successfully');
      navigate('/onboarding');
    } catch (error) {
      console.error('Failed to offboard patient:', error);
      toast.error('Failed to offboard patient');
    } finally {
      setShowOffboardModal(false);
    }
  };

  const handleCancelOffboard = () => {
    setShowOffboardModal(false);
  };

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

      {/* Single Page Content - No Tabs */}
      <div className="px-6 pt-6 space-y-6">
        {/* Section 1: Vitals & Camera Feeds */}
        <VitalsCard
          session={session}
          ambulance={ambulance}
          isActive={isActive}
          vitals={vitals}
          onCameraClick={(device) => {
            setSelectedCamera(device);
            setShowCameraModal(true);
          }}
          onOffboardPatient={handleOffboardPatient}
          onRefresh={fetchSessionDetails}
        />

        {/* Section 2: Medical Reports & Live Meeting */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MedicalReportsCard
              isActive={isActive}
              user={user}
              sessionData={sessionData}
              loadingData={loadingData}
              newNote={newNote}
              setNewNote={setNewNote}
              newMedication={newMedication}
              setNewMedication={setNewMedication}
              loadingNote={loadingNote}
              loadingMedication={loadingMedication}
              uploadingFile={uploadingFile}
              handleAddNote={handleAddNote}
              handleAddMedication={handleAddMedication}
              handleFileUpload={handleFileUpload}
              handleDeleteData={handleDeleteData}
              handleDownloadFile={handleDownloadFile}
            />
          </div>
          <div>
            <LiveMeetingCard
              isActive={isActive}
              onJoinSession={() => setShowVideoCall(true)}
            />
          </div>
        </div>

        {/* Section 3: Devices (GPS & SOS) */}
        <DevicesCard sosAlerts={sosAlerts} />

        {/* Section 4: Ambulance Controls */}
        <ControlsCard
          controls={controls}
          onToggleControl={toggleControl}
        />

        {/* Section 5: Details (Ambulance & Crew) */}
        <DetailsCard session={session} />
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                mainTab === 'devices'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text hover:bg-background'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Devices
            </button>
            <button
              onClick={() => setMainTab('controls')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                mainTab === 'controls'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text hover:bg-background'
              }`}
            >
              <Power className="w-4 h-4" />
              Controls
            </button>
            <button
              onClick={() => setMainTab('details')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                mainTab === 'details'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text hover:bg-background'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Details
            </button>
          </div>
        </div>

        {/* TAB 1: Live Vitals & CCTV */}
        {mainTab === 'vitals' && (
          <div className="space-y-6">
            {/* Camera Feeds */}
            <Card className="p-6">
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

            {/* Patient Status with Vitals */}
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
          </div>
        )}

        {/* TAB 2: Communications */}
        {mainTab === 'communications' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Medical Reports - 2/3 width */}
              <Card className="lg:col-span-2 p-6">
            <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" /> Medical Reports
            </h2>
            <p className="text-xs text-text-secondary mb-4">Incident & treatment notes</p>

            <div className="flex gap-4 border-b border-border mb-4">
              {['Notes', 'Meds', 'Files'].map((tab) => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab.toLowerCase())} 
                  className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors relative ${ 
                    activeTab === tab.toLowerCase() 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-text-secondary hover:text-text' 
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {tab === 'Notes' && <FileText className="w-4 h-4" />}
                    {tab === 'Meds' && <Pill className="w-4 h-4" />}
                    {tab === 'Files' && <Paperclip className="w-4 h-4" />}
                    {tab}
                    <span className={`inline-flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full ${
                      activeTab === tab.toLowerCase() ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {sessionData.counts[tab.toLowerCase()] || 0}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {/* Notes Tab */}
              {activeTab === 'notes' && (
                <div className="space-y-3">
                  {/* Add Note Form */}
                  {isActive && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <FileText className="w-5 h-5 text-blue-600 mt-1" />
                        <div className="flex-1">
                          <label className="text-sm font-semibold text-blue-900 dark:text-blue-100 block mb-2">
                            Add Clinical Note
                          </label>
                          <textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Document patient condition, vital observations, treatment administered, or any significant changes..."
                            className="w-full p-3 border-2 border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-800 text-text text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            rows={4}
                          />
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-blue-600 dark:text-blue-300">
                              {newNote.length} / 1000 characters
                            </span>
                            <button 
                              onClick={() => handleAddNote()}
                              disabled={loadingNote}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                            >
                              {loadingNote ? (
                                <div className="flex items-center gap-1">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Saving...
                                </div>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  Save Note
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Notes List */}
                  {loadingData ? (
                    <div className="text-center py-8">
                      <Activity className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-text-secondary">Loading notes...</p>
                    </div>
                  ) : sessionData.notes.length > 0 ? (
                    <div className="space-y-2">
                      {sessionData.notes.map((note, index) => (
                        <motion.div 
                          key={note.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-text leading-relaxed mb-2">{note.content.text}</p>
                              <div className="flex items-center justify-between text-xs text-text-secondary">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-blue-600">{note.addedBy.name}</span>
                                  <span>•</span>
                                  <span>{note.addedBy.role}</span>
                                  <span>•</span>
                                  <span>{new Date(note.addedAt).toLocaleString()}</span>
                                </div>
                                {isActive && note.addedBy.id === user?.id && (
                                  <button
                                    onClick={() => handleDeleteData(note.id)}
                                    className="flex items-center gap-1 text-error hover:text-red-700 transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-text-secondary">No clinical notes yet</p>
                      <p className="text-xs text-text-secondary mt-1">Start documenting patient observations above</p>
                    </div>
                  )}
                </div>
              )}

              {/* Medications Tab */}
              {activeTab === 'meds' && (
                <div className="space-y-3">
                  {/* Add Medication Form */}
                  {isActive && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-800"
                    >
                      <div className="flex items-start gap-2 mb-3">
                        <Pill className="w-5 h-5 text-green-600 mt-1" />
                        <label className="text-sm font-semibold text-green-900 dark:text-green-100">
                          Administer Medication
                        </label>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-green-700 dark:text-green-300 mb-1 block font-medium">
                            Medication Name
                          </label>
                          <input
                            type="text"
                            value={newMedication.name}
                            onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                            placeholder="e.g., Aspirin, Morphine"
                            className="w-full p-2.5 border-2 border-green-300 dark:border-green-700 rounded-lg bg-white dark:bg-gray-800 text-text text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-green-700 dark:text-green-300 mb-1 block font-medium">
                            Dosage
                          </label>
                          <input
                            type="text"
                            value={newMedication.dosage}
                            onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                            placeholder="e.g., 150 mg, 2 tablets"
                            className="w-full p-2.5 border-2 border-green-300 dark:border-green-700 rounded-lg bg-white dark:bg-gray-800 text-text text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-green-700 dark:text-green-300 mb-1 block font-medium">
                            Route
                          </label>
                          <select
                            value={newMedication.route}
                            onChange={(e) => setNewMedication({ ...newMedication, route: e.target.value })}
                            className="w-full p-2.5 border-2 border-green-300 dark:border-green-700 rounded-lg bg-white dark:bg-gray-800 text-text text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          >
                            <option value="oral">Oral</option>
                            <option value="iv">Intravenous (IV)</option>
                            <option value="im">Intramuscular (IM)</option>
                            <option value="subcutaneous">Subcutaneous</option>
                            <option value="inhalation">Inhalation</option>
                            <option value="topical">Topical</option>
                            <option value="sublingual">Sublingual</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end mt-3">
                        <button 
                          onClick={() => handleAddMedication()}
                          disabled={!newMedication.name.trim() || !newMedication.dosage.trim() || loadingMedication}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                        >
                          {loadingMedication ? (
                            <div className="flex items-center gap-1">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Recording...
                            </div>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Record Medication
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Medications List */}
                  {loadingData ? (
                    <div className="text-center py-8">
                      <Activity className="w-8 h-8 text-green-500 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-text-secondary">Loading medications...</p>
                    </div>
                  ) : sessionData.medications.length > 0 ? (
                    <div className="space-y-2">
                      {sessionData.medications.map((med, index) => (
                        <motion.div 
                          key={med.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-green-500 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                              <Pill className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-semibold text-text text-base">{med.content.name}</p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 text-xs rounded-full font-medium">
                                      <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                                      {med.content.dosage}
                                    </span>
                                    <span className="text-xs text-text-secondary uppercase tracking-wide">
                                      {med.content.route}
                                    </span>
                                  </div>
                                </div>
                                {isActive && med.addedBy.id === user?.id && (
                                  <button
                                    onClick={() => handleDeleteData(med.id)}
                                    className="flex items-center gap-1 text-error hover:text-red-700 transition-colors text-xs"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Delete
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-text-secondary mt-2">
                                <span className="font-semibold text-green-600">{med.addedBy.name}</span>
                                <span>•</span>
                                <span>{med.addedBy.role}</span>
                                <span>•</span>
                                <span>{new Date(med.content.time_administered || med.addedAt).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300">
                      <Pill className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-text-secondary">No medications administered</p>
                      <p className="text-xs text-text-secondary mt-1">Record medications given to the patient</p>
                    </div>
                  )}
                </div>
              )}

              {/* Files Tab */}
              {activeTab === 'files' && (
                <div className="space-y-3">
                  {/* Upload File Form - Drag & Drop */}
                  {isActive && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative"
                    >
                      <label 
                        htmlFor="file-upload"
                        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                          uploadingFile 
                            ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20' 
                            : 'border-purple-300 bg-purple-50/50 dark:bg-purple-900/10 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {uploadingFile ? (
                            <>
                              <Activity className="w-10 h-10 text-purple-600 animate-spin mb-2" />
                              <p className="text-sm text-purple-600 font-semibold">Uploading file...</p>
                            </>
                          ) : (
                            <>
                              <Upload className="w-10 h-10 text-purple-600 mb-2" />
                              <p className="mb-1 text-sm text-purple-700 dark:text-purple-300 font-semibold">
                                Click to upload or drag and drop
                              </p>
                              <p className="text-xs text-purple-600 dark:text-purple-400">
                                PDF, Images, Word, Excel (Max 10MB)
                              </p>
                            </>
                          )}
                        </div>
                        <input
                          id="file-upload"
                          type="file"
                          onChange={handleFileUpload}
                          accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
                          className="hidden"
                          disabled={uploadingFile}
                        />
                      </label>
                      
                      <div className="mt-2 flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400">
                        <CheckCircle className="w-4 h-4" />
                        <span>Supported formats: PDF, JPEG, PNG, GIF, DOC, DOCX, XLS, XLSX</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Files List */}
                  {loadingData ? (
                    <div className="text-center py-8">
                      <Activity className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-text-secondary">Loading files...</p>
                    </div>
                  ) : sessionData.files.length > 0 ? (
                    <div className="space-y-2">
                      {sessionData.files.map((file, index) => (
                        <motion.div 
                          key={file.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-purple-500 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                              <Paperclip className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-text truncate">{file.content.filename}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-text-secondary">
                                  {(file.content.size / 1024).toFixed(1)} KB
                                </span>
                                <span className="text-xs text-text-secondary">•</span>
                                <span className="text-xs text-purple-600 font-medium">{file.addedBy.name}</span>
                                <span className="text-xs text-text-secondary">•</span>
                                <span className="text-xs text-text-secondary">
                                  {new Date(file.addedAt).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDownloadFile(file.id)}
                                className="p-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/50 dark:hover:bg-purple-800 text-purple-600 rounded-lg transition-colors"
                                title="Download file"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              {isActive && file.addedBy.id === user?.id && (
                                <button
                                  onClick={() => handleDeleteData(file.id)}
                                  className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-800 text-error rounded-lg transition-colors"
                                  title="Delete file"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300">
                      <Paperclip className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-text-secondary">No files uploaded</p>
                      <p className="text-xs text-text-secondary mt-1">Upload patient documents, X-rays, or reports</p>
                    </div>
                  )}
                </div>
              )}
            </div>
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
          </div>
        )}

        {/* TAB 3: Devices */}
        {mainTab === 'devices' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        )}

        {/* TAB 4: Controls */}
        {mainTab === 'controls' && (
          <div className="space-y-6">
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
          </div>
        )}

        {/* TAB 5: Details */}
        {mainTab === 'details' && (
          <div className="space-y-6">
            {/* Ambulance & Crew Info Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ambulance Details */}
              <Card className="p-6">
                <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
                  <AmbulanceIcon className="w-5 h-5" /> Ambulance Details
                </h2>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-secondary mb-1">Registration</p>
                      <p className="text-sm font-medium text-text">{session.ambulance_code || session.ambulanceCode || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary mb-1">Model</p>
                      <p className="text-sm font-medium text-text">{session.vehicle_model || session.vehicleModel || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary mb-1">Type</p>
                      <p className="text-sm font-medium text-text">{session.vehicle_type || session.vehicleType || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary mb-1">Owner</p>
                      <p className="text-sm font-medium text-text">{session.organization_name || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Crew Members */}
              <Card className="p-6">
                <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
                  <UserPlus className="w-5 h-5" /> Crew Members
                </h2>
                {session.crew && session.crew.length > 0 ? (
                  <div className="space-y-3">
                    {session.doctors && session.doctors.length > 0 && (
                      <div>
                        <p className="text-xs text-secondary mb-2">Doctors</p>
                        <div className="flex flex-wrap gap-2">
                          {session.doctors.map((doc) => (
                            <span 
                              key={doc.id} 
                              className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                            >
                              {doc.first_name || doc.firstName} {doc.last_name || doc.lastName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {session.paramedics && session.paramedics.length > 0 && (
                      <div>
                        <p className="text-xs text-secondary mb-2">Paramedics</p>
                        <div className="flex flex-wrap gap-2">
                          {session.paramedics.map((para) => (
                            <span 
                              key={para.id} 
                              className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                            >
                              {para.first_name || para.firstName} {para.last_name || para.lastName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {session.drivers && session.drivers.length > 0 && (
                      <div>
                        <p className="text-xs text-secondary mb-2">Drivers</p>
                        <div className="flex flex-wrap gap-2">
                          {session.drivers.map((driver) => (
                            <span 
                              key={driver.id} 
                              className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200"
                            >
                              {driver.first_name || driver.firstName} {driver.last_name || driver.lastName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-secondary">No crew members assigned</p>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Chat and Video Call Panels */}
      <ChatPanel sessionId={sessionId} isOpen={showChat} onClose={() => setShowChat(false)} />
      <VideoCallPanelSFU 
        sessionId={sessionId} 
        isOpen={showVideoCall} 
        onClose={() => setShowVideoCall(false)}
        session={session} // Pass session data for reference
      />

      {/* Floating Action Buttons - Chat and Video only (hidden while chat/video panels are open to avoid interference) */}
      {(!showChat && !showVideoCall) && (
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
      )}

      {/* Camera Modal */}
      <CameraFeedModal isOpen={showCameraModal} onClose={() => setShowCameraModal(false)} session={session} ambulance={ambulance} selectedCamera={selectedCamera} />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        title="Confirm Deletion"
        footer={
          <>
            <Button variant="secondary" onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Yes, Delete Entry
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100">Delete Entry</h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                This action cannot be undone. The entry will be permanently removed.
              </p>
            </div>
          </div>

          {deleteTarget && (
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  {deleteTarget.dataType === 'note' && <FileText className="w-5 h-5 text-blue-600" />}
                  {deleteTarget.dataType === 'medication' && <Pill className="w-5 h-5 text-green-600" />}
                  {deleteTarget.dataType === 'file' && <Paperclip className="w-5 h-5 text-purple-600" />}
                  <span className="font-medium text-text capitalize">{deleteTarget.dataType}</span>
                </div>
                <div className="text-sm text-text-secondary">
                  {deleteTarget.dataType === 'note' && (
                    <p className="line-clamp-2">{deleteTarget.content.text}</p>
                  )}
                  {deleteTarget.dataType === 'medication' && (
                    <p>{deleteTarget.content.name} - {deleteTarget.content.dosage} ({deleteTarget.content.route})</p>
                  )}
                  {deleteTarget.dataType === 'file' && (
                    <p>{deleteTarget.content.filename} ({(deleteTarget.content.size / 1024).toFixed(1)} KB)</p>
                  )}
                </div>
                <div className="text-xs text-text-secondary mt-2">
                  Added by {deleteTarget.addedBy.name} on {new Date(deleteTarget.addedAt).toLocaleString()}
                </div>
              </div>

              <div className="text-sm text-secondary">
                <p>Are you sure you want to delete this entry? This action cannot be undone.</p>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Offboard Confirmation Modal */}
      <Modal
        isOpen={showOffboardModal}
        onClose={handleCancelOffboard}
        title="Confirm Patient Offboarding"
        footer={
          <>
            <Button variant="secondary" onClick={handleCancelOffboard}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmOffboard}>
              Yes, Offboard Patient
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center flex-shrink-0">
              <Power className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100">Offboard Patient</h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                This action will complete the patient session and mark it as offboarded.
              </p>
            </div>
          </div>

          {session && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="text-xs text-secondary mb-1">Session Code</p>
                  <p className="font-medium">{session.session_code || session.sessionCode}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary mb-1">Ambulance</p>
                  <p className="font-medium">{session.ambulance_code || session.ambulanceCode}</p>
                </div>
              </div>

              <div className="text-sm text-secondary">
                <p>Are you sure you want to offboard this patient? This action will complete the session and cannot be undone.</p>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
