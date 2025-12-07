import React, { useEffect, useState } from "react";
import { Suspense } from "react";
import { useGLTF } from "@react-three/drei";
import { VoiceInteractionProvider } from "./utils/VoiceInteractionManager";
import VirtualPatientUnity from "./VirtualPatientUnity";
import "./App.css";

// List of all model URLs to preload
const MODEL_URLS = [
  "https://storage.googleapis.com/vp-model-storage/girlpat.glb",
  "https://storage.googleapis.com/vp-model-storage/fp.glb",
  "https://storage.googleapis.com/vp-model-storage/fempatanim.glb",
  "https://storage.googleapis.com/vp-model-storage/newanimation.glb",
  "https://storage.googleapis.com/vp-model-storage/animations.glb",
  "https://storage.googleapis.com/vp-model-storage/newexamroom.glb",
  "https://storage.googleapis.com/vp-model-storage/HospitalRoom/HospitalRoom.gltf",
];

function LoadingScreen({ progress }) {
  return (
    <div className="global-loading-screen">
      <div className="loading-text">Loading Virtual Patient...</div>
      <div className="loading-bar">
        <div
          className="loading-bar-progress"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <style>{`
        .global-loading-screen {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: #111;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        .loading-text {
          font-size: 24px;
          color: #fff;
          margin-bottom: 16px;
          font-weight: 500;
          text-align: center;
        }
        .loading-bar {
          width: 320px;
          height: 12px;
          background: #333;
          border-radius: 8px;
          overflow: hidden;
        }
        .loading-bar-progress {
          height: 100%;
          background: #fff;
          transition: width 0.3s;
        }
        @media (max-width: 600px) {
          .loading-bar { width: 80vw; }
        }
      `}</style>
    </div>
  );
}

function App() {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const start = Date.now();
    let loadingTimeout;
    let loadedCount = 0;
    const totalModels = MODEL_URLS.length;
    
    console.log('🎮 Starting Virtual Patient model preload... (v2)');
    console.log('📦 Models to load:', totalModels);
    
    // Manual progress tracking since DefaultLoadingManager doesn't work with useGLTF.preload
    const updateProgress = (loaded) => {
      const progressPercent = Math.round((loaded / totalModels) * 100);
      console.log(`📈 Loading progress: ${loaded}/${totalModels} (${progressPercent}%)`);
      setProgress(progressPercent);
    };
    
    // Timeout fallback - if loading takes more than 15 seconds, proceed anyway
    loadingTimeout = setTimeout(() => {
      console.warn('⏰ Loading timeout reached after 15s, proceeding to app');
      setIsLoading(false);
    }, 15000);
    
    // Start preloading all models
    const loadPromises = MODEL_URLS.map((url, index) => {
      console.log(`🔄 Starting preload: ${url}`);
      
      return new Promise((resolve) => {
        try {
          // useGLTF.preload doesn't return a promise, so we simulate completion
          useGLTF.preload(url);
          
          // Give the preload a moment to start, then consider it "loaded"
          setTimeout(() => {
            loadedCount++;
            console.log(`✅ Preload initiated: ${url} (${loadedCount}/${totalModels})`);
            updateProgress(loadedCount);
            resolve(true);
          }, 100 * (index + 1)); // Stagger the completion simulation
        } catch (error) {
          console.error(`❌ Failed to preload: ${url}`, error);
          loadedCount++; // Count failed loads to prevent hanging
          updateProgress(loadedCount);
          resolve(false);
        }
      });
    });
    
    // Wait for all preloads to complete (or simulate completion)
    Promise.allSettled(loadPromises).then((results) => {
      const successful = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
      console.log(`🎯 Model preload complete: ${successful}/${totalModels} successful`);
      
      clearTimeout(loadingTimeout);
      
      const elapsed = Date.now() - start;
      const delay = Math.max(2000 - elapsed, 0); // Minimum 2 second loading screen
      
      console.log(`⏱️  Loading took ${elapsed}ms, adding ${delay}ms delay`);
      setTimeout(() => {
        console.log('🚀 Virtual Patient ready! Starting app...');
        setIsLoading(false);
      }, delay);
    });

    return () => {
      clearTimeout(loadingTimeout);
    };
  }, []);

  if (isLoading) {
    return <LoadingScreen progress={progress} />;
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <VoiceInteractionProvider>
        <div className="app">
          <VirtualPatientUnity />
        </div>
      </VoiceInteractionProvider>
    </Suspense>
  );
}

export default App;