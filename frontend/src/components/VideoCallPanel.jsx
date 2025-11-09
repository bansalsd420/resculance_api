import { useState, useEffect, useRef } from 'react';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Loader, AlertCircle, X, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import socketService from '../services/socketService.js';
import { useAuthStore } from '../store/authStore';
import { formatRoleName } from '../utils/roleUtils';

const VideoCallPanel = ({ sessionId, isOpen, onClose, pendingCall, session }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [callState, setCallState] = useState('idle'); // idle, calling, connecting, connected, ended
  const [error, setError] = useState(null);
  const [remoteUser, setRemoteUser] = useState(null);
  const [processedCallId, setProcessedCallId] = useState(null); // Track which call we've processed
  
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

  // Process pending incoming call when panel opens
  useEffect(() => {
    if (isOpen && pendingCall && processedCallId !== pendingCall.callerId) {
      console.log('🎯 Processing pending video call:', pendingCall);
      setProcessedCallId(pendingCall.callerId); // Mark as processed
      handleVideoRequest(pendingCall);
    }
  }, [isOpen, pendingCall, processedCallId]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      console.log('📹 Assigning local stream to video element');
      console.log('📹 Local stream tracks:', localStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })));
      localVideoRef.current.srcObject = localStream;
      
      // Debug video element
      console.log('📹 Video element dimensions:', localVideoRef.current.clientWidth, 'x', localVideoRef.current.clientHeight);
      console.log('📹 Video element visibility:', window.getComputedStyle(localVideoRef.current).visibility);
      
      // Ensure video plays
      localVideoRef.current.play().catch(err => {
        console.warn('Could not auto-play local video:', err);
      });
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log('🎥 Assigning remote stream to video element');
      console.log('🎥 Remote stream tracks:', remoteStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })));
      
      // Clear any existing srcObject first
      remoteVideoRef.current.srcObject = null;
      
      // Small delay to ensure cleanup is complete
      setTimeout(() => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          console.log('🎥 Remote stream assigned to video element');
          
          // Ensure video plays
          remoteVideoRef.current.play().catch(err => {
            console.warn('Could not auto-play remote video:', err);
          });
        }
      }, 100);
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
    
    // Ignore if this is our own call request
    if (data.callerId === user?.id) {
      console.log('Ignoring own video call request');
      return;
    }
    
    console.log('Incoming video call from:', data);
    
    // Validate that offer exists
    if (!data.offer) {
      console.error('No offer in video request');
      return;
    }
    
    setRemoteUser({
      id: data.callerId,
      role: data.callerRole
    });
    
    setCallState('receiving');
    
    // Auto-accept for now (can add UI prompt later)
    await acceptCall(data.callerId, data.offer);
  };

  const handleVideoAnswer = async (data) => {
    if (data.sessionId !== sessionId) return;
    
    // Ignore our own answer
    if (data.responderId === user?.id) {
      console.log('Ignoring own video answer');
      return;
    }
    
    console.log('Video call answer received:', data);
    
    if (data.accepted && data.answer && peerConnection) {
      try {
        console.log('📡 Setting remote description from answer');
        console.log('📡 Answer type:', data.answer.type);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        console.log('✅ Remote description set successfully');
        setCallState('connected');
        setRemoteUser({
          id: data.responderId,
          role: data.responderRole
        });
      } catch (error) {
        console.error('❌ Error setting remote description:', error);
        setError('Failed to establish connection');
      }
    } else if (!data.accepted) {
      setCallState('rejected');
      setTimeout(() => {
        cleanup();
        onClose();
      }, 2000);
    } else {
      console.warn('Missing answer or peer connection:', { 
        hasAnswer: !!data.answer, 
        hasPeerConnection: !!peerConnection 
      });
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
    if (data.sessionId !== sessionId) return;
    
    // Only process ICE candidates from other users
    if (data.fromUserId === user?.id) {
      console.log('Ignoring our own ICE candidate');
      return;
    }
    
    // Only process if we have a peer connection
    if (!peerConnection) {
      console.warn('Received ICE candidate but no peer connection exists yet');
      return;
    }
    
    try {
      if (data.candidate) {
        console.log('🧊 Adding ICE candidate from user:', data.fromUserId);
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        console.log('✅ ICE candidate added successfully');
      }
    } catch (error) {
      console.error('❌ Error adding ICE candidate:', error);
    }
  };

  const testCamera = async () => {
    try {
      console.log('🧪 Testing camera access...');
      const testStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      
      console.log('✅ Camera test successful');
      console.log('🧪 Test stream tracks:', testStream.getTracks().length);
      
      // Stop test stream
      testStream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      console.error('❌ Camera test failed:', error);
      setError('Camera access denied or unavailable');
      return false;
    }
  };

  const startCall = async () => {
    // Test camera first
    const cameraWorking = await testCamera();
    if (!cameraWorking) {
      return;
    }

    try {
      console.log('📞 Starting video call for session:', sessionId);
      setCallState('calling');
      setError(null);

      // Find target user (first available crew member)
      let targetUserId = null;
      if (session?.crew && session.crew.length > 0) {
        // Prefer paramedics first, then doctors, then drivers
        const paramedic = session.crew.find(c => c.role?.toLowerCase().includes('paramedic'));
        const doctor = session.crew.find(c => c.role?.toLowerCase().includes('doctor'));
        const driver = session.crew.find(c => c.role?.toLowerCase().includes('driver'));
        
        targetUserId = paramedic?.id || doctor?.id || driver?.id || session.crew[0].id;
        console.log('🎯 Targeting user for video call:', targetUserId);
      }

      if (!targetUserId) {
        setError('No crew members available for video call');
        setCallState('idle');
        return;
      }

      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      console.log('✅ Got local media stream with tracks:', stream.getTracks().length);
      console.log('📹 Video tracks:', stream.getVideoTracks().length, 'Audio tracks:', stream.getAudioTracks().length);
      
      // Ensure tracks are enabled
      stream.getVideoTracks().forEach(track => {
        track.enabled = true;
        console.log('📹 Enabled video track:', track.label);
      });
      stream.getAudioTracks().forEach(track => {
        track.enabled = true;
        console.log('🎤 Enabled audio track:', track.label);
      });
      
      setLocalStream(stream);

      // Create peer connection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      setPeerConnection(pc);
      console.log('✅ Created peer connection');

      // Add local tracks to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
        console.log('Added track:', track.kind);
      });

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🧊 Sending ICE candidate to target user');
          socketService.sendIceCandidate(sessionId, event.candidate, targetUserId);
        }
      };

      // Handle remote stream - improved handling
      let remoteStreamTemp = new MediaStream();
      
      pc.ontrack = (event) => {
        console.log('📺 Received remote track:', event.track.kind, 'streams:', event.streams.length);
        
        if (event.streams && event.streams[0]) {
          console.log('📺 Setting remote stream from ontrack event');
          setRemoteStream(event.streams[0]);
          setCallState('connected');
        } else {
          // Fallback: add track to our own stream
          console.log('📺 Adding track to temporary stream');
          remoteStreamTemp.addTrack(event.track);
          
          // If this is the first track or we have both audio/video, set the stream
          if (remoteStreamTemp.getTracks().length >= 1) {
            console.log('📺 Setting temporary stream as remote stream');
            setRemoteStream(remoteStreamTemp);
            setCallState('connected');
          }
        }
      };

      // Add connection state monitoring
      pc.onconnectionstatechange = () => {
        console.log('🔗 Connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          console.log('✅ Peer connection established successfully');
          setCallState('connected');
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          console.log('❌ Connection lost:', pc.connectionState);
          setError('Connection lost');
          endCall();
        }
      };

      // Add ICE connection state monitoring
      pc.oniceconnectionstatechange = () => {
        console.log('🧊 ICE connection state:', pc.iceConnectionState);
      };

      // Create and send offer
      const offer = await pc.createOffer();
      console.log('✅ Created offer:', offer.type);
      await pc.setLocalDescription(offer);
      console.log('✅ Set local description, sending to session');
      
      setCallState('connecting');
      // Send offer to specific target user
      socketService.requestVideoCall(sessionId, targetUserId, pc.localDescription);

    } catch (error) {
      console.error('❌ Error starting call:', error);
      setError(error.message || 'Failed to start call');
      setCallState('idle');
    }
  };

  const acceptCall = async (callerId, offer) => {
    // Test camera first
    const cameraWorking = await testCamera();
    if (!cameraWorking) {
      socketService.answerVideoCall(sessionId, callerId, false);
      return;
    }

    try {
      console.log('📞 Accepting call from:', callerId);
      setCallState('connecting');
      setError(null);

      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      console.log('✅ Got local media stream with tracks:', stream.getTracks().length);
      console.log('📹 Video tracks:', stream.getVideoTracks().length, 'Audio tracks:', stream.getAudioTracks().length);
      
      // Ensure tracks are enabled
      stream.getVideoTracks().forEach(track => {
        track.enabled = true;
        console.log('📹 Enabled video track:', track.label);
      });
      stream.getAudioTracks().forEach(track => {
        track.enabled = true;
        console.log('🎤 Enabled audio track:', track.label);
      });
      
      setLocalStream(stream);

      // Create peer connection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      setPeerConnection(pc);
      console.log('✅ Created peer connection');

      // Add local tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
        console.log('Added track:', track.kind);
      });

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🧊 Sending ICE candidate to caller');
          socketService.sendIceCandidate(sessionId, event.candidate, callerId);
        }
      };

      // Handle remote stream - improved handling
      let remoteStreamTemp = new MediaStream();
      
      pc.ontrack = (event) => {
        console.log('📺 Received remote track in acceptCall:', event.track.kind, 'streams:', event.streams.length);
        
        if (event.streams && event.streams[0]) {
          console.log('📺 Setting remote stream from ontrack event in acceptCall');
          setRemoteStream(event.streams[0]);
          setCallState('connected');
        } else {
          // Fallback: add track to our own stream
          console.log('📺 Adding track to temporary stream in acceptCall');
          remoteStreamTemp.addTrack(event.track);
          
          // If this is the first track or we have both audio/video, set the stream
          if (remoteStreamTemp.getTracks().length >= 1) {
            console.log('📺 Setting temporary stream as remote stream in acceptCall');
            setRemoteStream(remoteStreamTemp);
            setCallState('connected');
          }
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log('🔗 Connection state in acceptCall:', pc.connectionState);
      };

      // Add ICE connection state monitoring
      pc.oniceconnectionstatechange = () => {
        console.log('🧊 ICE connection state in acceptCall:', pc.iceConnectionState);
      };

      // Set remote description and create answer
      if (offer) {
        console.log('✅ Setting remote description from offer');
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
      }
      
      const answer = await pc.createAnswer();
      console.log('✅ Created answer:', answer.type);
      await pc.setLocalDescription(answer);
      console.log('✅ Set local description in acceptCall, sending to caller');

      // Send answer
      socketService.answerVideoCall(sessionId, callerId, true, pc.localDescription);

    } catch (error) {
      console.error('❌ Error accepting call:', error);
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
    console.log('🧹 Cleaning up video call resources');
    
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
    setProcessedCallId(null); // Reset processed call tracker
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[9990] flex items-center justify-center"
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
                    onLoadedMetadata={() => console.log('🎥 Remote video metadata loaded')}
                    onCanPlay={() => console.log('🎥 Remote video can play')}
                    onError={(e) => console.error('🎥 Remote video error:', e)}
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
              {localStream ? (
                <>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                    onLoadedMetadata={() => console.log('📹 Local video metadata loaded')}
                    onCanPlay={() => console.log('📹 Local video can play')}
                    onError={(e) => console.error('📹 Local video error:', e)}
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <div className="w-6 h-6 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {user?.firstName?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-white text-sm font-medium">You</span>
                  </div>
                  {!isVideoEnabled && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="text-center">
                        <VideoOff className="w-8 h-8 mx-auto mb-1 text-white/70" />
                        <p className="text-white/70 text-xs">Camera Off</p>
                      </div>
                    </div>
                  )}
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
