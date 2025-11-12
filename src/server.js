require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const http = require('http');
const socketIo = require('socket.io');
const rateLimit = require('express-rate-limit');

const db = require('./config/database');
// Optional: auto-run migrations on first boot if core tables are missing
const runComprehensiveMigration = require('./database/comprehensive-migration');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');
const socketHandler = require('./socket/socketHandler');
const mediasoupService = require('./services/mediasoupService');

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const path = require('path');
const fs = require('fs');

// Normalize socket CORS origins: allow comma-separated lists in env vars and trim spaces
const socketAllowedOrigins = (process.env.SOCKET_CORS_ORIGIN || process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

console.log('🔒 Socket allowed origins:', socketAllowedOrigins);

const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (socketAllowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: process.env.NODE_ENV === 'production'
}));

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

console.log('🔒 Express allowed origins:', allowedOrigins);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure uploads directory exists and serve it as static
const uploadsPath = path.join(__dirname, '..', 'uploads');
try {
  if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
  const profilesPath = path.join(uploadsPath, 'profiles');
  if (!fs.existsSync(profilesPath)) fs.mkdirSync(profilesPath, { recursive: true });
} catch (e) {
  console.warn('Could not ensure uploads directory exists:', e.message);
}

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Rate limiting
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60,
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000000,
//   message: 'Too many requests from this IP, please try again later.',
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use('/api/', limiter);

// Trust proxy for accurate IP tracking behind reverse proxies
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Health check (no rate limit)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'RESCULANCE API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use(`/api/${process.env.API_VERSION || 'v1'}`, routes);

// Socket.IO initialization
socketHandler(io);

// Make io accessible to routes
app.set('io', io);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

// Database connection, ensure schema, and server start
db.getConnection()
  .then(async (connection) => {
    console.log('✅ Database connected successfully');

    try {
      // Check if core table exists; if not, run migrations once
      const [rows] = await connection.query(
        `SELECT COUNT(*) as cnt FROM information_schema.tables 
         WHERE table_schema = DATABASE() AND table_name = 'users'`
      );
      const hasUsersTable = rows?.[0]?.cnt > 0;

      if (!hasUsersTable) {
        console.warn('⚠️  Core table "users" not found. Running migrations now...');
        await runComprehensiveMigration();
        console.log('✅ Migrations completed at startup');
      }
    } catch (checkErr) {
      console.error('❌ Failed while checking/running migrations at startup:', checkErr.message);
      console.error('Please run: make db-setup (or npm run db:setup) and restart.');
      process.exit(1);
    } finally {
      connection.release();
    }

    // Initialize mediasoup worker
    try {
      await mediasoupService.initialize();
      console.log('✅ Mediasoup service initialized');
    } catch (mediasoupErr) {
      console.error('❌ Failed to initialize mediasoup:', mediasoupErr.message);
      console.error('Video calls will not work properly. Consider restarting the server.');
    }

    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api/${process.env.API_VERSION || 'v1'}`);
    });
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    db.end();
  });
});

module.exports = { app, io };
