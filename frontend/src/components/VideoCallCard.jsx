import React, { useState, useRef, useEffect } from 'react';
import { Card } from './ui/Card';
import { JitsiMeeting } from '@jitsi/react-sdk';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Users,
  Monitor,
  MessageSquare,
  MoreHorizontal,
  Share2,
  X
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { JITSI_CONFIG, generateRoomName } from '../config/jitsiConfig';

export default function VideoCallCard({ sessionId, session }) {
  const { user } = useAuthStore();
  const [isJoined, setIsJoined] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [participants, setParticipants] = useState(0);
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const apiRef = useRef(null);
  const [renderJitsi, setRenderJitsi] = useState(false); // only mount Jitsi when user joins

  const roomName = generateRoomName(sessionId);
  const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Anonymous';

  const handleApiReady = (api) => {
    apiRef.current = api;
    setIsLoading(false);
    setConnectionStatus('connecting');

    // initial participants count may be 1 (self) once joined
    const updateParticipants = () => {
      try {
        const ids = api.getParticipantsInfo ? api.getParticipantsInfo() : [];
        setParticipants(Array.isArray(ids) ? ids.length + 1 : 1);
      } catch (e) {
        // fallback
      }
    };

    api.addEventListener('videoConferenceJoined', () => {
      setIsJoined(true);
      setConnectionStatus('connected');
      updateParticipants();
    });

    api.addEventListener('videoConferenceLeft', () => {
      setIsJoined(false);
      setConnectionStatus('disconnected');
      setParticipants(0);
    });

    api.addEventListener('participantJoined', (p) => {
      setParticipants((n) => n + 1);
    });

    api.addEventListener('participantLeft', (p) => {
      setParticipants((n) => Math.max(0, n - 1));
    });

    api.addEventListener('errorOccurred', (err) => {
      console.error('Jitsi error', err);
      setError(err?.error?.message || 'Video call error');
      setConnectionStatus('error');
    });

    api.executeCommand('displayName', displayName);
    api.executeCommand('subject', `Session ${session?.session_code || sessionId}`);
  };

  const leave = () => {
    if (apiRef.current && isJoined) {
      try { apiRef.current.executeCommand('hangup'); } catch (e) { /* noop */ }
    }
    // unmount the jitsi iframe to fully stop the meeting
    apiRef.current = null;
    setIsJoined(false);
    setConnectionStatus('idle');
    setError(null);
    setParticipants(0);
    setRenderJitsi(false);
  };

  const toggleAudio = () => {
    if (!apiRef.current) return;
    try {
      apiRef.current.executeCommand('toggleAudio');
      setMicMuted((v) => !v);
    } catch (e) { /* noop */ }
  };

  const toggleVideo = () => {
    if (!apiRef.current) return;
    try {
      apiRef.current.executeCommand('toggleVideo');
      setCamOff((v) => !v);
    } catch (e) { /* noop */ }
  };

  const toggleScreenShare = () => {
    if (!apiRef.current) return;
    try { apiRef.current.executeCommand('toggleShareScreen'); } catch (e) { /* noop */ }
  };

  const toggleChat = () => {
    if (!apiRef.current) return;
    try { apiRef.current.executeCommand('toggleChat'); } catch (e) { /* noop */ }
  };

  useEffect(() => {
    return () => {
      if (apiRef.current) {
        try { apiRef.current.dispose(); } catch (e) { /* noop */ }
        apiRef.current = null;
      }
    };
  }, []);

  return (
    <Card className="p-3 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Video className="w-4 h-4" />
          <div>
            <h3 className="text-sm font-semibold text-text">Video Call</h3>
            <p className="text-xs text-text-secondary">Room: {roomName} • Participants: {participants}</p>
          </div>
        </div>
        <div className="text-xs text-text-secondary">{connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'connecting' ? 'Connecting...' : 'Not connected'}</div>
      </div>

      <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden relative flex flex-col">
        {/* If not explicitly joined, show a lightweight preview + join CTA. This prevents auto-joining when page loads. */}
        {!renderJitsi && (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
            <div className="text-white mb-4">
              <div className="text-lg font-semibold">Room: {roomName}</div>
              <div className="text-sm text-gray-300">Participants: {participants}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRenderJitsi(true)}
                className="px-4 py-2 bg-primary text-white rounded-lg shadow"
              >
                Join Meeting
              </button>
              <button
                onClick={() => { setRenderJitsi(false); setIsJoined(false); setConnectionStatus('idle'); }}
                className="px-4 py-2 bg-white text-gray-800 rounded-lg border"
              >
                Cancel
              </button>
            </div>
            <div className="mt-3 text-xs text-gray-300">The meeting will only start when you click Join.</div>
          </div>
        )}

        {renderJitsi && (
          <div className="absolute inset-0 w-full h-full">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center text-white">
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <div>Loading video...</div>
                </div>
              </div>
            )}

            <JitsiMeeting
              roomName={roomName}
              displayName={displayName}
              onApiReady={handleApiReady}
              configOverwrite={{ ...JITSI_CONFIG.defaultConfig, enableWelcomePage: false }}
              interfaceConfigOverwrite={JITSI_CONFIG.interfaceConfig}
              userInfo={{ displayName, email: user?.email || '' }}
              getIFrameRef={(iframeRef) => {
                if (!iframeRef) return;
                // Ensure iframe fits the card and doesn't overflow neighboring elements
                iframeRef.style.height = '100%';
                iframeRef.style.width = '100%';
                iframeRef.style.objectFit = 'cover';
                iframeRef.style.border = '0';
                // keep a strong stacking context inside the card
                iframeRef.style.position = 'absolute';
                iframeRef.style.inset = '0';
              }}
            />
          </div>
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={toggleAudio} className={`px-3 py-1 rounded border text-sm flex items-center gap-2 ${micMuted ? 'bg-gray-200 dark:bg-gray-700' : 'bg-white dark:bg-gray-900'}`}>
            <Mic className="w-4 h-4" /> {micMuted ? 'Unmute' : 'Mute'}
          </button>
          <button onClick={toggleVideo} className={`px-3 py-1 rounded border text-sm flex items-center gap-2 ${camOff ? 'bg-gray-200 dark:bg-gray-700' : 'bg-white dark:bg-gray-900'}`}>
            <Video className="w-4 h-4" /> {camOff ? 'Turn On' : 'Turn Off'}
          </button>
          <button onClick={toggleScreenShare} className="px-3 py-1 rounded border text-sm flex items-center gap-2 bg-white dark:bg-gray-900">
            <Share2 className="w-4 h-4" /> Share
          </button>
          <button onClick={toggleChat} className="px-3 py-1 rounded border text-sm flex items-center gap-2 bg-white dark:bg-gray-900">
            <MessageSquare className="w-4 h-4" /> Chat
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={leave} className="px-3 py-1 rounded bg-red-600 text-white text-sm flex items-center gap-2">
            <PhoneOff className="w-4 h-4" /> Leave
          </button>
        </div>
      </div>
    </Card>
  );
}
