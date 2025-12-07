import React, { Suspense, useEffect } from "react";
import { CharacterModel } from "./CharacterModel";

function LoadingFallback() {
  return (
    <mesh position={[0, 1, 0]}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial color="purple" />
    </mesh>
  );
}

function VirtualCharacter({ selectedPose, message, onMessageEnd, mode, positionOffset, rotationOffset }) {
  // Add debugging to track message data
  useEffect(() => {
    if (message) {
      console.log("VirtualCharacter received message:", {
        text: message.text?.substring(0, 30) + "...",
        animation: message.animation,
        facialExpression: message.facialExpression
      });
    }
  }, [message]);

  const handleMessageEnd = () => {
    console.log("Message playback completed");
    if (onMessageEnd) {
      onMessageEnd();
    }
  };

  // Create a modified message without audio to prevent duplicate playback
  const modifiedMessage = message ? {
    ...message,
    // Remove the audio property to prevent CharacterModel from playing it
    audio: null
  } : null;

  return (
    <Suspense fallback={<LoadingFallback />}>
      <CharacterModel
        key={`${selectedPose?.id}-${mode}`} // Ensure model refreshes when pose or mode changes
        animation={selectedPose?.animation || 'sitting'}
        position={selectedPose?.position || [0, -5.4, 5]}
        rotation={selectedPose?.rotation || [0, Math.PI, 0]}
        scale={mode === 'physical_exam' ? [2.8, 2.8, 2.8] : [1.45, 1.45, 1.45]}
        message={modifiedMessage}
        onMessageEnd={handleMessageEnd}
        mode={mode}
        positionOffset={positionOffset}
        rotationOffset={rotationOffset}
      />
    </Suspense>
  );
}

export default VirtualCharacter;