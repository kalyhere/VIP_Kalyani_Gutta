import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import PhysicalExamInterface from './PhysicalExamInterface';
import PhysicalExamScene from './PhysicalExamScene';
import ThreeJSScene from './ThreeJSScene';

// Coordinate adjustments for torso view (abdomen examinations)
const torsoCoordinateAdjustments = {
  // Stethoscope cardiac points
  'steth_1': { x: 2, y: -3 }, // Aortic Area
  'steth_2': { x: -1, y: -2 }, // Tricuspid Area  
  'steth_3': { x: 0, y: 1 }, // Pulmonary Area
  'steth_4': { x: -2, y: 0 }, // Mitral Area
  
  // Respiratory points
  'resp_f_lul': { x: 1, y: -2 }, // Front LUL
  'resp_f_lll': { x: 2, y: 1 }, // Front LLL
  'resp_f_rul': { x: -2, y: -2 }, // Front RUL
  'resp_f_rll': { x: -1, y: 1 }, // Front RLL
  'resp_b_lul': { x: 1, y: -2 }, // Back LUL
  'resp_b_lll': { x: 2, y: 1 }, // Back LLL
  'resp_b_rul': { x: -2, y: -2 }, // Back RUL
  'resp_b_rll': { x: -1, y: 1 }, // Back RLL
  
  // Abdomen points
  'abd_ruq': { x: 1, y: 2 }, // RUQ
  'abd_luq': { x: -1, y: 2 }, // LUQ
  'abd_rlq': { x: 2, y: 3 }, // RLQ
  'abd_llq': { x: -2, y: 3 }, // LLQ
  'abd_umb': { x: 0, y: 2 }, // Umbilicus
  
  // Vascular points
  'vas_rcar': { x: 1, y: -1 }, // Right Carotid
  'vas_lcar': { x: -1, y: -1 }, // Left Carotid
  'vas_aorta': { x: 0, y: 2 }, // Abdominal Aorta
  'vas_rrenal': { x: 2, y: 3 }, // Right Renal
  'vas_lrenal': { x: -2, y: 3 }, // Left Renal
  
  // Eye points
  'pen_1': { x: 8.2, y: 3 }, // Left Eye
  'pen_2': { x: 7, y: 3 }, // Right Eye
  'ophthal_1': { x: 8.2, y: 3 }, // Left Eye Fundus
  'ophthal_2': { x: 7, y: 3 }, // Right Eye Fundus
  
  // Ear points
  'oto_1': { x: 7, y: 5 }, // Left Ear
  'oto_2': { x: 7.9, y: 5 }, // Right Ear
  'oto_3': { x: 1, y: -2 }, // Left Ear Back
  'oto_4': { x: -1, y: -2 }, // Right Ear Back
  
  // Tuning fork points
  'fork_1': { x: 1, y: -1 }, // Left Ear
  'fork_2': { x: -1, y: -1 }, // Right Ear
  'fork_3': { x: 0, y: -2 }, // Forehead Weber
  'fork_4': { x: 1, y: -2 }, // Left Ear Back
  'fork_5': { x: -1, y: -2 }, // Right Ear Back
  'fork_6': { x: 0, y: -3 }, // Occiput Weber
  
  // Tongue depressor points
  'tongue_1': { x: 0, y: 0 }, // Mouth
  'tongue_2': { x: 0, y: 0 }, // Oropharynx
  'tongue_3': { x: 0, y: -1 }, // Mouth Back
  'tongue_4': { x: 0, y: -1 }, // Oropharynx Back
  
  // Reflex hammer points
  'reflex_1': { x: 2, y: 2 }, // Left Bicep
  'reflex_2': { x: -2, y: 2 }, // Right Bicep
  'reflex_3': { x: 3, y: 3 }, // Left Forearm
  'reflex_4': { x: -3, y: 3 }, // Right Forearm
  'reflex_5': { x: 1, y: 4 }, // Left Knee
  'reflex_6': { x: -1, y: 4 }, // Right Knee
  'reflex_7': { x: 1, y: 5 }, // Left Ankle
  'reflex_8': { x: -1, y: 5 }, // Right Ankle
  'reflex_9': { x: 2, y: 3 }, // Left Tricep
  'reflex_10': { x: -2, y: 3 }, // Right Tricep
  'reflex_11': { x: 3, y: 3 }, // Left Forearm Back
  'reflex_12': { x: -3, y: 3 }, // Right Forearm Back
  'reflex_13': { x: 1, y: 4 }, // Left Knee Back
  'reflex_14': { x: -1, y: 4 }, // Right Knee Back
  'reflex_15': { x: 1, y: 5 }, // Left Ankle Back
  'reflex_16': { x: -1, y: 5 }, // Right Ankle Back
  
  // Dermatoscope points
  'derm_1': { x: 1, y: -2 }, // Face
  'derm_2': { x: 0, y: 1 }, // Chest
  'derm_3': { x: 3, y: 2 }, // Left Arm
  'derm_4': { x: -3, y: 2 }, // Right Arm
  'derm_5': { x: 0, y: 0 }, // Back
  
  // Blood pressure points
  'bp_1': { x: 2, y: 2 }, // Left Arm
  'bp_2': { x: -2, y: 2 }, // Right Arm
  'bp_3': { x: 2, y: 2 }, // Left Arm Back
  'bp_4': { x: -2, y: 2 }, // Right Arm Back
  
  // Palpation points
  'palp_1': { x: 1, y: 2 }, // RUQ
  'palp_2': { x: -1, y: 2 }, // LUQ
  'palp_3': { x: 1, y: 3 }, // RLQ
  'palp_4': { x: -1, y: 3 }, // LLQ
};

