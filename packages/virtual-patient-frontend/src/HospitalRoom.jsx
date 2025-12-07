import React, { Suspense, useRef, useEffect, useState } from "react";
import { useGLTF } from "@react-three/drei";

function HospitalRoomModel() {
  const roomRef = useRef();
  
  // Load model with exact path from file structure
  const { scene } = useGLTF("https://storage.googleapis.com/vp-model-storage/HospitalRoom/HospitalRoom.gltf");
  
  useEffect(() => {
    if (scene && roomRef.current) {
      console.log("Setting up hospital room model");
      
      // Clone the scene to avoid mutation issues
      const roomScene = scene.clone();
      
      // Adjust the hospital room position and scale
      roomScene.scale.set(2, 2, 2);
      roomScene.position.set(0, -1, 0);
      
      // Add shadows
      roomScene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Add the scene to the group
      roomRef.current.add(roomScene);
    }
  }, [scene]);
  
  return <group ref={roomRef} />;
}

// Simple fallback when model is loading
function LoadingFallback() {
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="blue" />
    </mesh>
  );
}

function HospitalRoom() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <HospitalRoomModel />
    </Suspense>
  );
}

export default HospitalRoom;