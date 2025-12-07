import React from 'react';
import { Activity } from 'lucide-react';
import './PhysicalExamBanner.css';

const PhysicalExamBanner = ({ onNavigate, onDismiss }) => {
  return (
    <div className="physical-exam-banner">
      <div className="physical-exam-banner-content">
        <Activity className="physical-exam-banner-icon" size={24} />
        <div className="physical-exam-banner-text">
          <strong>Physical Examination Available</strong>
          <span>You can perform a physical examination using our interactive tools</span>
        </div>
        <div className="physical-exam-banner-actions">
          <button 
            className="physical-exam-banner-btn primary"
            onClick={onNavigate}
          >
            Go to Physical Exam
          </button>
          <button 
            className="physical-exam-banner-btn secondary"
            onClick={onDismiss}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhysicalExamBanner;


