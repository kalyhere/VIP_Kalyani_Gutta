import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { useVoiceInteraction } from './utils/VoiceInteractionManager';
import EndSessionButton from './components/EndSessionButton';
import CloseButton from './components/CloseButton';
import { detectPatientGender } from './utils/patientGenderDetector';

// UA Brand Colors from your design system (matching Physical Exam interface)
const uaColors = {
  arizonaRed: '#AB0520',
  arizonaBlue: '#0C234B',
  chili: '#8B0015',
  white: '#FFFFFF',
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  }
};

const ChatInterface = ({ 
  onSendMessage, 
  messages = [], 
  isLoading = false, 
  isSpeaking = false,
  sessionId = null,
  isSessionEnded = false,
  onEndSession = null,
  isHidden = false,
  externalControl = false,
  mccData = null,
  patientGender = "female"
}) => {
  // State management
  const [userInput, setUserInput] = useState(""); // Separate state for user typing
  const [isMinimized, setIsMinimized] = useState(true);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [tipDismissed, setTipDismissed] = useState(false);
  
  // Voice interaction hooks
  const { 
    isMicEnabled, 
    isVoiceActive, 
    transcript, 
    isListening,
    toggleMic,
    startBotSpeaking,
    stopBotSpeaking,
    setTranscriptCompleteCallback
  } = useVoiceInteraction();

  const chatBoxRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isUserTypingRef = useRef(false); // More reliable typing state tracking

  // External control: listen for events to open/close/toggle chat window
  useEffect(() => {
    if (!externalControl) return;

    const open = () => setIsMinimized(false);
    const close = () => setIsMinimized(true);
    const toggle = () => setIsMinimized(prev => !prev);

    window.addEventListener('openChat', open);
    window.addEventListener('closeChat', close);
    window.addEventListener('toggleChat', toggle);
    return () => {
      window.removeEventListener('openChat', open);
      window.removeEventListener('closeChat', close);
      window.removeEventListener('toggleChat', toggle);
    };
  }, [externalControl]);

  // Monitor messages for gender detection based on intro content
  useEffect(() => {
    if (messages && messages.length > 0) {
      // Look for the intro message (usually the first bot message)
      const introMessage = messages.find(msg => msg.sender === 'bot');
      
      if (introMessage && introMessage.text) {
        // Check if the intro contains "acute myocardial infarction management"
        const isMalePatient = introMessage.text.toLowerCase().includes('acute myocardial infarction management');
        const detectedGender = isMalePatient ? 'male' : 'female';
        
        console.log('🎭 ChatInterface: Intro message:', introMessage.text);
        console.log('🎭 ChatInterface: Detected patient gender (based on intro):', detectedGender);
        
        // Dispatch a global event to notify other components of gender change
        const genderChangeEvent = new CustomEvent('patientGenderChanged', {
          detail: { 
            gender: detectedGender,
            mccData: mccData,
            introMessage: introMessage.text
          }
        });
        window.dispatchEvent(genderChangeEvent);
        
        // Also store in window for debugging
        window.currentPatientGender = detectedGender;
        window.currentMccData = mccData;
        window.currentIntroMessage = introMessage.text;
      }
    }
  }, [messages, mccData]);

  // Submit handler (hoisted as function declaration to avoid TDZ issues)
  async function handleSubmit(text = userInput) {
    if (!sessionId) {
      console.error('Cannot send message: No session ID available');
      return;
    }

    if (isLoading || isSpeaking) {
      console.log('Cannot send message while loading or speaking');
      return;
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      console.log('Empty message, not sending');
      return;
    }

    console.log('📤 Submitting message:', trimmedText);
    console.log('📤 Current typing state:', isUserTyping);

    // Clear typing state and timeout when submitting
    setIsUserTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Clear input value and focus on the input
    setUserInput('');
    
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = '40px';
      inputRef.current.focus();
    }
    
    onSendMessage(trimmedText);
  }

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatBoxRef.current) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
      }, 10);
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Focus input when minimized state changes
  useEffect(() => {
    if (!isMinimized && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [isMinimized]);



  // Set up transcript completion callback
  useEffect(() => {
    setTranscriptCompleteCallback((finalTranscript) => {
      if (finalTranscript && finalTranscript.trim()) {
        console.log('📤 Auto-submitting transcript:', finalTranscript);
        // Clear typing state before submitting transcript
        setIsUserTyping(false);
        isUserTypingRef.current = false;
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
        // Set the transcript as userInput and submit
        setUserInput(finalTranscript);
        handleSubmit(finalTranscript);
      }
    });
  }, [setTranscriptCompleteCallback]);
        
  // Handle transcript updates (only if user is not manually typing)
  useEffect(() => {
    if (transcript && !isUserTypingRef.current && isVoiceActive) {
      setUserInput(transcript);
      // Auto-resize and scroll logic
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.style.height = 'auto';
          const newHeight = Math.min(inputRef.current.scrollHeight, 150);
          inputRef.current.style.height = `${newHeight}px`;
          
          // Auto-scroll to bottom for voice transcript
          inputRef.current.scrollTop = inputRef.current.scrollHeight;
        }
      }, 0);
    }
  }, [transcript, isVoiceActive]);
            
  // Handle bot speaking state
  useEffect(() => {
    if (isSpeaking) {
      startBotSpeaking();
      // Only clear input if user wasn't typing
      if (!isUserTypingRef.current) {
        setUserInput("");
      }
    } else {
      stopBotSpeaking();
    }
  }, [isSpeaking, startBotSpeaking, stopBotSpeaking]);

  // Focus management
  useEffect(() => {
    const maintainFocus = () => {
      if (inputRef.current && !isLoading && !isSpeaking) {
        // Only focus if not already focused to avoid triggering onFocus repeatedly
        if (document.activeElement !== inputRef.current) {
          inputRef.current.focus();
        }
      }
    };

    const interval = setInterval(maintainFocus, 1000);
    return () => clearInterval(interval);
  }, [isLoading, isSpeaking]);

  // Minimal native event shield to prevent Unity/window listeners from blocking typing
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const stopBubble = (e) => {
      // Allow default typing but stop other listeners from seeing it first
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
    };
    const types = ['keydown', 'keypress', 'beforeinput', 'input'];
    types.forEach((t) => el.addEventListener(t, stopBubble, { capture: true }));
    return () => {
      types.forEach((t) => el.removeEventListener(t, stopBubble, { capture: true }));
    };
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Global keydown capture fallback to synthesize typing if default is prevented by Unity/global listeners
  useEffect(() => {
    const onDocKeyDown = (e) => {
      const el = inputRef.current;
      if (!el) return;
      if (document.activeElement !== el) return;
      if (e.isComposing) return;

      const isPrintable = e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
      const isBackspace = e.key === 'Backspace';
      const isDelete = e.key === 'Delete';
      const isEnter = e.key === 'Enter';
      const isShiftEnter = isEnter && e.shiftKey;

      if (!(isPrintable || isBackspace || isDelete || isEnter)) return;

      // Prevent default so we fully control the value
      e.preventDefault();
      e.stopPropagation();

      const start = el.selectionStart ?? userInput.length;
      const end = el.selectionEnd ?? start;
      const before = userInput.slice(0, start);
      const after = userInput.slice(end);

      let nextValue = userInput;
      let nextCaret = start;

      if (isPrintable) {
        nextValue = `${before}${e.key}${after}`;
        nextCaret = start + 1;
      } else if (isBackspace) {
        if (start !== end) {
          nextValue = `${before}${after}`;
          nextCaret = start;
        } else if (start > 0) {
          nextValue = `${userInput.slice(0, start - 1)}${after}`;
          nextCaret = start - 1;
        }
      } else if (isDelete) {
        if (start !== end) {
          nextValue = `${before}${after}`;
          nextCaret = start;
        } else if (start < userInput.length) {
          nextValue = `${before}${userInput.slice(start + 1)}`;
          nextCaret = start;
        }
      } else if (isEnter) {
        if (isShiftEnter) {
          nextValue = `${before}\n${after}`;
          nextCaret = start + 1;
        } else {
          // Submit on Enter (no shift)
          if (userInput.trim()) {
            handleSubmit();
          }
          return; // Do not modify value
        }
      }

      setUserInput(nextValue);
      setIsUserTyping(true);
      isUserTypingRef.current = true;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsUserTyping(false);
        isUserTypingRef.current = false;
      }, 2000);

      // Restore caret position after React updates value
      requestAnimationFrame(() => {
        try {
          el.selectionStart = el.selectionEnd = nextCaret;
        } catch (_) {}
      });
    };

    // Capture phase to intercept before Unity bubble handlers; even if Unity prevents default earlier,
    // we still synthesize value changes here
    document.addEventListener('keydown', onDocKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', onDocKeyDown, { capture: true });
  }, [userInput]);

  // Handle input changes and resize
  const handleInputChange = (e) => {
    const value = e.target.value;
    setUserInput(value);
    
    // Simplified typing detection
    setIsUserTyping(true);
    isUserTypingRef.current = true;
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to clear typing state
    typingTimeoutRef.current = setTimeout(() => {
      setIsUserTyping(false);
      isUserTypingRef.current = false;
    }, 2000);
    
    // Auto-resize textarea and scroll to bottom
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const newHeight = Math.min(inputRef.current.scrollHeight, 150);
      inputRef.current.style.height = `${newHeight}px`;
      
      // Auto-scroll to bottom with a slight delay to ensure DOM update
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.scrollTop = inputRef.current.scrollHeight;
        }
      }, 0);
    }
  };

  // Simple mic toggle handler
  const handleToggleMic = () => {
    toggleMic();
  };

  // Don't render anything if the chat interface should be hidden
  if (isHidden) {
    return null;
  }

  return (
    <>
      {isMinimized ? (
        externalControl ? null : (
        <div style={{ position: 'fixed', bottom: '42px', right: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2000, pointerEvents: 'auto' }}>
          <button
            onClick={() => setIsMinimized(false)}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: uaColors.white,
              border: `2px solid ${uaColors.slate[200]}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              padding: 0,
              zIndex: 2001,
              pointerEvents: 'auto',
            }}
            title="Open Dialogue"
            onMouseEnter={(e) => {
              e.target.style.background = uaColors.slate[50];
              e.target.style.borderColor = uaColors.slate[300];
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = uaColors.white;
              e.target.style.borderColor = uaColors.slate[200];
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
          >
            <MessageCircle size={36} color={uaColors.arizonaRed} strokeWidth={3} style={{ display: 'block', margin: '0 auto' }} />
          </button>
          <span style={{ marginTop: '8px', color: '#000', fontWeight: 600, fontSize: '14px', letterSpacing: '0.5px', zIndex: 2001, pointerEvents: 'auto' }}>Chat</span>
        </div>
        )
      ) : (
        <div className="chatbot-window" style={{
          position: 'fixed',
          bottom: '18px',
          right: '12px',
          width: '350px',
          maxWidth: '90%',
          height: '400px',
          background: uaColors.white,
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          border: `1px solid ${uaColors.slate[200]}`,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 2000,
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          pointerEvents: 'auto',
        }}>
          <div className="chatbot-header" style={{
            padding: '1.5rem 1.5rem 1rem',
            borderBottom: `1px solid ${uaColors.slate[200]}`,
            background: uaColors.white,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: uaColors.slate[900] }}>Virtual Patient</h2>
              {patientGender && (
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: uaColors.slate[600], 
                  marginTop: '0.25rem',
                  textTransform: 'capitalize'
                }}>
                  {patientGender} Patient Model
                  <div style={{ 
                    fontSize: '0.65rem', 
                    color: uaColors.slate[500], 
                    fontStyle: 'italic'
                  }}>
                    (detected from intro)
                  </div>
                </div>
              )}
            </div>
            <button 
              onClick={() => setIsMinimized(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                color: uaColors.slate[600],
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'auto',
                zIndex: 1001,
                position: 'relative',
                outline: 'none',
                borderRadius: '8px',
                transition: 'all 0.2s ease'
              }}
              title="Minimize"
              onMouseEnter={(e) => {
                e.target.style.background = uaColors.slate[100];
                e.target.style.color = uaColors.slate[900];
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'none';
                e.target.style.color = uaColors.slate[600];
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="9" width="12" height="2" rx="1" fill="currentColor" />
              </svg>
            </button>
          </div>
          
          {/* Physical Exam Tip Banner */}
          {showPhysicalExamTip && !tipDismissed && (
            <div style={{
              padding: '0.75rem 1rem',
              background: `linear-gradient(135deg, ${uaColors.arizonaBlue}15 0%, ${uaColors.arizonaBlue}08 100%)`,
              borderBottom: `1px solid ${uaColors.slate[200]}`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              fontSize: '0.875rem',
              color: uaColors.slate[700],
              animation: 'slideDown 0.3s ease'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={uaColors.arizonaBlue} strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4"/>
                <path d="M12 8h.01"/>
              </svg>
              <div style={{ flex: 1 }}>
                <strong style={{ color: uaColors.arizonaBlue, display: 'block', marginBottom: '0.25rem' }}>
                  💬 Communication Tip
                </strong>
                <span>
                  You can ask the patient questions during physical examination, like "Does this hurt?" or "Can you feel this?"
                </span>
              </div>
              <button
                onClick={() => setTipDismissed(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  color: uaColors.slate[500],
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = uaColors.slate[200];
                  e.target.style.color = uaColors.slate[900];
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'none';
                  e.target.style.color = uaColors.slate[500];
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 4L4 12M4 4l8 8"/>
                </svg>
              </button>
            </div>
          )}
          
          <div 
            ref={chatBoxRef} 
            className="chatbot-messages" 
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              background: uaColors.slate[50],
              height: 'calc(100% - 130px)',
              transition: 'height 0.3s ease',
              pointerEvents: 'auto',
              minHeight: '0',
              maxHeight: '100%'
            }}
          >
            {messages.length === 0 ? (
              <div style={{
                background: uaColors.white,
                padding: '1rem',
                borderRadius: '12px',
                color: uaColors.slate[700],
                textAlign: 'center',
                border: `1px solid ${uaColors.slate[200]}`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <div>Error: Failed to fetch.</div>
                <div>Please try again</div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div 
                  key={index} 
                  style={{
                    alignSelf: message.sender === "user" ? 'flex-end' : 'flex-start',
                    maxWidth: '75%',
                    background: message.sender === "user" ? uaColors.arizonaRed : uaColors.white,
                    color: message.sender === "user" ? uaColors.white : uaColors.slate[700],
                    padding: '0.875rem 1rem',
                    borderRadius: '12px',
                    border: message.sender === "user" ? 'none' : `1px solid ${uaColors.slate[200]}`,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    fontSize: '0.875rem',
                    lineHeight: '1.5'
                  }}
                >
                  {message.text}
                </div>
              ))
            )}
            {isLoading && (
              <div style={{
                background: uaColors.white,
                padding: '1rem',
                borderRadius: '12px',
                color: uaColors.slate[700],
                border: `1px solid ${uaColors.slate[200]}`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                  <span style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: uaColors.slate[400],
                    animation: 'bounce 1.4s infinite ease-in-out both',
                    animationDelay: '0s'
                  }}></span>
                  <span style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: uaColors.slate[400],
                    animation: 'bounce 1.4s infinite ease-in-out both',
                    animationDelay: '0.2s'
                  }}></span>
                  <span style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: uaColors.slate[400],
                    animation: 'bounce 1.4s infinite ease-in-out both',
                    animationDelay: '0.4s'
                  }}></span>
                </div>
              </div>
            )}
          </div>
          
          <div style={{
            padding: '1rem',
            display: 'flex',
            background: uaColors.white,
            borderTop: `1px solid ${uaColors.slate[200]}`,
            alignItems: 'center',
            gap: '0.75rem',
            minHeight: '70px',
            transition: 'min-height 0.3s ease',
            position: 'relative'
          }}>
            {/* Status indicators */}
            {!isMicEnabled && (
              <div style={{
                position: 'absolute',
                top: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: uaColors.slate[200],
                color: uaColors.slate[700],
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '10px',
                fontWeight: '500',
                zIndex: 1002
              }}>
                🎤 Mic Off
              </div>
            )}
            {isSpeaking && (
              <div style={{
                position: 'absolute',
                top: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: uaColors.arizonaRed,
                color: uaColors.white,
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '10px',
                fontWeight: '500',
                zIndex: 1002
              }}>
                🤖 AI is Speaking
              </div>
            )}
            {isVoiceActive && isMicEnabled && !isSpeaking && (
              <div style={{
                position: 'absolute',
                top: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#10B981',
                color: uaColors.white,
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '10px',
                fontWeight: '500',
                zIndex: 1002,
                animation: 'pulse 1s infinite'
              }}>
                🎤 Listening...
              </div>
            )}
            <textarea
              ref={inputRef}
              value={userInput}
              onChange={handleInputChange}
              data-current-value={userInput}
              onKeyDown={(e) => {
                // Set typing state immediately
                setIsUserTyping(true);
                isUserTypingRef.current = true;
                
                if (e.key === 'Enter' && !e.shiftKey && userInput.trim() && !isLoading) {
                  handleSubmit();
                  e.preventDefault();
                }
              }}
              onInput={handleInputChange}
              onFocus={(e) => {
                // Keep focus without reselecting text to avoid overwriting while typing
                // Clear any existing timeout
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                  typingTimeoutRef.current = null;
                }
                // Apply focus styling
                e.target.style.borderColor = uaColors.arizonaBlue;
                e.target.style.boxShadow = `0 0 0 3px rgba(12, 35, 75, 0.1)`;
              }}
              onBlur={(e) => {
                // Don't immediately clear typing state on blur (Unity might steal focus)
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }
                typingTimeoutRef.current = setTimeout(() => {
                  setIsUserTyping(false);
                }, 2000); // Increased delay to prevent rapid focus loss
                // Remove focus styling
                e.target.style.borderColor = uaColors.slate[300];
                e.target.style.boxShadow = 'none';
              }}
              placeholder="Type your message here..."
              data-debug={`loading:${isLoading},speaking:${isSpeaking}`}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                border: `1px solid ${uaColors.slate[300]}`,
                borderRadius: '8px',
                fontSize: '0.875rem',
                outline: 'none',
                background: uaColors.white,
                color: uaColors.slate[700],
                caretColor: uaColors.slate[600],
                zIndex: 1001,
                cursor: 'text',
                pointerEvents: 'auto',
                height: '40px',
                minHeight: '40px',
                maxHeight: '120px',
                resize: 'none',
                transition: 'all 0.2s ease',
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.4',
                overflowY: 'auto',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                scrollbarWidth: 'thin'
              }}
            />
            <button 
              onClick={handleToggleMic}
              disabled={isLoading || isSpeaking}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${uaColors.slate[200]}`,
                cursor: 'pointer',
                background: isVoiceActive ? uaColors.arizonaRed : isMicEnabled ? uaColors.arizonaRed : uaColors.slate[100],
                color: 'white',
                padding: 0,
                transition: 'all 0.2s ease',
                pointerEvents: 'auto',
                zIndex: 1001,
                position: 'relative',
                outline: 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              title={isMicEnabled ? "Turn off microphone" : "Turn on microphone"}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" style={{ fill: 'none', stroke: 'white', strokeWidth: 2 }}>
                <path d="M12 2c-1.7 0-3 1.2-3 2.7v7c0 1.5 1.3 2.7 3 2.7s3-1.2 3-2.7v-7c0-1.5-1.3-2.7-3-2.7z" fill="white"></path>
                <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18.5V22"></path>
                {!isMicEnabled && <line x1="8" y1="8" x2="16" y2="16" stroke="white" strokeWidth="2"></line>}
              </svg>
            </button>
            <button 
              onClick={() => handleSubmit()}
              disabled={isLoading || isSpeaking || !userInput.trim()}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${uaColors.slate[200]}`,
                cursor: userInput.trim() && !isLoading && !isSpeaking ? 'pointer' : 'not-allowed',
                background: userInput.trim() && !isLoading && !isSpeaking ? uaColors.arizonaRed : uaColors.slate[300],
                color: 'white',
                padding: 0,
                transition: 'all 0.2s ease',
                pointerEvents: 'auto',
                zIndex: 1001,
                position: 'relative',
                outline: 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                opacity: userInput.trim() && !isLoading && !isSpeaking ? 1 : 0.6
              }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" style={{ fill: 'none', stroke: 'white', strokeWidth: 2 }}>
                <path d="M22 2L11 13M22 2L15 22 11 13 2 9 22 2z"></path>
              </svg>
            </button>
          </div>
          
          <div className="chat-footer" style={{
            padding: '1rem 1.5rem',
            background: uaColors.white,
            borderTop: `1px solid ${uaColors.slate[200]}`
          }}>
            <div className="session-buttons-container">
              <button
                className="submit-button"
                onClick={() => {
                  const aimmsfront = import.meta.env.VITE_AIMMS_FRONTEND || 'https://aidset.ai';
                  window.location.href = `${aimmsfront}/student-dashboard`;
                }}
                disabled={isSessionEnded || isLoading || isSpeaking}
                style={{
                  backgroundColor: uaColors.slate[100],
                  color: uaColors.slate[700],
                  border: `1px solid ${uaColors.slate[200]}`,
                  padding: '0.5rem 1.125rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  minWidth: '80px',
                  marginRight: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = uaColors.slate[200];
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = uaColors.slate[100];
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Close
              </button>
              {messages.length > 0 && onEndSession && (
                <EndSessionButton 
                  onEndSession={onEndSession}
                  conversation={messages}
                  sessionId={sessionId}
                  disabled={isSessionEnded || isLoading || isSpeaking}
                />
              )}
            </div>
          </div>
          
          <style>{`
            @keyframes bounce {
              0%, 80%, 100% { 
                transform: scale(0.6);
              } 
              40% { 
                transform: scale(1);
              }
            }

            @keyframes pulse {
              0%, 100% {
                opacity: 1;
              }
              50% {
                opacity: 0.7;
              }
            }

            .chatbot-messages::-webkit-scrollbar {
              width: 6px;
            }

            .chatbot-messages::-webkit-scrollbar-track {
              background: rgba(0, 0, 0, 0.1);
              border-radius: 3px;
            }

            .chatbot-messages::-webkit-scrollbar-thumb {
              background: ${uaColors.slate[400]};
              border-radius: 3px;
            }

            .chatbot-messages::-webkit-scrollbar-thumb:hover {
              background: ${uaColors.slate[500]};
            }

            .chatbot-window {
              transition: all 0.3s ease;
            }

            .chatbot-window input {
              transition: all 0.2s ease;
            }

            @media (max-width: 768px) {
              .chatbot-window {
                height: 400px;
              }
            }

            .session-buttons-container {
              display: flex;
              justify-content: center;
              gap: 0.75rem;
              align-items: center;
              flex-wrap: wrap;
              padding: 0;
            }

            textarea::-webkit-scrollbar {
              width: 6px;
            }
            textarea::-webkit-scrollbar-thumb {
              background-color: ${uaColors.slate[400]};
              border-radius: 10px;
            }
            textarea::-webkit-scrollbar-track {
              background-color: transparent;
            }
          `}</style>
        </div>
      )}
    </>
  );
};

export default ChatInterface;