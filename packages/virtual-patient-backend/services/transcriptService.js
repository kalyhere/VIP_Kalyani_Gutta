import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TranscriptService {
    constructor() {
        this.transcriptsDir = path.join(__dirname, '../data/transcripts');
        this.testTranscriptsDir = path.join(__dirname, '../data/test_transcripts');
        this.aimmsApiUrl = process.env.AIMMS_API_URL || 'http://localhost:8000';
    }

    async formatConversation(conversation) {
        // Log the conversation structure
        console.log('Raw conversation:', JSON.stringify(conversation, null, 2));
        
        if (!Array.isArray(conversation)) {
            console.error('Conversation is not an array:', typeof conversation);
            throw new Error('Invalid conversation format: expected an array');
        }

        // Format conversation into AIMHEI-compatible format
        const formatted = conversation.map(msg => {
            if (!msg || typeof msg !== 'object') {
                console.error('Invalid message format:', msg);
                throw new Error('Invalid message format');
            }

            // Handle different message formats - check for multiple possible properties
            let sender, text;
            
            // Try to get sender from different possible properties
            if (msg.sender) {
                sender = msg.sender;
            } else if (msg.speaker) {
                // Convert speaker format to sender format
                sender = msg.speaker === 'doctor' ? 'user' : 'bot';
            } else {
                console.error('Message missing sender/speaker:', msg);
                throw new Error('Message missing sender information');
            }
            
            // Try to get text from different possible properties
            if (msg.text) {
                text = msg.text;
            } else if (msg.message) {
                text = msg.message;
            } else if (msg.content) {
                text = msg.content;
            } else {
                console.error('Message missing text content:', msg);
                text = '';
            }
            
            if (!text) {
                console.warn('Message has empty text content:', msg);
            }

            return { sender, text };
        });

        console.log('Formatted transcript:', formatted);
        return formatted;
    }

    async submitTestTranscript(sessionId) {
        try {
            // Read the test transcript
            const testTranscriptPath = path.join(this.testTranscriptsDir, 'AIMHEI_transcript01.txt');
            const transcriptContent = await fs.readFile(testTranscriptPath, 'utf-8');

            // Submit to AIMHEI
            console.log('Submitting test transcript to AIMMS backend:', `${this.aimmsApiUrl}/api/transcripts/submit-virtual-patient`);
            
            const requestData = {
                transcript: transcriptContent
            };

            console.log('Submitting transcript content:', requestData.transcript);

            const response = await fetch(`${this.aimmsApiUrl}/api/transcripts/submit-virtual-patient`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('AIMHEI error response:', errorText);
                throw new Error(`AIMHEI submission failed: ${response.statusText}. Details: ${JSON.parse(errorText)}`);
            }

            const result = await response.json();
            console.log('Successfully submitted transcript to AIMHEI:', result);

            return {
                status: 'PENDING',
                message: 'Test transcript submission started',
                reportId: result.report_id
            };
        } catch (error) {
            console.error('Error in test transcript submission:', error);
            throw error;
        }
    }

    async submitToAIMHEI(conversation, sessionId) {
        try {
            // Format the conversation
            const formattedConversation = await this.formatConversation(conversation);

            // Submit to AIMHEI
            console.log('Submitting to AIMMS backend:', `${this.aimmsApiUrl}/api/transcripts/submit-virtual-patient`);
            
            const requestData = {
                session_id: sessionId,
                conversation: formattedConversation
            };

            console.log('Submitting request data:', JSON.stringify(requestData, null, 2));

            const response = await fetch(`${this.aimmsApiUrl}/api/transcripts/submit-virtual-patient`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('AIMHEI error response:', errorText);
                throw new Error(`AIMHEI submission failed: ${response.statusText}. Details: ${errorText}`);
            }

            const result = await response.json();
            console.log('Successfully submitted to AIMHEI:', result);

            return {
                status: 'PENDING',
                message: 'Submission started',
                reportId: result.report_id
            };
        } catch (error) {
            console.error('Error in AIMHEI submission:', error);
            throw error;
        }
    }
}

export default new TranscriptService(); 