import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { ArrowLeft, X, Settings } from 'lucide-react';

// Preload all models
useGLTF.preload('https://storage.googleapis.com/vp-model-storage/examroomPE.glb');
useGLTF.preload('https://storage.googleapis.com/vp-model-storage/interviewfp.glb');
useGLTF.preload('https://storage.googleapis.com/vp-model-storage/HospitalRoom/HospitalRoom.gltf');
useGLTF.preload('https://storage.googleapis.com/vp-model-storage/fbstand.glb');
useGLTF.preload('https://storage.googleapis.com/vp-model-storage/MalePatientLayingDown.glb');
useGLTF.preload('https://storage.googleapis.com/vp-model-storage/MalePatientSittingMR.glb');

// Camera presets - DO NOT MODIFY these values as they affect the camera positions
const CAMERA_PRESETS = {
      sitting: {
    position: [-2.90, 1.11, 0.65],
    target: [0.06, 0.12, 0.64]
      },
      lying_down: {
    position: [-3.7, 1.9, 3.97],
    target: [-4.08, -18, 3.97] // Tiny X offset to avoid pole singularity
  }
};

// Camera rig that owns the default camera and orbit controls
function CameraRig({ pose }) {
  const camRef = useRef();
  const controlsRef = useRef();

  const applyCameraPreset = useCallback((p) => {
    const EPS = 1e-3; // tiny offset to avoid pole singularity
    const preset = CAMERA_PRESETS[p] || CAMERA_PRESETS.sitting;
    const cam = camRef.current;
    const ctrls = controlsRef.current;
    if (!cam || !ctrls) return;

    // 1) Force Y-up so "north" stays up on screen
    cam.up.set(0, 1, 0);

    // 2) Position camera
    cam.position.set(...preset.position);

    // 3) Nudge target so it's not exactly under the camera on Y axis
    const [tx, ty, tz] = preset.target;
    const [px, py, pz] = preset.position;
    const targetX = Math.abs(tx - px) < EPS && Math.abs(tz - pz) < EPS ? tx + EPS : tx;
    const targetZ = Math.abs(tx - px) < EPS && Math.abs(tz - pz) < EPS ? tz + EPS : tz;

    ctrls.target.set(targetX, ty, targetZ);

    // 4) Keep away from exact poles
    ctrls.minPolarAngle = 0.01;
    ctrls.maxPolarAngle = Math.PI - 0.01;

    ctrls.update();
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
  }, []);

  // Apply camera preset on mount and when pose changes
  useEffect(() => {
    // Initial setup
    const setupTimer = setTimeout(() => {
      applyCameraPreset(pose);
    }, 100); // Small delay to ensure refs are ready

    return () => clearTimeout(setupTimer);
  }, []); // Empty deps for mount only

  // Handle pose changes
  useEffect(() => {
    applyCameraPreset(pose);
  }, [pose, applyCameraPreset]);

  return (
    <>
      <PerspectiveCamera ref={camRef} makeDefault fov={60} />
      <OrbitControls
        ref={controlsRef}
        enablePan
        enableZoom
        enableRotate={pose === 'sitting'} // only enable rotation in sitting mode
        maxDistance={20}
        minDistance={2}
      />
    </>
  );
}

// Error boundary for catching model loading errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Model loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

function ExamRoomSitting() {
  const gltf = useGLTF('https://storage.googleapis.com/vp-model-storage/examroomPE.glb', true);
  
  useEffect(() => {
    return () => {
      if (gltf.scene) {
        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            child.geometry?.dispose();
            child.material?.dispose();
          }
        });
      }
    };
  }, [gltf]);
  
  return gltf.scene ? <primitive object={gltf.scene} /> : null;
}

function PatientModelSittingFemale() {
  const { scene } = useGLTF('https://storage.googleapis.com/vp-model-storage/interviewfp.glb');
  
  useEffect(() => {
    return () => {
      if (scene) {
        scene.traverse((child) => {
          if (child.isMesh) {
            child.geometry?.dispose();
            child.material?.dispose();
          }
        });
      }
    };
  }, [scene]);
  
  return scene ? (
    <primitive 
      object={scene}
      position={[-1.2, 0, 0.75]}
      rotation={[0, Math.PI * -0.5, 0]}
      scale={1}
    />
  ) : null;
}

