import React, { useRef, useEffect, useState } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Standard ARKit/Ready Player Me viseme names to try
const arkit_viseme_map = {
  A: 'viseme_aa',    // AA in "trap"
  B: 'viseme_kk',    // K in "look"
  C: 'viseme_ee',    // EE in "beet" or I in "bit"
  D: 'viseme_aa',    // AA in "trap" 
  E: 'viseme_oh',    // O in "lot"
  F: 'viseme_ou',    // OO in "boot"
  G: 'viseme_ff',    // F in "fluff"
  H: 'viseme_th',    // TH in "thin"
  X: 'viseme_sil',   // Silent/rest position
};

// Alternate viseme names (in case the model uses these)
const alternate_viseme_map = {
  A: 'mouthOpen',     // Generic mouth open
  B: 'mouthClose',    // Generic mouth closed
  C: 'mouthSmile',    // Generic mouth wide
  D: 'jawOpen',       // Generic mouth open
  E: 'mouthRound',    // Generic rounded mouth
  F: 'mouthPucker',   // Generic puckered mouth
  G: 'mouthStretch',  // Generic stretched mouth
  H: 'mouthFunnel',   // Generic funneled mouth
  X: 'mouthClose',    // Silent/rest position
};

// Oculus standard visemes
const oculus_viseme_map = {
  A: 'viseme_PP',     // PP, BB, MM
  B: 'viseme_CH',     // CH, JJ, SH
  C: 'viseme_DD',     // DD, TT 
  D: 'viseme_FF',     // FF, VV
  E: 'viseme_kk',     // KK, GG
  F: 'viseme_ih',     // IH
  G: 'viseme_AA',     // AA
  H: 'viseme_E',      // E
  X: 'viseme_sil',    // Silent
};

// Facial expressions
const facialExpressions = {
  default: {},
  smile: {
    mouthSmile: 0.7,
    mouthSmileLeft: 0.7,
    mouthSmileRight: 0.7,
    eyeSquintLeft: 0.3,
    eyeSquintRight: 0.3,
  },
  sad: {
    mouthFrown: 0.7,
    mouthFrownLeft: 0.7,
    mouthFrownRight: 0.7,
    eyeLookDownLeft: 0.5,
    eyeLookDownRight: 0.5,
  },
  painful: {
    browInnerUp: 0.6,
    eyeSquintLeft: 0.6,
    eyeSquintRight: 0.6,
    mouthStretchLeft: 0.5,
    mouthStretchRight: 0.5,
  },
  distressed: {
    eyeWideLeft: 0.7,
    eyeWideRight: 0.7,
    mouthOpen: 0.5,
    jawOpen: 0.4,
  },
  thinking: {
    browInnerUp: 0.4,
    eyeLookUpLeft: 0.3,
    eyeLookUpRight: 0.3,
    mouthClose: 0.4,
  },
};

