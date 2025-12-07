import React, { useState } from 'react';
import { getApiUrl } from '../utils/api.js';

const EndSessionButton = ({ onEndSession, conversation, sessionId, disabled }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleEndSession = async () => {
        // This button should only be shown when there's conversation, but double-check
        const userMessages = conversation.filter(msg => msg.sender === 'user');
        
        if (userMessages.length === 0) {
            setError("No conversation to submit for grading.");
            return;
        }
        
        if (!window.confirm('Submit this conversation for final grading? You will not be able to continue this session after submission.')) {
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Call the parent's handler to do the actual submission
            await onEndSession({ status: 'submitted' });
        } catch (error) {
            setError('Failed to submit conversation');
            console.error('Error submitting:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="end-session-container">
            <button
                className={`end-session-button ${isSubmitting ? 'submitting' : ''}`}
                onClick={handleEndSession}
                disabled={disabled || isSubmitting}
            >
                {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
            {error && <div className="error-message">{error}</div>}
            <style jsx>{`
                .end-session-container {
                    display: inline-block;
                }

                .end-session-button {
                    background-color: var(--ua-arizona-red);
                    color: var(--ua-white);
                    border: 1px solid var(--ua-slate-200);
                    padding: 8px 18px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    min-width: 80px;
                }

                .end-session-button:hover:not(:disabled) {
                    background-color: var(--ua-chili);
                    transform: translateY(-1px);
                    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
                }

                .end-session-button:active:not(:disabled) {
                    transform: translateY(0);
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                }

                .end-session-button:disabled {
                    background-color: var(--ua-slate-100);
                    color: var(--ua-slate-400);
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }

                .end-session-button.submitting {
                    background-color: var(--ua-slate-400);
                    cursor: wait;
                    transform: none;
                }

                .error-message {
                    color: #B08968;
                    margin-top: 8px;
                    font-size: 12px;
                    text-align: center;
                }
            `}</style>
        </div>
    );
};

export default EndSessionButton; 