import React, { useState, useEffect } from 'react';
import { fetchMediaByTag, getMediaType } from '../utils/mediaService';

const MediaViewer = ({ tag, onClose, onError }) => {
  const [mediaData, setMediaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLoadingOptions, setShowLoadingOptions] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(120); // 2 minutes in seconds
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading test results...');
  const [currentStep, setCurrentStep] = useState(0);

  const loadingSteps = [
    { message: 'Initializing diagnostic protocols...', duration: 30 },
    { message: 'Processing sample data...', duration: 45 },
    { message: 'Running diagnostic algorithms...', duration: 30 },
    { message: 'Generating medical report...', duration: 15 }
  ];

  useEffect(() => {
    if (!tag) return;
    
    console.log('MediaViewer: Tag changed to:', tag);
    // Show loading options first
    setShowLoadingOptions(true);
    setLoading(true);
    setError(null);
    setTimeRemaining(120);
    setCurrentStep(0);
  }, [tag]);

  useEffect(() => {
    let timer;
    if (isTimerActive && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          
          // Update loading step based on time remaining
          const elapsed = 120 - newTime;
          let stepIndex = 0;
          let cumulativeTime = 0;
          
          for (let i = 0; i < loadingSteps.length; i++) {
            cumulativeTime += loadingSteps[i].duration;
            if (elapsed <= cumulativeTime) {
              stepIndex = i;
              break;
            }
          }
          
          if (stepIndex !== currentStep) {
            setCurrentStep(stepIndex);
            setLoadingMessage(loadingSteps[stepIndex].message);
          }
          
          if (newTime <= 0) {
            setIsTimerActive(false);
            loadMediaImmediately();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerActive, timeRemaining, currentStep]);

  const loadMediaImmediately = async () => {
    console.log('Loading media immediately...');
    setShowLoadingOptions(false);
    setIsTimerActive(false);
    setTimeRemaining(120); // Reset timer
    setCurrentStep(0); // Reset step
    setLoading(true);
    setLoadingMessage('Loading test results...');
    
    try {
      console.log('Fetching media for tag:', tag);
      const data = await fetchMediaByTag(tag);
      console.log('Media data received:', data);
      setMediaData(data);
    } catch (err) {
      console.error('Error loading media:', err);
      setError(err.message);
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    setIsTimerActive(true);
    setShowLoadingOptions(false);
    setLoadingMessage('Test results will be ready in 2 minutes...');
  };

  const skipWait = () => {
    console.log('Skip wait clicked');
    setIsTimerActive(false);
    setTimeRemaining(120);
    setCurrentStep(0);
    loadMediaImmediately();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderLoadingOptions = () => (
    <div className="media-viewer-overlay">
      <div className="media-viewer-modal loading-options-modal">
        <div className="loading-options-container">
          <h2>Test Results Ready</h2>
          <p>Your test results are available. Choose when you'd like to view them:</p>
          
          <div className="loading-options-buttons">
            <button 
              className="option-button immediate"
              onClick={loadMediaImmediately}
            >
              <div className="option-icon">⚡</div>
              <div className="option-content">
                <h3>View Now</h3>
                <p>See results immediately</p>
              </div>
            </button>
            
            <button 
              className="option-button timer"
              onClick={startTimer}
            >
              <div className="option-icon">⏱️</div>
              <div className="option-content">
                <h3>Wait 2 Minutes</h3>
                <p>Realistic processing time</p>
              </div>
            </button>
          </div>
          
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
      </div>
    </div>
  );

  const renderTimerLoading = () => (
    <div className="media-viewer-overlay">
      <div className="media-viewer-modal loading-modal">
        <div className="loading-container">
          <div className="timer-display">
            <div className="timer-circle">
              <div className="timer-text">{formatTime(timeRemaining)}</div>
            </div>
          </div>
          
          <div className="loading-content">
            <h2>Processing Test Results</h2>
            <p>{loadingMessage}</p>
            
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${((120 - timeRemaining) / 120) * 100}%` }}
              ></div>
            </div>
            
            <div className="loading-details">
              <p>• {loadingSteps[currentStep]?.message || 'Processing...'}</p>
              <p>• Validating test parameters</p>
              <p>• Cross-referencing with medical database</p>
            </div>
          </div>
          
          <button className="skip-button" onClick={loadMediaImmediately}>
            Skip Wait
          </button>
        </div>
      </div>
    </div>
  );

  const renderMedia = () => {
    if (!mediaData) return null;
    const mediaType = getMediaType(mediaData.contentType);
    const { signedUrl, name } = mediaData;
    switch (mediaType) {
      case 'image':
        return (
          <img 
            src={signedUrl} 
            alt={name}
            className="media-content"
            style={{ display: 'block', maxWidth: '100%', maxHeight: '80vh', margin: '0 auto' }}
            onError={(e) => {
              console.error('Image failed to load:', e);
              setError('Failed to load image');
            }}
          />
        );
      case 'video':
        return (
          <video 
            controls 
            className="media-content"
            style={{ display: 'block', maxWidth: '100%', maxHeight: '80vh', margin: '0 auto' }}
            onError={(e) => {
              console.error('Video failed to load:', e);
              setError('Failed to load video');
            }}
          >
            <source src={signedUrl} type={mediaData.contentType} />
            Your browser does not support the video tag.
          </video>
        );
      case 'audio':
        return (
          <audio 
            controls 
            className="media-content"
            style={{ display: 'block', width: '100%', maxWidth: '400px', margin: '40px auto' }}
            onError={(e) => {
              console.error('Audio failed to load:', e);
              setError('Failed to load audio');
            }}
          >
            <source src={signedUrl} type={mediaData.contentType} />
            Your browser does not support the audio tag.
          </audio>
        );
      default:
        return (
          <div className="media-container unknown-container">
            <div className="media-info">
              <h4>Unsupported Media Type</h4>
              <p>File: {name}</p>
              <p>Type: {mediaData.contentType}</p>
              <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="download-link">
                Download File
              </a>
            </div>
          </div>
        );
    }
  };

  if (showLoadingOptions) {
    console.log('Rendering loading options');
    return renderLoadingOptions();
  }

  if (isTimerActive) {
    console.log('Rendering timer loading, time remaining:', timeRemaining);
    return renderTimerLoading();
  }

  if (loading) {
    console.log('Rendering loading spinner');
    return (
      <div className="media-viewer-overlay">
        <div className="media-viewer-modal">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>{loadingMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="media-viewer-overlay">
        <div className="media-viewer-modal">
          <div className="error-container">
            <h3>Test Result Not Available</h3>
            <p>{error}</p>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
              This test result may not be available in the current case or the image may not be uploaded to the system.
            </p>
            <button onClick={onClose} className="media-viewer-close-btn">
              ×
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="media-viewer-overlay" onClick={onClose}>
      <div className="media-viewer-modal" onClick={e => e.stopPropagation()} style={{ position: 'relative', padding: 0, background: 'rgba(255,255,255,0.98)' }}>
        <button className="media-viewer-close-btn" onClick={onClose} aria-label="Close image viewer">×</button>
        {renderMedia()}
      </div>
      <style jsx>{`
        .media-viewer-close-btn {
          position: absolute;
          top: 18px;
          right: 18px;
          background: rgba(0, 0, 0, 0.3);
          color: white;
          border: none;
          font-size: 32px;
          font-weight: 300;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10001;
          transition: all 0.3s ease;
          padding: 8px;
          line-height: 1;
          width: auto;
          height: auto;
          border-radius: 4px;
          box-shadow: none;
          opacity: 0.9;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
        }
        .media-viewer-close-btn:hover {
          color: white;
          background: rgba(0, 0, 0, 0.5);
          opacity: 1;
          transform: scale(1.1);
          text-shadow: 0 2px 6px rgba(0, 0, 0, 0.9);
        }
      `}</style>
    </div>
  );
};

export default MediaViewer; 