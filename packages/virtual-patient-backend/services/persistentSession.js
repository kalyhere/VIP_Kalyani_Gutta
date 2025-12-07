import { SessionManager } from './session.js';
import fetch from 'node-fetch';

export class PersistentSessionManager extends SessionManager {
  constructor(aimmsBackendUrl) {
    super();
    this.aimmsBackendUrl = aimmsBackendUrl;
    this.saveTimeout = new Map(); // Track pending saves to avoid too frequent DB calls
    this.saveDelay = 2000; // 2 seconds delay for batching saves
  }

  async get(sessionId) {
    // First try to get from memory
    let sessionData = super.get(sessionId);
    
    if (sessionData) {
      // Update last activity when session is accessed
      sessionData.lastActivity = Date.now();
      sessionData.lastAccessed = Date.now();
      
      // Schedule a lightweight activity update to database
      this.updateSessionActivity(sessionId);
      
      return sessionData;
    }

    // If not in memory, try to load from database
    try {
      console.log(`Session ${sessionId} not in memory, attempting to load from database...`);
      sessionData = await this.loadSessionFromDatabase(sessionId);
      
      if (sessionData) {
        // Store in memory for future access
        super.set(sessionId, sessionData);
        console.log(`Session ${sessionId} loaded from database and cached in memory`);
        
        // Update activity on first load
        this.updateSessionActivity(sessionId);
        
        return sessionData;
      }
    } catch (error) {
      console.error(`Error loading session from database: ${error.message}`);
    }

    return null;
  }

  set(sessionId, data) {
    // Store in memory first
    super.set(sessionId, data);
    
    // Schedule database save (debounced)
    this.scheduleDataBaseSave(sessionId, data);
  }

  scheduleDataBaseSave(sessionId, data) {
    // Clear existing timeout for this session
    if (this.saveTimeout.has(sessionId)) {
      clearTimeout(this.saveTimeout.get(sessionId));
    }

    // Schedule new save
    const timeout = setTimeout(async () => {
      try {
        await this.saveSessionToDatabase(sessionId, data);
        this.saveTimeout.delete(sessionId);
      } catch (error) {
        console.error(`Error saving session ${sessionId} to database: ${error.message}`);
      }
    }, this.saveDelay);

    this.saveTimeout.set(sessionId, timeout);
  }

  async saveSessionToDatabase(sessionId, sessionData) {
    if (!this.aimmsBackendUrl) {
      console.warn('AIMMS backend URL not configured, skipping database save');
      return;
    }

    try {
      // Use the update-session-data endpoint instead of save-conversation
      // to ensure last_activity is also updated
      const response = await fetch(`${this.aimmsBackendUrl}/api/virtual-patient/update-session-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: sessionId,
          conversation_history: sessionData.conversationHistory || [],
          interaction_count: sessionData.interactions || 0,
          status: 'ACTIVE' // Update status to active when saving
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Database save failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`Session ${sessionId} saved to database: ${sessionData.conversationHistory?.length || 0} conversation exchanges, interaction_count: ${sessionData.interactions || 0}`);
      console.log(`Session update details:`, {
        sessionId,
        conversationCount: sessionData.conversationHistory?.length || 0,
        interactionCount: sessionData.interactions || 0,
        lastActivity: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Failed to save session ${sessionId} to database:`, error.message);
      throw error;
    }
  }

