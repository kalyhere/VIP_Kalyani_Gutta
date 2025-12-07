import React from 'react';

const CloseButton = ({ disabled }) => {
    const handleClose = () => {
        const aimmsfront = import.meta.env.VITE_AIMMS_FRONTEND;
        window.location.href = `${aimmsfront}/student-dashboard`;
    };

    return (
        <button
            className="close-button"
            onClick={handleClose}
            disabled={disabled}
        >
            Close
            <style jsx>{`
                .close-button {
                    background-color: var(--ua-cool-gray);
                    color: var(--ua-midnight);
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

                .close-button:hover:not(:disabled) {
                    background-color: var(--ua-slate-200);
                    transform: translateY(-1px);
                    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
                }

                .close-button:active:not(:disabled) {
                    transform: translateY(0);
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                }

                .close-button:disabled {
                    background-color: var(--ua-slate-100);
                    color: var(--ua-slate-400);
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }
            `}</style>
        </button>
    );
};

export default CloseButton; 