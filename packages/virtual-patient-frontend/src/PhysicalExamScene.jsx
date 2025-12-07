import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Preload models
useGLTF.preload('https://storage.googleapis.com/vp-model-storage/examroomPE.glb');
useGLTF.preload('https://storage.googleapis.com/vp-model-storage/fbstand.glb');
useGLTF.preload('https://storage.googleapis.com/vp-model-storage/MalePatientSittingMR.glb');

// Camera preset for exam room view - positioned to show full room with patient
const CAMERA_PRESET = {
  position: [-3.4, 1.3, 0.65],
  target: [0.06, 1.1, 0.64]
};

// Camera rig for exam room scene
function ExamRoomCameraRig() {
  const camRef = useRef();
  const controlsRef = useRef();

  const applyCameraPreset = useCallback(() => {
    const EPS = 1e-3; // tiny offset to avoid pole singularity
    const cam = camRef.current;
    const ctrls = controlsRef.current;
    if (!cam || !ctrls) return;

    // Set Y-up so "north" stays up on screen
    cam.up.set(0, 1, 0);

    // Position camera
    cam.position.set(...CAMERA_PRESET.position);

    // Set target with small offset to avoid pole singularity
    const [tx, ty, tz] = CAMERA_PRESET.target;
    const [px, py, pz] = CAMERA_PRESET.position;
    const targetX = Math.abs(tx - px) < EPS && Math.abs(tz - pz) < EPS ? tx + EPS : tx;
    const targetZ = Math.abs(tx - px) < EPS && Math.abs(tz - pz) < EPS ? tz + EPS : tz;

    ctrls.target.set(targetX, ty, targetZ);

    // Keep away from exact poles
    ctrls.minPolarAngle = 0.01;
    ctrls.maxPolarAngle = Math.PI - 0.01;

    ctrls.update();
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
  }, []);

  useEffect(() => {
    const setupTimer = setTimeout(() => {
      applyCameraPreset();
    }, 100);

    return () => clearTimeout(setupTimer);
  }, [applyCameraPreset]);

  return (
    <>
      <PerspectiveCamera ref={camRef} makeDefault fov={60} />
      <OrbitControls
        ref={controlsRef}
        enablePan
        enableZoom
        enableRotate
        maxDistance={15}
        minDistance={2}
        maxPolarAngle={Math.PI * 0.8} // Prevent going too low
        minPolarAngle={Math.PI * 0.1} // Prevent going too high
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

// Exam room model component
function ExamRoomModel() {
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

// Standing patient model component - Female
function StandingPatientModelFemale() {
  const { scene } = useGLTF('https://storage.googleapis.com/vp-model-storage/fbstand.glb');
  
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
      position={[-1.6, 0.5, 0.75]}
      rotation={[0, Math.PI * -0.5, 0]}
      scale={0.8}
    />
  ) : null;
}

// Standing patient model component - Male
function StandingPatientModelMale() {
  const { scene } = useGLTF('https://storage.googleapis.com/vp-model-storage/MalePatientSittingMR.glb');
  
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
      position={[-1.6, 0.5, 0.75]}
      rotation={[0, Math.PI * -0.5, 0]}
      scale={0.8}
    />
  ) : null;
}

// Main scene component
function ExamRoomScene({ patientGender = 'female' }) {
  return (
    <>
      {/* Camera Rig */}
      <ExamRoomCameraRig />

      {/* Lighting setup optimized for examination */}
      <color attach="background" args={['#87CEEB']} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 10, 5]} intensity={0.9} castShadow />
      <directionalLight position={[-10, 5, -5]} intensity={0.4} />
      <directionalLight position={[0, 10, 0]} intensity={0.3} />

      {/* Grid for reference - positioned below floor */}
      <gridHelper args={[20, 20, '#666666', '#333333']} position={[0, -5, 0]} />

      {/* Exam room model */}
      <ErrorBoundary fallback={<mesh><boxGeometry /></mesh>}>
        <Suspense fallback={null}>
          <ExamRoomModel />
        </Suspense>
      </ErrorBoundary>

      {/* Standing patient model - gender-based */}
      <ErrorBoundary fallback={<mesh><boxGeometry /></mesh>}>
        <Suspense fallback={null}>
          {patientGender === 'male' ? (
            <StandingPatientModelMale />
          ) : (
            <StandingPatientModelFemale />
          )}
        </Suspense>
      </ErrorBoundary>
    </>
  );
}

// Loading overlay
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
        Loading Exam Room...
      </div>
      <div style={{ fontSize: '18px', opacity: 0.7 }}>
        {progress}%
      </div>
    </div>
  );
}

export default function PhysicalExamScene({ patientGender = 'female' }) {
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    const preloadModels = async () => {
      try {
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const loader = new GLTFLoader();
        
        const modelUrls = [
          'https://storage.googleapis.com/vp-model-storage/examroomPE.glb',
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
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {loading && <LoadingOverlay progress={loadProgress} />}
      
      <Canvas
        gl={{ antialias: true }}
        shadows
        style={{ width: '100%', height: '100%' }}
      >
        <ExamRoomScene patientGender={patientGender} />
      </Canvas>
    </div>
  );
}
