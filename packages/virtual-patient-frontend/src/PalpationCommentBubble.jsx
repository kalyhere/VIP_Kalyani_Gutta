import React, { useEffect } from 'react';
import { Html } from '@react-three/drei';

export function PalpationCommentBubble({ position, description, onClose }) {
  useEffect(() => {
    console.log('PalpationCommentBubble props:', {
      position,
      description,
      hasDescription: !!description,
      hasDoctorFinding: !!description?.doctorFinding,
      hasPatientResponse: !!description?.patientResponse
    });
  }, [position, description]);

  if (!description) {
    console.log('No description provided to PalpationCommentBubble');
    return null;
  }

  return (
    <group position={position}>
      <Html
        center
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '25px',
          borderRadius: '12px',
          width: '600px',
          maxWidth: '80vw',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          animation: 'fadeIn 0.3s ease-in-out',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          transform: 'translate(-50%, -50%)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          position: 'absolute',
          left: '50%',
          top: '50%',
        }}
      >
        <div style={{ 
          marginBottom: '20px',
          padding: '20px',
          background: 'rgba(76, 175, 80, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(76, 175, 80, 0.2)'
        }}>
          <h4 style={{ 
            margin: '0 0 12px 0', 
            color: '#2E7D32',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '18px',
            fontWeight: '600'
          }}>
            <span style={{ fontSize: '22px' }}>👨‍⚕️</span>
            Doctor's Findings
          </h4>
          <p style={{ 
            margin: '0',
            fontSize: '16px',
            lineHeight: '1.6',
            color: '#1C1C1C'
          }}>
            {description.doctorFinding}
          </p>
        </div>
        
        <div style={{ 
          marginBottom: '20px',
          padding: '20px',
          background: 'rgba(255, 152, 0, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 152, 0, 0.2)'
        }}>
          <h4 style={{ 
            margin: '0 0 12px 0', 
            color: '#E65100',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '18px',
            fontWeight: '600'
          }}>
            <span style={{ fontSize: '22px' }}>🧑‍⚕️</span>
            Patient's Response
          </h4>
          <p style={{ 
            margin: '0',
            fontSize: '16px',
            lineHeight: '1.6',
            color: '#1C1C1C'
          }}>
            {description.patientResponse}
          </p>
        </div>

        <button
          onClick={onClose}
          style={{
            background: '#1976D2',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            width: '100%',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#1565C0'}
          onMouseOut={(e) => e.currentTarget.style.background = '#1976D2'}
        >
          <span style={{ fontSize: '18px' }}>✕</span>
          Close
        </button>
      </Html>
    </group>
  );
} 