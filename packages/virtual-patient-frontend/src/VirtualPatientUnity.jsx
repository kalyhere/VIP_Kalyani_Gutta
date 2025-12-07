import React, { useState, useRef, useEffect } from "react";
import UnityViewer from "./UnityViewer";
import ChatInterface from "./ChatInterface";
import MedicalUI from "./MedicalUI";
import VitalsMonitor from "./VitalsMonitor";
import { useVoiceInteraction } from "./utils/VoiceInteractionManager";
import { Unity, useUnityContext } from "react-unity-webgl";
// TEMPORARY: Using Three.js scene instead of Unity
import ThreeJSScene from "./ThreeJSScene";
import { useVitalsSimulation } from "./useVitalsSimulation";
import ThreeDPhysicalExam from "./ThreeDPhysicalExam";
import { detectPatientGender } from "./utils/patientGenderDetector";

// Global flag to prevent multiple session initializations
let globalSessionInitInProgress = false;

// Overlay style for UI elements
const overlayStyle = {
  position: "absolute",
  zIndex: 2000,
  width: "100%",
  display: "flex",
  justifyContent: "center",
  top: 24, // adjust as needed
  pointerEvents: "none", // allow Unity to receive pointer events except for children
};

const buttonPanelStyle = {
  pointerEvents: "auto", // allow interaction with buttons
  display: "flex",
  gap: 16,
};

const chatOverlayStyle = {
  position: "absolute",
  zIndex: 10005, // Higher than PhysicalExamInterface (10004) to stay on top
  bottom: 24,
  right: 24,
  pointerEvents: "auto",
  maxWidth: 400,
};

