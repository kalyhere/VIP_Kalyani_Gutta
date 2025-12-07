import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Cobra } from '@picovoice/cobra-web';
import { WebVoiceProcessor } from '@picovoice/web-voice-processor';
import { audioContextManager } from './AudioContextManager';

// Create context outside of any component
const VoiceInteractionContext = createContext(null);

// Export the hook as a named export
export function useVoiceInteraction() {
  const context = useContext(VoiceInteractionContext);
  if (!context) {
    throw new Error('useVoiceInteraction must be used within a VoiceInteractionProvider');
  }
  return context;
}

// Export the provider as a named export
export function VoiceInteractionProvider({ children }) {
  const [isMicEnabled, setIsMicEnabled] = useState(false); // Start with mic disabled
  const [userWantsMicEnabled, setUserWantsMicEnabled] = useState(false); // Track user's mic preference
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  const cobraInstance = useRef(null);
  const voiceProcessor = useRef(null);
  const recognition = useRef(null);
  const silenceTimer = useRef(null);
  const isProcessing = useRef(false);
  const isVoiceActiveRef = useRef(false);
  const latestTranscriptRef = useRef("");
  const recognitionActiveRef = useRef(false);
  const restartTimeoutRef = useRef(null);
  const restartAttemptsRef = useRef(0);
  const maxRestartAttempts = 3;
  const onTranscriptCompleteRef = useRef(null);
  const audioElementRef = useRef(null);
  const isProcessingTranscriptRef = useRef(false);
  const lastUserTranscriptRef = useRef('');
  const lastBotSpeechTimeRef = useRef(0);
  const isBotSpeakingRef = useRef(false);

  // Set the callback for when transcript is complete
  const setTranscriptCompleteCallback = (callback) => {
    onTranscriptCompleteRef.current = callback;
  };

  // Helper function to safely start recognition
  const safeStartRecognition = () => {
    if (!recognition.current) {
      console.log('ℹ️ Recognition not initialized, skipping start');
      return;
    }
    
    if (recognitionActiveRef.current) {
      console.log('ℹ️ Recognition already active, skipping start');
      return;
    }
    
    if (isBotSpeakingRef.current) {
      console.log('ℹ️ Bot is speaking, skipping recognition start');
      return;
    }
    
    try {
      // Clear any pending restart
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      
      // Reset restart attempts if we're starting fresh
      if (restartAttemptsRef.current >= maxRestartAttempts) {
        console.log('Max restart attempts reached, resetting counter');
        restartAttemptsRef.current = 0;
      }
      
      console.log('⚡ Starting recognition...');
      recognition.current.start();
      recognitionActiveRef.current = true;
      setIsListening(true);
      console.log('Speech recognition started safely');
    } catch (error) {
      console.error('⚠️ Failed to start recognition:', error);
      recognitionActiveRef.current = false;
      setIsListening(false);
    }
  };

  // Helper function to safely stop recognition
  const safeStopRecognition = () => {
    if (recognition.current && recognitionActiveRef.current) {
      try {
        // Clear any pending restart
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = null;
        }
        
        console.log('🛑 Stopping recognition...');
        recognition.current.stop();
        recognitionActiveRef.current = false;
        setIsListening(false);
        console.log('Speech recognition stopped safely');
      } catch (error) {
        console.error('⚠️ Error stopping speech recognition:', error);
      }
    } else {
      console.log('ℹ️ Recognition already stopped, skipping stop');
    }
  };

  // Helper function to handle transcript completion
  const handleTranscriptComplete = (finalTranscript) => {
    // Only process transcripts when the bot is not speaking and we're not already processing
    if (isBotSpeakingRef.current || isProcessingTranscriptRef.current) {
      console.log('Ignoring transcript: bot speaking or already processing');
      return;
    }
    
    // Reduced cooldown check to allow faster response
    const now = Date.now();
    if (now - lastBotSpeechTimeRef.current < 500) { // Reduced to 500ms
      console.log('⚠️ Ignoring transcript: occurred too soon after bot speaking');
      return;
    }
    
    if (finalTranscript && finalTranscript.trim() && onTranscriptCompleteRef.current) {
      console.log('Transcript complete, sending:', finalTranscript);
      
      // Set processing flag to prevent duplicate processing
      isProcessingTranscriptRef.current = true;
      
      // Store the transcript before clearing it
      const transcriptToSend = finalTranscript;
      
      // Store this transcript as the last one we processed
      lastUserTranscriptRef.current = finalTranscript;
      
      // Clear transcript immediately to prevent it from being displayed
      setTranscript('');
      latestTranscriptRef.current = '';
      
      // Send the transcript to the callback
      onTranscriptCompleteRef.current(transcriptToSend);
      
      // Reset processing flag after a delay to ensure we don't process the same transcript twice
      setTimeout(() => {
        isProcessingTranscriptRef.current = false;
      }, 500); // Reduced delay
    }
  };

  // Helper function to schedule a restart
  const scheduleRestart = () => {
    // Don't schedule a restart if we've reached max attempts
    if (restartAttemptsRef.current >= maxRestartAttempts) {
      console.log('Max restart attempts reached, not scheduling another restart');
      return;
    }
    
    // Don't schedule if recognition is already active
    if (recognitionActiveRef.current) {
      console.log('Recognition already active, skipping restart');
      return;
    }
    
    // Clear any existing restart timeout
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }
    
    // Increment restart attempts
    restartAttemptsRef.current += 1;
    console.log(`🔄 Scheduling restart attempt ${restartAttemptsRef.current} of ${maxRestartAttempts}`);
    
    // Schedule a new restart after a longer delay
            restartTimeoutRef.current = setTimeout(() => {
      if (userWantsMicEnabled && !isBotSpeakingRef.current && !recognitionActiveRef.current) {
        console.log('⏱️ Scheduled restart of speech recognition');
        safeStartRecognition();
      }
      restartTimeoutRef.current = null;
    }, 500); // Reduced delay for faster response
  };

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported in this browser');
      return;
    }

    recognition.current = new SpeechRecognition();
    recognition.current.continuous = true;
    recognition.current.interimResults = true;
    recognition.current.lang = 'en-US';

    recognition.current.onstart = () => {
      console.log('🎯 Speech recognition started');
      recognitionActiveRef.current = true;
      setIsListening(true);
      // Reset restart attempts on successful start
      restartAttemptsRef.current = 0;
    };

    recognition.current.onresult = (event) => {
      // Multiple checks to prevent processing during bot speech
      if (isBotSpeakingRef.current || 
          isProcessingTranscriptRef.current || 
          !userWantsMicEnabled || 
          !audioContextManager.isMicrophoneEnabled() ||
          document.body.classList.contains('bot-speaking')) {
        console.log('Ignoring speech recognition results: bot speaking or mic disabled');
        setTranscript('');
        latestTranscriptRef.current = '';
        return;
      }

      const now = Date.now();
      if (now - lastBotSpeechTimeRef.current < 500) { // Reduced cooldown period
        console.log('⚠️ Ignoring transcript: occurred too soon after bot speaking');
        setTranscript('');
        latestTranscriptRef.current = '';
        return;
      }
      
      const currentTranscript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join(' ');
      
      console.log('📝 Transcript updated:', currentTranscript);
      latestTranscriptRef.current = currentTranscript;
      setTranscript(currentTranscript);
      setIsVoiceActive(true);
      isVoiceActiveRef.current = true;
      
      // Clear any existing silence timer
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
      }

      // Set new silence timer for transcript completion
      silenceTimer.current = setTimeout(() => {
        if (recognition.current && isVoiceActiveRef.current) {
          console.log('🤫 Silence detected, completing transcript');
          safeStopRecognition();
          isVoiceActiveRef.current = false;
          setIsVoiceActive(false);
          
          // Send the transcript after silence
          handleTranscriptComplete(latestTranscriptRef.current);
        }
      }, 2000); // 2 seconds of silence
    };

    recognition.current.onerror = (event) => {
      console.error('⚠️ Speech recognition error:', event.error);
      
      // Handle specific error types
      if (event.error === 'no-speech') {
        // This is not a critical error, just means no speech was detected
        return;
      } else if (event.error === 'aborted') {
        // Recognition was aborted, don't try to restart immediately
        console.log('🛑 Recognition aborted');
        return;
      }
      
      // For other errors, stop recognition and reset state
      safeStopRecognition();
      isVoiceActiveRef.current = false;
      setIsVoiceActive(false);
      
      // Clear any existing silence timer
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
        silenceTimer.current = null;
      }
    };

    recognition.current.onend = () => {
      console.log('🏁 Speech recognition ended');
      recognitionActiveRef.current = false;
      isVoiceActiveRef.current = false;
      setIsVoiceActive(false);
      setIsListening(false);
      
      // Clear any existing silence timer
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
        silenceTimer.current = null;
      }
      
      // Only restart if user wants microphone enabled and bot is not speaking
      if (userWantsMicEnabled && !isBotSpeakingRef.current) {
        console.log('🔄 Recognition ended, attempting immediate restart');
        // Try immediate restart first
        if (!recognitionActiveRef.current) {
          console.log('⏱️ Immediate restart of speech recognition');
          safeStartRecognition();
        }
        
        // Also schedule a backup restart in case immediate fails
        setTimeout(() => {
          if (userWantsMicEnabled && !isBotSpeakingRef.current && !recognitionActiveRef.current) {
            console.log('⏱️ Backup restart of speech recognition');
            safeStartRecognition();
          }
        }, 500); // Short delay for backup
      }
    };

    return () => {
      safeStopRecognition();
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, [userWantsMicEnabled]);

  // Initialize Cobra VAD (but don't auto-start)
  useEffect(() => {
    const initVoiceDetection = async () => {
      try {
        const accessKey = import.meta.env.VITE_PICOVOICE_ACCESS_KEY;
        if (!accessKey) {
          console.warn('Missing Picovoice access key - voice detection will be limited to basic speech recognition.');
          return;
        }

        // Initialize Cobra for voice detection (but don't start immediately)
        cobraInstance.current = await Cobra.create(accessKey, {
          sensitivity: 0.7 // Higher sensitivity for better voice detection
        });
        console.log('Cobra initialized (ready but not started)');
        
        // Initialize WebVoiceProcessor but don't start it yet
        voiceProcessor.current = new WebVoiceProcessor(cobraInstance.current, {
          processCallback: (voiceProbability) => {
            if (!userWantsMicEnabled || isBotSpeakingRef.current || recognitionActiveRef.current) return;

            // Higher threshold for voice detection to reduce false positives
            if (voiceProbability > 0.6 && !isProcessing.current) {
              console.log('Voice detected with probability:', voiceProbability);
              setIsVoiceActive(true);
              isVoiceActiveRef.current = true;
              isProcessing.current = true;
              
              if (recognition.current && !recognitionActiveRef.current) {
                try {
                  recognition.current.start();
                  recognitionActiveRef.current = true;
                  setIsListening(true);
                  console.log('Speech recognition started on voice detection');
                } catch (error) {
                  console.error('Error starting speech recognition:', error);
                }
              }
            } else if (voiceProbability <= 0.3) {
              // Voice activity ended - silence detected
              if (isProcessing.current && latestTranscriptRef.current.trim()) {
                console.log('🤫 Cobra detected silence after voice, triggering auto-submit');
                setIsVoiceActive(false);
                isVoiceActiveRef.current = false;
                isProcessing.current = false;
                
                // Auto-submit after silence detection
                handleTranscriptComplete(latestTranscriptRef.current);
              } else if (isProcessing.current) {
                console.log('Voice ended but no transcript, probability:', voiceProbability);
                setIsVoiceActive(false);
                isVoiceActiveRef.current = false;
                isProcessing.current = false;
              }
            }
          },
          processErrorCallback: (error) => {
            console.error('WebVoiceProcessor error:', error);
          }
        });

        console.log('Voice detection system prepared (microphone remains disabled)');
      } catch (error) {
        console.error('Failed to initialize voice detection:', error);
      }
    };

    initVoiceDetection();

    return () => {
      voiceProcessor.current?.stop();
      cobraInstance.current?.release();
      audioContextManager.stop();
    };
  }, []);

  // Initialize audio context but keep microphone disabled by default
  useEffect(() => {
    const initAudioContextOnly = async () => {
      try {
        console.log('Initializing audio context (microphone disabled by default)...');
        
        // Only initialize the audio context, don't enable microphone
        // This prepares the system but keeps mic muted
        console.log('Audio context preparation complete - microphone remains disabled');
        setIsMicEnabled(false); // Explicitly set to false
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
        setIsMicEnabled(false);
      }
    };

    // Call the initialization function
    initAudioContextOnly();
  }, []); // Empty dependency array ensures this runs only once on mount

  const toggleMic = async () => {
    const newMicState = !userWantsMicEnabled;
    console.log(`User toggling microphone to: ${newMicState ? 'ON' : 'OFF'}`);
    
    // Update user preference first
    setUserWantsMicEnabled(newMicState);
    
    if (newMicState) {
      // User wants mic ON
      try {
        // Initialize audio context and enable microphone
        await audioContextManager.initialize();
        await audioContextManager.enableMicrophone();
        audioContextManager.setGain(0.5);
        
        // Start voice processor if available
        if (voiceProcessor.current && cobraInstance.current) {
          const mediaStream = audioContextManager.getMediaStream();
          if (mediaStream) {
            await voiceProcessor.current.start(mediaStream);
            console.log('Voice processor started');
          }
        }
        
        // Start recognition only if bot is not speaking
        if (!isBotSpeaking) {
          safeStartRecognition();
          setIsMicEnabled(true);
        } else {
          // Bot is speaking, mic will be enabled after bot finishes
          setIsMicEnabled(false);
          console.log('Bot is speaking, will enable mic after bot finishes');
        }
        
        console.log('Microphone preference set to ON');
      } catch (error) {
        console.error('Error enabling microphone:', error);
        setUserWantsMicEnabled(false);
        setIsMicEnabled(false);
      }
    } else {
      // User wants mic OFF - Disable everything
      try {
        // Stop voice processor
        if (voiceProcessor.current) {
          voiceProcessor.current.stop();
        }
        
        // Disable microphone
        audioContextManager.disableMicrophone();
        audioContextManager.setGain(0);
        safeStopRecognition();
        
        // Reset state
        setIsMicEnabled(false);
        setIsVoiceActive(false);
        setIsListening(false);
        setTranscript('');
        console.log('Microphone successfully toggled OFF');
      } catch (error) {
        console.error('Error disabling microphone:', error);
        // Still set mic as disabled even if there was an error
        setIsMicEnabled(false);
      }
    }
  };

  // Function to handle audio playback
  const handleAudioPlayback = (audioUrl) => {
    if (!audioUrl) return;

    // Clear transcript state
    setTranscript('');
    latestTranscriptRef.current = '';
    isProcessingTranscriptRef.current = false;
    lastUserTranscriptRef.current = '';

    // Start bot speaking immediately (this will handle all the microphone disable logic)
    startBotSpeaking();

    // Create new audio element
    const audio = new Audio(audioUrl);
    audioElementRef.current = audio;

    // Set up event listeners
    audio.addEventListener('play', () => {
      console.log('🎵 Audio started playing');
      // Don't call startBotSpeaking again, already called above
    });

    audio.addEventListener('ended', () => {
      console.log('🎵 Audio finished playing');
      stopBotSpeaking();
    });

    audio.addEventListener('error', (error) => {
      console.error('⚠️ Audio playback error:', error);
      stopBotSpeaking();
    });

    // Start playback
    audio.play().catch(error => {
      console.error('⚠️ Failed to play audio:', error);
      stopBotSpeaking();
    });
  };

  // Clean up audio element on unmount
  useEffect(() => {
    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
    };
  }, []);

  const startBotSpeaking = () => {
    if (isBotSpeakingRef.current) {
      console.log('Bot already speaking, skipping start');
      return;
    }
    
    console.log('Bot starting to speak');
    setIsBotSpeaking(true);
    isBotSpeakingRef.current = true;
    lastBotSpeechTimeRef.current = Date.now();

    // Forcefully abort recognition if still active
    if (recognition.current && recognitionActiveRef.current) {
      try {
        recognition.current.abort();
        recognitionActiveRef.current = false;
      } catch (error) {
        console.error("Error aborting recognition:", error);
      }
    }

    // Set bot speaking state in audio context manager
    audioContextManager.setBotSpeaking(true);

    // Temporarily disable mic while bot speaks (but remember user preference)
    if (userWantsMicEnabled) {
      // User wants mic on, so temporarily pause voice processing
      if (voiceProcessor.current) {
        voiceProcessor.current.stop();
      }
      setIsMicEnabled(false); // Temporarily disable
      console.log('Temporarily pausing mic while bot speaks (user wants mic on)');
    }

    // Reset transcript states
    setTranscript('');
    latestTranscriptRef.current = '';
    isVoiceActiveRef.current = false;
    setIsVoiceActive(false);
    setIsListening(false);
    isProcessingTranscriptRef.current = false;
    lastUserTranscriptRef.current = '';

    // Add a class to the body to indicate bot is speaking
    document.body.classList.add('bot-speaking');
  };

  const stopBotSpeaking = () => {
    if (!isBotSpeakingRef.current) {
      console.log('Bot was not speaking, skipping stop');
      return;
    }

    console.log('Bot finished speaking');
    setIsBotSpeaking(false);
    isBotSpeakingRef.current = false;
    audioContextManager.setBotSpeaking(false);
    document.body.classList.remove('bot-speaking');

    // Resume microphone if user wants it enabled
    if (userWantsMicEnabled) {
      console.log('User wants mic enabled, resuming after bot finished speaking');
      
      // Immediate resume without delay for better responsiveness
      const resumeMic = async () => {
        try {
          console.log('Resuming microphone after bot finished speaking');
          await audioContextManager.enableMicrophone();
          audioContextManager.setGain(0.5);

          // Start voice processor if available
          if (voiceProcessor.current && cobraInstance.current) {
            const mediaStream = audioContextManager.getMediaStream();
            if (mediaStream) {
              await voiceProcessor.current.start(mediaStream);
              console.log('Voice processor resumed');
            }
          }

          // Always try to start recognition if user wants mic enabled
          console.log('Attempting to resume recognition after bot finished speaking');
          // Force start recognition regardless of bot speaking state
          if (!recognitionActiveRef.current) {
            console.log('⚡ Force starting recognition after bot finished speaking');
            try {
              recognition.current.start();
              recognitionActiveRef.current = true;
              setIsListening(true);
              console.log('Speech recognition force started after bot speaking');
            } catch (error) {
              console.error('⚠️ Failed to force start recognition:', error);
            }
          }
          
          setIsMicEnabled(true);
          console.log('Microphone successfully resumed after bot speaking');
        } catch (error) {
          console.error('Error resuming microphone:', error);
          // Try again after a short delay if it fails
          setTimeout(resumeMic, 500);
        }
      };
      
      // Start immediately
      resumeMic();
    }
  };

  const handleBotSpeaking = (isSpeaking) => {
    if (isSpeaking) {
      startBotSpeaking();
    } else {
      stopBotSpeaking();
    }
  };

  // Function to manually clear the transcript
  const clearTranscript = () => {
    console.log('Manually clearing transcript');
    setTranscript('');
    latestTranscriptRef.current = '';
  };

  // Add cleanup for recognition when component unmounts
  useEffect(() => {
    return () => {
      if (recognition.current) {
        try {
          recognition.current.stop();
        } catch (error) {
          console.error('Error stopping recognition during cleanup:', error);
        }
      }
    };
  }, []);
  

  const value = {
    isMicEnabled: userWantsMicEnabled, // Show user preference for UI
    isVoiceActive,
    isBotSpeaking,
    transcript,
    isListening,
    toggleMic,
    startBotSpeaking,
    stopBotSpeaking,
    setTranscriptCompleteCallback,
    handleAudioPlayback,
    handleBotSpeaking,
    clearTranscript
  };

  return (
    <VoiceInteractionContext.Provider value={value}>
      {children}
    </VoiceInteractionContext.Provider>
  );
} 