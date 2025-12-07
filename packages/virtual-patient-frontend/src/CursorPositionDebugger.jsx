import React, { useState, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Cursor3DTracker({ onUpdate, isActive, selectedExam, selectedPoseId, debugMode }) {
  const { camera, mouse, raycaster } = useThree();
  const meshRef = useRef();

  useFrame(() => {
    if (!isActive || !meshRef.current) return;

    // Place the mesh always in front of the camera
    const distance = 5; // 5 units in front
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    const cameraPosition = camera.position.clone();
    const meshPosition = cameraPosition.clone().add(cameraDirection.multiplyScalar(distance));
    meshRef.current.position.copy(meshPosition);
    meshRef.current.lookAt(cameraPosition); // Always face the camera

    const pointer = new THREE.Vector2(mouse.x, mouse.y);
    raycaster.setFromCamera(pointer, camera);

    const intersects = raycaster.intersectObject(meshRef.current, true);
    if (intersects.length > 0) {
      const point = intersects[0].point;
      onUpdate({
        x: point.x,
        y: point.y,
        z: point.z
      });
    }
  });

  // Make the mesh a large plane always in front of the camera
  return (
    <mesh
      ref={meshRef}
      position={[0, 0, 0]}
      rotation={[0, 0, 0]}
      scale={[10, 10, 10]} // Large plane
    >
      <planeGeometry args={[5, 5]} />
      <meshBasicMaterial color="red" transparent opacity={debugMode ? 0.2 : 0.0} />
    </mesh>
  );
}

// This part lives OUTSIDE the <Canvas> and displays the coordinates
export function CursorPositionOverlay({ position }) {
  return (
    <div style={{
      position: 'fixed',
      top: '80px',  // Position below camera info
      right: '10px',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 1000
    }}>
      <div>Cursor 3D Position:</div>
      <div>X: {position.x.toFixed(2)}</div>
      <div>Y: {position.y.toFixed(2)}</div>
      <div>Z: {position.z.toFixed(2)}</div>
    </div>
  );
}