export default function VirtualPatientUnity() {
  // --- Session and Chat State ---
  const [sessionId, setSessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const sessionInitializedRef = useRef(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPhysicalExamBanner, setShowPhysicalExamBanner] = useState(false);
  const [isPhysicalExamActive, setIsPhysicalExamActive] = useState(false);
  const { startBotSpeaking, stopBotSpeaking } = useVoiceInteraction();
  const audioElementRef = useRef(null);

  // --- Unity Loading State ---
  const unityExternalPath = "https://storage.googleapis.com/vp-model-storage/unity/Builds/Build/";
  // Use Google Cloud Storage for Unity build files
  const { unityProvider, isLoaded, loadingProgression, sendMessage } = useUnityContext({
    loaderUrl: `${unityExternalPath}Builds.loader.js`,
    dataUrl: `${unityExternalPath}Builds.data`,
    frameworkUrl: `${unityExternalPath}Builds.framework.js`,
    codeUrl: `${unityExternalPath}Builds.wasm`,
  });

  // --- Patient Data State ---
  const [mccData, setMccData] = useState(null);
  const [patientGender, setPatientGender] = useState("female"); // Default to female

  // Track when Unity is fully ready for communication
  const [unityReady, setUnityReady] = useState(false);
  const [currentPose, setCurrentPose] = useState('sitting'); // Track current pose
  const [showVitalsMonitor, setShowVitalsMonitor] = useState(false); // Track monitoring mode
  const [showVitalsSettings, setShowVitalsSettings] = useState(false); // Track vitals settings panel
  const [showTestExamine, setShowTestExamine] = useState(false); // Track test examine mode (3D examination)
  
  // Handler to ensure we always return to sitting pose when closing interfaces
  const handleReturnToDefault = () => {
    setCurrentPose('sitting');
    setShowVitalsMonitor(false);
    setShowVitalsSettings(false);
    setShowTestExamine(false);
  };

  // Handler for test examine mode - switch to lying down with examination interface
  const handleTestExamineClick = () => {
    setShowTestExamine(true);
    setCurrentPose('lying_down');
    setShowVitalsMonitor(false); // Hide vitals when examining
  };

  // Vitals simulation for monitoring mode
  const { vitals } = useVitalsSimulation();

  // Switch to lying down pose when monitoring is enabled
  useEffect(() => {
    if (showVitalsMonitor) {
      setCurrentPose('lying_down');
      setShowTestExamine(false); // Hide test examine when monitoring
    } else if (!showTestExamine) {
      setCurrentPose('sitting');
    }
  }, [showVitalsMonitor, showTestExamine]);

  // --- Extra delay after Unity isLoaded ---
  // TEMPORARY: Force UI to show immediately for Three.js scene
  const [showOverlayUI] = useState(true);
  useEffect(() => {
    // TEMPORARY: Set ready immediately for Three.js
    setUnityReady(true);

    /* COMMENTED OUT: Unity loading check - uncomment to restore Unity
    let timeout;
    if (isLoaded) {
      // Set Unity as ready after a longer delay to ensure it's fully initialized
      timeout = setTimeout(() => {
        setShowOverlayUI(true);
        setUnityReady(true);
        console.log('Unity is now ready for communication');

        // Send any pending image requests when Unity is ready
        if (window.pendingImageRequests && window.pendingImageRequests.length > 0) {
          console.log('Unity ready, sending pending image requests...');

          window.pendingImageRequests.forEach(request => {
            console.log('Sending pending image request:', request);
            try {
              if (sendMessage) {
                sendMessage(
                  "ImageLoaderFromReact",
                  "DisplayImageForRegion",
                  `${request.regionId}|${request.imageUrl}`
                );
                console.log('Successfully sent message to Unity');
              } else {
                console.error('sendMessage function not available');
              }
            } catch (error) {
              console.error('Error sending message to Unity:', error);
            }
          });
          window.pendingImageRequests = []; // Clear the pending requests
        }
      }, 8000); // 8 seconds total delay for Unity to be fully ready
    } else {
      setShowOverlayUI(false);
      setUnityReady(false);
    }
    return () => clearTimeout(timeout);
    */
  }, []);

  // Set Unity session and API URL once Unity is ready
  useEffect(() => {
    if (unityReady && sendMessage && sessionId) {
      try {
        sendMessage("SaveManager", "SetSessionId", sessionId);
        console.log(`Set Unity session ID: ${sessionId}`);
      } catch (error) {
        console.error('Error setting Unity session ID:', error);
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      try {
        sendMessage("SaveManager", "SetApiBaseUrl", apiBaseUrl);
        console.log(`Set Unity API base URL: ${apiBaseUrl}`);
      } catch (error) {
        console.error('Error setting Unity API base URL:', error);
      }
    }
  }, [unityReady, sendMessage, sessionId]);

  // Cleanup audio element on unmount
  useEffect(() => {
    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
    };
  }, []);


  // Monitor when physical examination is active
  useEffect(() => {
    // Listen for physical exam button clicks
    const checkPhysicalExamState = () => {
      // Check if physical exam interface is visible
      const physicalExamInterface = document.querySelector('.physical-exam-container');
      const isActive = physicalExamInterface && window.getComputedStyle(physicalExamInterface).display !== 'none';
      setIsPhysicalExamActive(isActive);
    };

    // Set up mutation observer to detect when physical exam interface appears/disappears
    const observer = new MutationObserver(checkPhysicalExamState);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });

    // Initial check
    checkPhysicalExamState();

    // Also check periodically as backup
    const interval = setInterval(checkPhysicalExamState, 1000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  // --- Session Initialization ---
  useEffect(() => {
    const loadSession = async () => {
      const maxRetries = 3;
      let retryCount = 0;
      const initializeSession = async () => {
        try {
          // Check if session is already initialized
          if (sessionInitializedRef.current) {
            return true;
          }

          // Check global flag to prevent multiple simultaneous initializations
          if (globalSessionInitInProgress) {
            return false; // Will retry after delay
          }

          globalSessionInitInProgress = true;

          // First check for launch token in URL query parameters (from AIMMS)
          const urlParams = new URLSearchParams(window.location.search);
          const launchToken = urlParams.get('token');

          if (launchToken) {
            // Verify token with AIMMS backend and get case data
            const aimmsBackendUrl = import.meta.env.VITE_AIMMS_BACKEND_URL || 'http://localhost:8000';
            const virtualPatientApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

            console.log('=== TOKEN VERIFICATION DEBUG ===');
            console.log('Launch token extracted:', launchToken);
            console.log('AIMMS Backend URL:', aimmsBackendUrl);
            console.log('Current URL:', window.location.href);
            console.log('URL Search params:', window.location.search);

            const verifyResponse = await fetch(`${aimmsBackendUrl}/api/virtual-patient/verify-launch`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ launch_token: launchToken })
            });

            console.log('Verify response status:', verifyResponse.status);
            console.log('Verify response headers:', Object.fromEntries(verifyResponse.headers.entries()));

            if (!verifyResponse.ok) {
              const errorText = await verifyResponse.text();
              console.error('Token verification failed:', {
                status: verifyResponse.status,
                statusText: verifyResponse.statusText,
                errorBody: errorText,
                sentToken: launchToken
              });
              throw new Error(`Token verification failed: ${verifyResponse.status} - ${errorText}`);
            }

            const tokenData = await verifyResponse.json();

            // Store MCC data and extract patient gender
            setMccData(tokenData);
            const gender = detectPatientGender(tokenData);
            setPatientGender(gender);

            // Check if there's an existing session to resume
            let response;
            if (tokenData.has_previous_sessions && tokenData.latest_session_id) {
              // Resume existing session
              response = await fetch(`${virtualPatientApiUrl}/api/resume-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sessionId: tokenData.latest_session_id,
                  caseData: tokenData,
                  assignmentId: tokenData.assignment_id
                })
              });
            } else {
              // Create new session
              response = await fetch(`${virtualPatientApiUrl}/api/init-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  caseData: tokenData,
                  assignmentId: tokenData.assignment_id
                })
              });
            }

            if (!response.ok) {
              throw new Error(`Failed to initialize/resume session: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            if (!data.sessionId) {
              throw new Error('No session ID in response');
            }

            setSessionId(data.sessionId);
            sessionInitializedRef.current = true;
            globalSessionInitInProgress = false;

            // Handle previous messages for resumed sessions
            if (data.previousMessages && data.previousMessages.length > 0) {
              const formattedMessages = data.previousMessages.map(msg => ({
                text: msg.content,
                sender: msg.type === 'user' ? 'user' : 'bot'
              }));
              formattedMessages.unshift({
                text: `Welcome back to the Virtual Patient Simulation for ${tokenData.title}.`,
                sender: "bot"
              });
              setMessages(formattedMessages);
            } else {
              setMessages([{
                text: `Welcome to the Virtual Patient Simulation for ${tokenData.title}.`,
                sender: "bot"
              }]);
            }
            return true;
          }

          // Check for existing session ID in hash parameters (for resumption)
          const hashParams = new URLSearchParams(window.location.hash.substring(2)); // Remove #/
          const sid = hashParams.get('sessionId');
          if (sid) {
            setSessionId(sid);
            sessionInitializedRef.current = true;
            globalSessionInitInProgress = false;
            setMessages([{ text: "Welcome to the Virtual Patient Simulation.", sender: "bot" }]);
            return true;
          }

          // Fallback: initialize with static case data (development mode)
          const virtualPatientApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
          const response = await fetch(`${virtualPatientApiUrl}/api/init-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          });

          if (!response.ok) {
            throw new Error(`Failed to initialize session: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();
          if (!data.sessionId) {
            throw new Error('No session ID in response');
          }

          setSessionId(data.sessionId);
          sessionInitializedRef.current = true;
          globalSessionInitInProgress = false;
          setMessages([{ text: "Welcome to the Virtual Patient Simulation.", sender: "bot" }]);
          return true;

        } catch (error) {
          globalSessionInitInProgress = false;
          return false;
        }
      };

      // Try to initialize session with retries
      while (retryCount < maxRetries) {
        const success = await initializeSession();
        if (success) break;

        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
        }
      }

      if (retryCount === maxRetries) {
        setMessages([{
          text: "Sorry, there was an error initializing the session. Please refresh the page to try again.",
          sender: "bot"
        }]);
      }
    };

    if (!sessionInitializedRef.current) {
      loadSession();
    }
  }, []);



  // --- Audio Cleanup ---
  useEffect(() => {
    return () => {
      stopAndClearAudio();
    };
  }, []);

  // --- Audio Playback ---
  const audioRef = useRef(null);
  const stopAndClearAudio = () => {
    if (audioRef.current) {
      try {
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      } catch (err) {}
    }
    setIsSpeaking(false);
  };

  // Add useEffect to track state changes
  useEffect(() => {
    console.log('State updated:', { 
      sessionId, 
      isLoading, 
      isSpeaking, 
      messages: messages.length 
    });
  }, [sessionId, isLoading, isSpeaking, messages]);

  // Listen for gender changes from ChatInterface
  useEffect(() => {
    const handleGenderChange = (event) => {
      const { gender } = event.detail;
      console.log('🎭 VirtualPatientUnity: Received gender change event:', gender);
      setPatientGender(gender);
    };

    window.addEventListener('patientGenderChanged', handleGenderChange);
    return () => {
      window.removeEventListener('patientGenderChanged', handleGenderChange);
    };
  }, []);

  // --- Chat Send Handler ---
  const handleSendMessage = async (message) => {
    console.log('handleSendMessage called with message:', message);
    console.log('Current state:', { isLoading, isSpeaking, sessionId });
    
    if (isLoading || isSpeaking || !sessionId) {
      console.log('Cannot send message:', { isLoading, isSpeaking, sessionId });
      return;
    }

    try {
      setIsLoading(true);
      
      // Add user message to chat
      setMessages(prev => [...prev, { text: message, sender: 'user' }]);
      
      console.log('Sending message to API with sessionId:', sessionId);
      const virtualPatientApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const response = await fetch(`${virtualPatientApiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, sessionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      console.log('📥 Received response from API:', data);
      console.log('🔍 suggestPhysicalExam value:', data.suggestPhysicalExam);
      console.log('🔍 Type of suggestPhysicalExam:', typeof data.suggestPhysicalExam);

      // Check if physical exam is suggested
      if (data.suggestPhysicalExam === true) {
        setShowPhysicalExamBanner(true);
        // Auto-hide banner after 10 seconds
        setTimeout(() => {
          setShowPhysicalExamBanner(false);
        }, 10000);
      }

      // Add the bot's response to chat
      setMessages(prev => [...prev, { text: data.text, sender: 'bot' }]);

      // Play audio if available
      if (data.audio) {
        console.log('Audio data received:', data.audio);
        setIsSpeaking(true);
        startBotSpeaking();
        
        try {
          const audioUrl = `${virtualPatientApiUrl}${data.audio}`;
          console.log('Playing audio from URL:', audioUrl);
          
          // Stop any existing audio
          if (audioElementRef.current) {
            audioElementRef.current.pause();
            audioElementRef.current = null;
          }
          
          const audio = new Audio(audioUrl);
          audioElementRef.current = audio;
          
          // Add more detailed event listeners
          audio.addEventListener('loadstart', () => console.log('Audio loading started'));
          audio.addEventListener('loadeddata', () => console.log('Audio data loaded'));
          audio.addEventListener('canplay', () => console.log('Audio can play'));
          audio.addEventListener('play', () => console.log('Audio playback started'));
          audio.addEventListener('playing', () => console.log('Audio is playing'));
          audio.addEventListener('pause', () => console.log('Audio paused'));
          audio.addEventListener('ended', () => {
            console.log('Audio playback completed successfully');
            setIsSpeaking(false);
            stopBotSpeaking();
            audioElementRef.current = null;
          });
          audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            console.error('Audio error details:', {
              error: audio.error,
              networkState: audio.networkState,
              readyState: audio.readyState
            });
            setIsSpeaking(false);
            stopBotSpeaking();
            audioElementRef.current = null;
          });

          // Try to play the audio
          console.log('Attempting to play audio...');
          audio.play().then(() => {
            console.log('Audio play() promise resolved');
          }).catch(error => {
            console.error("Audio play error:", error);
            console.error("Audio error details:", {
              error: audio.error,
              networkState: audio.networkState,
              readyState: audio.readyState
            });
            setIsSpeaking(false);
            stopBotSpeaking();
            audioElementRef.current = null;
          });
        } catch (error) {
          console.error('Error playing audio:', error);
          setIsSpeaking(false);
          stopBotSpeaking();
        }
      } else {
        console.log('No audio data in response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        text: 'Error: Failed to send message. Please try again.', 
        sender: 'bot', 
        isError: true 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Session End Handler ---
  const handleEndSession = async () => {
    if (isSubmitting || isSessionEnded) return;
    setIsSubmitting(true);
    setIsSessionEnded(true);
    const virtualPatientApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    const aimmsfront = import.meta.env.VITE_AIMMS_FRONTEND || 'http://localhost:5173';
    const formattedConversation = messages.map(msg => ({ sender: msg.sender, text: msg.text }));
    
    // Optimistic exit - show success immediately and redirect
    alert('✅ Virtual patient session submitted successfully!\n\nYour session has been sent to faculty for grading. Results will be available on your dashboard once analysis is complete.');
    
    // Continue processing in background - if it fails, the case will remain in progress state
    fetch(`${virtualPatientApiUrl}/api/transcripts/submit-to-aimhei`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation: formattedConversation, sessionId })
    }).catch(error => {
      console.error('Background submission failed:', error);
      // Let the error be handled silently - user already redirected
    });
    
    // Redirect to student dashboard after a brief moment to ensure alert is dismissed
    const studentDashboardUrl = `${aimmsfront}/student-dashboard`;
    setTimeout(() => {
      window.location.href = studentDashboardUrl;
    }, 3000);
    
    setIsSubmitting(false);
  };

  // --- Unity-React Communication for Body Part Images (enhanced via backend) ---
  useEffect(() => {
    // Enhanced global function that Unity will call
    window.onBodyPartClicked = async (regionId) => {
      console.log('Unity clicked body part:', regionId);
      
      if (!sessionId) {
        console.error('No session ID available');
        return;
      }

      const virtualPatientApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const imageApiUrl = `${virtualPatientApiUrl}/api/unity/image-url/${regionId}/${sessionId}`;
      
      try {
        console.log('Fetching image URL from backend:', imageApiUrl);
        const response = await fetch(imageApiUrl);
        const data = await response.json();
        
        if (data.success && data.imageUrl) {
          console.log(`Got image URL for ${regionId}:`, data.imageUrl);
          
          if (unityReady && sendMessage) {
            try {
              sendMessage(
                "ImageLoaderFromReact", // GameObject name in Unity
                "DisplayImageForRegion",
                `${regionId}|${data.imageUrl}`
              );
              console.log('Successfully sent image URL to Unity');
            } catch (error) {
              console.error('Error sending image URL to Unity:', error);
              if (!window.pendingImageRequests) window.pendingImageRequests = [];
              window.pendingImageRequests.push({ regionId, imageUrl: data.imageUrl });
            }
          } else {
            console.log('Unity not ready, storing image request for later...');
            if (!window.pendingImageRequests) window.pendingImageRequests = [];
            window.pendingImageRequests.push({ regionId, imageUrl: data.imageUrl });
          }
        } else {
          console.warn(`No image available for region: ${regionId}`);
          if (unityReady && sendMessage) {
            sendMessage("ImageLoaderFromReact", "ShowImageNotAvailable", regionId);
          }
        }
      } catch (error) {
        console.error('Error fetching image URL from backend:', error);
        if (unityReady && sendMessage) {
          sendMessage("ImageLoaderFromReact", "ShowImageError", regionId);
        }
      }
    };

    // Cleanup function
    return () => {
      if (window.onBodyPartClicked) {
        delete window.onBodyPartClicked;
      }
    };
  }, [sessionId, unityReady, sendMessage]);

  // Trigger Unity to load case data from backend when ready
  useEffect(() => {
    if (unityReady && sendMessage && sessionId) {
      console.log('Triggering Unity to load case data...');
      try {
        sendMessage("SaveManager", "LoadCaseData", "");
      } catch (error) {
        console.error('Error triggering Unity case data load:', error);
      }
    }
  }, [unityReady, sendMessage, sessionId]);

  // Optional manual tester (not rendered by default)
  const testUnityBackendIntegration = async () => {
    if (!sessionId) {
      console.error('No session ID for testing');
      return;
    }
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    try {
      console.log('Testing case data endpoint...');
      const caseResponse = await fetch(`${apiBaseUrl}/api/unity/case-data/${sessionId}`);
      const caseData = await caseResponse.json();
      console.log('Case data response:', caseData);
      console.log('Testing image endpoint...');
      const imageResponse = await fetch(`${apiBaseUrl}/api/unity/image-url/head/${sessionId}`);
      const imageData = await imageResponse.json();
      console.log('Image response:', imageData);
    } catch (error) {
      console.error('Backend integration test failed:', error);
    }
  };

  // --- MedicalUI: Only show backend-connected buttons (exclude Poses/Physical Exam) ---
  // You may need to customize this prop depending on your MedicalUI implementation
  // Handle monitoring button click - switch to lying down pose and show vitals
  const handleMonitoringClick = () => {
    if (!showVitalsMonitor) {
      // When turning ON monitoring, switch to lying down pose
      setCurrentPose('lying_down');
      setShowVitalsMonitor(true);
    } else {
      // When turning OFF monitoring, return to sitting pose
      setShowVitalsMonitor(false);
      setCurrentPose('sitting');
    }
  };

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
      {/* TEMPORARY: Three.js scene instead of Unity */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <ThreeJSScene 
          pose={currentPose}
          patientGender={patientGender}
          onBack={handleReturnToDefault}
          onClose={handleReturnToDefault}
          onSettingsToggle={setShowVitalsSettings}
        />
      </div>

      {/* COMMENTED OUT: Unity WebGL build - uncomment to restore Unity
      <Unity
        unityProvider={unityProvider}
        style={{ width: "100vw", height: "100vh", background: "#000" }}
      />
      */}

      {/* TEMPORARY: Loading overlay hidden for Three.js
      {(!isLoaded || !showOverlayUI) && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "#111",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column"
          }}
        >
          <div style={{
            color: "#fff",
            fontSize: 24,
            fontWeight: 500,
            textAlign: "center"
          }}>
            Loading simulation... {Math.round(loadingProgression * 100)}%
          </div>
        </div>
      )}
      */}
      {/* Overlay: Backend-connected buttons (including Physical Exam) */}
      {/* TEMPORARY: Always show UI for Three.js */}
      {showOverlayUI && (
        <div style={overlayStyle}>
          <div style={buttonPanelStyle}>
            <MedicalUI
              mccData={mccData}
              onlyShowButtons={["chat", "poses", "tests", "monitoring", "physical_exam", "test_examine", "medication"]}
              onPoseChange={setCurrentPose}
              currentPose={currentPose}
              showVitalsMonitor={showVitalsMonitor}
              setShowVitalsMonitor={setShowVitalsMonitor}
              onMonitoringClick={handleMonitoringClick}
              onTestExamineClick={handleTestExamineClick}
              onReturnToDefault={handleReturnToDefault}
            />
          </div>
        </div>
      )}

      {/* Vitals Monitor on left side when monitoring is active */}
      {showVitalsMonitor && (
        <div style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: '350px',
          zIndex: 2000,
          pointerEvents: 'none'
        }}>
          <VitalsMonitor
            vitals={vitals}
            onClose={null}
            hideHeader={true}
            showSettings={showVitalsSettings}
            onSettingsToggle={setShowVitalsSettings}
          />
        </div>
      )}

      {/* 3D Examination Interface - overlays on top of 3D scene */}
      {showTestExamine && (
        <ThreeDPhysicalExam
          onClose={handleReturnToDefault}
          patientGender={patientGender}
        />
      )}

      {/* Chat overlay */}
      <div style={chatOverlayStyle}>
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          isSpeaking={isSpeaking}
          sessionId={sessionId}
          isSessionEnded={isSessionEnded}
          onEndSession={handleEndSession}
          externalControl={true}
          mccData={mccData}
          patientGender={patientGender}
        />
      </div>
    </div>
  );
} 
