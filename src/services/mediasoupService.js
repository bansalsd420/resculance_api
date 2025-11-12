const mediasoup = require('mediasoup');

class MediasoupService {
  constructor() {
    this.worker = null;
    this.routers = new Map(); // sessionId -> router
    this.transports = new Map(); // transportId -> transport
    this.producers = new Map(); // producerId -> { producer, sessionId, userId }
    this.consumers = new Map(); // consumerId -> { consumer, sessionId, userId }
    this.peers = new Map(); // `${sessionId}_${userId}` -> { transports, producers, consumers }
  }

  async initialize() {
    try {
      // Create a mediasoup Worker
      this.worker = await mediasoup.createWorker({
        logLevel: 'warn',
        logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'],
        rtcMinPort: 40000,
        rtcMaxPort: 49999,
      });

      console.log('✅ Mediasoup worker created [pid:%d]', this.worker.pid);

      this.worker.on('died', () => {
        console.error('❌ Mediasoup worker died, exiting in 2 seconds...');
        setTimeout(() => process.exit(1), 2000);
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to create mediasoup worker:', error);
      return false;
    }
  }

  // Get or create a router for a session
  async getRouter(sessionId) {
    if (this.routers.has(sessionId)) {
      return this.routers.get(sessionId);
    }

    const router = await this.worker.createRouter({
      mediaCodecs: [
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          clockRate: 48000,
          channels: 2,
        },
        {
          kind: 'video',
          mimeType: 'video/VP8',
          clockRate: 90000,
          parameters: {
            'x-google-start-bitrate': 1000,
          },
        },
        {
          kind: 'video',
          mimeType: 'video/H264',
          clockRate: 90000,
          parameters: {
            'packetization-mode': 1,
            'profile-level-id': '42e01f',
            'level-asymmetry-allowed': 1,
            'x-google-start-bitrate': 1000,
          },
        },
      ],
    });

    this.routers.set(sessionId, router);
    console.log(`📹 Created router for session ${sessionId}`);
    return router;
  }

  // Get RTP capabilities for a session
  async getRtpCapabilities(sessionId) {
    const router = await this.getRouter(sessionId);
    return router.rtpCapabilities;
  }

  // Create WebRTC transport
  async createWebRtcTransport(sessionId, userId) {
    const router = await this.getRouter(sessionId);

    const transport = await router.createWebRtcTransport({
      listenIps: [
        {
          ip: '0.0.0.0',
          announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || '127.0.0.1', // Use your server's public IP in production
        },
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
    });

    const peerKey = `${sessionId}_${userId}`;
    if (!this.peers.has(peerKey)) {
      this.peers.set(peerKey, {
        transports: [],
        producers: [],
        consumers: [],
      });
    }

    this.peers.get(peerKey).transports.push(transport.id);
    this.transports.set(transport.id, transport);

    console.log(`🚚 Created WebRTC transport [id:${transport.id}] for user ${userId} in session ${sessionId}`);

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    };
  }

  // Connect transport
  async connectTransport(transportId, dtlsParameters) {
    const transport = this.transports.get(transportId);
    if (!transport) {
      throw new Error(`Transport ${transportId} not found`);
    }

    await transport.connect({ dtlsParameters });
    console.log(`🔌 Transport ${transportId} connected`);
  }

  // Create producer (user starts sending media)
  async produce(transportId, kind, rtpParameters, sessionId, userId) {
    const transport = this.transports.get(transportId);
    if (!transport) {
      throw new Error(`Transport ${transportId} not found`);
    }

    const producer = await transport.produce({ kind, rtpParameters });

    const peerKey = `${sessionId}_${userId}`;
    this.peers.get(peerKey).producers.push(producer.id);
    this.producers.set(producer.id, { producer, sessionId, userId, kind });

    console.log(`🎥 Created producer [id:${producer.id}] ${kind} for user ${userId} in session ${sessionId}`);

    // Notify other peers in the session that a new producer is available
    return producer.id;
  }

  // Create consumer (user starts receiving media)
  async consume(transportId, producerId, rtpCapabilities, sessionId, userId) {
    const transport = this.transports.get(transportId);
    const producerInfo = this.producers.get(producerId);

    if (!transport) {
      throw new Error(`Transport ${transportId} not found`);
    }

    if (!producerInfo) {
      throw new Error(`Producer ${producerId} not found`);
    }

    const router = await this.getRouter(sessionId);

    if (!router.canConsume({ producerId, rtpCapabilities })) {
      console.warn(`Cannot consume producer ${producerId} with given RTP capabilities`);
      return null;
    }

    const consumer = await transport.consume({
      producerId,
      rtpCapabilities,
      paused: true, // Start paused
    });

    const peerKey = `${sessionId}_${userId}`;
    if (!this.peers.has(peerKey)) {
      this.peers.set(peerKey, {
        transports: [],
        producers: [],
        consumers: [],
      });
    }

    this.peers.get(peerKey).consumers.push(consumer.id);
    this.consumers.set(consumer.id, { consumer, sessionId, userId });

    console.log(`🎧 Created consumer [id:${consumer.id}] for user ${userId} consuming producer ${producerId}`);

    return {
      id: consumer.id,
      producerId: producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      type: consumer.type,
      producerPaused: consumer.producerPaused,
    };
  }

  // Resume consumer
  async resumeConsumer(consumerId) {
    const consumerInfo = this.consumers.get(consumerId);
    if (!consumerInfo) {
      throw new Error(`Consumer ${consumerId} not found`);
    }

    await consumerInfo.consumer.resume();
    console.log(`▶️  Consumer ${consumerId} resumed`);
  }

  // Pause consumer
  async pauseConsumer(consumerId) {
    const consumerInfo = this.consumers.get(consumerId);
    if (!consumerInfo) {
      throw new Error(`Consumer ${consumerId} not found`);
    }

    await consumerInfo.consumer.pause();
    console.log(`⏸️  Consumer ${consumerId} paused`);
  }

  // Get all producers in a session (for a user to consume)
  getProducersInSession(sessionId, excludeUserId) {
    const producers = [];
    const seen = new Set(); // Prevent duplicates
    
    for (const [producerId, info] of this.producers.entries()) {
      if (info.sessionId === sessionId && info.userId !== excludeUserId) {
        const key = `${info.userId}_${info.kind}`;
        
        // Skip if we already have a producer of this kind from this user
        if (seen.has(key)) {
          console.warn(`⚠️  Skipping duplicate producer: ${key} (producerId: ${producerId})`);
          continue;
        }
        
        seen.add(key);
        producers.push({
          producerId,
          userId: info.userId,
          kind: info.kind,
        });
      }
    }
    
    console.log(`📋 Found ${producers.length} unique producers in session ${sessionId} (excluding user ${excludeUserId})`);
    return producers;
  }

  // Clean up when user leaves
  async cleanupPeer(sessionId, userId) {
    const peerKey = `${sessionId}_${userId}`;
    const peer = this.peers.get(peerKey);

    if (!peer) {
      console.log(`No peer found for ${peerKey}`);
      return;
    }

    // Close all transports
    for (const transportId of peer.transports) {
      const transport = this.transports.get(transportId);
      if (transport) {
        transport.close();
        this.transports.delete(transportId);
      }
    }

    // Remove all producers
    for (const producerId of peer.producers) {
      this.producers.delete(producerId);
    }

    // Remove all consumers
    for (const consumerId of peer.consumers) {
      this.consumers.delete(consumerId);
    }

    this.peers.delete(peerKey);
    console.log(`🧹 Cleaned up peer ${userId} from session ${sessionId}`);
  }

  // Clean up entire session
  async cleanupSession(sessionId) {
    const router = this.routers.get(sessionId);
    if (router) {
      router.close();
      this.routers.delete(sessionId);
    }

    // Remove all peers in this session
    const peersToRemove = [];
    for (const [peerKey, peer] of this.peers.entries()) {
      if (peerKey.startsWith(`${sessionId}_`)) {
        peersToRemove.push(peerKey);
      }
    }

    for (const peerKey of peersToRemove) {
      const userId = peerKey.split('_')[1];
      await this.cleanupPeer(sessionId, userId);
    }

    console.log(`🧹 Cleaned up entire session ${sessionId}`);
  }
}

// Export singleton
const mediasoupService = new MediasoupService();
module.exports = mediasoupService;
