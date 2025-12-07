import React, { useState, useEffect } from 'react';
import { APP_MODES } from './constants/appModes';
import { IoArrowBack } from 'react-icons/io5';
import VitalsMonitor from './VitalsMonitor';
import Draggable from 'react-draggable';
import MediaViewer from './components/MediaViewer';
import PhysicalExamInterface from './PhysicalExamInterface';
import { detectPatientGender } from './utils/patientGenderDetector';
import {
  Stethoscope,
  Activity,
  FlaskRound,
  Pill,
  User,
  MessageCircle
} from "lucide-react";


function MedicalUI({
  onPoseSelect,
  currentPose,
  currentCameraPosition,
  selectedExam,
  setSelectedExam,
  mode,
  onModeChange,
  onPoseChange, // New prop for pose switching
  mccData,
  positionOffset,
  onPositionOffsetChange,
  rotationOffset,
  onRotationOffsetChange,
  onlyShowButtons,
  showCornerPoses = false,
  onOpenChat,
  onMonitoringClick = null, // Custom monitoring click handler
  onPhysicalExamClick = null, // Custom physical exam click handler
  onTestExamineClick = null // Custom test examine click handler for 3D examination
}) {
  // Extract patient name from mccData
  const getPatientNameFromMccData = () => {
    if (!mccData || !mccData.sections) return "Patient";
    
    // Search for patient_name variable in all sections
    for (const section of mccData.sections) {
      if (section.tables) {
        for (const table of section.tables) {
          if (table.rows) {
            for (const row of table.rows) {
              if (row.cells) {
                for (const cell of row.cells) {
                  if (cell.content && cell.content.includes('{patient_name}')) {
                    // Try to find the resolved value in the next cell or row
                    const cellIndex = row.cells.indexOf(cell);
                    if (cellIndex < row.cells.length - 1 && row.cells[cellIndex + 1].content) {
                      return row.cells[cellIndex + 1].content.trim();
                    }
                  }
                  // Also check for any cell that might contain a resolved patient name
                  if (cell.content && !cell.content.includes('{') && 
                      (cell.content.match(/^[A-Z][a-z]+ [A-Z][a-z]+$/) || 
                       cell.content.match(/^[A-Z][a-z]+$/))) {
                    // Simple pattern matching for names (First Last or First)
                    return cell.content.trim();
                  }
                }
              }
            }
          }
        }
      }
    }
    return "Patient";
  };

  // Extract patient gender from mccData
  const getPatientGenderFromMccData = () => {
    return detectPatientGender(mccData);
  };

  const [vitals, setVitals] = useState({
    bloodPressure: "120/80",
    pulse: "72",
    breathRate: "16",
    o2Sat: "98",
    etCO2: "35",
    patientName: getPatientNameFromMccData(),
    patientWeight: "68.0 Kg"
  });

  // Extract patient gender from mccData
  const patientGender = getPatientGenderFromMccData();

  const [showPosesMenu, setShowPosesMenu] = useState(false);
  const [showViewsMenu, setShowViewsMenu] = useState(false);
  const [showExamMenu, setShowExamMenu] = useState(false);
  const [showVitalsMonitor, setShowVitalsMonitor] = useState(false);
  const [showAirwayImage, setShowAirwayImage] = useState(false);
  const [selectedPhysicalExam, setSelectedPhysicalExam] = useState(null);
  const [showTestsMenu, setShowTestsMenu] = useState(false);
  const [showECGImage, setShowECGImage] = useState(false);
  const [selectedMediaTag, setSelectedMediaTag] = useState(null);
  const [showPhysicalExamInterface, setShowPhysicalExamInterface] = useState(false);

  const handleClosePhysicalExam = () => {
    setShowPhysicalExamInterface(false);
  };

  // Define poses with both character position and camera position
  const POSES = {
    SITTING: {
      id: 'sitting',
      label: 'Sitting',
      animation: 'sitting',
      position: [-7.6, -4, 8.4],
      rotation: [0, 10 * Math.PI / 180, 0],
      cameraPosition: [-6.96, -0.75, 13.81],
      cameraRotation: [-8.73 * Math.PI / 180, 5.96 * Math.PI / 180, 0.91 * Math.PI / 180]
    },
    LAYING_DOWN: {
      id: 'layingdown',
      label: 'Lying Down',
      animation: 'layingdown',
      position: [-7.9, -5.4, 7.5],
      rotation: [0, 90 * Math.PI / 180, 0],
      cameraPosition: [-8.75, 1.95, 7.74],
      cameraRotation: [-90 * Math.PI / 180, 1.15 * Math.PI / 180, 90.09 * Math.PI / 180]
    }
  };

  // Define camera views (different angles to look at the character)
  const views = [
    {
      id: 'front',
      label: 'Front View',
      cameraPosition: [-7.05, -1.08, 12.64],
      cameraRotation: [-1.94 * Math.PI / 180, 7.74 * Math.PI / 180, 0.26 * Math.PI / 180]
    },
    {
      id: 'back',
      label: 'Back View',
      cameraPosition: [-8.01, -0.61, 4.56],
      cameraRotation: [-167.46 * Math.PI / 180, -6.31 * Math.PI / 180, -178.60 * Math.PI / 180]
    },
    {
      id: 'left',
      label: 'Left View',
      cameraPosition: [-2.96, -0.80, 8.56],
      cameraRotation: [-104.20 * Math.PI / 180, 81.28 * Math.PI / 180, 104.36 * Math.PI / 180]
    },
    {
      id: 'right',
      label: 'Right View',
      cameraPosition: [-10.77, -0.71, 8.81],
      cameraRotation: [-90.71 * Math.PI / 180, -77.42 * Math.PI / 180, -90.74 * Math.PI / 180]
    }
  ];

  // Define available exams for each mode
  const AVAILABLE_EXAMS = {
    [APP_MODES.INTERVIEW]: [],
    [APP_MODES.PHYSICAL_EXAM]: [
      { id: 'chestsounds', label: 'Chest Sounds' },
      { id: 'palpation', label: 'Palpation' }
    ],
    [APP_MODES.DIAGNOSTIC_TESTING]: [
      { id: 'xray', label: 'X-Ray' },
      { id: 'ct', label: 'CT Scan' },
      { id: 'mri', label: 'MRI' }
    ],
    [APP_MODES.TREATMENT_PLANNING]: [
      { id: 'medications', label: 'Medications' },
      { id: 'procedures', label: 'Procedures' }
    ],
    [APP_MODES.SUMMARY]: []
  };

  // Define available tools for interview mode
  const INTERVIEW_TOOLS = [
    { id: 'stethoscope', label: 'Stethoscope', icon: '��' },
    { id: 'penlight', label: 'Penlight', icon: '🔦' },
    { id: 'otoscope', label: 'Otoscope', icon: '👂' },
    { id: 'tongue_depressor', label: 'Tongue Depressor', icon: '👅' },
    { id: 'reflex_hammer', label: 'Reflex Hammer', icon: '🔨' }
  ];

  // Add state for selected tool
  const [selectedTool, setSelectedTool] = useState(null);

  // Handle mode change
  const handleModeChange = (newMode) => {
    // Always ensure pointer is unlocked
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    
    // Reset exam selection when changing modes
    if (newMode !== APP_MODES.PHYSICAL_EXAM) {
      setSelectedExam(null);
    }
    
    // Call the parent's mode change handler
    onModeChange(newMode);
  };

  useEffect(() => {
    // Ensure pointer is always unlocked when component mounts or mode changes
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }

    // Add event listener to prevent pointer lock
    const preventLock = (e) => {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    };

    document.addEventListener('pointerlockchange', preventLock);
    
    return () => {
      document.removeEventListener('pointerlockchange', preventLock);
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    };
  }, [mode]);

  // Define available exams for physical exam mode
  const PHYSICAL_EXAMS = [
    { id: 'chestsounds', label: 'Chest Sounds' },
    { id: 'palpation', label: 'Palpation' }
  ];

  // Render launch mode UI
  const LaunchModeUI = () => (
    <div className="launch-page">
      <img src="/images/launch.png" alt="Launch" className="launch-bg-image" />
      <button className="launch-button" onClick={() => onModeChange(APP_MODES.INTERVIEW)}>
        Begin Virtual Patient Simulation
      </button>
      <style jsx>{`
        .launch-page {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .launch-bg-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          object-fit: cover;
          z-index: 0;
        }
        .launch-button {
          position: relative;
          z-index: 1;
          background: #000;
          color: #fff;
          border: none;
          padding: 18px 36px;
          border-radius: 8px;
          font-size: 20px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s;
          box-shadow: 0 4px 16px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3);
          text-shadow: 0 2px 8px rgba(0,0,0,0.7);
        }
        .launch-button:hover {
          background: #222;
        }
      `}</style>
    </div>
  );

  // Interview mode UI (no mode selection)
  // const InterviewModeUI = () => (
  //   <div className="position-slider-container">
  //     <div className="position-slider-panel">
  //       <h4>Character Adjustment</h4>
  //       
  //       <div className="section-title">Position</div>
  //       <div className="slider-group">
  //         <label>X Position: {positionOffset?.x?.toFixed(2) || '0.00'}</label>
  //         <input
  //           type="range"
  //           min="-5"
  //           max="5"
  //           step="0.1"
  //           value={positionOffset?.x || 0}
  //           onChange={(e) => onPositionOffsetChange({
  //             ...positionOffset,
  //             x: parseFloat(e.target.value)
  //           })}
  //         />
  //       </div>
  //       <div className="slider-group">
  //         <label>Y Position: {positionOffset?.y?.toFixed(2) || '0.00'}</label>
  //         <input
  //           type="range"
  //           min="-5"
  //           max="5"
  //           step="0.1"
  //           value={positionOffset?.y || 0}
  //           onChange={(e) => onPositionOffsetChange({
  //             ...positionOffset,
  //             y: parseFloat(e.target.value)
  //           })}
  //         />
  //       </div>
  //       <div className="slider-group">
  //         <label>Z Position: {positionOffset?.z?.toFixed(2) || '0.00'}</label>
  //         <input
  //           type="range"
  //           min="-5"
  //           max="5"
  //           step="0.1"
  //           value={positionOffset?.z || 0}
  //           onChange={(e) => onPositionOffsetChange({
  //             ...positionOffset,
  //             z: parseFloat(e.target.value)
  //           })}
  //         />
  //       </div>
  //       
  //       <div className="section-title">Rotation</div>
  //       <div className="slider-group">
  //         <label>X Rotation: {((rotationOffset?.x || 0) * (180/Math.PI)).toFixed(1)}°</label>
  //         <input
  //           type="range"
  //           min="-3.14"
  //           max="3.14"
  //           step="0.1"
  //           value={rotationOffset?.x || 0}
  //           onChange={(e) => onRotationOffsetChange({
  //             ...rotationOffset,
  //             x: parseFloat(e.target.value)
  //           })}
  //         />
  //       </div>
  //       <div className="slider-group">
  //         <label>Y Rotation: {((rotationOffset?.y || 0) * (180/Math.PI)).toFixed(1)}°</label>
  //         <input
  //           type="range"
  //           min="-3.14"
  //           max="3.14"
  //           step="0.1"
  //           value={rotationOffset?.y || 0}
  //           onChange={(e) => onRotationOffsetChange({
  //             ...rotationOffset,
  //             y: parseFloat(e.target.value)
  //           })}
  //         />
  //       </div>
  //       <div className="slider-group">
  //         <label>Z Rotation: {((rotationOffset?.z || 0) * (180/Math.PI)).toFixed(1)}°</label>
  //         <input
  //           type="range"
  //           min="-3.14"
  //           max="3.14"
  //           step="0.1"
  //           value={rotationOffset?.z || 0}
  //           onChange={(e) => onRotationOffsetChange({
  //             ...rotationOffset,
  //             z: parseFloat(e.target.value)
  //           })}
  //         />
  //       </div>
  //       
  //       <div className="button-group">
  //         <button 
  //           className="reset-position-btn"
  //           onClick={() => onPositionOffsetChange({ x: 0, y: 0, z: 0 })}
  //         >
  //           Reset Position
  //         </button>
  //         <button 
  //           className="reset-rotation-btn"
  //           onClick={() => onRotationOffsetChange({ x: 0, y: 0, z: 0 })}
  //         >
  //           Reset Rotation
  //         </button>
  //       </div>
  //     </div>
  //   </div>
  // );
  const InterviewModeUI = () => null;

  // Render physical exam mode UI
  const PhysicalExamModeUI = () => (
    <>
      <div className="back-button">
        <button onClick={() => handleModeChange(APP_MODES.INTERVIEW)}>
          <IoArrowBack /> Back to Interview
        </button>
      </div>
      <VitalsMonitor vitals={vitals} />
      <div className="exam-selection">
        <div className="exam-buttons">
          {AVAILABLE_EXAMS[APP_MODES.PHYSICAL_EXAM].map(exam => (
            <button
              key={exam.id}
              className={selectedExam === exam.id ? 'active' : ''}
              onClick={() => setSelectedExam(exam.id)}
            >
              {exam.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  const MonitoringModeUI = () => (
    <>
      <VitalsMonitor vitals={vitals} onClose={() => setShowVitalsMonitor(false)} />
    </>
  );

  const icons = {
    chat: <MessageCircle size={42} strokeWidth={2.2} color="#AB0520" />,
    physicalExam: <Stethoscope size={42} strokeWidth={2.2} color="#AB0520" />,
    monitoring: <Activity size={42} strokeWidth={2.2} color="#AB0520" />,
    tests: <FlaskRound size={42} strokeWidth={2.2} color="#AB0520" />,
    medication: <Pill size={42} strokeWidth={2.2} color="#AB0520" />,
    poses: <User size={42} strokeWidth={2.2} color="#AB0520" />
  };

  // Poses button state
  const handlePosesClick = () => {
    setShowPosesMenu((prev) => !prev);
  };
  const handlePoseOption = (pose) => {
    setShowPosesMenu(false);
    // Use onPoseChange callback if provided
    if (onPoseChange) {
      if (pose === 'Sitting') {
        onPoseChange('sitting');
      } else if (pose === 'Lying Down') {
        onPoseChange('lying_down');
      }
    } else {
      // Legacy behavior for backwards compatibility
      if (pose === 'Sitting') {
        onModeChange && onModeChange(APP_MODES.INTERVIEW);
      } else if (pose === 'Lying Down') {
        onModeChange && onModeChange(APP_MODES.PHYSICAL_EXAM);
      }
    }
  };

  const BottomIconBar = ({ mode, onModeChange }) => {
  


    const handlePhysicalExamClick = () => {
      if (onPhysicalExamClick) {
        // Use custom handler from parent if provided
        onPhysicalExamClick();
      } else {
        // Default behavior - show modal
        setShowPhysicalExamInterface(true);
      }
      // Close any other open menus
      setShowTestsMenu(false);
    };

    const handleTestExamineClick = () => {
      if (onTestExamineClick) {
        // Use custom handler from parent if provided
        onTestExamineClick();
      }
      // Close any other open menus
      setShowTestsMenu(false);
    };

    const handleAirwaySubMenuOption = (option) => {
      if (option === 'Airway Observation') {
        setShowAirwayImage(true);
      }
    };

    const handleCloseAirwayImage = () => {
      setShowAirwayImage(false);
    };

    const testsOptions = [
      'Chest X-Ray',
      'CT Scan',
      'MRI',
      'Ultrasound',
      'ECG',
      'Blood Test',
      'Urinalysis',
      'Pulse Oximetry',
      'ABG',
      'COVID/Flu PCR Test'
    ];

    const handleTestsClick = () => {
      setShowTestsMenu((prev) => !prev);
    };

    const handleTestsOption = (option) => {
      setShowTestsMenu(false);
      console.log('Selected Test Option:', option);
      
      // Handle special cases first
      if (option === 'ECG') {
        setShowECGImage(true);
        setSelectedMediaTag(null);
        return;
      }
      
      // For other test options, try to fetch media from GCS
      setShowECGImage(false);
      
      // Convert option to a suitable tag for GCS search
      // Handle special cases for better matching
      let mediaTag;
      switch (option.toLowerCase()) {
        case 'chest x-ray':
          mediaTag = 'chest';
          break;
        case 'ct scan':
          mediaTag = 'ct';
          break;
        case 'blood test':
          mediaTag = 'blood';
          break;
        case 'pulse oximetry':
          mediaTag = 'pulse';
          break;
        case 'covid/flu pcr test':
          mediaTag = 'covid';
          break;
        default:
          mediaTag = option.toLowerCase().replace(/\s+/g, '');
      }
      
      console.log('Searching for media with tag:', mediaTag);
      setSelectedMediaTag(mediaTag);
    };

    const handleChatClick = () => {
      const event = new Event('toggleChat');
      window.dispatchEvent(event);
    };

    const allButtons = [
      { id: 'poses', label: "Poses", icon: icons.poses, onClick: handlePosesClick, active: showPosesMenu, key: "poses" },
      { id: APP_MODES.MONITORING, label: "Monitoring", icon: icons.monitoring, onClick: onMonitoringClick || (() => setShowVitalsMonitor(v => !v)), active: showVitalsMonitor, key: "monitoring" },
      { id: APP_MODES.PHYSICAL_EXAM, label: "Examine", icon: icons.physicalExam, onClick: handlePhysicalExamClick, key: "physical_exam" },
      { id: 'test_examine', label: "Test", icon: icons.physicalExam, onClick: handleTestExamineClick, key: "test_examine" },
      { id: APP_MODES.DIAGNOSTIC_TESTING, label: "Tests", icon: icons.tests, onClick: handleTestsClick, active: showTestsMenu, key: "tests" },
      { id: APP_MODES.TREATMENT_PLANNING, label: "Medication", icon: icons.medication, key: "medication" },
      { id: 'chat', label: "Chat", icon: icons.chat, onClick: handleChatClick, key: "chat" }
    ];

    // Filter buttons based on onlyShowButtons prop
    const buttons = onlyShowButtons 
      ? allButtons.filter(btn => onlyShowButtons.includes(btn.key))
      : allButtons;

    return (
      <div className="bottom-icon-bar">
        {buttons.map(btn => (
          <div key={btn.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button
              className={`icon-button ${(mode === btn.id || btn.active) ? 'active' : ''}`}
              onClick={btn.onClick ? btn.onClick : () => onModeChange(btn.id)}
              data-mode={btn.key}
            >
              <div className="icon-circle">
                <div className="icon-wrapper">{btn.icon}</div>
              </div>
              <span className="icon-label">
                {btn.label.includes('\n') 
                  ? btn.label.split('\n').map((line, i) => <div key={i}>{line}</div>)
                  : btn.label}
              </span>
            </button>

            {/* Tests Menu */}
            {btn.id === APP_MODES.DIAGNOSTIC_TESTING && showTestsMenu && (
              <div className="physical-exam-menu">
                {testsOptions.map(option => (
                  <div
                    key={option}
                    className="physical-exam-menu-item"
                    onClick={() => handleTestsOption(option)}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}

            {/* Poses Menu Placeholder */}
            {btn.id === 'poses' && showPosesMenu && (
              <div className="physical-exam-menu">
                <div className="physical-exam-menu-item" onClick={() => handlePoseOption('Sitting')}>Sitting</div>
                <div className="physical-exam-menu-item" onClick={() => handlePoseOption('Lying Down')}>Lying Down</div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Add dynamic cursor style globally
  useEffect(() => {
    if (selectedPhysicalExam === 'Breathing') {
      document.body.style.cursor = 'url("/images/stheth.jpg"), auto';
    } else {
      document.body.style.cursor = 'default';
    }

    return () => {
      document.body.style.cursor = 'default'; // reset when component unmounts
    };
  }, [selectedPhysicalExam]);

  // Optional Reset (when exiting physical exam)
  useEffect(() => {
    if (mode !== APP_MODES.PHYSICAL_EXAM) {
      setSelectedPhysicalExam(null);
    }
  }, [mode]);

  return (
    <div className="medical-ui-overlay">
      <div className="medical-ui-container">
      {mode === APP_MODES.LAUNCH && <LaunchModeUI />}
      {mode === APP_MODES.INTERVIEW && <InterviewModeUI />}
        {mode === APP_MODES.PHYSICAL_EXAM && <PhysicalExamModeUI />}
        {showVitalsMonitor && <MonitoringModeUI />}
      </div>

      {/* NEW: Add Physical Examination Interface */}
      {showPhysicalExamInterface && (
        <PhysicalExamInterface onClose={handleClosePhysicalExam} />
      )}
      {/* Poses Button in Bottom Left (optional) */}
      {showCornerPoses && (
        <div className="poses-bottom-left">
          <button className="icon-button poses-btn" onClick={handlePosesClick}>
            <div className="icon-circle">
              <div className="icon-wrapper">{icons.poses}</div>
            </div>
            <span className="icon-label">Poses</span>
          </button>
          {showPosesMenu && (
            <div className="physical-exam-menu poses-menu">
              <div className="physical-exam-menu-item" onClick={() => handlePoseOption('Sitting')}>Sitting</div>
              <div className="physical-exam-menu-item" onClick={() => handlePoseOption('Lying Down')}>Lying Down</div>
            </div>
          )}
        </div>
      )}
      <BottomIconBar mode={mode} onModeChange={onModeChange} />
      {showAirwayImage && (
        <div className="airway-image-overlay">
          <Draggable handle=".airway-image-header">
            <div className="airway-image-container">
              <div className="airway-image-header">
                <span className="airway-title">Airway Observation</span>
                <button className="close-airway-image" onClick={handleCloseAirwayImage}>×</button>
              </div>
              <div className="airway-image-wrapper">
                <img
                  src="/images/Airway.png"
                  alt="Patient Airway"
                  className="airway-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/400x300?text=Airway+Image+Not+Found";
                  }}
                />
              </div>
            </div>
          </Draggable>
        </div>
      )}
      {showECGImage && (
        <div className="airway-image-overlay">
          <Draggable handle=".airway-image-header">
            <div className="airway-image-container">
              <div className="airway-image-header">
                <span className="airway-title">ECG Result</span>
                <button className="close-airway-image" onClick={() => setShowECGImage(false)}>×</button>
              </div>
              <div className="airway-image-wrapper">
                <img
                  src="/images/ecg.png"
                  alt="ECG Result"
                  className="airway-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/400x300?text=ECG+Image+Not+Found";
                  }}
                />
              </div>
            </div>
          </Draggable>
        </div>
      )}
      {selectedMediaTag && (
        <MediaViewer
          tag={selectedMediaTag}
          onClose={() => {
            setSelectedMediaTag(null);
            console.log('Media viewer closed');
          }}
          onError={(error) => {
            console.error('Media viewer error:', error);
            setSelectedMediaTag(null);
            // You could add a toast notification here if you have a notification system
          }}
        />
      )}
      <style jsx>{`
        :root {
          --icon-bg: #f5f1ea;
          --icon-text: #B08968;
        }

        .bottom-icon-bar {
          position: fixed;
          bottom: 18px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 4px 8px;
          border-radius: 8px;
          background: rgba(255,255,255,0.25);
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          backdrop-filter: blur(2px);
          z-index: 2005;
          pointer-events: auto;
        }

        .icon-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: none;
          border: none;
          cursor: pointer;
          pointer-events: auto;
          outline: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .icon-button:focus,
        .icon-button:active {
          outline: none;
          box-shadow: none;
        }

        .icon-button:hover .icon-circle {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .icon-button:active .icon-circle {
          background: #f8f9fa;
          transform: translateY(-1px) scale(0.98);
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .icon-button:hover .icon-label {
          color: #AB0520;
          transform: translateY(-1px);
        }

        .icon-circle {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .icon-circle::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(171, 5, 32, 0.05) 0%, rgba(171, 5, 32, 0.02) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .icon-button:hover .icon-circle::before {
          opacity: 1;
        }

        .icon-wrapper {
          position: relative;
          z-index: 1;
          transition: all 0.3s ease;
        }

        .icon-wrapper svg, .icon-wrapper img {
          width: 40px;
          height: 40px;
          transition: all 0.3s ease;
        }

        .icon-button:hover .icon-wrapper svg {
          transform: scale(1.05);
        }

        .icon-label {
          margin-top: 8px;
          font-size: 13px;
          color: #000000;
          font-weight: 500;
          letter-spacing: 0.5px;
          text-align: center;
          line-height: 1.2;
          text-shadow: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }
        @media (max-width: 768px) {
          .icon-label {
            font-size: 16px;
          }
        }

        .icon-button.active .icon-circle {
          background: linear-gradient(135deg, #AB0520 0%, #8B0015 100%);
          box-shadow: 0 6px 25px rgba(171, 5, 32, 0.25);
        }

        .icon-button.active .icon-wrapper svg {
          color: #ffffff;
          filter: brightness(1.1);
        }

        .icon-button.active .icon-label {
          color: #AB0520;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .bottom-icon-bar {
            left: 50%;
            transform: translateX(-50%);
            gap: 10px;
            padding: 4px 6px;
            bottom: 14px;
          }
          .icon-circle {
            width: 48px;
            height: 48px;
          }
          .icon-wrapper svg, .icon-wrapper img {
            width: 32px;
            height: 32px;
          }
          .icon-label {
            font-size: 12px;
          }
        }

        .physical-exam-menu {
          position: absolute;
          bottom: 100px;
          left: 50%;
          transform: translateX(-50%);
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          padding: 8px 0;
          min-width: 140px;
          z-index: 1200;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          margin-bottom: 8px;
        }
        .physical-exam-menu::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 10px solid transparent;
          border-right: 10px solid transparent;
          border-top: 10px solid #fff;
          filter: drop-shadow(0 2px 2px rgba(0,0,0,0.08));
        }
        .physical-exam-menu-item {
          padding: 10px 20px;
          color: #222;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
          text-align: left;
        }
        .physical-exam-menu-item:hover {
          background: #F5F1EA;
        }
        .airway-image-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: flex-start; /* controls vertical position */
          justify-content: center; /* centers horizontally */
          padding-bottom: -30vh; /* move image down from top */
          z-index: 3000;
        }

        .airway-image-container {
          margin-bottom: 500px; /* Pull image upward */
        }

        .airway-image-header {
          width: 100%;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          margin-bottom: 15px;
        }

        .close-airway-image {
          background: #B08968;
          color: white;
          border: none;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          transition: background 0.2s;
        }

        .close-airway-image:hover {
          background: #8B6B4A;
        }

        .poses-bottom-left {
          position: fixed;
          bottom: 20px;
          left: 20px;
          z-index: 1200;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .poses-btn {
          margin-bottom: 0;
        }
        .poses-menu {
          left: 0;
          transform: none;
          margin-top: 8px;
        }

        /* Media Viewer Styles */
        .media-viewer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }

        .media-viewer-modal {
          background: white;
          border-radius: 12px;
          max-width: 90vw;
          max-height: 90vh;
          overflow: hidden;
          position: relative;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .close-button {
          position: absolute;
          top: 15px;
          right: 15px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          font-size: 24px;
          cursor: pointer;
          z-index: 10001;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.3s;
        }

        .close-button:hover {
          background: rgba(0, 0, 0, 0.9);
        }

        .media-container {
          display: flex;
          flex-direction: column;
          max-width: 100%;
          max-height: 100%;
        }

        .media-content {
          max-width: 100%;
          max-height: 70vh;
          object-fit: contain;
        }

        .media-info {
          padding: 20px;
          background: #f8f9fa;
          border-top: 1px solid #e9ecef;
        }

        .media-info h4 {
          margin: 0 0 15px 0;
          color: #333;
          font-size: 18px;
        }

        .metadata {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          font-size: 14px;
        }

        .metadata-item {
          padding: 8px;
          background: white;
          border-radius: 4px;
          border: 1px solid #e9ecef;
        }

        .metadata-item strong {
          color: #495057;
        }

        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
          color: #666;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-container {
          padding: 40px;
          text-align: center;
          color: #dc3545;
        }

        .error-container h3 {
          margin-bottom: 15px;
        }

        .download-link {
          display: inline-block;
          margin-top: 15px;
          padding: 10px 20px;
          background: #007bff;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          transition: background 0.3s;
        }

        .download-link:hover {
          background: #0056b3;
        }

        .image-container .media-content {
          max-height: 80vh;
        }

        .video-container .media-content {
          max-height: 70vh;
        }

        .audio-container {
          padding: 40px;
          text-align: center;
        }

        .audio-container .media-content {
          width: 100%;
          max-width: 400px;
        }

        /* Loading Options Modal Styles */
        .loading-options-modal {
          max-width: 500px !important;
          padding: 30px !important;
        }

        .loading-options-container {
          text-align: center;
        }

        .loading-options-container h2 {
          color: #2c3e50;
          margin-bottom: 15px;
          font-size: 24px;
        }

        .loading-options-container > p {
          color: #7f8c8d;
          margin-bottom: 30px;
          font-size: 16px;
        }

        .loading-options-buttons {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
          justify-content: center;
        }

        .option-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 25px 20px;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 180px;
          text-align: center;
        }

        .option-button:hover {
          border-color: #3498db;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(52, 152, 219, 0.15);
        }

        .option-button.immediate:hover {
          border-color: #e74c3c;
          box-shadow: 0 8px 25px rgba(231, 76, 60, 0.15);
        }

        .option-button.timer:hover {
          border-color: #f39c12;
          box-shadow: 0 8px 25px rgba(243, 156, 18, 0.15);
        }

        .option-icon {
          font-size: 32px;
          margin-bottom: 15px;
        }

        .option-content h3 {
          margin: 0 0 8px 0;
          color: #2c3e50;
          font-size: 18px;
        }

        .option-content p {
          margin: 0;
          color: #7f8c8d;
          font-size: 14px;
        }

        .close-button {
          background: none;
          color: #333;
          border: none;
          cursor: pointer;
          font-size: 28px;
          font-weight: 300;
          transition: all 0.3s ease;
          width: auto;
          height: auto;
          border-radius: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          line-height: 1;
          opacity: 0.9;
        }

        .close-button:hover {
          color: #000;
          background: none;
          opacity: 1;
          transform: scale(1.1);
        }

        /* Timer Loading Modal Styles */
        .loading-modal {
          max-width: 600px !important;
          padding: 40px !important;
        }

        .loading-container {
          text-align: center;
        }

        .timer-display {
          margin-bottom: 30px;
        }

        .timer-circle {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3498db, #2980b9);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          box-shadow: 0 8px 25px rgba(52, 152, 219, 0.3);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        .timer-text {
          color: white;
          font-size: 28px;
          font-weight: bold;
          font-family: 'Courier New', monospace;
        }

        .loading-content h2 {
          color: #2c3e50;
          margin-bottom: 15px;
          font-size: 24px;
        }

        .loading-content > p {
          color: #7f8c8d;
          margin-bottom: 25px;
          font-size: 16px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #ecf0f1;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 25px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3498db, #2ecc71);
          border-radius: 4px;
          transition: width 1s ease;
        }

        .loading-details {
          text-align: left;
          margin-bottom: 30px;
        }

        .loading-details p {
          color: #7f8c8d;
          margin: 8px 0;
          font-size: 14px;
          animation: fadeInUp 0.5s ease forwards;
          opacity: 0;
        }

        .loading-details p:nth-child(1) { animation-delay: 0.2s; }
        .loading-details p:nth-child(2) { animation-delay: 0.4s; }
        .loading-details p:nth-child(3) { animation-delay: 0.6s; }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .skip-button {
          background: #e74c3c;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          transition: background 0.3s;
        }

        .skip-button:hover {
          background: #c0392b;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .loading-options-buttons {
            flex-direction: column;
            gap: 15px;
          }

          .option-button {
            min-width: auto;
            padding: 20px 15px;
          }

          .timer-circle {
            width: 100px;
            height: 100px;
          }

          .timer-text {
            font-size: 24px;
          }

          .loading-options-modal,
          .loading-modal {
            max-width: 90vw !important;
            padding: 20px !important;
          }

          .loading-content h2 {
            font-size: 20px;
          }

          .option-content h3 {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
}

export default MedicalUI;