import express from 'express';
import transcriptService from '../services/transcriptService.js';

const router = express.Router();

// Submit test transcript for AIMHEI grading
router.post('/submit-test-transcript', async (req, res) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({ 
                error: 'Missing required field: sessionId' 
            });
        }

        // Submit test transcript to AIMHEI
        const result = await transcriptService.submitTestTranscript(sessionId);

        res.json({
            success: true,
            reportId: result.reportId,
            status: result.status,
            message: result.message
        });
    } catch (error) {
        console.error('Error in test transcript submission:', error);
        res.status(500).json({
            error: 'Failed to process test transcript submission',
            details: error.message
        });
    }
});

// Track submissions to prevent duplicates
const submissionTracker = new Map();

// Submit conversation for AIMHEI grading
router.post('/submit-to-aimhei', async (req, res) => {
    let sessionId; // Declare outside try block so it's available in catch
    
    try {
        const { sessionId: reqSessionId, conversation } = req.body;
        sessionId = reqSessionId; // Assign to outer scope variable

        if (!sessionId || !conversation) {
            return res.status(400).json({ 
                error: 'Missing required fields: sessionId and conversation' 
            });
        }

        // Check if this session is already being submitted
        if (submissionTracker.has(sessionId)) {
            return res.status(409).json({
                error: 'Submission already in progress for this session',
                sessionId: sessionId
            });
        }

        // Mark this session as being submitted
        submissionTracker.set(sessionId, Date.now());

        // Submit conversation to AIMHEI
        const result = await transcriptService.submitToAIMHEI(conversation, sessionId);
        
        // Clear the submission tracker on success
        submissionTracker.delete(sessionId);
        
        res.json({
            success: true,
            reportId: result.reportId,
            status: result.status,
            message: result.message
        });
    } catch (error) {
        // Clear the submission tracker on error (sessionId is now available)
        if (sessionId) {
            submissionTracker.delete(sessionId);
        }
        
        console.error('Error in transcript submission:', error);
        res.status(500).json({
            error: 'Failed to process transcript submission',
            details: error.message
        });
    }
});

// Get grading status
router.get('/grading-status/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const response = await fetch(`${transcriptService.aimmsApiUrl}/api/transcripts/status/${sessionId}`);
        const result = await response.json();
        
        res.json({
            sessionId: result.session_id,
            status: result.status,
            reportId: result.report_id
        });
    } catch (error) {
        console.error('Error fetching grading status:', error);
        res.status(500).json({
            error: 'Failed to fetch grading status',
            details: error.message
        });
    }
});

export default router; 