// Coordinate adjustments for exam room view (non-abdomen examinations)
const examRoomCoordinateAdjustments = {
  // Stethoscope cardiac points - adjusted for standing patient
  'steth_1': { x: 1, y: -2 }, // Aortic Area
  'steth_2': { x: -1, y: -1 }, // Tricuspid Area  
  'steth_3': { x: 0, y: 0 }, // Pulmonary Area
  'steth_4': { x: -1, y: 0 }, // Mitral Area
  
  // Respiratory points - adjusted for standing patient
  'resp_f_lul': { x: 1, y: -1 }, // Front LUL
  'resp_f_lll': { x: 1, y: 1 }, // Front LLL
  'resp_f_rul': { x: -1, y: -1 }, // Front RUL
  'resp_f_rll': { x: -1, y: 1 }, // Front RLL
  'resp_b_lul': { x: 1, y: -1 }, // Back LUL
  'resp_b_lll': { x: 1, y: 1 }, // Back LLL
  'resp_b_rul': { x: -1, y: -1 }, // Back RUL
  'resp_b_rll': { x: -1, y: 1 }, // Back RLL
  
  // Abdomen points - keep same for consistency
  'abd_ruq': { x: 1, y: 2 }, // RUQ
  'abd_luq': { x: -1, y: 2 }, // LUQ
  'abd_rlq': { x: 2, y: 3 }, // RLQ
  'abd_llq': { x: -2, y: 3 }, // LLQ
  'abd_umb': { x: 0, y: 2 }, // Umbilicus
  
  // Vascular points - adjusted for standing patient
  'vas_rcar': { x: 1, y: -1 }, // Right Carotid
  'vas_lcar': { x: -1, y: -1 }, // Left Carotid
  'vas_aorta': { x: 0, y: 2 }, // Abdominal Aorta
  'vas_rrenal': { x: 2, y: 3 }, // Right Renal
  'vas_lrenal': { x: -2, y: 3 }, // Left Renal
  
  // Eye points - adjusted for standing patient
  'pen_1': { x: 8.2, y: 3 }, // Left Eye
  'pen_2': { x: 7, y: 3 }, // Right Eye
  'ophthal_1': { x: 8.2, y: 3 }, // Left Eye Fundus
  'ophthal_2': { x: 7, y: 3 }, // Right Eye Fundus
  
  // Ear points - adjusted for standing patient
  'oto_1': { x: 7, y: 5 }, // Left Ear
  'oto_2': { x: 7.9, y: 5 }, // Right Ear
  'oto_3': { x: 1, y: -2 }, // Left Ear Back
  'oto_4': { x: -1, y: -2 }, // Right Ear Back
  
  // Tuning fork points - adjusted for standing patient
  'fork_1': { x: 1, y: -1 }, // Left Ear
  'fork_2': { x: -1, y: -1 }, // Right Ear
  'fork_3': { x: 0, y: -2 }, // Forehead Weber
  'fork_4': { x: 1, y: -2 }, // Left Ear Back
  'fork_5': { x: -1, y: -2 }, // Right Ear Back
  'fork_6': { x: 0, y: -3 }, // Occiput Weber
  
  // Tongue depressor points - adjusted for standing patient
  'tongue_1': { x: 0, y: 0 }, // Mouth
  'tongue_2': { x: 0, y: 0 }, // Oropharynx
  'tongue_3': { x: 0, y: -1 }, // Mouth Back
  'tongue_4': { x: 0, y: -1 }, // Oropharynx Back
  
  // Reflex hammer points - adjusted for standing patient
  'reflex_1': { x: 2, y: 2 }, // Left Bicep
  'reflex_2': { x: -2, y: 2 }, // Right Bicep
  'reflex_3': { x: 3, y: 3 }, // Left Forearm
  'reflex_4': { x: -3, y: 3 }, // Right Forearm
  'reflex_5': { x: 1, y: 4 }, // Left Knee
  'reflex_6': { x: -1, y: 4 }, // Right Knee
  'reflex_7': { x: 1, y: 5 }, // Left Ankle
  'reflex_8': { x: -1, y: 5 }, // Right Ankle
  'reflex_9': { x: 2, y: 3 }, // Left Tricep
  'reflex_10': { x: -2, y: 3 }, // Right Tricep
  'reflex_11': { x: 3, y: 3 }, // Left Forearm Back
  'reflex_12': { x: -3, y: 3 }, // Right Forearm Back
  'reflex_13': { x: 1, y: 4 }, // Left Knee Back
  'reflex_14': { x: -1, y: 4 }, // Right Knee Back
  'reflex_15': { x: 1, y: 5 }, // Left Ankle Back
  'reflex_16': { x: -1, y: 5 }, // Right Ankle Back
  
  // Dermatoscope points - adjusted for standing patient
  'derm_1': { x: 1, y: -2 }, // Face
  'derm_2': { x: 0, y: 1 }, // Chest
  'derm_3': { x: 3, y: 2 }, // Left Arm
  'derm_4': { x: -3, y: 2 }, // Right Arm
  'derm_5': { x: 0, y: 0 }, // Back
  
  // Blood pressure points - adjusted for standing patient
  'bp_1': { x: 2, y: 2 }, // Left Arm
  'bp_2': { x: -2, y: 2 }, // Right Arm
  'bp_3': { x: 2, y: 2 }, // Left Arm Back
  'bp_4': { x: -2, y: 2 }, // Right Arm Back
  
  // Palpation points - adjusted for standing patient
  'palp_1': { x: 1, y: 2 }, // RUQ
  'palp_2': { x: -1, y: 2 }, // LUQ
  'palp_3': { x: 1, y: 3 }, // RLQ
  'palp_4': { x: -1, y: 3 }, // LLQ
};

