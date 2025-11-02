import { useState, useEffect, useRef } from 'react';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Loader, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import socketService from '../services/socketService.js';
import { useAuthStore } from '../store/authStore';

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
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
      >
        <div className="w-full h-full max-w-7xl mx-auto p-4 flex flex-col">
          {/* Status */}
          <div className="text-white text-center mb-4">
            {callState === 'calling' && <p className="text-lg">Initiating call...</p>}
            {callState === 'receiving' && <p className="text-lg">Incoming call...</p>}
            {callState === 'connecting' && <p className="text-lg">Connecting...</p>}
            {callState === 'connected' && <p className="text-green-400 text-lg">Connected</p>}
            {callState === 'rejected' && <p className="text-red-400 text-lg">Call Rejected</p>}
            {callState === 'ended' && <p className="text-gray-400 text-lg">Call Ended</p>}
            {error && (
              <div className="flex items-center justify-center gap-2 text-red-400 mt-2">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Video Grid */}
          <div className="flex-1 grid grid-cols-2 gap-4 mb-4">
            {/* Remote Video */}
            <div className="relative bg-gray-900 rounded-xl overflow-hidden">
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Video className="w-16 h-16 mx-auto mb-2" />
                    <p>Waiting for remote video...</p>
                  </div>
                </div>
              )}
              {remoteUser && (
                <div className="absolute top-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded-full text-white text-sm">
                  {remoteUser.role}
                </div>
              )}
            </div>

            {/* Local Video */}
            <div className="relative bg-gray-900 rounded-xl overflow-hidden">
              {localStream && isVideoEnabled ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <VideoOff className="w-16 h-16 mx-auto mb-2" />
                    <p>Camera Off</p>
                  </div>
                </div>
              )}
              <div className="absolute top-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded-full text-white text-sm">
                You ({user?.role})
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            {callState === 'idle' ? (
              <button
                onClick={startCall}
                className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center gap-2 transition-colors"
              >
                <Video className="w-6 h-6" />
                <span className="font-semibold">Start Video Call</span>
              </button>
            ) : callState !== 'ended' && callState !== 'rejected' ? (
              <>
                <button
                  onClick={toggleVideo}
                  className={`p-4 rounded-full transition-colors ${
                    isVideoEnabled
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                </button>

                <button
                  onClick={toggleAudio}
                  className={`p-4 rounded-full transition-colors ${
                    isAudioEnabled
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                </button>

                <button
                  onClick={endCall}
                  className="p-4 bg-red-600 hover:bg-red-700 rounded-full text-white transition-colors"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoCallPanel;
