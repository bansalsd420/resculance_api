import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Power,
  Info,
  MapPin
} from 'lucide-react';

import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import ChatPanel from '../../components/ChatPanel';
import VideoCallPanelJitsi from '../../components/VideoCallPanelJitsi';
import { patientService, ambulanceService, sessionService } from '../../services';
import socketService from '../../services/socketService';
import { useToast } from '../../hooks/useToast';
import { useAuthStore } from '../../store/authStore';
import { CameraFeedModal } from './CameraFeedModal';
import { GPSLocationModal } from './GPSLocationModal';
import CameraCard from '../../components/onboarding/CameraCard';
import NewVitalsCard from '../../components/onboarding/NewVitalsCard';
import MedicalReportsCard from '../../components/onboarding/MedicalReportsCard';
import ControlsCard from '../../components/onboarding/ControlsCard';
import VideoCallCard from '../../components/VideoCallCard';
import VehicleInfoModal from '../../components/onboarding/VehicleInfoModal';

export default function OnboardingDetailNew() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, token } = useAuthStore();

  const [session, setSession] = useState(null);
  const [ambulance, setAmbulance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showGPSModal, setShowGPSModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const videoPaneRef = useRef(null);

  const [showVehicleInfo, setShowVehicleInfo] = useState(false);
  const [controls, setControls] = useState({});

  const [sessionData, setSessionData] = useState({ notes: [], medications: [], files: [], counts: {} });
  const [loadingData, setLoadingData] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newMedication, setNewMedication] = useState({ name: '', dosage: '', route: 'oral' });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [loadingNote, setLoadingNote] = useState(false);
  const [loadingMedication, setLoadingMedication] = useState(false);

  const isActive = ['active', 'onboarded', 'in_transit'].includes((session?.status || '').toLowerCase());

  const fetchSessionDetails = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await patientService.getSessionById(sessionId);
      const data = res?.data?.data?.session || res?.data?.session || res?.data;
      if (!data || !data.id) throw new Error('Session not found');
      setSession(data);
      const ambId = data.ambulance_id || data.ambulanceId;
      if (ambId) {
        try {
          const ambRes = await ambulanceService.getById(ambId);
          setAmbulance(ambRes?.data?.data?.ambulance || ambRes?.data?.ambulance || ambRes?.data || null);
        } catch (e) {
          setAmbulance(null);
        }
      }
    } catch (err) {
      console.error('Failed to load session', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  }, [sessionId, toast]);

  useEffect(() => {
    // Connection is handled by the global layout; only join/leave the session room here.
    if (sessionId) {
      fetchSessionDetails();
      socketService.joinSession(sessionId);
    }
    return () => {
      if (sessionId) socketService.leaveSession(sessionId);
    };
  }, [sessionId, fetchSessionDetails]);

  // Listen for session data socket events and merge into local state (optimistic, avoids full refetch)
  useEffect(() => {
    if (!sessionId) return;

    const handleSessionDataAdded = (payload) => {
      try {
        const data = payload?.data || payload;
        if (!data || (data.sessionId && String(data.sessionId) !== String(sessionId))) return;

        const item = data.data || data; // support differing shapes
        const type = item.dataType || item.type || item.data_type;

        if (!type) return;

        setSessionData((prev) => {
          const notes = prev.notes || [];
          const medications = prev.medications || [];
          const files = prev.files || [];

          // normalize id
          const id = item.id || item.dataId || item._id || item.data?.id;

          if (type === 'note' || type === 'notes') {
            if (notes.some(n => String(n.id) === String(id))) return prev;
            return { ...prev, notes: [item, ...notes] };
          }

          if (type === 'medication' || type === 'medications') {
            if (medications.some(m => String(m.id) === String(id))) return prev;
            return { ...prev, medications: [item, ...medications] };
          }

          if (type === 'file' || type === 'files') {
            if (files.some(f => String(f.id) === String(id))) return prev;
            return { ...prev, files: [item, ...files] };
          }

          return prev;
        });
      } catch (err) {
        console.error('handleSessionDataAdded error', err);
      }
    };

    const handleSessionDataDeleted = (payload) => {
      try {
        const data = payload?.data || payload;
        if (!data || (data.sessionId && String(data.sessionId) !== String(sessionId))) return;
        const id = data.id || data.dataId || data.deletedId || data.data?.id;
        if (!id) return;
        setSessionData((prev) => ({
          ...prev,
          notes: (prev.notes || []).filter(i => String(i.id) !== String(id)),
          medications: (prev.medications || []).filter(i => String(i.id) !== String(id)),
          files: (prev.files || []).filter(i => String(i.id) !== String(id)),
        }));
      } catch (err) {
        console.error('handleSessionDataDeleted error', err);
      }
    };

    // Attach listeners (use socketService.socket if available)
    try {
      if (socketService.socket) {
        socketService.socket.on('session_data_added', handleSessionDataAdded);
        socketService.socket.on('session_data_deleted', handleSessionDataDeleted);
      } else {
        socketService.on('session_data_added', handleSessionDataAdded);
        socketService.on('session_data_deleted', handleSessionDataDeleted);
      }
    } catch (err) {
      console.warn('Failed to attach session data socket listeners', err);
    }

    return () => {
      try {
        if (socketService.socket) {
          socketService.socket.off('session_data_added', handleSessionDataAdded);
          socketService.socket.off('session_data_deleted', handleSessionDataDeleted);
        } else {
          socketService.off('session_data_added', handleSessionDataAdded);
          socketService.off('session_data_deleted', handleSessionDataDeleted);
        }
      } catch (err) {
        console.warn('Failed to detach session data socket listeners', err);
      }
    };
  }, [sessionId]);

  const fetchSessionData = useCallback(async () => {
    if (!sessionId) return;
    setLoadingData(true);
    try {
      const res = await sessionService.getData(sessionId);
      const d = res?.data?.data || res?.data || {};
      setSessionData({ notes: d.notes || [], medications: d.medications || [], files: d.files || [], counts: d.counts || {} });
    } catch (e) {
      console.error('Failed to fetch session data', e);
    } finally {
      setLoadingData(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  // Ensure modal is closed if inline video exists
  useEffect(() => {
    if (videoPaneRef?.current) setShowVideoCall(false);
  }, [videoPaneRef]);

  async function handleAddNote() {
    if (!newNote.trim()) return toast.error('Enter a note');
    setLoadingNote(true);
    try {
      const res = await sessionService.addNote(sessionId, { text: newNote });
      const created = res?.data?.data || res?.data || null;
      // append to local sessionData to avoid full reload
      if (created && created.id) {
        setSessionData((prev) => ({ ...prev, notes: [created, ...(prev.notes || [])] }));
      } else {
        const temp = {
          id: `temp-note-${Date.now()}`,
          dataType: 'note',
          content: { text: newNote },
          addedBy: user || { name: 'You' },
          addedAt: new Date().toISOString(),
        };
        setSessionData((prev) => ({ ...prev, notes: [temp, ...(prev.notes || [])] }));
      }
      setNewNote('');
      toast.success('Note added');
    } catch (e) {
      toast.error('Failed to add note');
    } finally { setLoadingNote(false); }
  }

  async function handleAddMedication() {
    if (!newMedication.name || !newMedication.dosage) return toast.error('Enter medication');
    setLoadingMedication(true);
    try {
      const res = await sessionService.addMedication(sessionId, newMedication);
      const created = res?.data?.data || res?.data || null;
      if (created && created.id) {
        setSessionData((prev) => ({ ...prev, medications: [created, ...(prev.medications || [])] }));
      } else {
        const temp = {
          id: `temp-med-${Date.now()}`,
          dataType: 'medication',
          content: { ...newMedication },
          addedBy: user || { name: 'You' },
          addedAt: new Date().toISOString(),
        };
        setSessionData((prev) => ({ ...prev, medications: [temp, ...(prev.medications || [])] }));
      }
      setNewMedication({ name: '', dosage: '', route: 'oral' });
      toast.success('Medication added');
    } catch (e) { toast.error('Failed to add medication'); } finally { setLoadingMedication(false); }
  }


  async function handleDeleteData(id) {
    if (!id) return;
    try {
      await sessionService.deleteData(sessionId, id);
      setSessionData((prev) => ({
        ...prev,
        notes: (prev.notes || []).filter((i) => i.id !== id),
        medications: (prev.medications || []).filter((i) => i.id !== id),
        files: (prev.files || []).filter((i) => i.id !== id),
      }));
      toast.success('Deleted');
    } catch (err) {
      console.error('Failed to delete data', err);
      toast.error('Failed to delete');
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 10 * 1024 * 1024) return toast.error('File too large');
    setUploadingFile(true);
    try {
      const res = await sessionService.uploadFile(sessionId, file);
      const created = res?.data?.data || res?.data || null;
      if (created && created.id) {
        setSessionData((prev) => ({ ...prev, files: [created, ...(prev.files || [])] }));
      } else {
        const temp = {
          id: `temp-file-${Date.now()}`,
          dataType: 'file',
          content: { filename: file.name, size: file.size },
          addedBy: user || { name: 'You' },
          addedAt: new Date().toISOString(),
        };
        setSessionData((prev) => ({ ...prev, files: [temp, ...(prev.files || [])] }));
      }
      toast.success('Uploaded');
    } catch (e) {
      console.error('Upload failed', e);
      toast.error('Upload failed');
    } finally { setUploadingFile(false); }
  }

  

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text mb-2">Session Not Found</h2>
          <p className="text-text-secondary mb-4">The requested session could not be found.</p>
          <Button onClick={() => navigate('/onboarding')}>Back to Sessions</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="bg-background-card border-b border-border px-3 md:px-6 py-2 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 md:gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/onboarding')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-sm md:text-base font-bold text-text">Ambulance Console</h1>
            <p className="text-xs text-text-secondary hidden md:block">Live • {session.ambulance_code || session.ambulanceCode || 'Unknown'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded-lg bg-error/10 text-error text-xs font-medium flex items-center gap-1 md:gap-2">
              <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
              <span className="hidden sm:inline">{session.ambulance_code || 'AMB-204'}</span>
            </span>
            <button onClick={() => setShowChat(true)} className="p-2 rounded-lg bg-primary hover:bg-primary-hover text-white transition-colors shadow-sm" title="Group Chat">
              <MessageCircle className="w-4 h-4" />
            </button>
            <button onClick={() => { if (videoPaneRef?.current) { try { setShowVideoCall(false); } catch (e) {} try { videoPaneRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {} } else { setShowVideoCall(true); } }} className="p-2 rounded-lg bg-success hover:bg-green-700 text-white transition-colors shadow-sm" title="Video Call">
              <Video className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-3 md:px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
          <div className="lg:col-span-2 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0">
              <CameraCard session={session} ambulance={ambulance} isActive={isActive} onCameraClick={() => setShowCameraModal(true)} onRefresh={fetchSessionDetails} />
            </div>
          </div>
          <div ref={videoPaneRef} className="lg:col-span-2 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0">
              <VideoCallCard sessionId={sessionId} session={session} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="min-h-0 flex flex-col md:col-span-1">
            <div className="flex-1 min-h-0">
              <NewVitalsCard vitals={{ heartRate: 98, bloodPressure: '120/78', spo2: 94, temp: 37.1 }} />
            </div>
          </div>

          <div className="min-h-0 flex flex-col md:col-span-2">
            <div className="flex-1 min-h-0">
              <MedicalReportsCard isActive={isActive} user={user} sessionData={sessionData} loadingData={loadingData} newNote={newNote} setNewNote={setNewNote} newMedication={newMedication} setNewMedication={setNewMedication} loadingNote={loadingNote} loadingMedication={loadingMedication} uploadingFile={uploadingFile} handleAddNote={handleAddNote} handleAddMedication={handleAddMedication} handleFileUpload={handleFileUpload} handleDeleteData={handleDeleteData} handleDownloadFile={() => {}} />
            </div>
          </div>
        </div>
      </div>

      <ControlsCard controls={controls} onToggleControl={toggleControl} horizontal />
      <ChatPanel sessionId={sessionId} isOpen={showChat} onClose={() => setShowChat(false)} />
      {(!videoPaneRef?.current) && (<VideoCallPanelJitsi sessionId={sessionId} isOpen={showVideoCall} onClose={() => setShowVideoCall(false)} session={session} />)}

      <VehicleInfoModal isOpen={showVehicleInfo} onClose={() => setShowVehicleInfo(false)} session={session} ambulance={ambulance} />
      <CameraFeedModal isOpen={showCameraModal} onClose={() => setShowCameraModal(false)} session={session} ambulance={ambulance} selectedCamera={selectedCamera} />
      <GPSLocationModal isOpen={showGPSModal} onClose={() => setShowGPSModal(false)} session={session} ambulance={ambulance} />
    </div>
  );

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
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text mb-2">Session Not Found</h2>
          <p className="text-text-secondary mb-4">The requested session could not be found.</p>
          <Button onClick={() => navigate('/onboarding')}>Back to Sessions</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="bg-background-card border-b border-border px-3 md:px-6 py-2 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 md:gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/onboarding')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-sm md:text-base font-bold text-text">Ambulance Console</h1>
            <p className="text-xs text-text-secondary hidden md:block">Live • {session.ambulance_code || session.ambulanceCode || 'Unknown'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded-lg bg-error/10 text-error text-xs font-medium flex items-center gap-1 md:gap-2">
            <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
            <span className="hidden sm:inline">{session.ambulance_code || 'AMB-204'}</span>
          </span>
          <span className="hidden md:flex px-2 py-1 rounded-lg bg-success/10 text-success text-xs font-medium">82% Battery</span>
          <span className="hidden lg:flex px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">On-duty</span>
          
          {/* Action Buttons - Icon Only */}
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => setShowVehicleInfo(true)}
              className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
              title="Vehicle Info"
            >
              <Info className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowGPSModal(true)}
              className="p-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors shadow-sm"
              title="GPS Tracking"
            >
              <MapPin className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowChat(true)}
              className="p-2 rounded-lg bg-primary hover:bg-primary-hover text-white transition-colors shadow-sm"
              title="Group Chat"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => {
                // Scroll to inline video pane if present, otherwise open modal
                if (videoPaneRef?.current) {
                  // ensure modal is closed so it doesn't overlay the inline pane
                  try { setShowVideoCall(false); } catch (e) { /* noop */ }
                  try { videoPaneRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { /* noop */ }
                } else {
                  setShowVideoCall(true);
                }
              }}
              className="p-2 rounded-lg bg-success hover:bg-green-700 text-white transition-colors shadow-sm"
              title="Video Call"
            >
              <Video className="w-4 h-4" />
            </button>
            
            {session.status?.toLowerCase() !== 'offboarded' && isActive && (
              <button
                onClick={handleOffboardPatient}
                className="p-2 rounded-lg bg-error hover:bg-red-700 text-white transition-colors shadow-sm"
                title="Offboard Patient"
              >
                <Power className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid Layout - Responsive */}
      <div className="px-2 md:px-4 py-2">
        <div className="grid grid-rows-1 lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-2 md:gap-3">
          {/* Top Row - Responsive: stacked on mobile, 4 cols on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 min-h-0">
            {/* Camera Feed - Takes 2 columns on large screens */}
            <div className="sm:col-span-2 pane-top">
              <CameraCard
                session={session}
                ambulance={ambulance}
                isActive={isActive}
                onCameraClick={() => {
                  setShowCameraModal(true);
                }}
                onRefresh={fetchSessionDetails}
              />
            </div>
            
            {/* Video Call Pane (replaces GPS & SOS panes) */}
            <div ref={videoPaneRef} className="sm:col-span-2 pane-top">
              <VideoCallCard sessionId={sessionId} session={session} />
            </div>
          </div>
          
          {/* Bottom Row - Responsive: stacked on mobile, 3 cols on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 min-h-0">
            {/* Medical Reports */}
            <div className="pane-bottom-med lg:min-h-0">
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
            
            {/* Controls moved to fixed footer */}
            
            {/* Patient Vitals */}
            <div className="pane-bottom-small lg:min-h-0">
              <NewVitalsCard vitals={vitals} />
            </div>
          </div>
        </div>
      </div>

      {/* Chat and Video Call Panels */}
      <ChatPanel sessionId={sessionId} isOpen={showChat} onClose={() => setShowChat(false)} />
      {/* Only render the modal if the inline video pane is not present to avoid overlapping UIs */}
      {(!videoPaneRef?.current) && (
        <VideoCallPanelJitsi
          sessionId={sessionId}
          isOpen={showVideoCall}
          onClose={() => setShowVideoCall(false)}
          session={session}
        />
      )}

      {/* Vehicle Info Modal */}
      <VehicleInfoModal
        isOpen={showVehicleInfo}
        onClose={() => setShowVehicleInfo(false)}
        session={session}
        ambulance={ambulance}
      />

      {/* Camera Feed Modal */}
      <CameraFeedModal 
        isOpen={showCameraModal} 
        onClose={() => setShowCameraModal(false)} 
        session={session}
        ambulance={ambulance}
        selectedCamera={selectedCamera}
      />

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

      {/* GPS Location Modal */}
      <GPSLocationModal
        isOpen={showGPSModal}
        onClose={() => setShowGPSModal(false)}
        session={session}
        ambulance={ambulance}
      />
    </div>
  );
}
