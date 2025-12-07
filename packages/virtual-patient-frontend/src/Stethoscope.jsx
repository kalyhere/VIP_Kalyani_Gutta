import React, { useRef, useState, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Default position near the patient's chest in physical exam mode
const DEFAULT_POSITION = [-7.9, -2.0, 7.9];
const DEFAULT_ROTATION = [0, 0, 0];
const DEFAULT_SCALE = [0.5, 0.5, 0.5];

export default function Stethoscope({ visible = true, initialPosition = DEFAULT_POSITION, rotation = DEFAULT_ROTATION, scale = DEFAULT_SCALE, cameraPosition, cameraDirection }) {
  const group = useRef();
  const { scene } = useGLTF('https://storage.googleapis.com/vp-model-storage/doctors_stethoscope.glb');
  const [position, setPosition] = useState(initialPosition);
  const [dragging, setDragging] = useState(false);
  const offset = useRef([0, 0, 0]);

  useEffect(() => {
    if (visible) {
      console.log('Stethoscope rendered at', position, 'with rotation', rotation, 'and scale', scale);
      if (cameraPosition && cameraDirection) {
        console.log('Camera position:', cameraPosition, 'Camera direction:', cameraDirection);
      }
    }
  }, [visible, position, rotation, scale, cameraPosition, cameraDirection]);

  // Convert screen coordinates to Three.js world coordinates
  const getWorldPosition = (event) => {
    const { camera, size } = event;
    const x = (event.pointer.x / size.width) * 2 - 1;
    const y = -(event.pointer.y / size.height) * 2 + 1;
    const vector = new THREE.Vector3(x, y, 0.5).unproject(camera);
    return [vector.x, vector.y, vector.z];
  };

  const onPointerDown = (e) => {
    e.stopPropagation();
    setDragging(true);
    // Calculate offset between pointer and stethoscope position
    const worldPos = getWorldPosition(e);
    offset.current = [
      position[0] - worldPos[0],
      position[1] - worldPos[1],
      position[2] - worldPos[2],
    ];
    document.body.style.cursor = 'grabbing';
  };

  const onPointerUp = (e) => {
    setDragging(false);
    document.body.style.cursor = 'default';
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    e.stopPropagation();
    const worldPos = getWorldPosition(e);
    setPosition([
      worldPos[0] + offset.current[0],
      worldPos[1] + offset.current[1],
      worldPos[2] + offset.current[2],
    ]);
  };

  if (!visible) return null;

  return (
    <group
      ref={group}
      position={position}
      rotation={rotation}
      scale={[0.006, 0.006, 0.006]}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerMove={onPointerMove}
      castShadow
      receiveShadow
      dispose={null}
    >
      <primitive object={scene} scale={scale} />
    </group>
  );
}

useGLTF.preload('https://storage.googleapis.com/vp-model-storage/doctors_stethoscope.glb'); 