export function CharacterModel({ animation, message, onMessageEnd, mode, positionOffset, rotationOffset, ...props }) {
  // Model paths for different modes
  const modelPaths = {
    interview: 'https://storage.googleapis.com/vp-model-storage/interviewfp.glb',
    physical_exam: 'https://storage.googleapis.com/vp-model-storage/fp.glb'
  };

  // Use the appropriate model based on mode
  const modelPath = mode === 'physical_exam' ? modelPaths.physical_exam : modelPaths.interview;
  const animationsPath = mode === 'physical_exam' ? 'https://storage.googleapis.com/vp-model-storage/fempatanim.glb' : 'https://storage.googleapis.com/vp-model-storage/newanimation.glb';

  // Calculate adjusted position (move down by subtracting from Y)
  const adjustedPosition = props.position ? [
    props.position[0] + (mode === 'physical_exam' ? 0 : 5.8) + (positionOffset?.x || 0),
    props.position[1] + (mode === 'physical_exam' ? 0 : 2.8) + (positionOffset?.y || 0),
    props.position[2] + (mode === 'physical_exam' ? 0 : -0.07) + (positionOffset?.z || 0)
  ] : undefined;

  // Calculate adjusted rotation
  const adjustedRotation = props.rotation ? [
    props.rotation[0] + (rotationOffset?.x || 0),
    props.rotation[1] + (rotationOffset?.y || 0),
    props.rotation[2] + (rotationOffset?.z || 0)
  ] : undefined;

  console.log('Loading model:', {
    mode,
    modelPath,
    animationsPath,
    originalPosition: props.position,
    adjustedPosition,
    rotation: props.rotation,
    scale: mode === 'physical_exam' ? 1 : 1 // Changed scale to 1 for both modes
  });

  const group = useRef();
  const { scene } = useGLTF(modelPath);
  const { animations: extraAnimations } = useGLTF(animationsPath);
  const { actions, mixer } = useAnimations(extraAnimations, group);
  const { invalidate, camera } = useThree();

  // Debug log to check model structure and animations
  useEffect(() => {
    console.log('Model loaded:', {
      mode,
      modelPath,
      animationsPath,
      scene: scene ? Object.keys(scene.children) : [],
      animations: extraAnimations ? extraAnimations.map(anim => anim.name) : [],
      originalPosition: props.position,
      adjustedPosition,
      rotation: props.rotation,
      scale: mode === 'physical_exam' ? 1 : 1,
      hasActions: !!actions,
      actionNames: actions ? Object.keys(actions) : []
    });

    // Additional check for physical exam mode
    if (mode === 'physical_exam') {
      console.log('Physical exam mode details:', {
        modelLoaded: !!scene,
        animationsLoaded: !!extraAnimations,
        animationCount: extraAnimations ? extraAnimations.length : 0,
        groupRef: !!group.current,
        position: adjustedPosition,
        scale: 1
      });
    }
  }, [mode, modelPath, animationsPath, scene, extraAnimations, props.position, props.rotation, actions, adjustedPosition]);

  const [lipsyncData, setLipsyncData] = useState(null);
  const [facialExpression, setFacialExpression] = useState('default');
  const [currentAnimation, setCurrentAnimation] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const externalAudioRef = useRef(null);
  const lipsyncTimerRef = useRef(null);
  
  // To store best viseme mapping for this model
  const [activeVisemeMap, setActiveVisemeMap] = useState(null);
  const [discoveredMorphs, setDiscoveredMorphs] = useState([]);

  // Function to determine the best viseme map to use
  const determineBestVisemeMap = (availableMorphs) => {
    // Check for ARKit visemes first
    const arkitMatches = Object.values(arkit_viseme_map).filter(
      viseme => availableMorphs.includes(viseme)
    ).length;
    
    // Check for Oculus visemes
    const oculusMatches = Object.values(oculus_viseme_map).filter(
      viseme => availableMorphs.includes(viseme)
    ).length;
    
    // Check for alternate morphs
    const alternateMatches = Object.values(alternate_viseme_map).filter(
      viseme => availableMorphs.includes(viseme)
    ).length;
    
    console.log(`Viseme matches - ARKit: ${arkitMatches}, Oculus: ${oculusMatches}, Alternate: ${alternateMatches}`);
    
    // Choose the best map based on the number of matches
    if (arkitMatches >= 4) {
      console.log("Using ARKit viseme mapping");
      return arkit_viseme_map;
    } else if (oculusMatches >= 4) {
      console.log("Using Oculus viseme mapping");
      return oculus_viseme_map;
    } else if (alternateMatches >= 4) {
      console.log("Using alternate morphs mapping");
      return alternate_viseme_map;
    }
    
    // Create a custom map based on available morphs
    console.log("Creating custom viseme mapping");
    
    // Find mouth-related morphs
    const mouthMorphs = availableMorphs.filter(name => 
      name.toLowerCase().includes('mouth') || 
      name.toLowerCase().includes('jaw') || 
      name.toLowerCase().includes('viseme')
    );
    
    // Create a basic mapping with available morphs
    const customMap = {};
    
    // Helper to find a morph
    const findMorph = (keywords) => {
      for (const keyword of keywords) {
        const match = mouthMorphs.find(m => m.toLowerCase().includes(keyword.toLowerCase()));
        if (match) return match;
      }
      return mouthMorphs[0] || null; // Default to first mouth morph if nothing else found
    };
    
    // Try to create meaningful mappings for each phoneme
    customMap.A = findMorph(['open', 'aa', 'ah']); 
    customMap.B = findMorph(['close', 'kk', 'k']);
    customMap.C = findMorph(['ee', 'ih', 'smile']);
    customMap.D = findMorph(['open', 'aa', 'ah']);
    customMap.E = findMorph(['oh', 'o', 'round']);
    customMap.F = findMorph(['ou', 'oo', 'pucker']);
    customMap.G = findMorph(['ff', 'f', 'stretch']);
    customMap.H = findMorph(['th', 'funnel']);
    customMap.X = findMorph(['sil', 'close', 'neutral']); 
    
    console.log("Created custom viseme mapping:", customMap);
    return customMap;
  };

  // Discover all morph targets in the model
  useEffect(() => {
    if (group.current && !activeVisemeMap) {
      const morphTargets = [];
      
      group.current.traverse((child) => {
        if (child.isSkinnedMesh && child.morphTargetDictionary) {
          const morphNames = Object.keys(child.morphTargetDictionary);
          morphTargets.push(...morphNames);
          
          console.log(`Morph targets in ${child.name}:`, morphNames);
        }
      });
      
      const uniqueMorphs = [...new Set(morphTargets)];
      setDiscoveredMorphs(uniqueMorphs);
      
      // Determine the best viseme map
      const bestMap = determineBestVisemeMap(uniqueMorphs);
      setActiveVisemeMap(bestMap);
    }
  }, [group.current]);

  // Set up animation
  useEffect(() => {
    if (!actions || !animation) return;

    // Stop current animation if it exists
    if (currentAnimation && actions[currentAnimation]) {
      actions[currentAnimation].fadeOut(0.2);
    }

    // Find the animation by name or use the first available animation
    const targetAnimation = actions[animation] || Object.values(actions)[0];
    
    if (targetAnimation) {
      // Configure the animation
      targetAnimation
        .reset()
        .setEffectiveTimeScale(1)
        .setEffectiveWeight(1)
        .fadeIn(0.2)
        .play();
      
      setCurrentAnimation(targetAnimation.getClip().name);
      console.log('Playing animation:', targetAnimation.getClip().name);
    }

    invalidate();
    return () => {
      if (targetAnimation) targetAnimation.fadeOut(0.2);
    };
  }, [animation, actions, currentAnimation, invalidate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (lipsyncTimerRef.current) {
        clearTimeout(lipsyncTimerRef.current);
      }
    };
  }, []);

  // Process new messages - WITHOUT playing audio
  useEffect(() => {
    if (!message) return;

    // Debug log - only when message text changes
    console.log("CharacterModel processing message:", {
      text: message.text?.substring(0, 30) + "...",
      animation: message.animation,
      facialExpression: message.facialExpression
    });
    
    // Clear any existing lip sync timer
    if (lipsyncTimerRef.current) {
      clearTimeout(lipsyncTimerRef.current);
      lipsyncTimerRef.current = null;
    }

    try {
      // Set animation and expression states
      setIsAnimating(true);
      setFacialExpression(message.facialExpression || 'default');
      
      // Simulate message duration
      const messageDuration = message.text ? message.text.length * 80 : 3000; // Estimate duration based on text length
      lipsyncTimerRef.current = setTimeout(() => {
        setFacialExpression('default');
        setIsAnimating(false);
        if (onMessageEnd) onMessageEnd();
      }, messageDuration);
    } catch (error) {
      console.error("Error processing message:", error);
    }

    // Cleanup function
    return () => {
      if (lipsyncTimerRef.current) {
        clearTimeout(lipsyncTimerRef.current);
        lipsyncTimerRef.current = null;
      }
    };
  }, [message?.text]); // Only re-run when message text changes

  // Listen for external audio playback
  useEffect(() => {
    const handleAudioPlayback = (event) => {
      // Check if this is our relevant audio event
      if (event.detail && event.detail.messageId && message && message.messageId === event.detail.messageId) {
        console.log("Received external audio event:", event.detail);
        
        // If audio is playing
        if (event.detail.status === 'playing') {
          externalAudioRef.current = {
            currentTime: event.detail.currentTime || 0,
            duration: event.detail.duration || 0
          };
        }
        // If audio has ended
        else if (event.detail.status === 'ended') {
          externalAudioRef.current = null;
          setLipsyncData(null);
          setFacialExpression('default');
          setIsAnimating(false);
          if (onMessageEnd) onMessageEnd();
        }
      }
    };
    
    // Listen for custom audio events
    window.addEventListener('character-audio-update', handleAudioPlayback);
    
    return () => {
      window.removeEventListener('character-audio-update', handleAudioPlayback);
    };
  }, [message, onMessageEnd]);

  // Handle lip sync data
  useEffect(() => {
    if (message?.lipsyncData) {
      console.log("CharacterModel received new lipsyncData:", message.lipsyncData);
      setLipsyncData(null); // Reset first
      setTimeout(() => {
        setLipsyncData(message.lipsyncData);
      }, 10); // Small delay ensures reactivity
    }
  }, [message?.lipsyncData]);

  // Apply a morph target with a specific value
  const applyMorphTarget = (morphName, value = 1.0, speed = 0.15) => {
    if (!group.current || !morphName) return false;
    
    let applied = false;
    
    group.current.traverse((child) => {
      if (child.isSkinnedMesh && child.morphTargetDictionary) {
        const morphIndex = child.morphTargetDictionary[morphName];
        
        if (morphIndex !== undefined && child.morphTargetInfluences) {
          // Apply the morph with smooth transition
          child.morphTargetInfluences[morphIndex] = THREE.MathUtils.lerp(
            child.morphTargetInfluences[morphIndex],
            value,
            speed
          );
          
          applied = true;
        }
      }
    });
    
    return applied;
  };

  // Reset all mouth-related morphs
  const resetMouthMorphs = () => {
    if (!group.current || !discoveredMorphs.length) return;
    
    // Reset any mouth-related morphs
    discoveredMorphs.forEach(morph => {
      if (morph.toLowerCase().includes('mouth') || 
          morph.toLowerCase().includes('viseme') || 
          morph.toLowerCase().includes('jaw')) {
        applyMorphTarget(morph, 0, 0.1);
      }
    });
  };

  // Apply facial expressions in the animation frame
  useFrame(() => {
    if (!group.current || !activeVisemeMap) return;
    
    // Apply facial expression
    const expression = facialExpressions[facialExpression] || {};
    for (const [morphName, value] of Object.entries(expression)) {
      // Skip mouth-related morphs
      if (morphName.toLowerCase().includes('mouth') || 
          morphName.toLowerCase().includes('viseme') || 
          morphName.toLowerCase().includes('jaw')) {
        continue;
      }
      if (discoveredMorphs.includes(morphName)) {
        applyMorphTarget(morphName, value, 0.1);
      }
    }
  });

  return (
    <group 
      ref={group} 
      {...props} 
      position={adjustedPosition} 
      rotation={adjustedRotation}
      dispose={null}
    >
      <primitive object={scene} scale={1} />
    </group>
  );
}

// Preload both models
// useGLTF.preload('/models/Character/67f49496689407918a5e6469.glb');
// useGLTF.preload('/models/Character/MalePatient.glb');
useGLTF.preload('https://storage.googleapis.com/vp-model-storage/animations.glb');