/**
 * Wrapper component that displays PhysicalExamInterface with a 3D patient model
 * instead of the 2D patient image. All examination functionality remains identical.
 */
export default function ThreeDPhysicalExam({ onClose, patientGender = 'female' }) {
  const wrapperRef = useRef(null);
  const [sceneMode, setSceneMode] = useState('exam-room'); // 'exam-room' or 'torso'
  const [isAbdomenExam, setIsAbdomenExam] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);


  useEffect(() => {
    // Mark body as being in 3D exam mode (to allow global, scoped CSS overrides)
    document.body.classList.add('threed-mode-active');

    // Hide any underlying headers/controls that can appear behind the floating header
    const addHiddenClass = (selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        el.classList.add('threed-hidden');
      });
    };
    const hideMonitoringHeaders = () => {
      // Hide Vitals monitor title blocks
      addHiddenClass('.monitor-main-title');
      // Hide any generic headers that render "Patient Monitoring"
      const headingEls = Array.from(document.querySelectorAll('h1, h2, h3, h4'));
      headingEls.forEach((h) => {
        const text = (h.textContent || '').trim().toLowerCase();
        if (text === 'patient monitoring') {
          const headerContainer = h.closest('div');
          const topBar = headerContainer && headerContainer.parentElement ? headerContainer.parentElement : headerContainer;
          if (topBar) {
            topBar.classList.add('threed-hidden');
          }
        }
      });
    };

    // Wipe backgrounds/heights from any header wrappers that contain the exam navbar
    const clearHeaderAncestors = () => {
      const nav = document.querySelector('.threed-physical-exam-wrapper .top-navbar');
      if (!nav) return;
      let p = nav.parentElement;
      for (let i = 0; i < 4 && p; i++) {
        p.classList.add('threed-clear-header');
        p = p.parentElement;
      }
    };
    addHiddenClass('.view-toggle-top');
    addHiddenClass('.back-exam-button');
    addHiddenClass('.monitoring-container');
    addHiddenClass('header.app-header, .global-topbar, .modal-header');
    hideMonitoringHeaders();
    clearHeaderAncestors();

    const observer = new MutationObserver(() => {
      addHiddenClass('.view-toggle-top');
      addHiddenClass('.back-exam-button');
      addHiddenClass('.monitoring-container');
      addHiddenClass('header.app-header, .global-topbar, .modal-header');
      hideMonitoringHeaders();
      clearHeaderAncestors();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.body.classList.remove('threed-mode-active');
      observer.disconnect();
    };
  }, []);

  // Handle scene mode changes from PhysicalExamInterface
  const handleSceneModeChange = (isAbdomen) => {
    const newSceneMode = isAbdomen ? 'torso' : 'exam-room';
    
    // Only transition if the mode actually changed
    if (newSceneMode !== sceneMode) {
      setIsTransitioning(true);
      
      // Add a brief transition delay for smooth switching
      setTimeout(() => {
        setIsAbdomenExam(isAbdomen);
        setSceneMode(newSceneMode);
        setIsTransitioning(false);
      }, 150);
    } else {
      setIsAbdomenExam(isAbdomen);
    }
  };

  useEffect(() => {
    // Apply coordinate adjustments to examination points based on current scene mode
    const adjustPointCoordinates = () => {
      if (!wrapperRef.current) return;
      
      const examinationPoints = wrapperRef.current.querySelectorAll('.examination-point');
      const adjustments = sceneMode === 'torso' ? torsoCoordinateAdjustments : examRoomCoordinateAdjustments;
      
      examinationPoints.forEach(point => {
        const pointId = point.getAttribute('data-point-id');
        if (pointId && adjustments[pointId]) {
          const adjustment = adjustments[pointId];
          const currentLeft = parseFloat(point.style.left);
          const currentTop = parseFloat(point.style.top);
          
          if (!isNaN(currentLeft) && !isNaN(currentTop)) {
            const newLeft = currentLeft + adjustment.x;
            const newTop = currentTop + adjustment.y;
            point.style.setProperty('--adjusted-left', `${newLeft}%`);
            point.style.setProperty('--adjusted-top', `${newTop}%`);
          }
        }
      });
    };

    // Apply adjustments immediately and on any changes
    adjustPointCoordinates();
    
    // Use MutationObserver to catch dynamically added points
    const observer = new MutationObserver(adjustPointCoordinates);
    observer.observe(wrapperRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-point-id']
    });

    return () => observer.disconnect();
  }, [sceneMode]);

  return (
    <div className="threed-physical-exam-wrapper" ref={wrapperRef}>
        {/* Inject custom styles to make panels floating and replace 2D image area */}
        <style>
        {`
          /* Utility: force-hide elements when necessary in 3D mode */
          .threed-hidden { display: none !important; }

          /* Hide MedicalUI bottom buttons panel only while 3D exam is active */
          .threed-mode-active .bottom-icon-bar {
            display: none !important;
          }

          /* Ensure 2D base header/spacers never render in 3D */
          .threed-physical-exam-wrapper .base-header,
          .threed-physical-exam-wrapper .top-navbar,
          .threed-physical-exam-wrapper [data-role="exam-header"],
          .threed-physical-exam-wrapper .navbar-placeholder,
          .threed-physical-exam-wrapper .header-spacer {
            display: none !important;
            height: 0 !important;
            min-height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            border: 0 !important;
            visibility: hidden !important;
          }

          /* Strip paint/space from any header wrappers that could leave a band */
          .threed-physical-exam-wrapper .threed-clear-header,
          .threed-physical-exam-wrapper .threed-clear-header::before,
          .threed-physical-exam-wrapper .threed-clear-header::after {
            background: transparent !important;
            box-shadow: none !important;
            border: 0 !important;
          }
          .threed-physical-exam-wrapper .navbar-placeholder,
          .threed-physical-exam-wrapper .header-spacer,
          .threed-physical-exam-wrapper .sticky-top,
          .threed-physical-exam-wrapper [data-role="header-placeholder"] {
            height: 0 !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
          }

          /* Hide common app shell headers while in 3D exam */
          .threed-mode-active header.app-header,
          .threed-mode-active .global-topbar,
          .threed-mode-active .modal-header {
            display: none !important;
          }

          /* Remove any mask layer to avoid accidental white band */
          .threed-physical-exam-wrapper::before { display: none !important; }

          /* Remove all backgrounds to show 3D scene */
          .threed-physical-exam-wrapper {
            background: transparent !important;
          }

          /* Ensure base container doesn't render a strip behind the floating header */
          .threed-physical-exam-wrapper .physical-exam-container {
            background: transparent !important;
          }

          /* Hide any exam headers; only patient monitoring shows a header */
          .threed-physical-exam-wrapper .top-navbar,
          .threed-physical-exam-wrapper [data-role="exam-header"],
          .threed-physical-exam-wrapper .back-exam-button,
          .threed-physical-exam-wrapper .close-exam-button {
            display: none !important;
          }

          /* Header fixes for 3D exam (legacy 2D header if ever present) */
          .threed-physical-exam-wrapper .top-navbar {
            left: 24px !important;
            right: 24px !important;
            position: fixed !important;
            height: 72px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            pointer-events: auto !important;
            z-index: 10001 !important;
            background: rgba(255, 255, 255, 0.85) !important;
            backdrop-filter: blur(20px) !important;
            border: 1px solid rgba(226, 232, 240, 0.6) !important;
            border-radius: 16px !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
          }
          /* Absolutely center the title so left/right widths don't affect it */
          .threed-physical-exam-wrapper .navbar-center {
            position: absolute !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            text-align: center !important;
            width: max-content !important;
            pointer-events: none !important; /* clicks go through */
            z-index: 10004 !important;
          }
          .threed-physical-exam-wrapper .navbar-center .navbar-title {
            pointer-events: none !important;
          }
          /* Ensure left/right keep their layout but don't push title */
          .threed-physical-exam-wrapper .navbar-left {
            position: absolute !important;
            left: 16px !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            z-index: 10002 !important;
            display: flex !important;
            align-items: center !important;
          }
          .threed-physical-exam-wrapper .navbar-right {
            position: absolute !important;
            right: 16px !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            z-index: 10002 !important;
          }
          /* Back button: keep only arrow, hide text label in 3D mode */
          .threed-physical-exam-wrapper .navbar-left .back-button span {
            display: none !important;
          }
          .threed-physical-exam-wrapper .navbar-left .back-button {
            padding: 8px 10px !important;
            width: 44px !important;
            height: 44px !important;
            justify-content: center !important;
          }
          /* Hide floating back button in 3D; use only navbar back */
          .threed-physical-exam-wrapper .back-exam-button {
            display: none !important;
          }
          /* Align the floating close button with the navbar (top-right) */
          .threed-physical-exam-wrapper .close-exam-button {
            position: fixed !important;
            top: 14px !important; /* align within rounded header */
            right: 38px !important; /* account for 24px header margin */
            z-index: 10003 !important;
            background: rgba(248, 250, 252, 0.8) !important;
            border: 1px solid rgba(226, 232, 240, 0.8) !important;
            color: #334155 !important;
            width: 44px !important;
            height: 44px !important;
            padding: 8px 10px !important;
            border-radius: 12px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.04) !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          .threed-physical-exam-wrapper .close-exam-button:hover {
            background: rgba(248, 250, 252, 0.95) !important;
            border-color: rgba(171, 5, 32, 0.3) !important;
            color: #AB0520 !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 12px rgba(171, 5, 32, 0.15) !important;
          }

          /* Hide navigation buttons in 3D physical exam mode */
          .threed-physical-exam-wrapper .navbar-actions {
            display: none !important;
          }

          .threed-physical-exam-wrapper .physical-exam-container {
            background: transparent !important;
          }

          /* Make the exam layout position relative for absolute positioning of panels */
          .threed-physical-exam-wrapper .exam-layout {
            position: fixed !important;
            top: 72px; /* clear the floating header */
            left: 0;
            right: 0;
            bottom: 0;
            display: flex !important;
            background: transparent !important;
            height: calc(100vh - 72px) !important;
            margin-top: 0 !important;
            padding: 24px !important;
            gap: 24px !important;
          }

          /* Float the tools panel on the left */
          .threed-physical-exam-wrapper .tools-panel {
            position: relative !important;
            width: 320px !important;
            max-width: 320px !important;
            background: #FFFFFF !important;
            border: 1px solid rgba(226, 232, 240, 0.8) !important;
            border-radius: 16px !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
            z-index: 9999;
            overflow-y: auto;
            padding: 24px !important;
            margin: 0 !important;
            height: calc(100vh - 120px) !important; /* account for header + padding */
            flex-shrink: 0 !important;
          }

          /* Float the categories panel on the right */
          .threed-physical-exam-wrapper .categories-panel {
            position: relative !important;
            width: 320px !important;
            max-width: 320px !important;
            background: #FFFFFF !important;
            border: 1px solid rgba(226, 232, 240, 0.8) !important;
            border-radius: 16px !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
            z-index: 9999;
            overflow-y: auto;
            padding: 24px !important;
            margin: 0 !important;
            height: calc(100vh - 120px) !important; /* account for header + padding */
            flex-shrink: 0 !important;
          }

          /* Replace the body-examination-container to overlay 3D scene */
          .threed-physical-exam-wrapper .body-examination-container {
            position: relative !important;
            flex: 1 !important;
            background: transparent !important;
            z-index: 9998;
            pointer-events: none; /* Allow 3D scene interaction */
            min-width: 0 !important;
            overflow: hidden !important;
          }

          /* 3D Scene container */
          .threed-physical-exam-wrapper .scene-container {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9997 !important;
            pointer-events: none !important;
          }

          /* Scene transition animation */
          .threed-physical-exam-wrapper .scene-container.transitioning {
            opacity: 0.7 !important;
            transition: opacity 0.3s ease-in-out !important;
          }

          /* Re-enable pointer events for interactive elements */
          .threed-physical-exam-wrapper .examination-tool,
          .threed-physical-exam-wrapper .examination-point {
            pointer-events: auto;
          }

          /* Update view toggle positioning in 3D mode */
          .threed-physical-exam-wrapper .view-toggle-top {
            display: none !important; /* hide in 3D to avoid extra header area */
          }

          /* Hide any navbar actions area that might duplicate controls */
          .threed-physical-exam-wrapper .navbar-actions {
            display: none !important;
          }

          /* Hide the 2D patient image */
          .threed-physical-exam-wrapper .patient-body-image {
            display: none !important;
          }

          /* Make examination tools and points visible over 3D scene */
          .threed-physical-exam-wrapper .examination-tool,
          .threed-physical-exam-wrapper .examination-point {
            position: absolute;
            z-index: 10000;
          }

          /* Floating trash area positioning */
          .threed-physical-exam-wrapper .floating-trash-area {
            position: fixed !important;
            bottom: 40px;
            right: 360px;
            transform: none !important;
            z-index: 10001;
          }

          /* Floating header for 3D exam */
          .threed-floating-header {
            position: fixed;
            top: 12px;
            left: 24px;
            right: 24px;
            height: 60px;
            background: rgba(255,255,255,0.9);
            border: 1px solid rgba(226,232,240,0.6);
            border-radius: 14px;
            backdrop-filter: blur(16px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.08);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10005;
          }
          .threed-floating-header .header-title {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            font-weight: 600;
            font-size: 16px;
            color: #0F172A;
            pointer-events: none;
          }
          .threed-floating-header .header-left,
          .threed-floating-header .header-right {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .threed-floating-header .header-left { left: 10px; }
          .threed-floating-header .header-right {
            right: -4px;
            top: 25%;
            transform: translateY(-50%);
          }
          .threed-floating-header .icon-btn {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            background: rgba(248,250,252,0.95);
            border: 1px solid rgba(226,232,240,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #0F172A; /* dark icon color for visibility */
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0,0,0,0.06);
            transition: transform .15s ease, box-shadow .15s ease, color .15s ease, border-color .15s ease;
          }
          .threed-floating-header .icon-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(171,5,32,0.18);
            border-color: rgba(171,5,32,0.35);
            color: #AB0520;
          }
          .threed-floating-header .icon-btn svg {
            stroke: #0F172A !important;
            color: #0F172A !important;
            width: 20px; height: 20px;
            stroke-width: 2.2 !important;
            display: block;
          }

          /* Match 2D header button styles inside floating header */
          .threed-floating-header .back-button {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(248, 250, 252, 0.8);
            border: 1px solid rgba(226, 232, 240, 0.8);
            color: #334155;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            padding: 10px 16px;
            border-radius: 12px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(10px);
          }
          .threed-floating-header .back-button:hover {
            background: rgba(171, 5, 32, 0.08);
            border-color: rgba(171, 5, 32, 0.3);
            color: #AB0520;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(171, 5, 32, 0.15);
          }
          .threed-floating-header .close-button {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 44px;
            height: 44px;
            background: rgba(248, 250, 252, 0.8);
            border: 1px solid rgba(226, 232, 240, 0.8);
            color: #334155;
            cursor: pointer;
            padding: 0;
            border-radius: 12px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(10px);
            position: relative;
            margin: 0;
          }
          .threed-floating-header .close-button:hover {
            background: rgba(171, 5, 32, 0.08);
            border-color: rgba(171, 5, 32, 0.3);
            color: #AB0520;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(171, 5, 32, 0.15);
          }

          /* Ensure cardiovascular overlay and other overlays work */
          .threed-physical-exam-wrapper .cardio-ausc-overlay {
            display: none !important; /* Hide overlay for 3D - points positioned directly */
          }

          /* Apply coordinate adjustments for 3D mode */
          .threed-physical-exam-wrapper .examination-point[data-point-id] {
            position: absolute !important;
          }
          
          .threed-physical-exam-wrapper .examination-point[style*="--adjusted-left"] {
            left: var(--adjusted-left) !important;
            top: var(--adjusted-top) !important;
          }

          /* Make all examination points visible in 3D mode */
          .threed-physical-exam-wrapper .examination-point .point-indicator {
            opacity: 1 !important;
            background: rgba(171, 5, 32, 0.2) !important;
            border: 2px solid #AB0520 !important;
            box-shadow: 0 0 0 4px rgba(171, 5, 32, 0.15) !important;
            animation: pulse 2s infinite !important;
          }

          .threed-physical-exam-wrapper .examination-point .point-indicator::before {
            opacity: 1 !important;
            background: #AB0520 !important;
          }

          /* Override specific point type styles to ensure visibility */
          .threed-physical-exam-wrapper .examination-point.cardiac-point .point-indicator,
          .threed-physical-exam-wrapper .examination-point.respiratory-point .point-indicator,
          .threed-physical-exam-wrapper .examination-point.abdomen-point .point-indicator,
          .threed-physical-exam-wrapper .examination-point.vascular-point .point-indicator {
            opacity: 1 !important;
            background: rgba(171, 5, 32, 0.2) !important;
            border-color: #AB0520 !important;
            box-shadow: 0 0 0 4px rgba(171, 5, 32, 0.15) !important;
          }

          .threed-physical-exam-wrapper .examination-point.cardiac-point .point-indicator::before,
          .threed-physical-exam-wrapper .examination-point.respiratory-point .point-indicator::before,
          .threed-physical-exam-wrapper .examination-point.abdomen-point .point-indicator::before,
          .threed-physical-exam-wrapper .examination-point.vascular-point .point-indicator::before {
            opacity: 1 !important;
            background: #AB0520 !important;
          }

          /* Make activated points more prominent */
          .threed-physical-exam-wrapper .examination-point.activated .point-indicator {
            background: rgba(171, 5, 32, 0.4) !important;
            border-color: #8B0015 !important;
            box-shadow: 0 0 0 6px rgba(171, 5, 32, 0.25) !important;
          }

          .threed-physical-exam-wrapper .examination-point.activated .point-indicator::before {
            background: #8B0015 !important;
          }

          /* Media player and modals stay on top */
          .threed-physical-exam-wrapper .media-player-overlay,
          .threed-physical-exam-wrapper .palpation-modal-overlay {
            z-index: 10002 !important;
          }
        `}
      </style>

      {/* Floating header controls (same UI as 2D) */}
      <div className="threed-floating-header">
        <div className="header-left">
          <button className="back-button" onClick={onClose}>
            <ArrowLeft size={18} />
            <span>Back to Patient</span>
          </button>
        </div>
        <div className="header-title">Physical Examination</div>
        <div className="header-right">
          <button className="close-button" onClick={onClose} title="Close Examination">
            <X size={18} />
          </button>
        </div>
      </div>

      <PhysicalExamInterface 
        onClose={onClose} 
        embedMode="3d" 
        onSceneModeChange={handleSceneModeChange}
      />

      {/* 3D Scene Rendering */}
      <div className={`scene-container ${isTransitioning ? 'transitioning' : ''}`}>
        {sceneMode === 'exam-room' ? (
          <PhysicalExamScene patientGender={patientGender} />
        ) : (
          <ThreeJSScene pose="lying_down" patientGender={patientGender} hideHeader={true} />
        )}
      </div>
    </div>
  );
}
