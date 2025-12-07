import express from 'express';
import axios from 'axios';
import { validationResult } from 'express-validator';
import { validateChatInput } from '../middleware/validation.js';
import { sessionManager } from '../services/session.js';
import { createPersistentSessionManager } from '../services/persistentSession.js';
import { generatePatientResponse, generatePalpationDescription } from '../services/ai.js';
import { generateAudio } from '../services/audio.js';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { PATHS } from '../config/constants.js';
import { getFileByTag } from '../utils/gcsClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// General OPTIONS handler for CORS preflight requests
router.options('*', (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400' // 24 hours
  });
  res.status(200).end();
});

// Initialize session manager - use persistent if AIMMS backend URL is available
const aimmsBackendUrl = process.env.AIMMS_BACKEND_URL || process.env.VITE_BACKEND_URL;
const persistentSessionManager = aimmsBackendUrl ? 
  createPersistentSessionManager(aimmsBackendUrl) : 
  sessionManager;

console.log(`AIMMS_BACKEND_URL: ${process.env.AIMMS_BACKEND_URL}`);
console.log(`VITE_BACKEND_URL: ${process.env.VITE_BACKEND_URL}`);
console.log(`Resolved aimmsBackendUrl: ${aimmsBackendUrl}`);
console.log(`Using ${aimmsBackendUrl ? 'persistent' : 'in-memory'} session manager`);
console.log(`Session manager type: ${persistentSessionManager.constructor.name}`);

// Handle graceful shutdown to sync sessions
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, syncing sessions...');
  if (persistentSessionManager.shutdown) {
    await persistentSessionManager.shutdown();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, syncing sessions...');
  if (persistentSessionManager.shutdown) {
    await persistentSessionManager.shutdown();
  }
  process.exit(0);
});

// Home route
router.get("/", (req, res) => {
  res.json({ status: "Virtual Patient API is Running" });
});

// Health check endpoint for Docker
router.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Function to extract essential content from MCC case data
function extractEssentialContent(mccData) {
  const essentialContent = {
    title: mccData.title,
    sections: []
  };

  if (mccData.content && Array.isArray(mccData.content.sections)) {
    essentialContent.sections = mccData.content.sections.map(section => ({
      name: section.name,
      tables: section.tables.map(table => ({
        name: table.name,
        rows: table.rows.map(row => 
          row.cells.map(cell => {
            // Filter out images and other large content
            let content = cell.content;
            
            // Skip base64 encoded images (data:image/...)
            if (typeof content === 'string' && content.startsWith('data:image/')) {
              return {
                content: '[IMAGE: ' + content.substring(11, content.indexOf(';')) + ']',
                type: cell.type
              };
            }
            
            // Skip very long content (likely encoded data)
            if (typeof content === 'string' && content.length > 1000) {
              return {
                content: '[LARGE_CONTENT: ' + content.substring(0, 100) + '...]',
                type: cell.type
              };
            }
            
            return {
              content: content,
              type: cell.type
            };
          })
        )
      }))
    }));
  }
  return essentialContent;
}

