export function ChestSoundSpot({ position, id, onClick, color = "red" }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.05, 32, 32]} />
      <meshStandardMaterial 
        color={color} 
        emissive={color}
        emissiveIntensity={1}
        transparent={true}
        opacity={0.8}
      />
    </mesh>
  );
} 