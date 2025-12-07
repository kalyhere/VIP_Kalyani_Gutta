import { MAX_SESSIONS, SESSION_TIMEOUT, SESSION_CLEANUP_INTERVAL, MAX_MESSAGE_LENGTH } from '../config/constants.js';

export class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.maxSessions = MAX_SESSIONS;
    this.sessionTimeout = SESSION_TIMEOUT;
    this.setupCleanupInterval();
  }

  setupCleanupInterval() {
    setInterval(() => this.cleanup(), SESSION_CLEANUP_INTERVAL);
  }

  get(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      // Check if session has assignment due date info
      if (session.tokenData && session.tokenData.expires_at) {
        const expiresAt = new Date(session.tokenData.expires_at);
        if (Date.now() > expiresAt.getTime()) {
          console.log(`Session ${sessionId} expired based on assignment due date`);
          this.sessions.delete(sessionId);
          return null;
        }
      }
      // If no due date, don't expire based on time - only manual cleanup
      session.lastAccessed = Date.now();
    }
    return session;
  }

  set(sessionId, data) {
    // Validate session ID format
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(sessionId)) {
      throw new Error('Invalid session ID format');
    }

    if (this.sessions.size >= this.maxSessions) {
      // Remove oldest session
      let oldest = [...this.sessions.entries()]
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)[0];
      if (oldest) {
        this.sessions.delete(oldest[0]);
      }
    }

    // Sanitize and validate data before storing
    const sanitizedData = {
      ...data,
      lastAccessed: Date.now(),
      lastActivity: Date.now(),
      created: data.created || Date.now(),
      disease: this.sanitizeString(data.disease),
      patientName: this.sanitizeString(data.patientName),
      interactions: Number(data.interactions) || 0,
      conversationHistory: Array.isArray(data.conversationHistory) ? 
        data.conversationHistory.map(entry => ({
          doctor: this.sanitizeString(entry.doctor),
          patient: this.sanitizeString(entry.patient)
        })) : [],
      tokenData: data.tokenData
    };

    this.sessions.set(sessionId, sanitizedData);
  }

  sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.slice(0, MAX_MESSAGE_LENGTH).trim()
      .replace(/[<>]/g, ''); // Basic XSS prevention
  }

  cleanup() {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      // Only remove sessions that have expired based on assignment due date
      if (session.tokenData && session.tokenData.expires_at) {
        const expiresAt = new Date(session.tokenData.expires_at);
        if (now > expiresAt.getTime()) {
          this.sessions.delete(id);
          console.log(`Session ${id} expired and removed (assignment past due)`);
        }
      }
      // Don't remove sessions without due dates - they remain valid
    }
  }

  createSession(sessionId, caseData, tokenData) {
    if (this.sessions.size >= this.maxSessions) {
      throw new Error('Maximum number of sessions reached');
    }

    if (!this.isValidSessionId(sessionId)) {
      throw new Error('Invalid session ID format');
    }

    const session = {
      id: sessionId,
      caseData: this.sanitizeData(caseData),
      tokenData: tokenData,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      messageCount: 0,
      context: []
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  validateSession(sessionId, caseId) {
    const session = this.get(sessionId);
    if (!session) return false;
    
    // Check if the case ID matches the one in the token
    if (session.tokenData && session.tokenData.case_id !== caseId) {
      return false;
    }
    
    return true;
  }
}

export const sessionManager = new SessionManager(); 