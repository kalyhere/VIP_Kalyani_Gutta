import React, { useState, useEffect } from 'react';
import { Lightbulb, ChevronDown, ChevronUp, Copy, X } from 'lucide-react';

const AutoSuggestions = ({ 
  isVisible, 
  suggestions = [], 
  symptoms = [],
  onSelectSuggestion,
  onDismiss,
  autoHide = true,
  autoHideDelay = 15000 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Auto-hide after delay
  useEffect(() => {
    if (isVisible && autoHide && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoHide, autoHideDelay, onDismiss]);

  // Copy suggestion to clipboard
  const handleCopySuggestion = async (suggestion, index) => {
    try {
      await navigator.clipboard.writeText(suggestion);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy suggestion:', err);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion) => {
    if (onSelectSuggestion) {
      onSelectSuggestion(suggestion);
    }
  };

  if (!isVisible || !suggestions || suggestions.length === 0) {
    return null;
  }

  const displaySuggestions = isExpanded ? suggestions : suggestions.slice(0, 3);
  const hasMoreSuggestions = suggestions.length > 3;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      maxWidth: '600px',
      width: '90%',
      background: '#FFFFFF',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
      border: '1px solid rgba(0, 0, 0, 0.08)',
      zIndex: 3000,
      animation: 'slideDown 0.3s ease-out',
      pointerEvents: 'auto'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '16px 16px 0 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lightbulb size={20} />
          <span style={{ fontWeight: '600', fontSize: '16px' }}>
            Smart Follow-up Questions
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
            opacity: 0.8,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.opacity = '1'}
          onMouseLeave={(e) => e.target.style.opacity = '0.8'}
        >
          <X size={18} />
        </button>
      </div>

      {/* Symptoms Detected */}
      {symptoms && symptoms.length > 0 && (
        <div style={{
          padding: '12px 20px',
          background: '#f8f9fa',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          fontSize: '14px',
          color: '#6c757d'
        }}>
          <span style={{ fontWeight: '500' }}>Detected symptoms: </span>
          {symptoms.map((symptom, index) => (
            <span key={index}>
              {symptom.category}
              {index < symptoms.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      )}

      {/* Suggestions List */}
      <div style={{
        padding: '16px 20px',
        maxHeight: isExpanded ? '400px' : '200px',
        overflowY: 'auto'
      }}>
        {displaySuggestions.map((suggestion, index) => (
          <div
            key={index}
            style={{
              padding: '12px 16px',
              marginBottom: '8px',
              background: '#f8f9fa',
              borderRadius: '12px',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative',
              fontSize: '14px',
              lineHeight: '1.5'
            }}
            onClick={() => handleSuggestionClick(suggestion)}
            onMouseEnter={(e) => {
              e.target.style.background = '#e9ecef';
              e.target.style.borderColor = '#667eea';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#f8f9fa';
              e.target.style.borderColor = 'rgba(0, 0, 0, 0.06)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#667eea',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '600',
                flexShrink: 0,
                marginTop: '2px'
              }}>
                {index + 1}
              </div>
              <div style={{ flex: 1 }}>
                {suggestion}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopySuggestion(suggestion, index);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  color: '#6c757d',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 0.7,
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.target.style.opacity = '1';
                  e.target.style.background = '#e9ecef';
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = '0.7';
                  e.target.style.background = 'none';
                }}
                title="Copy suggestion"
              >
                {copiedIndex === index ? (
                  <span style={{ color: '#28a745', fontSize: '12px' }}>✓</span>
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
          </div>
        ))}

        {/* Show More/Less Button */}
        {hasMoreSuggestions && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              width: '100%',
              padding: '12px',
              background: 'none',
              border: '1px solid #667eea',
              borderRadius: '8px',
              color: '#667eea',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
              marginTop: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#667eea';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'none';
              e.target.style.color = '#667eea';
            }}
          >
            {isExpanded ? (
              <>
                <ChevronUp size={16} />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown size={16} />
                Show {suggestions.length - 3} More
              </>
            )}
          </button>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 20px',
        background: '#f8f9fa',
        borderRadius: '0 0 16px 16px',
        borderTop: '1px solid rgba(0, 0, 0, 0.08)',
        fontSize: '12px',
        color: '#6c757d',
        textAlign: 'center'
      }}>
        Click on any suggestion to use it, or copy it to your clipboard
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        /* Custom scrollbar for suggestions */
        div::-webkit-scrollbar {
          width: 6px;
        }

        div::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 3px;
        }

        div::-webkit-scrollbar-thumb {
          background: rgba(102, 126, 234, 0.5);
          border-radius: 3px;
        }

        div::-webkit-scrollbar-thumb:hover {
          background: rgba(102, 126, 234, 0.7);
        }
      `}</style>
    </div>
  );
};

export default AutoSuggestions;
