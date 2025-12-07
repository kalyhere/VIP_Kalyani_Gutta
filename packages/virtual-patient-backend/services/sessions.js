// Map to store session details
const sessions = new Map();

export function createSession(caseData) {
  const sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  sessions.set(sessionId, {
    caseData,
    createdAt: new Date(),
    interactions: 0,
    conversationHistory: []
  });
  
  return sessionId;
}

export function getSession(sessionId) {
  return sessions.get(sessionId);
}

export function updateSession(sessionId, message, response) {
  const session = sessions.get(sessionId);
  if (session) {
    session.interactions += 1;
    session.conversationHistory.push({ user: message, assistant: response });
  }
}

export default {
  createSession,
  getSession,
  updateSession
}; 