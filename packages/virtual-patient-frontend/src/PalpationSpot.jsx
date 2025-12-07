import React from 'react';

export function PalpationSpot({ position, region, onClick }) {
  return (
    <group position={position}>
      <mesh onClick={(e) => {
        e.stopPropagation(); // Prevent event from bubbling up
        console.log('Palpation spot clicked:', region);
        onClick(region);
      }}>
        <sphereGeometry args={[0.05, 32, 32]} />
        <meshStandardMaterial color="red" />
      </mesh>
    </group>
  );
}
