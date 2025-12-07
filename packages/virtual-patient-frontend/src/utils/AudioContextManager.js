class AudioContextManager {
  constructor() {
    this.audioContext = null;
    this.mediaStream = null;
    this.gainNode = null;
    this.isInitialized = false;
    this.isMicEnabled = false;
    this.source = null;
    this.isBotSpeaking = false;
    this.originalTracks = null;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('Initializing audio context manager...');
      
      // Create audio context first
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('Audio context created');

      // Request microphone access with echo cancellation
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          googEchoCancellation: true,
          googAutoGainControl: true,
          googNoiseSuppression: true,
          googHighpassFilter: true
        }
      });
      console.log('Microphone access granted successfully');

      // Store original tracks for later restoration
      this.originalTracks = this.mediaStream.getAudioTracks();

      // Create gain node
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 0.5; // Start with gain at 0.5 (active)
      
      // Create media stream source
      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      // Connect source to gain node but NOT to destination
      // This prevents echo by not routing mic input to speakers
      this.source.connect(this.gainNode);

      this.isInitialized = true;
      this.isMicEnabled = true;
      console.log('Audio context manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      this.isInitialized = false;
      this.isMicEnabled = false;
      throw error;
    }
  }

  getMediaStream() {
    if (this.isBotSpeaking) {
      console.log('Cannot get media stream while bot is speaking');
      return null;
    }
    return this.mediaStream;
  }

  setGain(value) {
    if (this.gainNode) {
      this.gainNode.gain.value = value;
      console.log(`Gain set to ${value}`);
    }
  }

  stop() {
    this.cleanup();
    this.isInitialized = false;
    this.isMicEnabled = false;
    this.isBotSpeaking = false;
    console.log('Audio context stopped and cleaned up');
  }

  cleanup() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => {
        track.stop();
      });
      this.mediaStream = null;
    }

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.originalTracks = null;
  }

  // Method to completely disable the microphone
  disableMicrophone() {
    console.log('Disabling microphone completely');
    
    // Stop all tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => {
        track.stop();
      });
      this.mediaStream = null;
    }

    // Disconnect and cleanup audio nodes
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isMicEnabled = false;
    this.isInitialized = false;
    console.log('Microphone disabled successfully');
  }

  // Method to enable the microphone
  async enableMicrophone() {
    if (this.isBotSpeaking) {
      console.log('Cannot enable microphone while bot is speaking');
      return;
    }

    try {
      // Clean up any existing resources
      this.cleanup();

      // Request new microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          googEchoCancellation: true,
          googAutoGainControl: true,
          googNoiseSuppression: true,
          googHighpassFilter: true
        }
      });

      // Create new audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 0.5;
      
      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.source.connect(this.gainNode);

      this.isMicEnabled = true;
      this.isInitialized = true;
      console.log('Microphone enabled successfully');
    } catch (error) {
      console.error('Failed to enable microphone:', error);
      this.isMicEnabled = false;
      throw error;
    }
  }

  // Method to check if microphone is enabled
  isMicrophoneEnabled() {
    return this.isMicEnabled && !this.isBotSpeaking && this.mediaStream?.getAudioTracks().some(track => track.enabled);
  }

  // Method to set bot speaking state
  setBotSpeaking(isSpeaking) {
    console.log(`Setting bot speaking state to: ${isSpeaking}`);
    
    // Only process if state is actually changing
    if (this.isBotSpeaking === isSpeaking) {
      console.log(`Bot speaking state already ${isSpeaking}, skipping`);
      return;
    }
    
    this.isBotSpeaking = isSpeaking;
    
    // Don't automatically disable microphone - let VoiceInteractionManager handle it
    // The AudioContextManager should only track the bot speaking state
  }
}

// Create a singleton instance
export const audioContextManager = new AudioContextManager(); 