function PatientModelSittingMale() {
  const { scene } = useGLTF('https://storage.googleapis.com/vp-model-storage/MalePatientLayingDown.glb');
  
  useEffect(() => {
    return () => {
      if (scene) {
        scene.traverse((child) => {
          if (child.isMesh) {
            child.geometry?.dispose();
            child.material?.dispose();
          }
        });
      }
    };
  }, [scene]);
  
  return scene ? (
    <primitive 
      object={scene}
      position={[1, -1.3, 1]}  // Adjust X, Y, Z position here
      rotation={[0.4, Math.PI * -0.5, -1]}  // Adjust rotation here
      scale={0.6}  // Adjust scale here (1 = normal, 0.5 = smaller, 1.5 = larger)
    />
  ) : null;
}

function HospitalRoomLyingDown() {
  const gltf = useGLTF('https://storage.googleapis.com/vp-model-storage/HospitalRoom/HospitalRoom.gltf', true);
  
  useEffect(() => {
    return () => {
      if (gltf.scene) {
        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            child.geometry?.dispose();
            child.material?.dispose();
          }
        });
      }
    };
  }, [gltf]);

  return gltf.scene ? <primitive object={gltf.scene} position={[0, 0, 0]} /> : null;
}

function PatientModelLyingDown({ useAlternateModel = false }) {
  const modelUrl = useAlternateModel
    ? 'https://storage.googleapis.com/vp-model-storage/MalePatientLayingDown.glb'
    : 'https://storage.googleapis.com/vp-model-storage/fbstand.glb';

  const gltf = useGLTF(modelUrl, true);

  useEffect(() => {
    return () => {
      if (gltf.scene) {
        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            child.geometry?.dispose();
            child.material?.dispose();
          }
        });
      }
    };
  }, [gltf]);

  // Different positioning for each model
  // Female patient (original/default)
  const femalePosition = [-3, -0.4, 3.8];
  const femaleRotation = [-Math.PI / 2, 0, 1.6];
  const femaleScale = 1.35;

  // Male patient (alternate model)
  const malePosition = [0.1, -0.01, 0.1];
  const maleRotation = [0, 0, 0]; // Made vertical, lying on bed
  const maleScale = 1.0;

  const position = useAlternateModel ? malePosition : femalePosition;
  const rotation = useAlternateModel ? maleRotation : femaleRotation;
  const scale = useAlternateModel ? maleScale : femaleScale;

  return gltf.scene ? (
    <primitive
      object={gltf.scene}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  ) : null;
}

function Scene({ pose = 'sitting', patientGender = 'female' }) {
  return (
    <>
      {/* Camera Rig with default PerspectiveCamera and OrbitControls */}
      <CameraRig pose={pose} />

      {/* Lighting */}
      <color attach="background" args={['#87CEEB']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-10, 5, -5]} intensity={0.3} />

      {/* Grid for reference - positioned at floor level */}
      {/* Hide grid or move it way down below the hospital room floor */}
      <gridHelper args={[20, 20, '#666666', '#333333']} position={[0, -5, 0]} />

      {/* Conditional rendering based on pose */}
      {pose === 'sitting' ? (
        <>
          {/* Sitting exam room */}
          <ErrorBoundary fallback={<mesh><boxGeometry /></mesh>}>
            <Suspense fallback={null}>
              <ExamRoomSitting />
            </Suspense>
          </ErrorBoundary>

          {/* Sitting patient model - gender-based */}
          <ErrorBoundary fallback={<mesh><boxGeometry /></mesh>}>
            <Suspense fallback={null}>
              {patientGender === 'male' ? (
                <PatientModelSittingMale />
              ) : (
                <PatientModelSittingFemale />
              )}
            </Suspense>
          </ErrorBoundary>
        </>
      ) : (
        <>
          {/* Hospital room with bed */}
          <ErrorBoundary fallback={<mesh><boxGeometry /></mesh>}>
            <Suspense fallback={null}>
              <HospitalRoomLyingDown />
            </Suspense>
          </ErrorBoundary>

          {/* Lying down patient model - gender-based */}
          <ErrorBoundary fallback={<mesh><boxGeometry /></mesh>}>
            <Suspense fallback={null}>
              <PatientModelLyingDown useAlternateModel={patientGender === 'male'} />
            </Suspense>
          </ErrorBoundary>
        </>
      )}
    </>
  );
}