// Initialize session endpoint
router.post("/init-session", async (req, res) => {
  try {
    const { caseToken, backendUrl, caseData, assignmentId } = req.body;
    const authToken = req.headers.authorization;
    let mccData;

    // 1. If caseData is directly provided in the body
    if (caseData) {
      console.log("Using case data provided in request body.");
      console.log("Raw caseData received:", JSON.stringify(caseData, null, 2));
      mccData = extractEssentialContent(caseData);
      console.log("Processed mccData:", JSON.stringify(mccData, null, 2));

    // 2. If caseToken & backendUrl are provided (remote mode)
    } else if (caseToken && backendUrl && authToken) {
      console.log("Fetching case data from external backend.");
      try {
        const baseUrl = backendUrl.replace(/\/token\/?$/, '');
        const url = `${baseUrl}/token/${encodeURIComponent(caseToken)}/content`;

        const response = await axios.get(url, {
          headers: {
            'Accept': 'application/json',
            'Authorization': authToken
          }
        });

        mccData = response.data;
        const essentialContent = extractEssentialContent(mccData);

        if (!essentialContent.sections?.length) {
          return res.status(404).json({ error: "No case content found" });
        }

        mccData = essentialContent;

      } catch (fetchError) {
        console.error(" Error fetching remote case data:", fetchError.message);
        return res.status(500).json({
          error: "Failed to fetch case data",
          details: fetchError.response?.data?.detail || fetchError.message
        });
      }

    // 3. Otherwise, load from local sample JSON file
    } else {
      console.log("No data provided — loading sample_case.json from local.");
      try {
        const sampleCasePath = path.join(__dirname, '..', 'data', 'cases', 'sample_case.json');

        const exists = await fs.access(sampleCasePath)
          .then(() => true)
          .catch(() => false);

        if (!exists) throw new Error(`Sample case file not found at: ${sampleCasePath}`);

        const fileContent = await fs.readFile(sampleCasePath, 'utf8');
        mccData = JSON.parse(fileContent);

      } catch (err) {
        console.error("Failed to load sample case:", err);
        return res.status(500).json({ error: `Failed to load sample case: ${err.message}` });
      }
    }

    // Virtual Patient always generates its own session ID
    const sessionId = randomUUID();
    console.log(`Generated new session ID: ${sessionId}`);
    
    const sessionData = {
      mccData,
      interactions: 0,
      conversationHistory: [],
      assignmentId, // Store assignment ID for later reference
      aimmsBackendUrl: aimmsBackendUrl, // Store AIMMS backend URL for reporting back
      // Store token data with due date for session expiration management
      tokenData: {
        assignment_id: assignmentId,
        case_id: caseData?.case_id,
        expires_at: caseData?.due_date, // Use assignment due date for session expiration
        user_id: caseData?.user_id
      }
    };

    // Store session locally first
    persistentSessionManager.set(sessionId, sessionData);

    // Register session with AIMMS immediately for persistence/resumption
    console.log("assignmentId", assignmentId)
    console.log("aimmsBackendUrl (from env)", aimmsBackendUrl)
    if (assignmentId && aimmsBackendUrl) {
      try {
        console.log(`Registering session ${sessionId} with AIMMS...`);
        const registerResponse = await axios.post(`${aimmsBackendUrl}/api/virtual-patient/register-session`, {
          assignment_id: assignmentId,
          session_id: sessionId,
          user_id: caseData?.user_id
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (registerResponse.data.status === 'success') {
          console.log(`Session ${sessionId} successfully registered with AIMMS`);
          // Store AIMMS session ID for reference
          sessionData.aimmsSessionId = registerResponse.data.aimms_session_id;
          persistentSessionManager.set(sessionId, sessionData);
        } else {
          console.warn(`AIMMS registration returned: ${registerResponse.data.message}`);
        }
      } catch (registerError) {
        console.error(`Failed to register session with AIMMS:`, registerError.message);
        // Continue anyway - session will still work locally
        // AIMMS will create the record when transcript is submitted as fallback
      }
    }

    console.log(`Session ${sessionId} created and ready`);
    return res.status(200).json({ sessionId });

  } catch (error) {
    console.error("Failed to initialize session:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Resume session endpoint
router.post("/resume-session", async (req, res) => {
  try {
    const { sessionId, caseData, assignmentId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    // Check if session already exists in memory or database
    let sessionData = await persistentSessionManager.get(sessionId);
    
    if (sessionData) {
      console.log(`Session ${sessionId} found in memory, resuming...`);
      
      // Convert conversation history to messages format for frontend
      const previousMessages = [];
      if (sessionData.conversationHistory && sessionData.conversationHistory.length > 0) {
        for (const interaction of sessionData.conversationHistory) {
          if (interaction.doctor) {
            previousMessages.push({
              id: `doctor-${interaction.timestamp || Date.now()}`,
              type: 'user',
              content: interaction.doctor
            });
          }
          if (interaction.patient) {
            previousMessages.push({
              id: `patient-${interaction.timestamp || Date.now()}`,
              type: 'assistant',
              content: interaction.patient
            });
          }
        }
      }
      
      return res.status(200).json({
        sessionId,
        mccData: sessionData.mccData,
        interactionCount: sessionData.interactions || 0,
        previousMessages,
        canResume: true
      });
    } else {
      // Session not in memory - create new session from provided data
      console.log(`Session ${sessionId} not in memory. Creating new session...`);
      
      if (!caseData) {
        return res.status(404).json({ 
          error: "Session not found and no case data provided to recreate it" 
        });
      }

      // Extract essential content from case data
      const mccData = extractEssentialContent(caseData);
      
      // Create new session data
      sessionData = {
        mccData,
        interactions: 0,
        conversationHistory: [],
        assignmentId,
        aimmsBackendUrl: aimmsBackendUrl,
        tokenData: {
          assignment_id: assignmentId,
          case_id: caseData.case_id,
          expires_at: caseData.due_date,
          user_id: caseData.user_id
        }
      };

      // Store in session manager
      persistentSessionManager.set(sessionId, sessionData);

      // Note: Don't register with AIMMS here - the session should already exist in AIMMS
      // when resuming. If it doesn't exist, that's an error condition.
      console.log(`Session ${sessionId} recreated in memory from case data`);

      return res.status(200).json({
        sessionId,
        mccData: sessionData.mccData,
        interactionCount: 0,
        previousMessages: [],
        canResume: false // New session created from scratch
      });
    }

  } catch (error) {
    console.error("Error in resume-session:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Chat endpoint with validation
router.post("/chat", validateChatInput, async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userMessage = req.body.message;
    const sessionId = req.body.sessionId;

    if (!sessionId) {
      return res.status(400).json({ error: "No session ID provided" });
    }

    // Get session data
    let sessionData = await persistentSessionManager.get(sessionId);
    if (!sessionData) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Add user message to conversation history
    sessionData.conversationHistory.push({ doctor: userMessage, patient: "" });

    // Add timing logs
    const processStart = Date.now();
    console.log('--- Message processing started ---');
    console.time('AI response time');
    // Generate AI response
    const aiResponse = await generatePatientResponse(sessionData, userMessage);
    console.timeEnd('AI response time');
    console.log('AI response:', aiResponse);
    const afterAI = Date.now();

    // Parse the response
    let message;
    try {
      if (typeof aiResponse === "string") {
        message = JSON.parse(aiResponse);
      } else {
        message = aiResponse;
      }

      if (!message || typeof message !== 'object') {
        console.error("⚠️ OpenAI response is not an object:", message);
        return res.status(500).json({ error: "Invalid AI response format: not an object" });
      }

      if (!message.text || typeof message.text !== 'string') {
        console.error("⚠️ Message missing text field:", message);
        return res.status(500).json({ error: "Invalid AI response format: message missing text field" });
      }

      // Set default animation if missing or invalid
      if (!message.animation || !['Talking', 'Idle', 'Thinking', 'Painful', 'Distressed'].includes(message.animation)) {
        message.animation = 'Talking';
      }
      // Set default facial expression if missing
      message.facialExpression = message.facialExpression || "default";

    } catch (error) {
      console.error("⚠️ Error parsing OpenAI response:", error);
      console.error("Raw response:", aiResponse);
      return res.status(500).json({ error: "Invalid AI response format: parsing error" });
    }

    try {
      console.time('Audio generation (ElevenLabs + WAV)');
      console.log('Generating audio for text:', message.text);

      // Emotion mapping logic
      const emotionMap = {
        'default': 'default',
        'smile': 'happy',
        'sad': 'sad',
        'distressed': 'distressed',
        'painful': 'painful',
        'angry': 'angry',
        'excited': 'excited',
        'thinking': 'thinking',
        'calm': 'calm',
        'happy': 'happy',
        'fearful': 'distressed',
        'surprised': 'excited'
      };
      const audioEmotion = emotionMap[message.facialExpression] || 'default';
      console.log('AI facial expression:', message.facialExpression);
      console.log('Mapped to audio emotion:', audioEmotion);

      // Always use bufferOnly, never save to disk
      const audioResult = await generateAudio(
        message.text,
        sessionData.interactions,
        Date.now(),
        audioEmotion,
        { bufferOnly: true }
      );
      console.timeEnd('Audio generation (ElevenLabs + WAV)');

      // Update the last conversation entry with the patient's response
      if (sessionData.conversationHistory.length > 0) {
        sessionData.conversationHistory[sessionData.conversationHistory.length - 1].patient = message.text;
      }

      // Update session data
      sessionData.interactions++;
      sessionData.conversationHistory[sessionData.conversationHistory.length - 1].patient = message.text;
      console.log(`Updating session ${sessionId} with interaction count: ${sessionData.interactions}, conversation length: ${sessionData.conversationHistory.length}`);
      persistentSessionManager.set(sessionId, sessionData);
      console.log(`Session ${sessionId} update completed`);

      // Send response
      return res.json({
        text: message.text,
        animation: message.animation,
        facialExpression: message.facialExpression,
        audio: `/api/audio?text=${encodeURIComponent(message.text)}&emotion=${encodeURIComponent(audioEmotion)}`
      });

    } catch (error) {
      console.error('Error generating audio:', error);
      return res.status(500).json({ error: "Failed to generate audio" });
    }
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Palpation endpoint
router.post("/palpation", async (req, res) => {
  try {
    const { region, sessionId } = req.body;

    if (!region || !sessionId) {
      return res.status(400).json({ error: "Region and sessionId are required" });
    }

    // Get session data
    const sessionData = await persistentSessionManager.get(sessionId);
    if (!sessionData) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Generate palpation description
    const palpationData = await generatePalpationDescription(sessionData, region);
    console.log("Palpation Response:", palpationData);

    res.json(palpationData);
  } catch (error) {
    console.error("Error handling palpation:", error);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});

// Add new route for body part images (for Unity integration)
router.post('/body-part-image', async (req, res) => {
  try {
    const { region, sessionId } = req.body;
    
    if (!region) {
      return res.status(400).json({ error: 'Region parameter is required' });
    }
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    console.log(`Body part image request - Region: ${region}, Session: ${sessionId}`);
    
    // Normalize region names from Unity format to GCS search format
    const regionMapping = {
      'head': 'head',
      'lefteye': 'left eye',
      'righteye': 'right eye', 
      'face': 'face',
      'chest': 'chest',
      'abdomen': 'abdomen',
      'left_eye': 'left eye',
      'right_eye': 'right eye'
    };
    
    const searchTerm = regionMapping[region];
    
    if (!searchTerm) {
      console.log(`No mapping found for region: ${region}`);
      return res.status(404).json({ error: `Unsupported region: ${region}` });
    }
    
    try {
      // Use GCS client to get authenticated URL
      const gcsFile = await getFileByTag(searchTerm);
      
      if (!gcsFile) {
        console.log(`No GCS file found for search term: ${searchTerm}`);
        return res.status(404).json({ error: `No image found for region: ${region}` });
      }
      
      console.log(`Found GCS file for ${region}: ${gcsFile.name}`);
      console.log(`Returning authenticated URL for ${region}: ${gcsFile.signedUrl}`);
      
      res.json({ 
        imageUrl: gcsFile.signedUrl,
        region,
        sessionId,
        fileName: gcsFile.name,
        contentType: gcsFile.contentType
      });
      
    } catch (gcsError) {
      console.error('GCS error:', gcsError);
      
      // Fallback to authenticated URLs if GCS is not configured
      const fallbackUrlMap = {
        'head': 'https://storage.cloud.google.com/aidset-magic-kingdom-test-bucket/v1%20Olivia%20Hierarchy/Region%20of%20the%20Body/Specific%20Body%20Part/Condition/Modality/Head.jpeg?authuser=4',
        'lefteye': 'https://storage.cloud.google.com/aidset-magic-kingdom-test-bucket/v1%20Olivia%20Hierarchy/Region%20of%20the%20Body/Specific%20Body%20Part/Condition/Modality/LeftEye.jpeg?authuser=4',
        'righteye': 'https://storage.cloud.google.com/aidset-magic-kingdom-test-bucket/v1%20Olivia%20Hierarchy/Region%20of%20the%20Body/Specific%20Body%20Part/Condition/Modality/LeftEye.jpeg?authuser=4', // Use left eye as fallback for right eye
        'face': 'https://storage.cloud.google.com/aidset-magic-kingdom-test-bucket/v1%20Olivia%20Hierarchy/Region%20of%20the%20Body/Specific%20Body%20Part/Condition/Modality/Face.jpeg?authuser=4',
        'chest': 'https://storage.cloud.google.com/aidset-magic-kingdom-test-bucket/v1%20Olivia%20Hierarchy/Region%20of%20the%20Body/Specific%20Body%20Part/Condition/Modality/Chest.jpeg?authuser=4',
        'abdomen': 'https://storage.cloud.google.com/aidset-magic-kingdom-test-bucket/v1%20Olivia%20Hierarchy/Region%20of%20the%20Body/Specific%20Body%20Part/Condition/Modality/Abdomen.jpeg?authuser=4'
      };
      
      const fallbackUrl = fallbackUrlMap[region];
      
      if (!fallbackUrl) {
        return res.status(404).json({ error: `No fallback image found for region: ${region}` });
      }
      
      console.log(`Using fallback URL for ${region}: ${fallbackUrl}`);
      
      res.json({ 
        imageUrl: fallbackUrl,
        region,
        sessionId,
        fallback: true
      });
    }
    
  } catch (error) {
    console.error('Error in /api/body-part-image:', error);
    res.status(500).json({ error: 'Failed to get body part image' });
  }
});

// Get the absolute path to the project root
const PROJECT_ROOT = path.resolve(process.cwd());

// Add new route for deleting audio files
router.delete('/delete-audio/*', async (req, res) => {
  try {
    const audioPath = req.path.replace('/delete-audio', '');
    const fullPath = path.join(PROJECT_ROOT, PATHS.AUDIO_DIR, path.basename(audioPath));
    
    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch (error) {
      return res.status(404).json({ error: 'Audio file not found' });
    }

    // Delete the file
    await fs.unlink(fullPath);
    res.status(200).json({ message: 'Audio file deleted successfully' });
  } catch (error) {
    console.error('Error deleting audio file:', error);
    res.status(500).json({ error: 'Failed to delete audio file' });
  }
});

// Add new route for session end/logout
router.post("/end-session", async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    // Get session data
    const sessionData = await persistentSessionManager.get(sessionId);
    if (!sessionData) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Force immediate save to database
    if (persistentSessionManager.forceSync) {
      await persistentSessionManager.forceSync(sessionId);
    }

    console.log(`Session ${sessionId} ended and synced to database`);

    res.json({
      status: "success",
      message: "Session ended and conversation saved",
      sessionId: sessionId
    });

  } catch (error) {
    console.error("Error ending session:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- In-memory TTS audio streaming endpoint ---
// Example usage on frontend:
//   const audio = new Audio('/api/audio?text=Hello%20world');
//   audio.play();
router.get('/audio', async (req, res) => {
  try {
    const { text } = req.query;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Missing or invalid text parameter' });
    }
    // Accept emotion param and always use bufferOnly
    const emotion = req.query.emotion || 'default';
    const audioResult = await generateAudio(text, 0, Date.now(), emotion, { bufferOnly: true });
    // audioResult should contain a Buffer (wavData) and mime type
    // If generateAudio returns a stream, pipe it directly
    if (audioResult.audioStream) {
      res.set({
        'Content-Type': 'audio/wav',
        'Content-Disposition': 'inline; filename="tts.wav"'
      });
      return audioResult.audioStream.pipe(res);
    }
    // If generateAudio returns a buffer
    if (audioResult.audioBuffer) {
      res.set({
        'Content-Type': 'audio/wav',
        'Content-Length': audioResult.audioBuffer.length,
        'Content-Disposition': 'inline; filename="tts.wav"'
      });
      return res.send(audioResult.audioBuffer);
    }
    // Fallback: error
    return res.status(500).json({ error: 'Failed to generate audio buffer' });
  } catch (error) {
    console.error('Error in /api/audio:', error);
    res.status(500).json({ error: 'Failed to generate audio' });
  }
});

// Add proxy endpoint for serving images without CORS issues
router.get('/proxy-image/:region', async (req, res) => {
  // Set CORS headers specifically for this endpoint
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400' // 24 hours
  });
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { region } = req.params;
    
    if (!region) {
      return res.status(400).json({ error: 'Region parameter is required' });
    }
    
    console.log(`Proxy image request - Region: ${region}`);
    
    // Normalize region names from Unity format to GCS search format
    const regionMapping = {
      'head': 'head',
      'lefteye': 'left eye',
      'righteye': 'right eye', 
      'face': 'face',
      'chest': 'chest',
      'abdomen': 'abdomen',
      'left_eye': 'left eye',
      'right_eye': 'right eye'
    };
    
    const searchTerm = regionMapping[region];
    
    if (!searchTerm) {
      console.log(`No mapping found for region: ${region}`);
      return res.status(404).json({ error: `Unsupported region: ${region}` });
    }
    
    try {
      // Use GCS client to get authenticated URL
      const gcsFile = await getFileByTag(searchTerm);
      
      if (!gcsFile) {
        console.log(`No GCS file found for search term: ${searchTerm}`);
        return res.status(404).json({ error: `No image found for region: ${region}` });
      }
      
      // Fetch the image from GCS and serve it directly
      const imageResponse = await axios.get(gcsFile.signedUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Virtual-Patient-Backend/1.0'
        }
      });
      
      // Set appropriate headers for image serving
      res.set({
        'Content-Type': gcsFile.contentType || 'image/jpeg',
        'Content-Length': imageResponse.data.length,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*', // Allow CORS
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      
      console.log(`Serving proxied image for ${region}: ${gcsFile.name}`);
      res.send(imageResponse.data);
      
    } catch (gcsError) {
      console.error('GCS error:', gcsError);
      
      // Fallback to hardcoded authenticated URLs
      const fallbackUrlMap = {
        'head': 'https://storage.cloud.google.com/aidset-magic-kingdom-test-bucket/v1%20Olivia%20Hierarchy/Region%20of%20the%20Body/Specific%20Body%20Part/Condition/Modality/Head.jpeg?authuser=4',
        'lefteye': 'https://storage.cloud.google.com/aidset-magic-kingdom-test-bucket/v1%20Olivia%20Hierarchy/Region%20of%20the%20Body/Specific%20Body%20Part/Condition/Modality/LeftEye.jpeg?authuser=4',
        'righteye': 'https://storage.cloud.google.com/aidset-magic-kingdom-test-bucket/v1%20Olivia%20Hierarchy/Region%20of%20the%20Body/Specific%20Body%20Part/Condition/Modality/RightEye.jpeg?authuser=4',
        'face': 'https://storage.cloud.google.com/aidset-magic-kingdom-test-bucket/v1%20Olivia%20Hierarchy/Region%20of%20the%20Body/Specific%20Body%20Part/Condition/Modality/Face.jpeg?authuser=4',
        'chest': 'https://storage.cloud.google.com/aidset-magic-kingdom-test-bucket/v1%20Olivia%20Hierarchy/Region%20of%20the%20Body/Specific%20Body%20Part/Condition/Modality/Chest.jpeg?authuser=4',
        'abdomen': 'https://storage.cloud.google.com/aidset-magic-kingdom-test-bucket/v1%20Olivia%20Hierarchy/Region%20of%20the%20Body/Specific%20Body%20Part/Condition/Modality/Abdomen.jpeg?authuser=4'
      };
      
      const fallbackUrl = fallbackUrlMap[region];
      
      if (!fallbackUrl) {
        return res.status(404).json({ error: `No fallback image found for region: ${region}` });
      }
      
      try {
        // Fetch fallback image
        const fallbackResponse = await axios.get(fallbackUrl, {
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'Virtual-Patient-Backend/1.0'
          }
        });
        
        res.set({
          'Content-Type': 'image/jpeg',
          'Content-Length': fallbackResponse.data.length,
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type'
        });
        
        console.log(`Serving fallback image for ${region}`);
        res.send(fallbackResponse.data);
        
      } catch (fallbackError) {
        console.error('Fallback image fetch failed:', fallbackError);
        res.status(500).json({ error: 'Failed to fetch image' });
      }
    }
    
  } catch (error) {
    console.error('Error in /api/proxy-image/:region:', error);
    res.status(500).json({ error: 'Failed to proxy image' });
  }
});

// Add OPTIONS handler for proxy-image endpoint
router.options('/proxy-image/:region', (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400' // 24 hours
  });
  res.status(200).end();
});

// Get sample case for admin case creation
router.get('/sample-case', async (req, res) => {
  try {
    const sampleCasePath = path.join(__dirname, '..', 'data', 'cases', 'sample_case.json');
    
    const exists = await fs.access(sampleCasePath)
      .then(() => true)
      .catch(() => false);

    if (!exists) {
      return res.status(404).json({ error: 'Sample case not found' });
    }

    const fileContent = await fs.readFile(sampleCasePath, 'utf8');
    const sampleCase = JSON.parse(fileContent);

    res.json(sampleCase);
  } catch (error) {
    console.error('Error loading sample case:', error);
    res.status(500).json({ error: 'Failed to load sample case' });
  }
});

export default router;
