import React, { useState, useEffect } from 'react';
import { Stethoscope, X, ArrowRight } from 'lucide-react';

/**
 * Physical Examination Prompt Component
 * 
 * Shows a notification when physical examination keywords are detected
 * in the conversation, prompting the doctor to switch to physical exam mode.
 */

const PhysicalExamPrompt = ({ 
  isVisible, 
  message, 
  category, 
  onSwitchToPhysicalExam, 
  onDismiss, 
  autoHide = true,
  autoHideDelay = 8000 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Handle auto-hide functionality
  useEffect(() => {
    if (isVisible && autoHide && !isHovered) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoHide, isHovered, autoHideDelay, onDismiss]);

  // Handle animation state
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div 
      className={`physical-exam-prompt ${isAnimating ? 'animate-in' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        maxWidth: '400px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        zIndex: 3000,
        transform: isAnimating ? 'translateX(100%)' : 'translateX(0)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        pointerEvents: 'auto'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Stethoscope size={20} />
          <span style={{
            fontWeight: '600',
            fontSize: '16px'
          }}>
            Physical Examination Suggested
          </span>
        </div>
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.8,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.opacity = '1'}
          onMouseLeave={(e) => e.target.style.opacity = '0.8'}
        >
          <X size={16} />
        </button>
      </div>

      {/* Message */}
      <div style={{
        marginBottom: '16px',
        fontSize: '14px',
        lineHeight: '1.5',
        opacity: 0.95
      }}>
        {message}
      </div>

      {/* Category indicator */}
      {category && (
        <div style={{
          fontSize: '12px',
          opacity: 0.8,
          marginBottom: '16px',
          textTransform: 'capitalize'
        }}>
          Category: {category.replace(/([A-Z])/g, ' $1').trim()}
        </div>
      )}

      {/* Action buttons */}
      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={onDismiss}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          Maybe Later
        </button>
        <button
          onClick={onSwitchToPhysicalExam}
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            color: '#667eea',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'white';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.9)';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          Go to Physical Exam
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Progress bar for auto-hide */}
      {autoHide && !isHovered && (
        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          height: '3px',
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: '0 0 16px 16px',
          overflow: 'hidden'
        }}>
          <div 
            className="progress-bar"
            style={{
              height: '100%',
              background: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '0 0 16px 16px',
              animation: `shrink ${autoHideDelay}ms linear forwards`
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        .physical-exam-prompt.animate-in {
          animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .progress-bar {
          animation: shrink ${autoHideDelay}ms linear forwards;
        }
      `}</style>
    </div>
  );
};

export default PhysicalExamPrompt;
