export const ALLOWED_ORIGINS = [
  'http://localhost:3000',   // VP backend
  'http://localhost:5173',   // aimms-web-frontend
  'http://localhost:5174',   // VP frontend (Unity)
  'http://127.0.0.1:3000',  // Alternative VP backend localhost
  'http://127.0.0.1:5173',  // Alternative aimms-web-frontend localhost
  'http://127.0.0.1:5174',   // Alternative VP frontend localhost
  'https://virtual-patient-frontend-7qak449u4-uaaidset-4275s-projects.vercel.app/' // Deployed frontend
];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_MESSAGE_LENGTH = 1000;
export const MAX_SESSIONS = 1000;
export const MAX_REQUEST_SIZE = '1mb';
export const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour
export const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
export const RATE_LIMIT_MAX = 100; // requests per window
export const SESSION_CLEANUP_INTERVAL = 15 * 60 * 1000; // 15 minutes

export const PATHS = {
  AUDIO_DIR: 'audios',
  RHUBARB_BIN: 'bin/Rhubarb-Lip-Sync-1.14.0-macOS/rhubarb'
}; 