import { useState, useEffect, useRef } from 'react';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Monitor, Users, MessageSquare, MoreVertical, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import socketService from '../services/socketService.js';
import { useAuthStore } from '../store/authStore';
import * as mediasoupClient from 'mediasoup-client';

const VideoCallPanelSFU = ({ sessionId, isOpen, onClose, session }) => {
  const { accessToken, user } = useAuthStore();
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map()); // userId -> MediaStream
  const [participants, setParticipants] = useState([]);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [debugMessages, setDebugMessages] = useState([]);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  
  const localVideoRef = useRef(null);
  const localVideoRef2 = useRef(null); // For grid view
  const localVideoRef3 = useRef(null); // For large grid view
  const localStreamRef = useRef(null);
  const hasJoinedRoom = useRef(false);
  
  // Mediasoup refs
  const device = useRef(null);
  const sendTransport = useRef(null);
  const recvTransport = useRef(null);
  const producers = useRef(new Map()); // kind -> producer
  const consumers = useRef(new Map()); // consumerId -> consumer
  const consumedProducers = useRef(new Set()); // Track which producerIds we've already consumed
  const remoteVideoRefs = useRef(new Map()); // userId -> video element ref

  const addDebug = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugMessages(prev => [...prev, `[${timestamp}] ${message}`].slice(-100));
    console.log(`[VideoCallSFU] ${message}`);
  };

  // Initialize mediasoup device and join room
  useEffect(() => {
    if (!isOpen || !sessionId || hasJoinedRoom.current) return;

    const joinRoom = async () => {
      try {
        addDebug('Starting mediasoup video call...');
        setConnectionStatus('connecting');
        setError(null);

        // Ensure socket is connected
        if (!socketService.socket || !socketService.socket.connected) {
          if (accessToken) {
            socketService.connect(accessToken);
            addDebug('Connecting socket with token');
            // Wait for connection
            await new Promise((resolve) => {
              const checkConnection = setInterval(() => {
                if (socketService.socket && socketService.socket.connected) {
                  clearInterval(checkConnection);
                  resolve();
                }
              }, 100);
              setTimeout(() => {
                clearInterval(checkConnection);
                resolve();
              }, 5000);
            });
          }
        }

        // Get user media first
        addDebug('Requesting local media...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 1280 }, height: { ideal: 720 } }, 
          audio: true 
        });
        
        setLocalStream(stream);
        localStreamRef.current = stream;
        addDebug(`Got local stream: ${stream.getTracks().map(t => t.kind).join(', ')}`);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(err => console.error('Play failed:', err));
        }

        // Join socket room
        socketService.joinVideoRoom(sessionId);
        addDebug('Joined video room via socket');

        // Get router RTP capabilities
        const { rtpCapabilities } = await new Promise((resolve, reject) => {
          socketService.socket.emit('getRouterRtpCapabilities', { sessionId }, (response) => {
            if (response.success) resolve(response);
            else reject(new Error(response.error || 'Failed to get RTP capabilities'));
          });
        });

        addDebug('Received RTP capabilities');

        // Create mediasoup device
        device.current = new mediasoupClient.Device();
        await device.current.load({ routerRtpCapabilities: rtpCapabilities });
        addDebug('Mediasoup device loaded');

        // Create send transport (for sending our video/audio)
        const sendTransportOptions = await new Promise((resolve, reject) => {
          socketService.socket.emit('createWebRtcTransport', { sessionId, direction: 'send' }, (response) => {
            if (response.success) resolve(response);
            else reject(new Error(response.error || 'Failed to create send transport'));
          });
        });

        sendTransport.current = device.current.createSendTransport(sendTransportOptions);
        addDebug(`Send transport created: ${sendTransport.current.id}`);

        // Handle send transport connect
        sendTransport.current.on('connect', async ({ dtlsParameters }, callback, errback) => {
          try {
            addDebug('Connecting send transport...');
            const response = await new Promise((resolve) => {
              socketService.socket.emit('connectWebRtcTransport', { 
                transportId: sendTransport.current.id, 
                dtlsParameters 
              }, resolve);
            });
            if (response.success) {
              callback();
              addDebug('Send transport connected');
            } else {
              errback(new Error(response.error));
            }
          } catch (error) {
            errback(error);
          }
        });

        // Handle send transport produce
        sendTransport.current.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
          try {
            addDebug(`Producing ${kind}...`);
            const response = await new Promise((resolve) => {
              socketService.socket.emit('produce', {
                transportId: sendTransport.current.id,
                kind,
                rtpParameters,
                sessionId
              }, resolve);
            });

            if (response.success) {
              callback({ id: response.producerId });
              addDebug(`Producer created for ${kind}: ${response.producerId}`);
            } else {
              errback(new Error(response.error));
            }
          } catch (error) {
            errback(error);
          }
        });

        // Produce video track
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const videoProducer = await sendTransport.current.produce({ track: videoTrack });
          producers.current.set('video', videoProducer);
          addDebug(`Video producer: ${videoProducer.id}`);
        }

        // Produce audio track
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          const audioProducer = await sendTransport.current.produce({ track: audioTrack });
          producers.current.set('audio', audioProducer);
          addDebug(`Audio producer: ${audioProducer.id}`);
        }

        // Create receive transport (for receiving others' video/audio)
        const recvTransportOptions = await new Promise((resolve, reject) => {
          socketService.socket.emit('createWebRtcTransport', { sessionId, direction: 'recv' }, (response) => {
            if (response.success) resolve(response);
            else reject(new Error(response.error || 'Failed to create recv transport'));
          });
        });

        recvTransport.current = device.current.createRecvTransport(recvTransportOptions);
        addDebug(`Recv transport created: ${recvTransport.current.id}`);

        // Handle recv transport connect
        recvTransport.current.on('connect', async ({ dtlsParameters }, callback, errback) => {
          try {
            addDebug('Connecting recv transport...');
            const response = await new Promise((resolve) => {
              socketService.socket.emit('connectWebRtcTransport', { 
                transportId: recvTransport.current.id, 
                dtlsParameters 
              }, resolve);
            });
            if (response.success) {
              callback();
              addDebug('Recv transport connected');
            } else {
              errback(new Error(response.error));
            }
          } catch (error) {
            errback(error);
          }
        });

        // Get existing producers and consume them
        const { producers: existingProducers } = await new Promise((resolve) => {
          socketService.socket.emit('getProducers', { sessionId }, resolve);
        });

        addDebug(`Found ${existingProducers.length} existing producers`);
        
        for (const producerInfo of existingProducers) {
          await consumeProducer(producerInfo);
        }

        // Listen for new producers
        socketService.socket.on('newProducer', async (data) => {
          addDebug(`New producer from user ${data.userId}: ${data.kind}`);
          await consumeProducer(data);
        });

        // Listen for users joining/leaving
        socketService.onVideoRoomJoined(handleVideoRoomJoined);
        socketService.onUserJoinedVideo(handleUserJoined);
        socketService.onUserLeftVideo(handleUserLeft);

        setConnectionStatus('connected');
        hasJoinedRoom.current = true;
        addDebug('✅ Successfully joined video call');

      } catch (error) {
        console.error('[VideoCallSFU] Failed to join:', error);
        addDebug(`❌ Error: ${error.message}`);
        setError(error.message || 'Failed to join video call');
        setConnectionStatus('idle');
        hasJoinedRoom.current = false;
      }
    };

    joinRoom();

    return () => {
      cleanup();
    };
  }, [isOpen, sessionId, accessToken]);

  // Ensure local video element gets the stream when it changes
  useEffect(() => {
    if (localStream) {
      console.log('[VideoCallSFU] Attaching local stream to video elements');
      
      // Attach to all video refs
      const refs = [localVideoRef, localVideoRef2, localVideoRef3];
      refs.forEach((ref, index) => {
        if (ref.current) {
          ref.current.srcObject = localStream;
          ref.current.play().catch(err => {
            console.error(`[VideoCallSFU] Failed to play local video ${index}:`, err);
          });
        }
      });
      
      addDebug(`Local stream attached: ${localStream.getTracks().map(t => t.kind).join(', ')}`);
    }
  }, [localStream]);

  // Consume a producer (receive remote stream)
  const consumeProducer = async (producerInfo) => {
    try {
      const { producerId, userId, kind } = producerInfo;
      
      // Skip if this is our own producer
      if (userId === user?.id) {
        addDebug(`Skipping own producer: ${kind} from user ${userId}`);
        return;
      }
      
      // Skip if we've already consumed this producer
      if (consumedProducers.current.has(producerId)) {
        addDebug(`Skipping already consumed producer: ${producerId}`);
        return;
      }
      
      if (!device.current || !recvTransport.current) {
        addDebug('Device or recv transport not ready for consuming');
        return;
      }

      addDebug(`Consuming ${kind} from user ${userId}...`);

      const response = await new Promise((resolve) => {
        socketService.socket.emit('consume', {
          transportId: recvTransport.current.id,
          producerId,
          rtpCapabilities: device.current.rtpCapabilities,
          sessionId
        }, resolve);
      });

      if (!response.success) {
        addDebug(`Failed to consume: ${response.error}`);
        return;
      }

      const consumer = await recvTransport.current.consume({
        id: response.id,
        producerId: response.producerId,
        kind: response.kind,
        rtpParameters: response.rtpParameters,
      });

      consumers.current.set(consumer.id, consumer);
      consumedProducers.current.add(producerId); // Mark as consumed
      addDebug(`Consumer created: ${consumer.id} for ${kind} from user ${userId}`);

      // Resume consumer
      socketService.socket.emit('resumeConsumer', { consumerId: consumer.id }, (res) => {
        if (res.success) {
          addDebug(`Consumer resumed: ${consumer.id}`);
        }
      });

      // Add track to remote stream
      setRemoteStreams(prev => {
        const copy = new Map(prev);
        let stream = copy.get(userId);
        
        if (!stream) {
          stream = new MediaStream();
          copy.set(userId, stream);
        }
        
        stream.addTrack(consumer.track);
        addDebug(`Added ${kind} track to stream for user ${userId}`);
        return copy;
      });

      // Update participants if not already added
      setParticipants(prev => {
        const exists = prev.find(p => p.userId === userId);
        if (!exists) {
          return [...prev, { 
            userId, 
            userName: producerInfo.userName || `User ${userId}` 
          }];
        }
        return prev;
      });

    } catch (error) {
      console.error('Error consuming producer:', error);
      addDebug(`Error consuming: ${error.message}`);
    }
  };

  const handleVideoRoomJoined = (data) => {
    addDebug(`Video room joined, ${data.participants?.length || 0} participants`);
    const existing = (data.participants || []).map(p => ({ 
      userId: p.id || p.userId, 
      userName: `${p.firstName || ''} ${p.lastName || ''}`.trim() 
    }));
    setParticipants(existing);
  };

  const handleUserJoined = (data) => {
    addDebug(`User joined: ${data.firstName} ${data.lastName}`);
    setParticipants(prev => {
      const exists = prev.find(p => p.userId === data.userId);
      if (!exists) {
        return [...prev, { 
          userId: data.userId, 
          userName: `${data.firstName || ''} ${data.lastName || ''}`.trim() 
        }];
      }
      return prev;
    });
  };

  const handleUserLeft = (data) => {
    addDebug(`User left: ${data.userId}`);
    setParticipants(prev => prev.filter(p => p.userId !== data.userId));
    setRemoteStreams(prev => {
      const copy = new Map(prev);
      copy.delete(data.userId);
      return copy;
    });
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        addDebug(`Video ${videoTrack.enabled ? 'enabled' : 'disabled'}`);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        addDebug(`Audio ${audioTrack.enabled ? 'enabled' : 'disabled'}`);
      }
    }
  };

  const cleanup = () => {
    addDebug('Cleaning up video call...');
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    producers.current.forEach(producer => producer.close());
    producers.current.clear();

    consumers.current.forEach(consumer => consumer.close());
    consumers.current.clear();
    
    consumedProducers.current.clear(); // Clear consumed producers tracking

    if (sendTransport.current) sendTransport.current.close();
    if (recvTransport.current) recvTransport.current.close();

    if (hasJoinedRoom.current) {
      socketService.leaveVideoRoom(sessionId);
      hasJoinedRoom.current = false;
    }

    try {
      socketService.socket?.off('newProducer');
      socketService.offVideoRoomJoined(handleVideoRoomJoined);
      socketService.offUserJoinedVideo(handleUserJoined);
      socketService.offUserLeftVideo(handleUserLeft);
    } catch (e) {
      // ignore
    }
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gray-900 z-[9999] flex flex-col"
      >
        {/* Debug Panel */}
        <button
          onClick={() => setShowDebugPanel(v => !v)}
          className="absolute top-2 right-2 z-[99999] bg-gray-800 text-xs text-white px-2 py-1 rounded shadow hover:bg-gray-700"
        >
          {showDebugPanel ? 'Hide Debug' : 'Show Debug'}
        </button>
        {showDebugPanel && (
          <div className="absolute top-10 right-2 z-[99999] w-96 max-h-96 overflow-auto bg-black/90 text-green-200 text-xs p-2 rounded shadow-lg">
            <div className="font-bold mb-1">Debug Log (SFU)</div>
            <pre className="whitespace-pre-wrap break-words">{debugMessages.join('\n')}</pre>
          </div>
        )}

        {/* Header */}
        <div className="bg-gray-800/90 backdrop-blur-sm px-6 py-4 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg">Emergency Session (SFU)</h2>
                <p className="text-gray-400 text-sm">Session #{sessionId?.slice(0, 8)}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-white text-sm font-medium">
                {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
              </span>
            </div>

            {/* Local Stream Status */}
            {localStream && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-700/50 rounded-lg">
                <Video className="w-4 h-4 text-green-300" />
                <span className="text-green-200 text-xs font-medium">
                  Camera Active
                </span>
              </div>
            )}
            
            <button className="p-2.5 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition-colors relative">
              <Users className="w-5 h-5" />
              {participants.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {participants.length + 1}
                </span>
              )}
            </button>

            <button onClick={handleClose} className="p-2.5 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/20 border-b border-red-500/40 px-6 py-3">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Video Grid */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
          <div className="w-full h-full max-w-7xl mx-auto">
            {participants.length === 0 && (
              <div className="relative w-full h-full bg-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                {localStream ? (
                  <>
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    {!isVideoEnabled && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
                        <VideoOff className="w-16 h-16 text-gray-500 mb-4" />
                        <p className="text-gray-400">{user?.name || 'You'}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
                  </div>
                )}
                <div className="absolute bottom-6 left-6 bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl">
                  <p className="text-white font-medium">{user?.name || 'You'}</p>
                </div>
              </div>
            )}

            {participants.length > 0 && participants.length <= 3 && (
              <div className="grid grid-cols-2 gap-4 h-full">
                <div className="relative bg-gray-800 rounded-2xl overflow-hidden shadow-xl">
                  {localStream ? (
                    <>
                      <video ref={localVideoRef2} autoPlay playsInline muted className="w-full h-full object-cover" />
                      {!isVideoEnabled && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                          <VideoOff className="w-12 h-12 text-gray-600" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1.5 rounded-lg">
                    <p className="text-white text-sm font-medium">{user?.name || 'You'}</p>
                    <p className="text-gray-400 text-xs">
                      {localStream ? `${localStream.getTracks().length} tracks` : 'No stream'}
                    </p>
                  </div>
                </div>

                {participants.map((participant) => (
                  <div key={participant.userId} className="relative bg-gray-800 rounded-2xl overflow-hidden shadow-xl">
                    {remoteStreams.get(participant.userId) ? (
                      <video
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                        ref={(el) => {
                          if (el && remoteStreams.get(participant.userId)) {
                            el.srcObject = remoteStreams.get(participant.userId);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-3 mx-auto">
                            <span className="text-white text-2xl">{participant.userName?.charAt(0) || '?'}</span>
                          </div>
                          <p className="text-gray-400">{participant.userName}</p>
                          <p className="text-gray-500 text-xs mt-1">Connecting...</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1.5 rounded-lg">
                      <p className="text-white text-sm font-medium">{participant.userName}</p>
                    </div>
                    {/* Active Speaker Indicator */}
                    {remoteStreams.get(participant.userId) && (
                      <div className="absolute top-4 left-4">
                        <div className="bg-green-500/80 px-2 py-1 rounded-lg flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                          <span className="text-white text-xs font-medium">Live</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {participants.length > 3 && (
              <div className="grid grid-cols-3 gap-3 h-full auto-rows-fr">
                <div className="relative bg-gray-800 rounded-xl overflow-hidden">
                  {localStream ? (
                    <>
                      <video ref={localVideoRef3} autoPlay playsInline muted className="w-full h-full object-cover" />
                      {!isVideoEnabled && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                          <VideoOff className="w-8 h-8 text-gray-600" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
                    {user?.name || 'You'}
                  </div>
                </div>

                {participants.map((participant) => (
                  <div key={participant.userId} className="relative bg-gray-800 rounded-xl overflow-hidden">
                    {remoteStreams.get(participant.userId) ? (
                      <>
                        <video
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                          ref={(el) => {
                            if (el && remoteStreams.get(participant.userId)) {
                              el.srcObject = remoteStreams.get(participant.userId);
                            }
                          }}
                        />
                        <div className="absolute top-2 left-2">
                          <div className="bg-green-500/80 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></div>
                            <span className="text-white text-xs font-medium">Live</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <span className="text-white text-lg">{participant.userName?.charAt(0) || '?'}</span>
                          <p className="text-gray-500 text-xs mt-1">Connecting...</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs text-white">{participant.userName}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-800/90 backdrop-blur-sm px-6 py-5 flex items-center justify-center border-t border-gray-700">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleAudio}
              className={`p-4 rounded-full transition-all shadow-lg ${isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {isAudioEnabled ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-all shadow-lg ${isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {isVideoEnabled ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-white" />}
            </button>

            <button onClick={handleClose} className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all shadow-lg ml-3">
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoCallPanelSFU;
