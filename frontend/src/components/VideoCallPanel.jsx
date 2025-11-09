import { useState, useEffect, useRef } from 'react';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Loader, AlertCircle, X, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import socketService from '../services/socketService.js';
import { useAuthStore } from '../store/authStore';
import { formatRoleName } from '../utils/roleUtils';

const VideoCallPanel = ({ sessionId, isOpen, onClose }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [callState, setCallState] = useState('idle'); // idle, calling, connecting, connected, ended
  const [error, setError] = useState(null);
  const [remoteUser, setRemoteUser] = useState(null);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const { user } = useAuthStore();

  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  useEffect(() => {
    if (isOpen && sessionId) {
      setupSocketListeners();
    }

    return () => {
      cleanup();
    };
  }, [isOpen, sessionId]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const setupSocketListeners = () => {
    // Listen for incoming video call requests
    socketService.onVideoRequest(handleVideoRequest);
    
    // Listen for call answers
    socketService.onVideoAnswer(handleVideoAnswer);
    
    // Listen for call end
    socketService.onVideoEnd(handleVideoEnd);
    
    // Listen for ICE candidates
    socketService.onIceCandidate(handleIceCandidate);
  };

  const handleVideoRequest = async (data) => {
    if (data.sessionId !== sessionId) return;
    
    console.log('Incoming video call from:', data);
    setRemoteUser({
      id: data.callerId,
      role: data.callerRole
    });
    
    setCallState('receiving');
    
    // Auto-accept for now (can add UI prompt later)
    await acceptCall(data.callerId, data.offer);
  };

  const handleVideoAnswer = async (data) => {
    if (data.sessionId !== sessionId || data.responderId === user?.id) return;
    
    console.log('Video call answer:', data);
    
    if (data.accepted && data.answer && peerConnection) {
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        setCallState('connected');
      } catch (error) {
        console.error('Error setting remote description:', error);
        setError('Failed to establish connection');
      }
    } else {
      setCallState('rejected');
      setTimeout(() => {
        cleanup();
        onClose();
      }, 2000);
    }
  };

  const handleVideoEnd = (data) => {
    if (data.sessionId !== sessionId) return;
    console.log('Video call ended by:', data.endedBy);
    setCallState('ended');
    cleanup();
    setTimeout(() => onClose(), 2000);
  };

  const handleIceCandidate = async (data) => {
    if (data.sessionId !== sessionId || !peerConnection) return;
    
    try {
      if (data.candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  };

  const startCall = async () => {
    try {
      setCallState('calling');
      setError(null);

      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setLocalStream(stream);

      // Create peer connection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      setPeerConnection(pc);

      // Add local tracks to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketService.sendIceCandidate(sessionId, event.candidate, null);
        }
      };

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log('Received remote track:', event);
        setRemoteStream(event.streams[0]);
        setCallState('connected');
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setError('Connection lost');
          endCall();
        }
      };

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      setCallState('connecting');
      socketService.requestVideoCall(sessionId, null); // null = group call
      
      // Send offer via socket
      socketService.emit('video_offer', {
        sessionId,
        offer: pc.localDescription
      });

    } catch (error) {
      console.error('Error starting call:', error);
      setError(error.message || 'Failed to start call');
      setCallState('idle');
    }
  };

  const acceptCall = async (callerId, offer) => {
    try {
      setCallState('connecting');
      setError(null);

      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setLocalStream(stream);

      // Create peer connection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      setPeerConnection(pc);

      // Add local tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketService.sendIceCandidate(sessionId, event.candidate, callerId);
        }
      };

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log('Received remote track:', event);
        setRemoteStream(event.streams[0]);
        setCallState('connected');
      };

      // Set remote description and create answer
      if (offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
      }
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Send answer
      socketService.answerVideoCall(sessionId, callerId, true, pc.localDescription);

    } catch (error) {
      console.error('Error accepting call:', error);
      setError(error.message || 'Failed to accept call');
      socketService.answerVideoCall(sessionId, callerId, false);
      cleanup();
    }
  };

  const endCall = () => {
    socketService.endVideoCall(sessionId);
    setCallState('ended');
    cleanup();
    setTimeout(() => onClose(), 1000);
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const cleanup = () => {
    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }

    // Close peer connection
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }

    setRemoteUser(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[9999] flex items-center justify-center"
      >
        <div className="w-full h-full max-w-7xl mx-auto p-6 flex flex-col">
          {/* Professional Header with Enhanced Design */}
          <div className="flex items-center justify-between mb-6 bg-black/30 backdrop-blur-xl p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-primary via-primary-dark to-primary-dark/80 rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 relative">
                <Video className="w-7 h-7 text-white" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-black/50 animate-pulse" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Video Conference
                </h2>
                <p className="text-sm text-white/70 font-medium">Session #{sessionId?.slice(0, 8)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Enhanced Status indicator */}
              <div className="flex items-center gap-2.5 px-5 py-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 shadow-lg">
                <span className={`w-2.5 h-2.5 rounded-full shadow-lg ${
                  callState === 'connected' ? 'bg-success shadow-success/50 animate-pulse' :
                  callState === 'connecting' || callState === 'calling' ? 'bg-warning shadow-warning/50 animate-pulse' :
                  'bg-error shadow-error/50'
                }`} />
                <span className="text-white font-semibold text-sm capitalize">
                  {callState === 'connected' ? 'Live' :
                   callState === 'connecting' ? 'Connecting...' :
                   callState === 'calling' ? 'Calling...' :
                   callState === 'receiving' ? 'Incoming...' :
                   callState === 'ended' ? 'Ended' :
                   callState === 'rejected' ? 'Rejected' :
                   'Ready'}
                </span>
              </div>
              <button
                onClick={() => {
                  if (callState === 'connected' || callState === 'calling' || callState === 'connecting') {
                    endCall();
                  } else {
                    cleanup();
                    onClose();
                  }
                }}
                className="p-3 hover:bg-white/20 rounded-xl transition-all duration-200 text-white hover:scale-110"
                title="Close"
                aria-label="Close video call"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-error/20 border-2 border-error/40 rounded-2xl flex items-center gap-3 text-white backdrop-blur-md shadow-lg"
            >
              <div className="w-10 h-10 bg-error/30 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
              </div>
              <span className="font-medium">{error}</span>
            </motion.div>
          )}

          {/* Video Grid - Enhanced Layout */}
          <div className="flex-1 relative mb-6">
            {/* Main remote video with improved styling */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-3xl overflow-hidden backdrop-blur-sm border-2 border-white/10 shadow-2xl">
              {remoteStream ? (
                <>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {remoteUser && (
                    <div className="absolute top-6 left-6 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/20">
                      <div className="w-8 h-8 bg-gradient-to-br from-success to-success/80 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {remoteUser.role?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{formatRoleName(remoteUser.role) || 'Participant'}</p>
                        <p className="text-white/60 text-xs">Remote</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                      <Video className="w-10 h-10 text-white/50" />
                    </div>
                    <p className="text-white/70 text-lg font-medium">Waiting for participant...</p>
                    <p className="text-white/40 text-sm mt-2">They will appear here once connected</p>
                  </div>
                </div>
              )}
            </div>

            {/* Picture-in-Picture local video */}
            <div className="absolute bottom-6 right-6 w-72 h-48 bg-gray-900 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 group hover:scale-105 transition-transform">
              {localStream && isVideoEnabled ? (
                <>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <div className="w-6 h-6 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {user?.firstName?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-white text-sm font-medium">You</span>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="text-center">
                    <VideoOff className="w-12 h-12 mx-auto mb-2 text-white/40" />
                    <p className="text-white/60 text-sm">Camera Off</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Professional Controls Bar */}
          <div className="flex items-center justify-center gap-3">
            {callState === 'idle' ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startCall}
                className="px-8 py-4 bg-gradient-to-r from-success to-success/90 hover:from-success-dark hover:to-success text-white rounded-full flex items-center gap-3 shadow-2xl transition-all font-semibold text-lg"
              >
                <Video className="w-6 h-6" />
                <span>Start Video Call</span>
              </motion.button>
            ) : callState !== 'ended' && callState !== 'rejected' ? (
              <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md p-3 rounded-full border border-white/10">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleVideo}
                  className={`p-4 rounded-full transition-all shadow-lg ${
                    isVideoEnabled
                      ? 'bg-white/10 hover:bg-white/20 text-white'
                      : 'bg-error hover:bg-error-dark text-white'
                  }`}
                  title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                  aria-label={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                >
                  {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleAudio}
                  className={`p-4 rounded-full transition-all shadow-lg ${
                    isAudioEnabled
                      ? 'bg-white/10 hover:bg-white/20 text-white'
                      : 'bg-error hover:bg-error-dark text-white'
                  }`}
                  title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
                  aria-label={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
                >
                  {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                </motion.button>

                <div className="w-px h-10 bg-white/20" />

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={endCall}
                  className="p-4 bg-error hover:bg-error-dark rounded-full text-white transition-all shadow-lg"
                  title="End call"
                  aria-label="End call"
                >
                  <PhoneOff className="w-6 h-6" />
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all font-semibold"
              >
                Close
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoCallPanel;