function LoadingOverlay({ progress }) {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      color: 'white',
      zIndex: 1000,
      pointerEvents: 'none'
    }}>
      <div style={{ fontSize: '24px', marginBottom: '20px', fontWeight: 500 }}>
        Loading 3D Scene...
      </div>
      <div style={{ fontSize: '18px', opacity: 0.7 }}>
        {progress}%
      </div>
    </div>
  );
}

export default function ThreeJSScene({ pose = 'sitting', patientGender = 'female', autoSetCamera = false, onBack, onClose, onSettingsToggle, hideHeader = false }) {
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [useAlternatePatient, setUseAlternatePatient] = useState(false);
  const isThreeDExamActive = typeof document !== 'undefined' && document.body.classList.contains('threed-mode-active');
  const showHeader = pose === 'lying_down' && !hideHeader && !isThreeDExamActive;

  useEffect(() => {
    const preloadModels = async () => {
      try {
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const loader = new GLTFLoader();
        
        const modelUrls = [
          'https://storage.googleapis.com/vp-model-storage/examroomPE.glb',
          'https://storage.googleapis.com/vp-model-storage/interviewfp.glb',
          'https://storage.googleapis.com/vp-model-storage/HospitalRoom/HospitalRoom.gltf',
          'https://storage.googleapis.com/vp-model-storage/fbstand.glb',
          'https://storage.googleapis.com/vp-model-storage/MalePatientSittingMR.glb'
        ];
        
        await Promise.all(
          modelUrls.map(url => 
            new Promise((resolve, reject) => {
              loader.load(
                url,
                (gltf) => resolve(gltf),
                undefined,
                (error) => resolve(null)
              );
            })
          )
        );
        
        setModelsLoaded(true);
      } catch (error) {
        setModelsLoaded(true);
      }
    };

    preloadModels();

    const progressInterval = setInterval(() => {
      setLoadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    const timer = setTimeout(() => {
      if (modelsLoaded) {
        setLoading(false);
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [modelsLoaded]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}>
      {loading && <LoadingOverlay progress={loadProgress} />}

      {/* Header - Only show in lying_down/monitoring mode and not during 3D Physical Exam */}
      {showHeader && (
        <>
          {/* Back button */}
          {onBack && (
            <button
              onClick={onBack}
              style={{
                position: 'fixed',
                top: '-0.2rem',
                left: '-0.5rem',
                background: 'none',
                border: 'none',
                width: '56px',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10000,
                color: '#1E293B',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#475569';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = '#1E293B';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <ArrowLeft size={32} />
            </button>
          )}

          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              style={{
                position: 'fixed',
                top: '0rem',
                right: '0rem',
                background: 'none',
                border: 'none',
                width: '56px',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10000,
                color: '#1E293B',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#475569';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = '#1E293B';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <X size={32} />
            </button>
          )}

          {/* Header with integrated toggle UI */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '64px',
            background: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            zIndex: 9999,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            {/* Left side toggle UI */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 600,
                color: '#1E293B',
                letterSpacing: '-0.025em'
              }}>
                Patient Monitoring
              </h3>
              <button
                onClick={() => {
                  setShowSettings(!showSettings);
                  if (onSettingsToggle) onSettingsToggle(!showSettings);
                }}
                style={{
                  background: '#F1F5F9',
                  border: '1px solid #E2E8F0',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = '#AB0520';
                  e.target.style.background = '#F1F5F9';
                  e.target.style.borderColor = '#CBD5E1';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#64748B';
                  e.target.style.background = '#F1F5F9';
                  e.target.style.borderColor = '#E2E8F0';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                  <Settings size={18} />
              </button>
            </div>

            {/* Right side - Change Patient button */}
            <button
              onClick={() => setUseAlternatePatient(!useAlternatePatient)}
              style={{
                background: '#AB0520',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#8B0418';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#AB0520';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              }}
            >
              Change Patient
            </button>
          </div>
        </>
      )}

      {/* Main content - Add margin-top when header is present */}
      <div style={{ 
        height: '100%', 
        marginTop: showHeader ? '64px' : '0'
      }}>
      <Canvas
        gl={{ antialias: true }}
        shadows
      >
          <Scene pose={pose} patientGender={patientGender} />
      </Canvas>
      </div>
    </div>
  );
}