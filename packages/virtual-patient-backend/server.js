// Main entry point for Virtual Patient Backend
// Keep business logic in services/, routes/, and middleware/ for maintainability.
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import { config } from 'dotenv';
import helmet from 'helmet';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import apiRoutes from './routes/api.js';
import transcriptRoutes from './routes/transcriptRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5174';

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
      mediaSrc: ["'self'", "data:", "blob:", "https:", "http:"],
      connectSrc: ["'self'", "https:", "http:"],
    },
  }
}));
app.use(hpp());

// Rate limiting
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
const allowedOrigins = [
  'http://localhost:5174',  // Virtual Patient frontend (Unity)
  'http://localhost:3001',
  'http://localhost:5173',  // Alternative frontend port
  'https://virtual-patient-frontend.vercel.app',
  'https://virtual-patient-frontend-uaaidset-4275s-projects.vercel.app',
  CORS_ORIGIN // Keep the environment variable as fallback
].filter(Boolean); // Remove any undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin matches any allowed origin or follows Vercel pattern
    const isAllowed = allowedOrigins.some(allowedOrigin => origin === allowedOrigin) ||
                     origin.match(/^https:\/\/virtual-patient-frontend-.*\.vercel\.app$/);
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS rejected origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '50mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_FILE_SIZE || '50mb' }));

// Serve audio files with CORS headers
app.use('/audio', (req, res, next) => {
  const origin = req.get('Origin');
  const isAllowed = allowedOrigins.some(allowedOrigin => origin === allowedOrigin) ||
                   (origin && origin.match(/^https:\/\/virtual-patient-frontend-.*\.vercel\.app$/));
  
  if (isAllowed || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static(path.join(__dirname, 'audios')));

// API routes
app.use('/api', apiRoutes);
app.use('/api/transcripts', transcriptRoutes);
app.use('/api/media', mediaRoutes);

// API status endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Virtual Patient Backend API',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    endpoints: {
      session: 'POST /api/init-session',
      chat: 'POST /api/chat',
      palpation: 'POST /api/palpation',
      audio: 'DELETE /api/delete-audio/*',
      transcripts: 'POST /api/transcripts/submit-to-aimhei',
      media: {
        'get by tag': 'GET /api/media/:tag',
        'get all files': 'GET /api/media',
        'get available tags': 'GET /api/media/tags/available',
        'get files by tag': 'GET /api/media/tags/:tag/files'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

console.log('👀 GCS_BUCKET_NAME:', process.env.GCS_BUCKET_NAME);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Virtual Patient listening on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 