  async loadSessionFromDatabase(sessionId) {
    if (!this.aimmsBackendUrl) {
      console.warn('AIMMS backend URL not configured, cannot load from database');
      return null;
    }

    try {
      // Use internal endpoint for service-to-service calls (no auth required)
      const response = await fetch(`${this.aimmsBackendUrl}/api/virtual-patient/conversation-history-internal/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 404) {
        console.log(`Session ${sessionId} not found in database`);
        return null;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Database load failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      // Convert database format back to session format
      const sessionData = {
        conversationHistory: result.conversation_history || [],
        interactions: result.interaction_count || 0,
        lastAccessed: Date.now(),
        created: Date.now(),
        // Get case data from medical case content (instead of storing redundantly)
        mccData: result.case_data || {},
        assignmentId: result.assignment_id,
        aimmsBackendUrl: this.aimmsBackendUrl,
        tokenData: {},  // Initialize empty, will be set when needed
        expiresAt: result.expires_at ? new Date(result.expires_at) : null,  // Computed from assignment.due_date
        lastActivity: Date.now()
      };

      console.log(`Loaded session ${sessionId} from database with ${result.conversation_history?.length || 0} conversation entries`);
      return sessionData;

    } catch (error) {
      console.error(`Failed to load session ${sessionId} from database:`, error.message);
      return null;
    }
  }

  async updateConversationMessage(sessionId, speaker, message, sequenceNumber, messageMetadata = null) {
    if (!this.aimmsBackendUrl) {
      return;
    }

    try {
      await fetch(`${this.aimmsBackendUrl}/api/virtual-patient/update-session-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: sessionId,
          new_message: {
            speaker: speaker,
            message: message,
            sequence_number: sequenceNumber,
            message_metadata: messageMetadata
          }
        })
      });
    } catch (error) {
      console.error(`Failed to update conversation message in database: ${error.message}`);
      // Don't throw - this is just persistence, memory operation should still work
    }
  }

  async forceSync(sessionId) {
    // Force immediate save to database
    const sessionData = super.get(sessionId);
    if (sessionData) {
      // Clear any pending timeout for this session
      if (this.saveTimeout.has(sessionId)) {
        clearTimeout(this.saveTimeout.get(sessionId));
        this.saveTimeout.delete(sessionId);
      }
      
      // Clear any pending activity timeout for this session
      const activityTimeoutKey = `activity_${sessionId}`;
      if (this.saveTimeout.has(activityTimeoutKey)) {
        clearTimeout(this.saveTimeout.get(activityTimeoutKey));
        this.saveTimeout.delete(activityTimeoutKey);
      }
      
      await this.saveSessionToDatabase(sessionId, sessionData);
    }
  }

  async shutdown() {
    // Force sync all pending sessions before shutdown
    console.log('Syncing all sessions to database before shutdown...');
    const syncPromises = [];
    
    // Clear all timeouts first
    for (const [key, timeout] of this.saveTimeout.entries()) {
      clearTimeout(timeout);
    }
    this.saveTimeout.clear();
    
    // Then sync all sessions
    for (const [sessionId] of this.sessions.entries()) {
      syncPromises.push(this.forceSync(sessionId));
    }
    
    await Promise.all(syncPromises);
    console.log('All sessions synced to database');
  }

  updateSessionActivity(sessionId) {
    // Lightweight activity update - don't wait for it to complete
    // and don't update conversation history, just the activity timestamp
    if (!this.aimmsBackendUrl) {
      return;
    }

    // Use a very short timeout to avoid spamming the database
    const activityTimeout = 10000; // 10 seconds
    const timeoutKey = `activity_${sessionId}`;
    
    // Clear existing activity timeout
    if (this.saveTimeout.has(timeoutKey)) {
      clearTimeout(this.saveTimeout.get(timeoutKey));
    }

    // Schedule activity update
    const timeout = setTimeout(async () => {
      try {
        await fetch(`${this.aimmsBackendUrl}/api/virtual-patient/update-session-data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            session_id: sessionId,
            status: 'ACTIVE'
            // Only update status and timestamp, don't send conversation history
          })
        });
        this.saveTimeout.delete(timeoutKey);
      } catch (error) {
        console.error(`Error updating session activity for ${sessionId}:`, error.message);
        this.saveTimeout.delete(timeoutKey);
      }
    }, activityTimeout);

    this.saveTimeout.set(timeoutKey, timeout);
  }
}

export const createPersistentSessionManager = (aimmsBackendUrl) => {
  return new PersistentSessionManager(aimmsBackendUrl);
}; 