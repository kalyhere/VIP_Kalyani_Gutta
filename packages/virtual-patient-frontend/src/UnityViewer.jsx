import React, { useState, useEffect } from "react";
import { Unity, useUnityContext } from "react-unity-webgl";

export default function UnityViewer() {
  const [unityError, setUnityError] = useState(null);
  const [useLocalFallback, setUseLocalFallback] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Try GCS first, fallback to local if needed
  const unityBuildPath = useLocalFallback 
    ? "/Builds/Build/" 
    : "https://storage.googleapis.com/vp-model-storage/unity/Builds/Build/";
  
  const { unityProvider, isLoaded, loadingProgression, error } = useUnityContext({
    loaderUrl: `${unityBuildPath}Builds.loader.js`,
    dataUrl: `${unityBuildPath}Builds.data`,
    frameworkUrl: `${unityBuildPath}Builds.framework.js`,
    codeUrl: `${unityBuildPath}Builds.wasm`,
  });

  // Handle Unity loading errors
  useEffect(() => {
    if (error) {
      console.error('Unity loading error:', error);
      setUnityError(error);
      
      // If GCS fails and we haven't tried local fallback yet
      if (!useLocalFallback && retryCount === 0) {
        console.log('GCS failed, trying local fallback...');
        setUseLocalFallback(true);
        setRetryCount(1);
      } else if (useLocalFallback && retryCount === 1) {
        console.log('Local fallback also failed');
        setRetryCount(2);
      }
    }
  }, [error, useLocalFallback, retryCount]);

  // Reset error when switching sources
  useEffect(() => {
    if (useLocalFallback) {
      setUnityError(null);
    }
  }, [useLocalFallback]);

  // Show error message if both sources failed
  if (retryCount >= 2) {
    return (
      <div style={{ 
        width: "100vw", 
        height: "100vh", 
        background: "#000",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "#fff"
      }}>
        <div style={{ textAlign: "center", padding: "20px" }}>
          <h2 style={{ color: "#ff6b6b", marginBottom: "20px" }}>
            Unity Failed to Load
          </h2>
          <p style={{ marginBottom: "15px" }}>
            Unable to load Unity from both GCS and local files.
          </p>
          <p style={{ marginBottom: "20px", fontSize: "14px", color: "#ccc" }}>
            Please check your Unity build files and try again.
          </p>
          <button 
            onClick={() => {
              setUseLocalFallback(false);
              setRetryCount(0);
              setUnityError(null);
            }}
            style={{
              padding: "10px 20px",
              backgroundColor: "#39FF14",
              color: "#000",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "16px"
            }}
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000" }}>
      {/* Error Status Messages */}
      {unityError && !useLocalFallback && (
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(255, 107, 107, 0.9)",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: "5px",
            zIndex: 200,
            textAlign: "center"
          }}
        >
          GCS loading failed, trying local files...
        </div>
      )}
      
      {unityError && useLocalFallback && (
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(255, 193, 7, 0.9)",
            color: "#000",
            padding: "10px 20px",
            borderRadius: "5px",
            zIndex: 200,
            textAlign: "center"
          }}
        >
          Loading from local files...
        </div>
      )}

      {/* Loading Progress */}
      {!isLoaded && (
        <div
          style={{
            color: "#fff",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 100,
            textAlign: "center"
          }}
        >
          <div style={{ marginBottom: "10px" }}>
            {useLocalFallback ? "Loading from local files..." : "Loading from GCS..."}
          </div>
          <div>Loading simulation... {Math.round(loadingProgression * 100)}%</div>
        </div>
      )}

      {/* Unity Component */}
      <Unity
        unityProvider={unityProvider}
        style={{
          width: "100vw",
          height: "100vh",
          display: isLoaded ? "block" : "none",
        }}
      />
    </div>
  );
} 