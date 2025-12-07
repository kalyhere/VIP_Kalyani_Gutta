import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Search, ArrowLeft, Check, Trash2 } from 'lucide-react';
import PhysicalExamBanner from './components/PhysicalExamBanner';

// UA Brand Colors from your design system
const uaColors = {
  arizonaRed: '#AB0520',
  arizonaBlue: '#0C234B',
  chili: '#8B0015',
  white: '#FFFFFF',
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  }
};

// Anatomy data for body part selection
const anatomyData = {
  head: [
    { id: 'forehead', label: 'Forehead', type: 'anatomy' },
    { id: 'eyes', label: 'Eyes', type: 'anatomy' },
    { id: 'pupillary_exam', label: 'Pupillary Response Examination', type: 'tool', tool: 'penlight' },
    { id: 'fundoscopic_exam', label: 'Fundoscopic Examination', type: 'tool', tool: 'ophthalmoscope' },
    { id: 'airway_exam', label: 'Airway Examination', type: 'tool', tool: 'visual' },
    { id: 'oral_exam', label: 'Oral Cavity Examination', type: 'tool', tool: 'tongue_depressor' },
    { id: 'upper_limbs_reflexes', label: 'Upper Limbs Reflexes', type: 'tool', tool: 'reflex_hammer' },
    { id: 'lower_limbs_reflexes', label: 'Lower Limbs Reflexes', type: 'tool', tool: 'reflex_hammer' },
    { id: 'left_ear', label: 'Left Ear', type: 'anatomy' },
    { id: 'right_ear', label: 'Right Ear', type: 'anatomy' },
    { id: 'otoscopy_exam', label: 'Otoscopic Examination', type: 'tool', tool: 'otoscope' },
    { id: 'hearing_exam', label: 'Hearing Tests (Weber/Rinne)', type: 'tool', tool: 'tuning_fork' },
    { id: 'nose', label: 'Nose', type: 'anatomy' },
    { id: 'mouth', label: 'Mouth', type: 'anatomy' },
    { id: 'neck', label: 'Neck', type: 'anatomy' },
    { id: 'chin', label: 'Chin', type: 'anatomy' },
  ],
  chest: [
    { id: 'upper_chest', label: 'Upper Chest', type: 'anatomy' },
    { id: 'left_breast', label: 'Left Breast', type: 'anatomy' },
    { id: 'right_breast', label: 'Right Breast', type: 'anatomy' },
    { id: 'sternum', label: 'Sternum', type: 'anatomy' },
    { id: 'ribs', label: 'Ribs', type: 'anatomy' },
    { id: 'auscultation_exam', label: 'Cardiac & Pulmonary Auscultation', type: 'tool', tool: 'stethoscope' },
    { id: 'skin_lesion_exam', label: 'Skin Lesion Examination', type: 'tool', tool: 'dermatoscope' },
    { id: 'upper_back', label: 'Upper Back', type: 'anatomy' },
  ],
  abdomen: [
    { id: 'upper_abdomen', label: 'Upper Abdomen', type: 'anatomy' },
    { id: 'lower_abdomen', label: 'Lower Abdomen', type: 'anatomy' },
    { id: 'left_side', label: 'Left Side', type: 'anatomy' },
    { id: 'right_side', label: 'Right Side', type: 'anatomy' },
    { id: 'pelvis', label: 'Pelvis', type: 'anatomy' },
    { id: 'lower_back', label: 'Lower Back', type: 'anatomy' },
  ],
  arm: [
    { id: 'left_shoulder', label: 'Left Shoulder', type: 'anatomy' },
    { id: 'right_shoulder', label: 'Right Shoulder', type: 'anatomy' },
    { id: 'left_upper_arm', label: 'Left Upper Arm', type: 'anatomy' },
    { id: 'right_upper_arm', label: 'Right Upper Arm', type: 'anatomy' },
    { id: 'reflex_exam_arms', label: 'Arm Reflex Testing', type: 'tool', tool: 'reflex_hammer' },
    { id: 'left_elbow', label: 'Left Elbow', type: 'anatomy' },
    { id: 'right_elbow', label: 'Right Elbow', type: 'anatomy' },
    { id: 'left_forearm', label: 'Left Forearm', type: 'anatomy' },
    { id: 'right_forearm', label: 'Right Forearm', type: 'anatomy' },
    { id: 'left_wrist', label: 'Left Wrist', type: 'anatomy' },
    { id: 'right_wrist', label: 'Right Wrist', type: 'anatomy' },
    { id: 'left_hand', label: 'Left Hand', type: 'anatomy' },
    { id: 'right_hand', label: 'Right Hand', type: 'anatomy' },
  ],
  leg: [
    { id: 'left_hip', label: 'Left Hip', type: 'anatomy' },
    { id: 'right_hip', label: 'Right Hip', type: 'anatomy' },
    { id: 'left_thigh', label: 'Left Thigh', type: 'anatomy' },
    { id: 'right_thigh', label: 'Right Thigh', type: 'anatomy' },
    { id: 'reflex_exam_legs', label: 'Leg Reflex Testing', type: 'tool', tool: 'reflex_hammer' },
    { id: 'left_knee', label: 'Left Knee', type: 'anatomy' },
    { id: 'right_knee', label: 'Right Knee', type: 'anatomy' },
    { id: 'left_shin', label: 'Left Shin', type: 'anatomy' },
    { id: 'right_shin', label: 'Right Shin', type: 'anatomy' },
    { id: 'left_calf', label: 'Left Calf', type: 'anatomy' },
    { id: 'right_calf', label: 'Right Calf', type: 'anatomy' },
    { id: 'left_ankle', label: 'Left Ankle', type: 'anatomy' },
    { id: 'right_ankle', label: 'Right Ankle', type: 'anatomy' },
    { id: 'left_foot', label: 'Left Foot', type: 'anatomy' },
    { id: 'right_foot', label: 'Right Foot', type: 'anatomy' },
  ],
};

// Physical Examination categories structured according to provided requirements
const examCategories = {
  "General Appearance": [
    "Body Mass Index (BMI)"
  ],
  
  "Vitals": [
    "Blood Pressure",
    "Pulse", 
    "Temperature",
    "Respiratory Rate"
  ],
  
  "General Inspection": [
    "Pallor",
    "Icterus",
    "Clubbing",
    "Cyanosis",
    "Lymphadenopathy",
    "Pedal Edema",
    "Peripheral pulses",
    "Jugular Venous Pressure",
    "Brudzinski's Sign (Nuchal Rigidity)",
    "Facial tenderness"
  ],
  
  "Examination of the Eye": [
    "Conjunctiva",
    "Sclera", 
    "Extra Ocular Movement",
    "Fundus Examination",
    "Pupils"
  ],
  
  "Examination of Ear, Neck and Throat (ENT)": [
    "Ear-Tympanic Membranes",
    "Teeth - Dentition",
    "Nose - Septal Deviation", 
    "External Auditory Canal",
    "Nasal Mucosa",
    "Throat - Pharynx"
  ],
  
  "Examination of Neck": [
    "Tracheal Position",
    "Thyroid",
    "Range of Motion"
  ],
  
  "Systemic Examination": {
    "Cranial Nerve Test I-VI": [
      "CN I -Olfactory Nerve",
      "CN II - Visual Acuity",
      "CN II - Visual Reflexes", 
      "CN II - Visual Field",
      "CN II - Nystagmus",
      "CN II - Colour Vision",
      "CN III, IV and VI - Extraocular Movements",
      "CN V- Trigeminal nerve - Sensory",
      "CN V- Trigeminal nerve - Motor",
      "CN V - Corneal Reflex",
      "CN V - Jaw Jerk"
    ],
    
    "Cranial Nerve Test VII-XII": [
      "CN VII - Facial Nerve",
      "CN VIII - Rinne Test",
      "CN VIII - Weber's Test", 
      "CN IX - Gag Reflex",
      "CN IX - Sternocleidomastoid",
      "CN X- Vagus Nerves",
      "CN XI- Trapezius",
      "CN XII-Hypoglossal Nerve"
    ],
    
    "Motor Function Test": [
      "Pronator Drift",
      "Triceps Reflex",
      "Biceps Reflex",
      "Brachioradialis Reflex",
      "Finger Jerk",
      "Knee Jerk",
      "Ankle Jerk", 
      "Plantar Reflex"
    ],
    
    "Coordination Test": [
      "Gait Assessment",
      "Finger-to-Nose Test",
      "Heel-to-Toe (Tandem Gait)",
      "Rapid Alternating Finger Movements",
      "Rapid Alternating Hand Movements",
      "Rebound Effect",
      "Graphesthesia",
      "Heel-to-Shin Test"
    ],
    
    "Sensation Test": [
      "Light Touch",
      "Pain",
      "Vibratory Sense",
      "Temperature",
      "Double Simultaneous Stimulation",
      "Stereognosis",
      "Tactile Movement",
      "Two point discrimination"
    ],
    
    "Other Test": [
      "Speech Assessment",
      "Mental Status Examination"
    ]
  },
  
  "Respiratory System": [
    "Palpation -Chest Expansion",
    "Palpation- Supraclavicular node",
    "Thorax",
    "Palpation-Tactile Fremitus",
    "Respiratory System - Chest Palpation",
    "Percussion",
    "Diaphragmatic Excursion",
    "Auscultation - Breath Sounds",
    "Auscultation - Bronchophony",
    "Auscultation - Egophony",
    "Auscultation-Whispered Pectoriloquy"
  ],
  
  "Cardiovascular System": [
    "Cardiovascular System- Inspection",
    "Cardiovascular System - Palpation",
    "Cardiovascular System- Percussion", 
    "Cardiovascular System- Auscultation",
    "Vascular Examination - Bruit Screening"
  ],
  
  "Abdomen Examination": [
    "Abdomen Examination- Inspection",
    "Abdomen Examination- Palpation",
    "Abdomen Examination- Percussion",
    "Abdomen Examination - Auscultation"
  ]
};

const PhysicalExamInterface = ({ onClose, embedMode = '2d', onSceneModeChange }) => {
  const is3D = embedMode === '3d';
  
  // Notify parent about initial scene mode (exam room by default) - only once on mount
  useEffect(() => {
    if (onSceneModeChange && is3D) {
      onSceneModeChange(false); // Default to exam room view
    }
  }, [is3D]); // Remove onSceneModeChange from dependencies to prevent repeated calls
  
  const [currentView, setCurrentView] = useState('front'); // 'front' or 'back'
  const [showStethoscopeExam, setShowStethoscopeExam] = useState(false);
  const [showPenlightExam, setShowPenlightExam] = useState(false);
  const [showOtoscopeExam, setShowOtoscopeExam] = useState(false);
  const [showReflexHammerExam, setShowReflexHammerExam] = useState(false);
  const [showTuningForkExam, setShowTuningForkExam] = useState(false);
  const [showDermatoscopeExam, setShowDermatoscopeExam] = useState(false);
  const [showOphthalmoscopeExam, setShowOphthalmoscopeExam] = useState(false);
  const [showTongueDepressorExam, setShowTongueDepressorExam] = useState(false);
  const [showBloodPressureCuffExam, setShowBloodPressureCuffExam] = useState(false);
  const [showPalpationExam, setShowPalpationExam] = useState(false);
  const [showPalpationModal, setShowPalpationModal] = useState(false);
  const [currentPalpationQuadrant, setCurrentPalpationQuadrant] = useState('');
  const [showMediaPlayer, setShowMediaPlayer] = useState(false);
  const [currentMedia, setCurrentMedia] = useState(null);
  const [categoryPath, setCategoryPath] = useState([]); // array of keys down the tree
  const [categoriesSearchTerm, setCategoriesSearchTerm] = useState('');
  const [previousCategoryPath, setPreviousCategoryPath] = useState([]); // Store path before opening examinations
  const [cameFromCategories, setCameFromCategories] = useState(false); // Track if we came from categories vs body parts
  const [stethoscopePosition, setStethoscopePosition] = useState({ x: 50, y: 50 });
  const [penlightPosition, setPenlightPosition] = useState({ x: 60, y: 15 });
  const [tuningForkPosition, setTuningForkPosition] = useState({ x: 60, y: 15 });
  const [tongueDepressorPosition, setTongueDepressorPosition] = useState({ x: 60, y: 15 });
  const [reflexHammerPosition, setReflexHammerPosition] = useState({ x: 60, y: 15 });
  const [otoscopePosition, setOtoscopePosition] = useState({ x: 60, y: 15 });
  const [ophthalmoscopePosition, setOphthalmoscopePosition] = useState({ x: 60, y: 15 });
  const [dermatoscopePosition, setDermatoscopePosition] = useState({ x: 60, y: 15 });
  const [bloodPressureCuffPosition, setBloodPressureCuffPosition] = useState({ x: 60, y: 15 });
  const [palpationPosition, setPalpationPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [currentDraggingToolName, setCurrentDraggingToolName] = useState(null);
  const [activatedPoints, setActivatedPoints] = useState(new Set());
  const [showCardioOverlay, setShowCardioOverlay] = useState(false);
  const [audioElement, setAudioElement] = useState(null);
  const [dragTimer, setDragTimer] = useState(null);
  const [tongueDepressorExamType, setTongueDepressorExamType] = useState('default');
  const [reflexHammerExamType, setReflexHammerExamType] = useState('upper');
  const [currentlyPlayingPoint, setCurrentlyPlayingPoint] = useState(null);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const containerRef = useRef(null);
  const stethoscopeRef = useRef(null);
  const stethoscopeButtonRef = useRef(null);
  const [showBloodPressureMonitor, setShowBloodPressureMonitor] = useState(false);
  const [bloodPressureReading, setBloodPressureReading] = useState({ systolic: 120, diastolic: 80 });
  const [isAbdomenExam, setIsAbdomenExam] = useState(false);
  const searchInputRef = useRef(null);
  const [stethoscopeMode, setStethoscopeMode] = useState('cardio'); // 'cardio' | 'respiratory' | 'abdomen' | 'vascular'
  const [showStethoscopeModeMenu, setShowStethoscopeModeMenu] = useState(false);
  const playRequestIdRef = useRef(0);
  const audioContextRef = useRef(null); // Shared AudioContext for amplification
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioSourceNodes = useRef(new Map()); // Track connected audio sources

  // Patient reactions for different examinations
  const patientReactions = {
    palpation: {
      palp_1: ["Ow!", "That's tender", "That hurts a bit"],  // Right Upper Quadrant
      palp_2: ["I feel some discomfort", "That's a little tender"],  // Left Upper Quadrant
      palp_3: ["Ouch! That really hurts", "That's very painful", "Please be gentle"],  // Right Lower Quadrant (tender in appendicitis)
      palp_4: ["That feels okay", "I don't feel much there"],  // Left Lower Quadrant
    },
    reflex_hammer: {
      default: ["I felt that", "My leg jumped", "That tickles a bit", "I felt a reflex"]
    },
    stethoscope: {
      default: ["Should I breathe normally?", "Okay", "Like this?", "Deep breath?"]
    },
    blood_pressure: {
      default: ["That's tight", "I can feel the pressure", "Okay"]
    },
    otoscope: {
      default: ["That feels weird", "Okay", "Is that bright?"]
    },
    ophthalmoscope: {
      default: ["That's very bright", "Should I look straight?", "Okay"]
    },
    penlight: {
      default: ["That's bright", "My eyes are watering", "Okay"]
    },
    tuning_fork: {
      default: ["I can hear it", "I hear a buzzing sound", "Yes, I hear that"]
    },
    tongue_depressor: {
      default: ["Ahh", "That makes me gag", "*gags*"]
    },
    dermatoscope: {
      default: ["What do you see?", "Is that okay?", "Does it look concerning?"]
    }
  };

  // Function to get a random reaction from array
  const getRandomReaction = (reactions) => {
    return reactions[Math.floor(Math.random() * reactions.length)];
  };

  // Function to generate patient speech reaction
  const generatePatientReaction = async (toolName, pointId = null) => {
    let reactionText = null;
    
    // Get appropriate reaction based on tool and point
    if (toolName === 'palpation' && pointId && patientReactions.palpation[pointId]) {
      reactionText = getRandomReaction(patientReactions.palpation[pointId]);
    } else if (patientReactions[toolName]) {
      reactionText = getRandomReaction(patientReactions[toolName].default);
    }
    
    if (!reactionText) return;
    
    // Generate TTS audio for the reaction using the audio endpoint
    try {
      const virtualPatientApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const audioUrl = `${virtualPatientApiUrl}/api/audio?text=${encodeURIComponent(reactionText)}&emotion=default`;
      
      // Play the audio reaction directly from URL
      const audio = new Audio(audioUrl);
      audio.volume = 0.8;
      audio.play().catch(error => {
        console.error('Error playing patient reaction:', error);
      });
      
      console.log(`🗣️ Patient reacted: "${reactionText}"`);
    } catch (error) {
      console.error('Error generating patient reaction:', error);
    }
  };

  // Media URLs for different examinations
  const cardioOverlayUrl = 'https://storage.googleapis.com/vp-model-storage/Physical%20Exam/aus.png';

  const mediaUrls = {
    airway: {
      type: 'video',
      url: 'https://storage.googleapis.com/vp-model-storage/Physical%20Exam/airwayexamination.mp4'
    },
    pupillary: {
      type: 'video',
      url: 'https://storage.googleapis.com/vp-model-storage/Physical%20Exam/pupillaryresponsetolight.mp4'
    },
    cardiac: {
      type: 'audio',
      url: 'https://storage.googleapis.com/vp-model-storage/Physical%20Exam/Cardiacauscultation.mp3'
    },
    eyes: {
      type: 'image',
      url: 'https://storage.googleapis.com/vp-model-storage/Physical%20Exam/eyes.png'
    },
    head: {
      type: 'image',
      url: 'https://storage.googleapis.com/vp-model-storage/Physical%20Exam/head.png'
    },
    nose: {
      type: 'image',
      url: 'https://storage.googleapis.com/vp-model-storage/Physical%20Exam/nose.png'
    },
    leftforearm: {
      type: 'image',
      url: 'https://storage.googleapis.com/vp-model-storage/Physical%20Exam/leftforearm.png'
    },
    rightforearm: {
      type: 'image',
      url: 'https://storage.googleapis.com/vp-model-storage/Physical%20Exam/rightforearm.png'
    },
    leftknee: {
      type: 'image',
      url: 'https://storage.googleapis.com/vp-model-storage/Physical%20Exam/leftknee.png'
    },
    rightknee: {
      type: 'image',
      url: 'https://storage.googleapis.com/vp-model-storage/Physical%20Exam/rightknee.png'
    },
    tuning_fork: {
      type: 'video',
      url: 'https://storage.googleapis.com/vp-model-storage/Physical%20Exam/tuningfork.mov'
    },
    tongue_depressor: {
      type: 'image',
      url: 'https://storage.googleapis.com/vp-model-storage/tongue_depressor.png'
    },
    oral_cavity: {
      type: 'video',
      url: 'https://storage.googleapis.com/vp-model-storage/Physical%20Exam/oralcavity.mov'
    },
    oropharynx: {
      type: 'video',
      url: 'https://storage.googleapis.com/vp-model-storage/Physical%20Exam/oropharynx.mov'
    },
    upper_limbs_reflexes: {
      type: 'video',
      url: 'https://storage.googleapis.com/vp-model-storage/Physical%20Exam/upperlimbs.mov'
    },
    lower_limbs_reflexes: {
      type: 'video',
      url: 'https://storage.googleapis.com/vp-model-storage/Physical%20Exam/lowerlimbs.mov'
    },
    reflex_hammer: {
      type: 'video',
      url: 'https://storage.googleapis.com/vp-model-storage/Physical%20Exam/upperlimbs.mov'
    },
    otoscope: {
      type: 'video',
      url: 'https://storage.googleapis.com/vp-model-storage/Physical%20Exam/otoscope.mov'
    },
    ophthalmoscope: {
      type: 'video',
      url: 'https://storage.googleapis.com/vp-model-storage/Physical%20Exam/fundoscopicexam.mov'
    },
    dermatoscope: {
      type: 'image',
      url: 'https://storage.googleapis.com/vp-model-storage/dermatoscope.png'
    },
    blood_pressure: {
      type: 'image',
      url: 'https://storage.googleapis.com/vp-model-storage/Physical%20Exam/blood_pressure_reading.png'
    },
    palpation: {
      type: 'image',
      url: 'https://storage.googleapis.com/vp-model-storage/Physical%20Exam/abdomen_palpation.png'
    }
  };

  // Preload the cardiac overlay image to remove initial render delay
  useEffect(() => {
    const img = new Image();
    img.src = cardioOverlayUrl;
  }, []);


  // Tool-specific examination points for front and back views
  const toolPoints = {
    stethoscope: {
    front: [
        { id: 'steth_1', x: 50, y: 33, label: 'Aortic Area', media: 'cardiac' },
        { id: 'steth_2', x: 55, y: 33, label: 'Tricuspid Area', media: 'cardiac' },
        { id: 'steth_3', x: 50, y: 37.5, label: 'Pulmonary Area', media: 'cardiac' },
        { id: 'steth_4', x: 55, y: 37.5, label: 'Mitral Area', media: 'cardiac' },
    ],
    back: [
        { id: 'steth_5', x: 45, y: 30, label: 'Upper Left Lung', media: 'cardiac' },
        { id: 'steth_6', x: 44, y: 42, label: 'Lower Left Lung', media: 'cardiac' },
        { id: 'steth_7', x: 55, y: 30, label: 'Upper Right Lung', media: 'cardiac' },
        { id: 'steth_8', x: 56, y: 42, label: 'Lower Right Lung', media: 'cardiac' },
      ]
    },
    // Respiratory auscultation points for stethoscope mode 'respiratory'
    stethoscope_respiratory: {
      front: [
        { id: 'resp_f_lul', x: 45, y: 29, label: 'Front LUL', media: 'cardiac' },
        { id: 'resp_f_lll', x: 44, y: 36.5, label: 'Front LLL', media: 'cardiac' },
        { id: 'resp_f_rul', x: 54, y: 29, label: 'Front RUL', media: 'cardiac' },
        { id: 'resp_f_rll', x: 55, y: 36.5, label: 'Front RLL', media: 'cardiac' },
      ],
      back: [
        { id: 'resp_b_lul', x: 45, y: 29, label: 'Back LUL', media: 'cardiac' },
        { id: 'resp_b_lll', x: 44.2, y: 36.5, label: 'Back LLL', media: 'cardiac' },
        { id: 'resp_b_rul', x: 54.5, y: 29, label: 'Back RUL', media: 'cardiac' },
        { id: 'resp_b_rll', x: 55.5, y: 36.5, label: 'Back RLL', media: 'cardiac' },
      ]
    },
    // Abdomen auscultation points for stethoscope mode 'abdomen'
    stethoscope_abdomen: {
      front: [
        { id: 'abd_ruq', x: 45.5, y: 41, label: 'RUQ', media: 'cardiac' },
        { id: 'abd_luq', x: 55.5, y: 41, label: 'LUQ', media: 'cardiac' },
        { id: 'abd_rlq', x: 45, y: 48, label: 'RLQ', media: 'cardiac' },
        { id: 'abd_llq', x: 56, y: 48, label: 'LLQ', media: 'cardiac' },
        { id: 'abd_umb', x: 50.5, y: 44.5, label: 'Umbilicus', media: 'cardiac' },
      ],
      back: []
    },
    // Vascular bruit screening points
    stethoscope_vascular: {
      front: [
        { id: 'vas_rcar', x: 48.5, y: 24.5, label: 'Right Carotid', media: 'cardiac' },
        { id: 'vas_lcar', x: 52.5, y: 24.5, label: 'Left Carotid', media: 'cardiac' },
        { id: 'vas_aorta', x: 50.5, y: 44.5, label: 'Abdominal Aorta (Epigastric)', media: 'cardiac' },
        { id: 'vas_rrenal', x: 45, y: 48, label: 'Right Renal Artery', media: 'cardiac' },
        { id: 'vas_lrenal', x: 56, y: 48, label: 'Left Renal Artery', media: 'cardiac' },
      ],
      back: []
    },
    penlight: {
      front: [
        { id: 'pen_1', x: 46.5, y: 20, label: 'Left Eye', media: 'pupillary' },
        { id: 'pen_2', x: 52, y: 20, label: 'Right Eye', media: 'pupillary' },
      ]
    },
    otoscope: {
      front: [
        { id: 'oto_1', x: 45.3, y: 21, label: 'Left Ear', media: 'otoscope' },
        { id: 'oto_2', x: 53, y: 21, label: 'Right Ear', media: 'otoscope' },
      ],
      back: [
        { id: 'oto_3', x: 45, y: 18, label: 'Left Ear (Back View)', media: 'otoscope' },
        { id: 'oto_4', x: 54, y: 18, label: 'Right Ear (Back View)', media: 'otoscope' },
      ]
    },
    tuning_fork: {
      front: [
        { id: 'fork_1', x: 45.3, y: 21, label: 'Left Ear', media: 'tuning_fork' },
        { id: 'fork_2', x: 53, y: 21, label: 'Right Ear', media: 'tuning_fork' },
        { id: 'fork_3', x: 49.5, y: 17.5, label: 'Forehead (Weber Test)', media: 'tuning_fork' },
      ],
      back: [
        { id: 'fork_4', x: 45, y: 18, label: 'Left Ear (Back View)', media: 'tuning_fork' },
        { id: 'fork_5', x: 54, y: 18, label: 'Right Ear (Back View)', media: 'tuning_fork' },
        { id: 'fork_6', x: 49.5, y: 13, label: 'Occiput (Weber Test)', media: 'tuning_fork' },
      ]
    },
    tongue_depressor: {
      front: [
        { id: 'tongue_1', x: 49.5, y: 23, label: 'Mouth/Oral Cavity', media: 'oral_cavity' },
        { id: 'tongue_2', x: 49.5, y: 23, label: 'Oropharynx', media: 'oropharynx' },
      ],
      back: [
        { id: 'tongue_3', x: 49.5, y: 20, label: 'Oral Cavity (Back View)', media: 'oral_cavity' },
        { id: 'tongue_4', x: 49.5, y: 20, label: 'Oropharynx (Back View)', media: 'oropharynx' },
      ]
    },
    reflex_hammer: {
      front: [
        { id: 'reflex_1', x: 40, y: 36, label: 'Left Bicep', media: 'upper_limbs_reflexes' },
        { id: 'reflex_2', x: 59, y: 36, label: 'Right Bicep', media: 'upper_limbs_reflexes' },
        { id: 'reflex_3', x: 38, y: 44, label: 'Left Forearm', media: 'upper_limbs_reflexes' },
        { id: 'reflex_4', x: 61, y: 44.5, label: 'Right Forearm', media: 'upper_limbs_reflexes' },
        { id: 'reflex_5', x: 44, y: 67, label: 'Left Knee', media: 'lower_limbs_reflexes' },
        { id: 'reflex_6', x: 55, y: 67, label: 'Right Knee', media: 'lower_limbs_reflexes' },
        { id: 'reflex_7', x: 44.5, y: 80, label: 'Left Ankle', media: 'lower_limbs_reflexes' },
        { id: 'reflex_8', x: 54.75, y: 80, label: 'Right Ankle', media: 'lower_limbs_reflexes' },
      ],
      back: [
        { id: 'reflex_9', x: 39.5, y: 39, label: 'Left Tricep', media: 'upper_limbs_reflexes' },
        { id: 'reflex_10', x: 60, y: 39, label: 'Right Tricep', media: 'upper_limbs_reflexes' },
        { id: 'reflex_11', x: 38, y: 44, label: 'Left Forearm (Back)', media: 'upper_limbs_reflexes' },
        { id: 'reflex_12', x: 61, y: 44.5, label: 'Right Forearm (Back)', media: 'upper_limbs_reflexes' },
        { id: 'reflex_13', x: 44, y: 68, label: 'Left Knee (Back)', media: 'lower_limbs_reflexes' },
        { id: 'reflex_14', x: 55, y: 68, label: 'Right Knee (Back)', media: 'lower_limbs_reflexes' },
        { id: 'reflex_15', x: 44.5, y: 83, label: 'Left Ankle (Back)', media: 'lower_limbs_reflexes' },
        { id: 'reflex_16', x: 54.75, y: 83, label: 'Right Ankle (Back)', media: 'lower_limbs_reflexes' },
      ]
    },
    ophthalmoscope: {
      front: [
        { id: 'ophthal_1', x: 46.5, y: 20, label: 'Left Eye Fundus', media: 'ophthalmoscope' },
        { id: 'ophthal_2', x: 52, y: 20, label: 'Right Eye Fundus', media: 'ophthalmoscope' },
      ],
      back: [
        { id: 'ophthal_3', x: 47, y: 17, label: 'Left Eye Fundus (Back View)', media: 'ophthalmoscope' },
        { id: 'ophthal_4', x: 52, y: 17, label: 'Right Eye Fundus (Back View)', media: 'ophthalmoscope' },
      ]
    },
    dermatoscope: {
      front: [
        { id: 'derm_1', x: 45, y: 20, label: 'Skin Lesion - Face', media: 'dermatoscope' },
        { id: 'derm_2', x: 50, y: 35, label: 'Skin Lesion - Chest', media: 'dermatoscope' },
        { id: 'derm_3', x: 40, y: 45, label: 'Skin Lesion - Left Arm', media: 'dermatoscope' },
        { id: 'derm_4', x: 60, y: 45, label: 'Skin Lesion - Right Arm', media: 'dermatoscope' },
      ],
      back: [
        { id: 'derm_5', x: 50, y: 30, label: 'Skin Lesion - Back', media: 'dermatoscope' },
      ]
    },
    blood_pressure_cuff: {
      front: [
        { id: 'bp_1', x: 39.5, y: 37, label: 'Left Arm - Blood Pressure', media: 'blood_pressure' },
        { id: 'bp_2', x: 59.5, y: 37, label: 'Right Arm - Blood Pressure', media: 'blood_pressure' },
      ],
      back: [
        { id: 'bp_3', x: 39.5, y: 37, label: 'Left Arm - Blood Pressure (Back View)', media: 'blood_pressure' },
        { id: 'bp_4', x: 59.5, y: 37, label: 'Right Arm - Blood Pressure (Back View)', media: 'blood_pressure' },
      ]
    },
    palpation: {
      front: [
        { id: 'palp_1', x: 47, y: 41, label: 'Right Upper Quadrant', media: 'palpation' },
        { id: 'palp_2', x: 54, y: 41, label: 'Left Upper Quadrant', media: 'palpation' },
        { id: 'palp_3', x: 47, y: 47, label: 'Right Lower Quadrant', media: 'palpation' },
        { id: 'palp_4', x: 54, y: 47, label: 'Left Lower Quadrant', media: 'palpation' },
      ],
      back: []
    }
  };

  // Legacy support - keeping auscultation points for backwards compatibility
  const auscultationPoints = toolPoints.stethoscope;

  // Cleanup audio and timer on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
      if (dragTimer) {
        clearTimeout(dragTimer);
      }
      // Clear audio source nodes
      audioSourceNodes.current.clear();
    };
  }, [audioElement, dragTimer]);

  // Stop audio if stethoscope is toggled off
  useEffect(() => {
    if (!showStethoscopeExam) {
      stopCardiacSound();
    }
  }, [showStethoscopeExam]);

  // Stop audio when switching views
  useEffect(() => {
    stopCardiacSound();
  }, [currentView]);

  // Close stethoscope mode menu on outside click
  useEffect(() => {
    if (!showStethoscopeModeMenu) return;
    const handler = (e) => {
      const container = stethoscopeButtonRef.current;
      if (container && !container.contains(e.target)) {
        setShowStethoscopeModeMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showStethoscopeModeMenu]);

  const playMedia = (mediaKey) => {
    const media = mediaUrls[mediaKey];
    if (media) {
      setCurrentMedia(media);
      setShowMediaPlayer(true);
    } else {
      console.error('Media not found for key:', mediaKey);
    }
  };

  const playCardiacSound = (pointId) => {
    console.log('🎵 Attempting to play cardiac sound for point:', pointId);
    
    // Map specific cardiac points to provided URLs
    const pointToUrl = {
      steth_1: 'https://storage.googleapis.com/vp-model-storage/Physical%20Exam/aortic.mp3',
      steth_3: 'https://storage.googleapis.com/vp-model-storage/Physical%20Exam/pulmonic.mp3',
      steth_2: 'https://storage.googleapis.com/vp-model-storage/Physical%20Exam/tricuspid.mp3',
      steth_4: 'https://storage.googleapis.com/vp-model-storage/Physical%20Exam/mitral.mp3',
    };

    const defaultUrl = mediaUrls.cardiac?.url || '';
    const selectedUrl = pointToUrl[pointId] || defaultUrl;
    if (!selectedUrl) {
      console.error('❌ Cardiac media not found for point:', pointId);
      return;
    }

    console.log('🎵 Playing cardiac audio from URL:', selectedUrl);

    // Stop any existing audio
    if (audioElement) {
      console.log('🛑 Stopping existing audio');
      audioElement.pause();
      audioElement.currentTime = 0;
    }

    // Create new audio element with better error handling
    const audio = new Audio();
    // Important: set crossOrigin BEFORE assigning src to avoid tainting
    audio.crossOrigin = 'anonymous';
    audio.src = selectedUrl;
    audio.volume = 1.0; // Increase volume to maximum
    audio.preload = 'auto';
    
    // Set up audio amplification using Web Audio API
    const setupAudioAmplification = async () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        
        // Check if this audio element is already connected
        // Track by element reference to avoid duplicate MediaElementSource for same element
        let sourceNode = audioSourceNodes.current.get(audio);
        
        if (!sourceNode) {
          // Create a gain node for amplification
          const gainNode = audioContextRef.current.createGain();
          gainNode.gain.value = 5.0; // Fixed 5x amplification
          
          // Create a media element source (only once per audio element)
          sourceNode = {
            source: audioContextRef.current.createMediaElementSource(audio),
            gainNode: gainNode
          };
          
          // Connect: source -> gain -> destination
          sourceNode.source.connect(sourceNode.gainNode);
          sourceNode.gainNode.connect(audioContextRef.current.destination);
          
          // Store the source node for reuse
          audioSourceNodes.current.set(audio, sourceNode);
          
          console.log('🔊 Audio amplification enabled for new audio element');
        } else {
          // Update gain for existing source
          sourceNode.gainNode.gain.value = 5.0;
          console.log('🔊 Audio amplification updated for existing element');
        }
      } catch (error) {
        console.warn('⚠️ Could not set up audio amplification:', error);
        // If CORS blocks WebAudio (MediaElementAudioSource outputs zeroes),
        // fall back to native element volume-only playback. Already at 1.0.
      }
    };

    const currentReq = ++playRequestIdRef.current;
    
    const playSafely = async () => {
      if (currentReq !== playRequestIdRef.current) {
        console.log('🚫 Audio request cancelled (newer request exists)');
        return;
      }
      
      try {
        console.log('▶️ Attempting to play audio...');
        await setupAudioAmplification();
        await audio.play();
        console.log('✅ Audio playing successfully with amplification');
        setAudioElement(audio);
        setCurrentlyPlayingPoint(pointId);
      } catch (error) {
        console.error('❌ Failed to play cardiac audio:', error);
        
        // If autoplay is blocked, try to enable audio context
        if (error.name === 'NotAllowedError') {
          console.log('🔇 Autoplay blocked, trying to enable audio context...');
          try {
            if (!audioContextRef.current) {
              audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioContextRef.current.state === 'suspended') {
              await audioContextRef.current.resume();
            }
            setAudioEnabled(true);
            console.log('🔊 Audio context enabled, retrying play...');
            await audio.play();
            setAudioElement(audio);
            setCurrentlyPlayingPoint(pointId);
          } catch (contextError) {
            console.error('❌ Failed to enable audio context:', contextError);
          }
        }
      }
    };

    // Set up event listeners
    audio.addEventListener('ended', () => {
      console.log('🏁 Audio ended');
      setCurrentlyPlayingPoint(null);
    });
    
    audio.addEventListener('error', (e) => {
      console.error('❌ Cardiac audio error:', e);
      console.error('❌ Audio error details:', {
        error: audio.error,
        networkState: audio.networkState,
        readyState: audio.readyState
      });
    });
    
    audio.addEventListener('loadstart', () => console.log('📥 Audio loading started'));
    audio.addEventListener('canplay', () => console.log('✅ Audio can play'));
    audio.addEventListener('canplaythrough', () => {
      console.log('✅ Audio can play through');
      playSafely();
    }, { once: true });
    
    // Load the audio
    audio.load();
    
    // Fallback timeout
    setTimeout(() => {
      if (currentReq !== playRequestIdRef.current) return;
      if (audio.readyState >= 2 && currentlyPlayingPoint !== pointId) {
        console.log('⏰ Fallback timeout triggered, attempting to play');
        playSafely();
      }
    }, 1000);
  };

  const playRespiratorySound = (pointId) => {
    console.log('🎵 Attempting to play respiratory sound for point:', pointId);
    
    const fieldToUrl = {
      lul: 'https://storage.googleapis.com/vp-model-storage/Physical%20Exam/LUL.mp3',
      lll: 'https://storage.googleapis.com/vp-model-storage/Physical%20Exam/LLL.mp3',
      rul: 'https://storage.googleapis.com/vp-model-storage/Physical%20Exam/RUL.mp3',
      rll: 'https://storage.googleapis.com/vp-model-storage/Physical%20Exam/RLL.mp3',
    };
    const idToField = {
      resp_f_lul: 'lul',
      resp_f_lll: 'lll',
      resp_f_rul: 'rul',
      resp_f_rll: 'rll',
      resp_b_lul: 'lul',
      resp_b_lll: 'lll',
      resp_b_rul: 'rul',
      resp_b_rll: 'rll',
    };
    const selectedUrl = fieldToUrl[idToField[pointId]] || '';
    if (!selectedUrl) {
      console.error('❌ Respiratory media not found for point:', pointId);
      return;
    }

    console.log('🎵 Playing respiratory audio from URL:', selectedUrl);

    if (audioElement) {
      console.log('🛑 Stopping existing audio');
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    
    const audio = new Audio();
    // Important: set crossOrigin BEFORE assigning src to avoid tainting
    audio.crossOrigin = 'anonymous';
    audio.src = selectedUrl;
    audio.preload = 'auto';
    audio.volume = 1.0; // Increase volume to maximum
    
    // Set up audio amplification using Web Audio API
    const setupAudioAmplification = async () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        
        // Check if this audio element is already connected
        // Track by element reference to avoid duplicate MediaElementSource for same element
        let sourceNode = audioSourceNodes.current.get(audio);
        
        if (!sourceNode) {
          // Create a gain node for amplification
          const gainNode = audioContextRef.current.createGain();
          gainNode.gain.value = 5.0; // Fixed 5x amplification
          
          // Create a media element source (only once per audio element)
          sourceNode = {
            source: audioContextRef.current.createMediaElementSource(audio),
            gainNode: gainNode
          };
          
          // Connect: source -> gain -> destination
          sourceNode.source.connect(sourceNode.gainNode);
          sourceNode.gainNode.connect(audioContextRef.current.destination);
          
          // Store the source node for reuse
          audioSourceNodes.current.set(audio, sourceNode);
          
          console.log('🔊 Respiratory audio amplification enabled for new audio element');
        } else {
          // Update gain for existing source
          sourceNode.gainNode.gain.value = 5.0;
          console.log('🔊 Respiratory audio amplification updated for existing element');
        }
      } catch (error) {
        console.warn('⚠️ Could not set up respiratory audio amplification:', error);
        // If CORS blocks WebAudio (MediaElementAudioSource outputs zeroes),
        // fall back to native element volume-only playback. Already at 1.0.
      }
    };
    
    const currentReq = ++playRequestIdRef.current;
    
    const playSafely = async () => {
      if (currentReq !== playRequestIdRef.current) {
        console.log('🚫 Audio request cancelled (newer request exists)');
        return;
      }
      
      try {
        console.log('▶️ Attempting to play respiratory audio...');
        await setupAudioAmplification();
        await audio.play();
        console.log('✅ Respiratory audio playing successfully with amplification');
        setAudioElement(audio);
        setCurrentlyPlayingPoint(pointId);
      } catch (error) {
        console.error('❌ Failed to play respiratory audio:', error);
        
        // If autoplay is blocked, try to enable audio context
        if (error.name === 'NotAllowedError') {
          console.log('🔇 Autoplay blocked, trying to enable audio context...');
          try {
            if (!audioContextRef.current) {
              audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioContextRef.current.state === 'suspended') {
              await audioContextRef.current.resume();
            }
            setAudioEnabled(true);
            console.log('🔊 Audio context enabled, retrying play...');
            await audio.play();
            setAudioElement(audio);
            setCurrentlyPlayingPoint(pointId);
          } catch (contextError) {
            console.error('❌ Failed to enable audio context:', contextError);
          }
        }
      }
    };
    
    audio.addEventListener('ended', () => {
      console.log('🏁 Respiratory audio ended');
      setCurrentlyPlayingPoint(null);
    });
    
    audio.addEventListener('error', (e) => {
      console.error('❌ Respiratory audio error:', e);
      console.error('❌ Audio error details:', {
        error: audio.error,
        networkState: audio.networkState,
        readyState: audio.readyState
      });
    });
    
    audio.addEventListener('loadstart', () => console.log('📥 Respiratory audio loading started'));
    audio.addEventListener('canplay', () => console.log('✅ Respiratory audio can play'));
    audio.addEventListener('canplaythrough', () => {
      console.log('✅ Respiratory audio can play through');
      playSafely();
    }, { once: true });
    
    audio.load();
    
    setTimeout(() => {
      if (currentReq !== playRequestIdRef.current) return;
      if (audio.readyState >= 2 && currentlyPlayingPoint !== pointId) {
        console.log('⏰ Fallback timeout triggered for respiratory audio, attempting to play');
        playSafely();
      }
    }, 1000);
  };

  const stopAllAuscultationAudio = () => {
    if (audioElement) {
      try {
        audioElement.pause();
        audioElement.currentTime = 0;
      } catch (_) {}
    }
    playRequestIdRef.current += 1; // cancel any pending play attempts
    setCurrentlyPlayingPoint(null);
  };

  const stopCardiacSound = () => {
    stopAllAuscultationAudio();
  };

  const handleClose = () => {
    // Reset all states
    setShowStethoscopeExam(false);
    setShowPenlightExam(false);
    setShowOtoscopeExam(false);
    setShowReflexHammerExam(false);
    setShowTuningForkExam(false);
    setShowDermatoscopeExam(false);
    setShowOphthalmoscopeExam(false);
    setShowTongueDepressorExam(false);
    setShowPalpationExam(false);
    setShowPalpationModal(false);
    setShowMediaPlayer(false);
    setCurrentMedia(null);
    setActivatedPoints(new Set());
    setIsDragging(false);
    setCategoryPath([]);
    setCategoriesSearchTerm('');
    setPreviousCategoryPath([]);
          setCameFromCategories(false);
          setShowBloodPressureMonitor(false);
          setIsAbdomenExam(false);
          setShowCardioOverlay(false);
    
    // Stop and cleanup audio
    stopCardiacSound();
    setAudioElement(null);
    
    // Call the onClose prop to close the interface
    if (onClose) {
      onClose();
    }
  };

  const handleBack = () => {
    if (showMediaPlayer) {
      setShowMediaPlayer(false);
      setCurrentMedia(null);
      setIsDragging(false);
        // Return to the correct view based on where we came from
        if (cameFromCategories) {
          setCategoryPath([...previousCategoryPath]);
          // Check if we're going back to an abdomen examination path
          const isInAbdomenPath = previousCategoryPath.some(segment => segment.toLowerCase().includes('abdomen'));
          setIsAbdomenExam(isInAbdomenPath);
          // Notify parent component about scene mode change
          if (onSceneModeChange) {
            onSceneModeChange(isInAbdomenPath);
          }
        }
    } else {
      // If not in media player, go back to main interface (same as close)
      handleClose();
    }
  };

  // Helpers for categories navigation
  const getCategoryNode = (path) => {
    let node = examCategories;
    for (const key of path) {
      node = node?.[key];
      if (!node) break;
    }
    return node;
  };

  // Search function for categories
  const searchCategories = (searchTerm, categories = examCategories, path = []) => {
    const results = [];
    
    Object.entries(categories).forEach(([key, value]) => {
      const currentPath = [...path, key];
      
      if (Array.isArray(value)) {
        // Search in array items
        value.forEach(item => {
          if (item.toLowerCase().includes(searchTerm.toLowerCase())) {
            results.push({
              item,
              path: currentPath,
              fullPath: [...currentPath, item]
            });
          }
        });
      } else if (typeof value === 'object') {
        // Search in nested objects
        const nestedResults = searchCategories(searchTerm, value, currentPath);
        results.push(...nestedResults);
      }
    });
    
    return results;
  };

  const handleSearchResultSelect = (result) => {
    // Navigate to the category path and select the item
    setCategoryPath(result.path);
    handleCategoryItemSelect(result.item);
  };

  // Memoize search results to reduce re-renders during typing
  const searchResults = useMemo(
    () => categoriesSearchTerm.trim() ? searchCategories(categoriesSearchTerm) : [],
    [categoriesSearchTerm]
  );

  const handleCategoryClick = (key) => {
    const current = getCategoryNode(categoryPath);
    const next = current?.[key];
    
    // Check if this is the Abdomen Examination category and set appropriate mode
    const isAbdomenCategory = key.toLowerCase().includes('abdomen');
    
    if (isAbdomenCategory) {
      setIsAbdomenExam(true);
      // Notify parent component about scene mode change
      if (onSceneModeChange) {
        onSceneModeChange(true);
      }
    } else {
      // Reset abdomen mode for any non-abdomen category
      setIsAbdomenExam(false);
      // Notify parent component about scene mode change
      if (onSceneModeChange) {
        onSceneModeChange(false);
      }
    }
    
    if (Array.isArray(next)) {
      // bottom list → just open this list for selection
      setCategoryPath(prev => {
        const newPath = [...prev, key];
        
        // Check if the new path contains abdomen examination
        const newPathContainsAbdomen = newPath.some(segment => segment.toLowerCase().includes('abdomen'));
        
        if (newPathContainsAbdomen) {
          // We're entering an abdomen category path, switch to torso view
          setIsAbdomenExam(true);
          if (onSceneModeChange) {
            onSceneModeChange(true);
          }
        }
        
        return newPath;
      });
    } else if (typeof next === 'object') {
      // go deeper into object
      setCategoryPath(prev => [...prev, key]);
    }
  };

  const handleCategoryItemSelect = (label) => {
    // Store current category path before opening examination
    setPreviousCategoryPath([...categoryPath]);
    setCameFromCategories(true);
    
    // Check if we're currently in an abdomen examination path
    const isInAbdomenPath = categoryPath.some(segment => segment.toLowerCase().includes('abdomen'));
    const isAbdomenItem = label.toLowerCase().includes('abdomen');
    
    // Update abdomen mode based on examination item
    if (isInAbdomenPath || isAbdomenItem) {
      setIsAbdomenExam(true);
      // Notify parent component about scene mode change
      if (onSceneModeChange) {
        onSceneModeChange(true);
      }
    } else {
      setIsAbdomenExam(false);
      // Notify parent component about scene mode change
      if (onSceneModeChange) {
        onSceneModeChange(false);
      }
    }
    
    // Map certain known labels to existing actions/media
    const normalized = label.toLowerCase();
    
    // Map examination categories to appropriate tools and media based on new structure
    
    // General Appearance
    if (normalized.includes('bmi') || normalized.includes('body mass index')) {
      // Show BMI value directly
      setBloodPressureReading({ systolic: (Math.random() * (28 - 18) + 18).toFixed(1), diastolic: 'kg/m²' });
      setShowBloodPressureMonitor(true);
      return;
    }
    
    // Vitals
    if (normalized.includes('blood pressure')) {
      setShowBloodPressureCuffExam(true);
      return;
    }
    if (normalized.includes('pulse')) {
      // Show pulse value directly
      setBloodPressureReading({ systolic: Math.floor(Math.random() * (100 - 60) + 60), diastolic: 'BPM' });
      setShowBloodPressureMonitor(true);
      return;
    }
    if (normalized.includes('temperature')) {
      // Show temperature value directly  
      setBloodPressureReading({ systolic: Math.floor(Math.random() * (101 - 97) + 97), diastolic: '°F' });
      setShowBloodPressureMonitor(true);
      return;
    }
    if (normalized.includes('respiratory rate')) {
      // Show respiratory rate value directly
      setBloodPressureReading({ systolic: Math.floor(Math.random() * (20 - 12) + 12), diastolic: '/min' });
      setShowBloodPressureMonitor(true);
      return;
    }
    
    // General Inspection
    if (normalized.includes('pallor') || normalized.includes('icterus') || normalized.includes('clubbing') || normalized.includes('cyanosis')) {
      playMedia('head');
      return;
    }
    if (normalized.includes('lymphadenopathy') || normalized.includes('pedal edema') || normalized.includes('peripheral pulses')) {
      setShowDermatoscopeExam(true);
      return;
    }
    if (normalized.includes('jugular venous pressure') || normalized.includes('facial tenderness')) {
      playMedia('head');
      return;
    }
    if (normalized.includes('brudzinski') || normalized.includes('nuchal rigidity')) {
      setShowReflexHammerExam(true);
      return;
    }

    // Eye Examination
    if (normalized.includes('conjunctiva') || normalized.includes('sclera') || normalized.includes('extra ocular movement')) {
      playMedia('eyes');
      return;
    }
    if (normalized.includes('pupils')) {
      setShowPenlightExam(true);
      return;
    }
    if (normalized.includes('fundus examination')) {
      setShowOphthalmoscopeExam(true);
      return;
    }

    // ENT Examination
    if (normalized.includes('ear-tympanic membranes') || normalized.includes('external auditory canal')) {
      setShowOtoscopeExam(true);
      return;
    }
    if (normalized.includes('teeth - dentition') || normalized.includes('throat - pharynx')) {
      setShowTongueDepressorExam(true);
      return;
    }
    if (normalized.includes('nose - septal deviation') || normalized.includes('nasal mucosa')) {
      playMedia('nose');
      return;
    }

    // Neck Examination
    if (normalized.includes('tracheal position') || normalized.includes('thyroid') || normalized.includes('range of motion')) {
      playMedia('head');
      return;
    }

    // Cranial Nerves I-VI
    if (normalized.includes('cn i') || normalized.includes('olfactory nerve')) {
      playMedia('nose');
      return;
    }
    if (normalized.includes('cn ii') && (normalized.includes('visual acuity') || normalized.includes('visual reflexes') || normalized.includes('visual field') || normalized.includes('nystagmus') || normalized.includes('colour vision'))) {
      playMedia('eyes');
      return;
    }
    if (normalized.includes('cn iii') || normalized.includes('cn iv') || normalized.includes('cn vi') || normalized.includes('extraocular movements')) {
      playMedia('eyes');
      return;
    }
    if (normalized.includes('cn v') && (normalized.includes('trigeminal') || normalized.includes('sensory') || normalized.includes('motor') || normalized.includes('corneal reflex') || normalized.includes('jaw jerk'))) {
      setShowPenlightExam(true);
      return;
    }

    // Cranial Nerves VII-XII
    if (normalized.includes('cn vii') || normalized.includes('facial nerve')) {
      setShowPenlightExam(true);
      return;
    }
    if (normalized.includes('cn viii') && (normalized.includes('rinne test') || normalized.includes('weber') || normalized.includes('weber\'s test'))) {
      setShowTuningForkExam(true);
      return;
    }
    if (normalized.includes('cn ix') && (normalized.includes('gag reflex') || normalized.includes('sternocleidomastoid'))) {
      setShowTongueDepressorExam(true);
      return;
    }
    if (normalized.includes('cn x') || normalized.includes('vagus nerves')) {
      setShowTongueDepressorExam(true);
      return;
    }
    if (normalized.includes('cn xi') || normalized.includes('trapezius')) {
      setShowReflexHammerExam(true);
      return;
    }
    if (normalized.includes('cn xii') || normalized.includes('hypoglossal nerve')) {
      setShowTongueDepressorExam(true);
      return;
    }

    // Motor Function Tests
    if (normalized.includes('pronator drift')) {
      setShowReflexHammerExam(true);
      return;
    }
    if (normalized.includes('triceps reflex') || normalized.includes('biceps reflex') || normalized.includes('brachioradialis reflex') || normalized.includes('finger jerk')) {
      setReflexHammerExamType('upper');
      setShowReflexHammerExam(true);
      return;
    }
    if (normalized.includes('knee jerk') || normalized.includes('ankle jerk') || normalized.includes('plantar reflex')) {
      setReflexHammerExamType('lower');
      setShowReflexHammerExam(true);
      return;
    }

    // Coordination Tests
    if (normalized.includes('gait assessment') || normalized.includes('finger-to-nose test') || normalized.includes('heel-to-toe') || normalized.includes('tandem gait') || normalized.includes('rapid alternating') || normalized.includes('rebound effect') || normalized.includes('graphesthesia') || normalized.includes('heel-to-shin test')) {
      setShowReflexHammerExam(true);
      return;
    }

    // Sensation Tests
    if (normalized.includes('light touch') || normalized.includes('pain') || normalized.includes('vibratory sense') || normalized.includes('temperature') || normalized.includes('double simultaneous stimulation') || normalized.includes('stereognosis') || normalized.includes('tactile movement') || normalized.includes('two point discrimination')) {
      setShowDermatoscopeExam(true);
      return;
    }

    // Other Tests
    if (normalized.includes('speech assessment') || normalized.includes('mental status examination')) {
      playMedia('head');
      return;
    }

    // Respiratory System
    if (normalized.includes('palpation -chest expansion') || normalized.includes('palpation- supraclavicular node') || normalized.includes('thorax') || normalized.includes('palpation-tactile fremitus') || normalized.includes('respiratory system - chest palpation')) {
      setShowDermatoscopeExam(true);
      return;
    }
    if (normalized.includes('percussion') || normalized.includes('diaphragmatic excursion')) {
      setShowReflexHammerExam(true);
      return;
    }
    if (normalized.includes('auscultation - breath sounds') || normalized.includes('auscultation - bronchophony') || normalized.includes('auscultation - egophony') || normalized.includes('auscultation-whispered pectoriloquy') || (normalized.includes('respiratory system') && normalized.includes('auscultation'))) {
      setStethoscopeMode('respiratory');
      setShowCardioOverlay(false);
      setShowStethoscopeExam(true);
      setCurrentView('front');
      return;
    }

    // Cardiovascular System
    if (normalized.includes('cardiovascular system- inspection') || normalized.includes('cardiovascular system - palpation')) {
      setShowDermatoscopeExam(true);
      return;
    }
    if (normalized.includes('cardiovascular system- percussion')) {
      setShowReflexHammerExam(true);
      return;
    }
    if (normalized.includes('cardiovascular system- auscultation')) {
      setStethoscopeMode('cardio');
      setShowStethoscopeExam(true);
      setShowCardioOverlay(true);
      setCurrentView('front');
      return;
    }
    if (normalized.includes('vascular examination - bruit screening')) {
      setStethoscopeMode('vascular');
      setShowStethoscopeExam(true);
      setShowCardioOverlay(false);
      setIsAbdomenExam(true);
      // Ensure scene mode change is called for vascular examination
      if (onSceneModeChange) {
        onSceneModeChange(true);
      }
      setCurrentView('front');
      return;
    }

    // Abdomen Examination - maintain abdomen state
    if (normalized.includes('abdomen examination')) {
      setIsAbdomenExam(true);
      // Ensure scene mode change is called for abdomen examinations
      if (onSceneModeChange) {
        onSceneModeChange(true);
      }
      setShowCardioOverlay(false);
      if (normalized.includes('inspection')) {
        playMedia('palpation');
      } else if (normalized.includes('palpation')) {
        setShowPalpationExam(true);
      } else if (normalized.includes('percussion')) {
        setShowReflexHammerExam(true);
      } else if (normalized.includes('auscultation')) {
        // Abdomen auscultation: use abdomen stethoscope points
        setStethoscopeMode('abdomen');
        setShowStethoscopeExam(true);
      } else {
        setStethoscopeMode('cardio');
        setShowStethoscopeExam(true); // Default
      }
      return;
    }

    // Handle abdomen examination items if we're in abdomen path
    if (isInAbdomenPath) {
      setIsAbdomenExam(true);
      setShowStethoscopeExam(true);
      return;
    }
    // Fallback: no media mapped yet
    console.log('No media/action mapped for category item:', label);
  };

  const removeTool = () => {
    console.log('removeTool called - clearing all tools and points'); // Debug log
    
    // Reset all tool examinations
    setShowStethoscopeExam(false);
    setShowPenlightExam(false);
    setShowOtoscopeExam(false);
    setShowReflexHammerExam(false);
    setShowTuningForkExam(false);
    setShowDermatoscopeExam(false);
    setShowOphthalmoscopeExam(false);
    setShowTongueDepressorExam(false);
    setShowBloodPressureCuffExam(false);
    setShowPalpationExam(false);
    setShowPalpationModal(false);
    setIsDragging(false);
    setIsOverTrash(false);
    setShowCardioOverlay(false);
    
    // Clear all activated points
    setActivatedPoints(new Set());
    
    // Stop any audio
    stopCardiacSound();
    
      // Close any open media player
      setShowMediaPlayer(false);
      setCurrentMedia(null);
      
      // When removing tools, check if we should stay in abdomen mode based on current category path
      const isInAbdomenPath = categoryPath.some(segment => segment.toLowerCase().includes('abdomen'));
      setIsAbdomenExam(isInAbdomenPath);
      // Notify parent component about scene mode change
      if (onSceneModeChange) {
        onSceneModeChange(isInAbdomenPath);
      }
    
    // Don't clear blood pressure monitor - it should persist
    
    console.log('removeTool completed'); // Debug log
  };


  // Helper function to find the closest examination point to a tool position
  const checkToolPointActivation = (toolName, toolPosition) => {
    const points = toolPoints[toolName]?.[currentView];
    if (!points || points.length === 0) return null;
    
    let closestPoint = null;
    let minDistance = Infinity;
    
    points.forEach(point => {
      const distance = Math.sqrt(
        Math.pow(point.x - toolPosition.x, 2) + 
        Math.pow(point.y - toolPosition.y, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    });
    
    // Only activate if within a reasonable distance (5% of screen)
    return minDistance <= 5 ? closestPoint : null;
  };

  // Generic function to handle tool activation at specific points
  const handleToolActivation = (toolName, toolPosition) => {
    const closestPoint = checkToolPointActivation(toolName, toolPosition);
    
    if (closestPoint) {
      // Mark point as activated
      setActivatedPoints(prev => new Set([...prev, closestPoint.id]));
      
      // Generate patient reaction FIRST (before media/monitor)
      generatePatientReaction(toolName, closestPoint.id);
      
      // Special handling for blood pressure cuff
      if (toolName === 'blood_pressure_cuff') {
        // Generate random but realistic blood pressure reading
        const systolic = Math.floor(Math.random() * (140 - 110) + 110);
        const diastolic = Math.floor(Math.random() * (90 - 70) + 70);
        setBloodPressureReading({ systolic, diastolic });
        setShowBloodPressureMonitor(true);
        // Don't play media for blood pressure cuff - only show the monitor
        return true;
      }
      
      // Play the associated media
      if (closestPoint.media) {
        if (closestPoint.media === 'cardiac') {
          // Special handling for cardiac audio
          playCardiacSound(closestPoint.id);
        } else {
          // Play video/image media
          playMedia(closestPoint.media);
        }
      }
      
      return true; // Point was activated
    }
    
    return false; // No point activated
  };

  // Helper function to handle tool drag activation - only activates at specific points
  const handleToolDragStart = (toolName) => {
    setIsDragging(true);
    setCurrentDraggingToolName(toolName);
    
    // Clear any existing timer
    if (dragTimer) {
      clearTimeout(dragTimer);
    }
    
    // Add document-level mouseup listener to handle cases where mouse goes outside element
    const handleDocumentMouseUp = (e) => {
      handleToolDragEnd(e);  // Pass the event
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };
    document.addEventListener('mouseup', handleDocumentMouseUp);
  };

  const handleToolDragEnd = (e) => {
    // Check final position if event is available
    let finalOverTrash = isOverTrash;
    if (e && e.clientX && e.clientY) {
      finalOverTrash = checkTrashCollision(e.clientX, e.clientY);
    }
    
    console.log('Tool drag ended, over trash:', finalOverTrash); // Debug log
    
    setIsDragging(false);
    setIsOverTrash(false);
    
    // Clear the timer if it exists
    if (dragTimer) {
      clearTimeout(dragTimer);
      setDragTimer(null);
    }
    
    // If dropped over trash, remove the tool
    if (finalOverTrash) {
      console.log('Removing tool via trash'); // Debug log
      removeTool();
      setCurrentDraggingToolName(null);
      return;
    }

    // On drop: for stethoscope, if it's no longer over a point, stop immediately
    if (currentDraggingToolName === 'stethoscope') {
      const overEl = stethoscopeRef?.current || null;
      const stillOverPoint = overEl ? !!getOverlappedPointElement(overEl) : false;
      if (!stillOverPoint) {
        stopCardiacSound();
      }
    }

    // On drop: trigger findings for non-stethoscope tools if dropped over a point
    if (currentDraggingToolName && currentDraggingToolName !== 'stethoscope' && e && e.currentTarget) {
      handleToolHitTest(currentDraggingToolName, e.currentTarget, true);
    }

    setCurrentDraggingToolName(null);
  };

  // Check if mouse is over trash area
  const checkTrashCollision = (clientX, clientY) => {
    // Support both 2D and 3D exam trash areas
    const trashElement = document.querySelector('.trash-area, .floating-trash-area');
    if (!trashElement) {
      console.log('Trash element not found!'); // Debug log
      return false;
    }
    
    const rect = trashElement.getBoundingClientRect();
    const isOver = (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    );
    
    if (isOver) {
      console.log('Mouse over trash area:', { clientX, clientY, rect }); // Debug log
    }
    
    return isOver;
  };

  // --- Pixel hit testing utilities ---
  const rectsOverlap = (a, b) => !(b.left > a.right || b.right < a.left || b.top > a.bottom || b.bottom < a.top);

  // No padding - exact positioning only
  const expandRect = (r, pad = 0) => ({
    left: r.left - pad,
    top: r.top - pad,
    right: r.right + pad,
    bottom: r.bottom + pad,
  });

  const getOverlappedPointElement = (toolEl) => {
    const containerEl = containerRef.current;
    if (!containerEl || !toolEl) return null;

    const toolRect = toolEl.getBoundingClientRect();
    // Use a small area around the center point of the tool for hit detection
    const toolCenterX = toolRect.left + toolRect.width / 2;
    const toolCenterY = toolRect.top + toolRect.height / 2;
    
    // Create a small hit area around the center point (10px radius)
    const hitAreaSize = 10;
    const toolHitArea = {
      left: toolCenterX - hitAreaSize,
      right: toolCenterX + hitAreaSize,
      top: toolCenterY - hitAreaSize,
      bottom: toolCenterY + hitAreaSize
    };
    
    // IMPORTANT: hit-test only the indicator, not the container (tooltip inflates size)
    const indicators = containerEl.querySelectorAll('.examination-point .point-indicator');
    for (const ind of indicators) {
      const pointEl = ind.closest('.examination-point');
      const pointId = pointEl?.getAttribute('data-point-id') || '';
      
      const pointRect = ind.getBoundingClientRect();
      
      // Check if tool hit area overlaps with the target point area
      if (toolHitArea.left < pointRect.right && 
          toolHitArea.right > pointRect.left && 
          toolHitArea.top < pointRect.bottom && 
          toolHitArea.bottom > pointRect.top) {
        return pointEl;
      }
    }
    return null;
  };

  const handleToolHitTest = (toolName, toolEl, isDrop = false) => {
    const pointEl = getOverlappedPointElement(toolEl);
    if (!pointEl) {
      if (toolName === 'stethoscope' && currentlyPlayingPoint) {
        stopCardiacSound();
      }
      return false;
    }

    const pointId = pointEl.getAttribute('data-point-id');
    const mediaKey = pointEl.getAttribute('data-media') || '';
    // Map stethoscope to the correct point set based on mode
    let lookupToolName = toolName;
    if (toolName === 'stethoscope') {
      if (stethoscopeMode === 'respiratory') lookupToolName = 'stethoscope_respiratory';
      else if (stethoscopeMode === 'abdomen') lookupToolName = 'stethoscope_abdomen';
      else if (stethoscopeMode === 'vascular') lookupToolName = 'stethoscope_vascular';
    }
    const point = toolPoints?.[lookupToolName]?.[currentView]?.find(p => p.id === pointId);
    if (!point) return false;

    setActivatedPoints(prev => (prev.has(pointId) ? prev : new Set([...prev, pointId])));

    // Blood pressure cuff only changes value on drop, not during drag
    if (toolName === 'blood_pressure_cuff' && isDrop) {
      const systolic = Math.floor(Math.random() * (140 - 110) + 110);
      const diastolic = Math.floor(Math.random() * (90 - 70) + 70);
      setBloodPressureReading({ systolic, diastolic });
      setShowBloodPressureMonitor(true);
      return true;
    }

    // Palpation tool shows modal on drop
    if (toolName === 'palpation' && isDrop) {
      setCurrentPalpationQuadrant(point.label);
      setShowPalpationModal(true);
      return true;
    }

    if (mediaKey === 'cardiac') {
      if (currentlyPlayingPoint !== pointId) {
        // If we're in respiratory mode and this is a respiratory point, play respiratory sound
        if (stethoscopeMode === 'respiratory' && pointId.startsWith('resp_')) {
          playRespiratorySound(pointId);
        } else {
          playCardiacSound(pointId);
        }
      }
    } else if (mediaKey && toolName !== 'palpation') {
      playMedia(mediaKey);
    }

    return true;
  };

  // Generic drag handler for all tools - fixed and optimized
  const handleToolDrag = (e, toolName, setPosition) => {
    if (!isDragging) return;

    const clientX = e.clientX;
    const clientY = e.clientY;
    const currentTarget = e.currentTarget;

    const isOverTrashArea = checkTrashCollision(clientX, clientY);
    setIsOverTrash(isOverTrashArea);
    if (isOverTrashArea) return;

    const container = currentTarget.closest('.body-examination-container');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    const newPosition = { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
    setPosition(newPosition);

    // Pixel-accurate overlap test
    if (toolName === 'stethoscope') {
      // Stethoscope should live-update during drag
      handleToolHitTest(toolName, currentTarget);
    }
  };

  const handleStethoscopeDrag = (e) => {
    if (!isDragging) return;

    const clientX = e.clientX;
    const clientY = e.clientY;
    const currentTarget = e.currentTarget;

    const isOverTrashArea = checkTrashCollision(clientX, clientY);
    setIsOverTrash(isOverTrashArea);
    if (isOverTrashArea) return;

    const container = currentTarget.closest('.body-examination-container');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    const newPosition = { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
    setStethoscopePosition(newPosition);

    // Pixel-accurate overlap test and audio management
    const beforePointId = currentlyPlayingPoint;
    const hit = handleToolHitTest('stethoscope', currentTarget);
    if (!hit) {
      // Not over a point → stop immediately
      stopAllAuscultationAudio();
    }
  };

  // legacy distance-based activation removed in favor of pixel-accurate hit testing

  return (
    <div className="physical-exam-container">
      {/* Enhanced Top Navigation Bar - render only in 2D mode */}
      {!is3D && (
      <div className="top-navbar" data-role="exam-header">
        <div className="navbar-left">
          <button className="back-button" onClick={handleBack}>
            <ArrowLeft size={18} />
            <span>Back to Patient</span>
          </button>
        </div>

        <div className="navbar-center">
          <h1 className="navbar-title">Physical Examination</h1>
        </div>

        <div className="navbar-right">
          <button className="close-button" onClick={handleClose} title="Close Examination">
            <X size={20} />
          </button>
        </div>
      </div>
      )}

      {/* Three Panel Layout */}
      <div className="exam-layout">
        {/* Tools Panel - Left Side */}
        <div className="tools-panel">
          <h3 className="panel-title">Instruments</h3>
          <div className="tools-list">
            <button 
              className={`tool-button ${showPenlightExam ? 'active' : ''}`}
              onClick={() => {
                setShowPenlightExam(true);
                setIsAbdomenExam(false);
              }}
            >
              <img src="https://storage.googleapis.com/vp-model-storage/penlight.png" alt="Pen Light" />
              </button>
            <button 
              className={`tool-button ${showOphthalmoscopeExam ? 'active' : ''}`}
              onClick={() => {
                setShowOphthalmoscopeExam(true);
                setIsAbdomenExam(false);
              }}
            >
              <img src="https://storage.googleapis.com/vp-model-storage/ophthalmoscope.png" alt="Ophthalmoscope" />
              </button>
            <button 
              className={`tool-button ${showOtoscopeExam ? 'active' : ''}`}
              onClick={() => {
                setShowOtoscopeExam(true);
                setIsAbdomenExam(false);
              }}
            >
              <img src="https://storage.googleapis.com/vp-model-storage/otoscope.png" alt="Otoscope" />
              </button>
            <button 
              className={`tool-button ${showReflexHammerExam ? 'active' : ''}`}
              onClick={() => {
                setShowReflexHammerExam(true);
                setIsAbdomenExam(false);
              }}
            >
              <img src="https://storage.googleapis.com/vp-model-storage/reflex_hammer.png" alt="Reflex Hammer" />
              </button>
            <button 
              className={`tool-button ${showTuningForkExam ? 'active' : ''}`}
              onClick={() => {
                setShowTuningForkExam(true);
                setIsAbdomenExam(false);
              }}
            >
              <img src="https://storage.googleapis.com/vp-model-storage/tuning_fork.png" alt="Tuning Fork" />
            </button>
            <div className="tool-with-menu" ref={stethoscopeButtonRef}>
              <button 
                className={`tool-button ${showStethoscopeExam ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowStethoscopeModeMenu((v) => !v);
                }}
              >
                <img src="https://storage.googleapis.com/vp-model-storage/stethicon.png" alt="Stethoscope" />
              </button>
              {showStethoscopeModeMenu && (
                <div className="stethoscope-mode-menu">
                  <button className="mode-item" onClick={() => {
                    setStethoscopeMode('cardio');
                    setIsAbdomenExam(false);
                    setShowCardioOverlay(true);
                    setShowStethoscopeExam(true);
                    setCurrentView('front');
                    setShowStethoscopeModeMenu(false);
                  }}>Cardiac</button>
                  <button className="mode-item" onClick={() => {
                    setStethoscopeMode('respiratory');
                    setIsAbdomenExam(false);
                    setShowCardioOverlay(false);
                    setShowStethoscopeExam(true);
                    setCurrentView('front');
                    setShowStethoscopeModeMenu(false);
                  }}>Respiratory</button>
                  <button className="mode-item" onClick={() => {
                    setStethoscopeMode('abdomen');
                    setIsAbdomenExam(true);
                    setShowCardioOverlay(false);
                    setShowStethoscopeExam(true);
                    setCurrentView('front');
                    setShowStethoscopeModeMenu(false);
                  }}>Abdomen</button>
                  <button className="mode-item" onClick={() => {
                    setStethoscopeMode('vascular');
                    setIsAbdomenExam(true);
                    setShowCardioOverlay(false);
                    setShowStethoscopeExam(true);
                    setCurrentView('front');
                    setShowStethoscopeModeMenu(false);
                  }}>Vascular</button>
                </div>
              )}
            </div>
                  <button
              className={`tool-button ${showDermatoscopeExam ? 'active' : ''}`}
              onClick={() => {
                setShowDermatoscopeExam(true);
                setIsAbdomenExam(false);
              }}
            >
              <img src="https://storage.googleapis.com/vp-model-storage/dermatoscope.png" alt="Dermatoscope" />
            </button>
            <button 
              className={`tool-button ${showTongueDepressorExam ? 'active' : ''}`}
              onClick={() => {
                setShowTongueDepressorExam(true);
                setIsAbdomenExam(false);
              }}
            >
              <img src="https://storage.googleapis.com/vp-model-storage/tongue_depressor.png" alt="Tongue Depressor" />
            </button>
            <button 
              className={`tool-button ${showBloodPressureCuffExam ? 'active' : ''}`}
              onClick={() => {
                setShowBloodPressureCuffExam(true);
                setIsAbdomenExam(false);
              }}
            >
              <img src="https://storage.googleapis.com/vp-model-storage/bloodpressurecuff.png" alt="Blood Pressure Cuff" />
            </button>
          </div>
        </div>
          
        {/* Center Panel - Body and Controls */}
        <div className="center-panel">
          {/* Front/Back Toggle Buttons */}
          <div className="view-toggle-top">
            <button 
              className={`view-button ${currentView === 'front' ? 'active' : ''}`}
              onClick={() => setCurrentView('front')}
            >
              Front
              </button>
            <button 
              className={`view-button ${currentView === 'back' ? 'active' : ''}`}
              onClick={() => setCurrentView('back')}
            >
              Back
              </button>
            </div>

          {/* Blood Pressure Monitor */}
          {showBloodPressureMonitor && (
            <div className="blood-pressure-monitor">
              <button 
                className="bp-close-button" 
                onClick={() => setShowBloodPressureMonitor(false)}
                title="Close blood pressure monitor"
              >
                ×
              </button>
              <div className="bp-monitor-content">
                <div className="bp-reading">
                  <span className="bp-value">{bloodPressureReading.systolic}/{bloodPressureReading.diastolic}</span>
                  <span className="bp-unit">mmHg</span>
                </div>
              </div>
            </div>
          )}


          {/* Audio Volume Control removed (fixed 5x) */}

          {/* Body Image and Examination Area */}
          <div className="body-examination-container" ref={containerRef}>
            <img 
              src={isAbdomenExam 
                ? "https://storage.googleapis.com/vp-model-storage/gponbed.png"
                : currentView === 'front' 
                  ? "https://storage.googleapis.com/vp-model-storage/gpfront.png"
                  : "https://storage.googleapis.com/vp-model-storage/gpback.png"
              }
              alt={isAbdomenExam ? "Patient lying down for abdominal examination" : `${currentView} view of patient`}
              className="patient-body-image"
                draggable={false}
              />

            {/* Cardiovascular auscultation overlay (front view only) */}
            {showCardioOverlay && currentView === 'front' && (
              <img
                src={cardioOverlayUrl}
                alt="Cardiovascular auscultation overlay"
                className="cardio-ausc-overlay"
                loading="eager"
                decoding="async"
                fetchpriority="high"
                draggable={false}
              />
            )}

            {/* Examination Points and Tools */}
            {/* Render points for the currently active tool */}
            {(() => {
              const currentToolName = showStethoscopeExam 
                                    ? (stethoscopeMode === 'respiratory' 
                                        ? 'stethoscope_respiratory' 
                                        : (stethoscopeMode === 'abdomen' 
                                            ? 'stethoscope_abdomen' 
                                            : (stethoscopeMode === 'vascular' ? 'stethoscope_vascular' : 'stethoscope'))) 
                                    :
                                    showPenlightExam ? 'penlight' :
                                    showOtoscopeExam ? 'otoscope' :
                                    showOphthalmoscopeExam ? 'ophthalmoscope' :
                                    showReflexHammerExam ? 'reflex_hammer' :
                                    showTuningForkExam ? 'tuning_fork' :
                                    showDermatoscopeExam ? 'dermatoscope' :
                                    showTongueDepressorExam ? 'tongue_depressor' :
                                    showBloodPressureCuffExam ? 'blood_pressure_cuff' :
                                    showPalpationExam ? 'palpation' : null;
              
              if (!currentToolName || !toolPoints[currentToolName] || !toolPoints[currentToolName][currentView]) {
                return null;
              }

              return toolPoints[currentToolName][currentView].map(point => (
                <div
                  key={point.id}
                  className={`examination-point ${(currentToolName === 'stethoscope' && stethoscopeMode === 'cardio') ? 'cardiac-point' : ''} ${currentToolName === 'stethoscope_respiratory' ? 'respiratory-point' : ''} ${currentToolName === 'stethoscope_abdomen' ? 'abdomen-point' : ''} ${currentToolName === 'stethoscope_vascular' ? 'vascular-point' : ''} ${activatedPoints.has(point.id) ? 'activated' : ''}`}
                  style={{ left: `${point.x}%`, top: `${point.y}%` }}
                  data-point-id={point.id}
                  data-media={point.media || ''}
                >
                  <div className="point-indicator"></div>
                  <div className="point-tooltip">{point.label}</div>
                </div>
              ));
            })()}

            {showStethoscopeExam && (
              <div
                ref={stethoscopeRef}
                className={`examination-tool stethoscope-tool ${isDragging ? 'dragging' : ''}`}
                style={{
                  left: `${stethoscopePosition.x}%`,
                  top: `${stethoscopePosition.y}%`,
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={() => handleToolDragStart('stethoscope')}
                onMouseMove={handleStethoscopeDrag}
                onMouseUp={handleToolDragEnd}
                draggable={false}
              >
                <img 
                  src="https://storage.googleapis.com/vp-model-storage/Physical%20Exam/black-steth.png"
                  alt="Stethoscope"
                  className="tool-image"
                draggable={false}
              />
              </div>
            )}

            {/* Penlight Examination */}
      {showPenlightExam && (
              <div
                className={`examination-tool penlight-tool ${isDragging ? 'dragging' : ''}`}
                  style={{
                  left: `${penlightPosition.x}%`,
                  top: `${penlightPosition.y}%`,
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={() => handleToolDragStart('penlight')}
                onMouseMove={(e) => handleToolDrag(e, 'penlight', setPenlightPosition)}
                onMouseUp={handleToolDragEnd}
                draggable={false}
              >
                <img 
                  src="https://storage.googleapis.com/vp-model-storage/penlight.png"
                  alt="Penlight"
                  className="tool-image"
                  draggable={false}
                />
        </div>
      )}

            {/* Other medical tools */}
            {showOtoscopeExam && (
              <div
                className="examination-tool"
                style={{
                  left: `${otoscopePosition.x}%`,
                  top: `${otoscopePosition.y}%`,
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={() => handleToolDragStart('otoscope')}
                onMouseMove={(e) => handleToolDrag(e, 'otoscope', setOtoscopePosition)}
              onMouseUp={handleToolDragEnd}
                draggable={false}
              >
                <img 
                  src="https://storage.googleapis.com/vp-model-storage/otoscope.png"
                  alt="Otoscope"
                  className="tool-image"
                draggable={false}
              />
              </div>
            )}

            {showOphthalmoscopeExam && (
              <div
                className="examination-tool"
                style={{
                  left: `${ophthalmoscopePosition.x}%`,
                  top: `${ophthalmoscopePosition.y}%`,
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={() => handleToolDragStart('ophthalmoscope')}
                onMouseMove={(e) => handleToolDrag(e, 'ophthalmoscope', setOphthalmoscopePosition)}
                onMouseUp={handleToolDragEnd}
                draggable={false}
              >
                <img 
                  src="https://storage.googleapis.com/vp-model-storage/ophthalmoscope.png"
                  alt="Ophthalmoscope"
                  className="tool-image"
                  draggable={false}
                />
        </div>
      )}

      {showReflexHammerExam && (
              <div
                className="examination-tool"
                style={{
                  left: `${reflexHammerPosition.x}%`,
                  top: `${reflexHammerPosition.y}%`,
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={() => handleToolDragStart('reflex_hammer')}
                onMouseMove={(e) => handleToolDrag(e, 'reflex_hammer', setReflexHammerPosition)}
                onMouseUp={handleToolDragEnd}
                draggable={false}
              >
                <img 
                  src="https://storage.googleapis.com/vp-model-storage/reflex_hammer.png"
                  alt="Reflex Hammer"
                  className="tool-image"
                  draggable={false}
                />
        </div>
      )}

            {showTuningForkExam && (
              <div
                className="examination-tool"
                style={{
                  left: `${tuningForkPosition.x}%`,
                  top: `${tuningForkPosition.y}%`,
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={() => handleToolDragStart('tuning_fork')}
                onMouseMove={(e) => handleToolDrag(e, 'tuning_fork', setTuningForkPosition)}
                onMouseUp={handleToolDragEnd}
                draggable={false}
              >
                <img 
                  src="https://storage.googleapis.com/vp-model-storage/tuning_fork.png"
                  alt="Tuning Fork"
                  className="tool-image"
                  draggable={false}
                />
        </div>
      )}

            {showDermatoscopeExam && (
              <div
                className="examination-tool"
                style={{
                  left: `${dermatoscopePosition.x}%`,
                  top: `${dermatoscopePosition.y}%`,
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={() => handleToolDragStart('dermatoscope')}
                onMouseMove={(e) => handleToolDrag(e, 'dermatoscope', setDermatoscopePosition)}
                onMouseUp={handleToolDragEnd}
                draggable={false}
              >
                <img 
                  src="https://storage.googleapis.com/vp-model-storage/dermatoscope.png"
                  alt="Dermatoscope"
                  className="tool-image"
                  draggable={false}
                />
        </div>
      )}

            {showTongueDepressorExam && (
              <div
                className="examination-tool"
                style={{
                  left: `${tongueDepressorPosition.x}%`,
                  top: `${tongueDepressorPosition.y}%`,
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={() => handleToolDragStart('tongue_depressor')}
                onMouseMove={(e) => handleToolDrag(e, 'tongue_depressor', setTongueDepressorPosition)}
                onMouseUp={handleToolDragEnd}
                draggable={false}
              >
                <img 
                  src="https://storage.googleapis.com/vp-model-storage/tongue_depressor.png"
                  alt="Tongue Depressor"
                  className="tool-image"
                  draggable={false}
                />
              </div>
            )}

            {showBloodPressureCuffExam && (
              <div
                className="examination-tool blood-pressure-cuff-tool"
                style={{
                  left: `${bloodPressureCuffPosition.x}%`,
                  top: `${bloodPressureCuffPosition.y}%`,
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={() => handleToolDragStart('blood_pressure_cuff')}
                onMouseMove={(e) => handleToolDrag(e, 'blood_pressure_cuff', setBloodPressureCuffPosition)}
                onMouseUp={handleToolDragEnd}
                draggable={false}
              >
                <img 
                  src="https://storage.googleapis.com/vp-model-storage/bloodpressurecuff.png"
                  alt="Blood Pressure Cuff"
                  className="tool-image"
                  draggable={false}
                />
              </div>
            )}

            {showPalpationExam && (
              <div
                className="examination-tool palpation-tool"
                style={{
                  left: `${palpationPosition.x}%`,
                  top: `${palpationPosition.y}%`,
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={() => handleToolDragStart('palpation')}
                onMouseMove={(e) => handleToolDrag(e, 'palpation', setPalpationPosition)}
                onMouseUp={handleToolDragEnd}
                draggable={false}
              >
                <img 
                  src="https://storage.googleapis.com/vp-model-storage/handicon.png"
                  alt="Palpation Hand"
                  className="tool-image"
                  draggable={false}
                />
              </div>
            )}

          </div>

            </div>

        {/* Categories Panel - Right Side */}
        <div className="categories-panel">
          <h3 className="panel-title">Examination Categories</h3>
          <p className="panel-subtitle">Select an examination category to perform</p>

            {/* Breadcrumb Navigation */}
            {categoryPath.length > 0 && (
              <div className="breadcrumb-section">
                <div className="breadcrumb-container">
                  <button 
                    className="breadcrumb-item breadcrumb-root"
                    onClick={() => {
                      setCategoryPath([]);
                      setIsAbdomenExam(false);
                      // Notify parent component about scene mode change (back to exam room)
                      if (onSceneModeChange) {
                        onSceneModeChange(false);
                      }
                      // Clear any auscultation points and overlays when navigating back
                      setShowStethoscopeExam(false);
                      setShowCardioOverlay(false);
                      setStethoscopeMode('cardio');
                      setActivatedPoints(new Set());
                    }}
                  >
                    Examinations
                  </button>
                  {categoryPath.map((pathSegment, index) => (
                    <React.Fragment key={index}>
                      <span className="breadcrumb-separator">›</span>
                      <button
                        className={`breadcrumb-item ${index === categoryPath.length - 1 ? 'breadcrumb-current' : ''}`}
                        onClick={() => {
                          const newPath = categoryPath.slice(0, index + 1);
                          setCategoryPath(newPath);
                          // Check if the new path still contains 'abdomen'
                          const stillInAbdomen = newPath.some(segment => segment.toLowerCase().includes('abdomen'));
                          setIsAbdomenExam(stillInAbdomen);
                          // Notify parent component about scene mode change
                          if (onSceneModeChange) {
                            onSceneModeChange(stillInAbdomen);
                          }
                          // Also clear auscultation points and overlays when moving up
                          setShowStethoscopeExam(false);
                          setShowCardioOverlay(false);
                          setStethoscopeMode('cardio');
                          setActivatedPoints(new Set());
                        }}
                      >
                        {pathSegment}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

          {/* Search Input */}
            <div className="search-section">
              <div className="search-input-container">
                <Search size={18} className="search-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search examination categories..."
                  value={categoriesSearchTerm || ''}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setCategoriesSearchTerm(newValue);
                  }}
                  onKeyDown={(e) => {
                    // Manual handling for typing
                    if (e.key.length === 1) { // Regular character
                      const newValue = categoriesSearchTerm + e.key;
                      setCategoriesSearchTerm(newValue);
                    } else if (e.key === 'Backspace') {
                      const newValue = categoriesSearchTerm.slice(0, -1);
                      setCategoriesSearchTerm(newValue);
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="search-input"
                  autoComplete="off"
                />
              </div>
            </div>

          <div className="categories-list">
              {(() => {
                // If searching, show search results
                if (categoriesSearchTerm.trim()) {
                  if (searchResults.length === 0) {
                    return (
                      <div className="no-results">
                        <p>No examination categories found for "{categoriesSearchTerm}"</p>
                      </div>
                    );
                  }
                  return searchResults.map((result, index) => (
                    <button 
                      key={`${result.item}-${index}`} 
                    className="category-item search-result" 
                      onClick={() => handleSearchResultSelect(result)}
                    >
                    <div className="category-content">
                      <div className="category-description">
                          <strong>{result.item}</strong>
                          <div className="search-result-path">
                            {result.path.join(' > ')}
                          </div>
                        </div>
                      </div>
                    </button>
                  ));
                }

                // Normal category navigation
                const node = getCategoryNode(categoryPath);
                if (!node) return null;
                if (Array.isArray(node)) {
                  // Render final items
                  return node.map((item) => (
                  <button key={item} className="category-item" onClick={() => handleCategoryItemSelect(item)}>
                    <div className="category-content">
                      <div className="category-description">{item}</div>
                      </div>
                    </button>
                  ));
                }
                // Render next-level keys
                return Object.keys(node).map((key) => (
                <button key={key} className="category-item" onClick={() => handleCategoryClick(key)}>
                  <div className="category-content">
                    <div className="category-description">{key}</div>
                    </div>
                  </button>
                ));
              })()}
            </div>
          </div>
        </div>

      {/* Media Player Overlay */}
      {showMediaPlayer && currentMedia && (
        <div className="media-player-overlay">
          <div className="media-player-container">
            <div className="media-header">
              <button className="back-button" onClick={handleBack}>
                <ArrowLeft size={30} />
              </button>
              <div className="media-title-section">
                <h3 className="media-title">Examination Findings</h3>
                <p className="media-subtitle">
                  {currentMedia.type === 'video' ? 'Playing examination video' : 'Showing examination image'}
                </p>
              </div>
              <button className="close-button" onClick={handleClose}>
                <X size={20} />
              </button>
            </div>

            <div className="media-content">
              {currentMedia.type === 'video' ? (
                <video 
                  controls 
                  autoPlay
                  muted
                  playsInline
                  className="examination-media"
                  src={currentMedia.url}
                  onError={(e) => console.error('Video error:', e)}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img 
                  src={currentMedia.url} 
                  alt="Examination findings"
                  className="examination-media"
                  onError={(e) => console.error('Image error:', e)}
                />
              )}
              </div>
            </div>
              </div>
      )}

      {/* Palpation Modal */}
      {showPalpationModal && (
        <div className="palpation-modal-overlay">
          <div className="palpation-modal-container">
            <div className="palpation-modal-header">
              <h3 className="palpation-modal-title">Palpation Report</h3>
              <p className="palpation-modal-subtitle">{currentPalpationQuadrant}</p>
              <button 
                className="palpation-modal-close" 
                onClick={() => setShowPalpationModal(false)}
                title="Close report"
              >
                ×
              </button>
            </div>
            <div className="palpation-modal-content">
              <div className="palpation-findings">
                <div className="finding-item">
                  <span className="finding-icon">🔍</span>
                  <span className="finding-text">No rigidity. No pain. No guarding or signs of peritoneal irritation. No masses or palpable organomegaly.</span>
                </div>
              </div>
              </div>
            </div>
              </div>
      )}

      {/* Back/Close buttons removed - now in navbar only */}

      <style jsx>{`
        .physical-exam-container {
          width: 100%;
          height: 100vh;
          background: #F9FAFB;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 9999;
          overflow: hidden;
        }

        /* Enhanced Top Navigation Bar */
        .top-navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 72px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(226, 232, 240, 0.6);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          z-index: 1001;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .navbar-left {
          display: flex;
          align-items: center;
          flex: 0 0 auto;
          min-width: 180px;
        }

        .back-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(248, 250, 252, 0.8);
          border: 1px solid rgba(226, 232, 240, 0.8);
          color: ${uaColors.slate[700]};
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          padding: 10px 16px;
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(10px);
        }

        .back-button:hover {
          background: rgba(171, 5, 32, 0.08);
          border-color: rgba(171, 5, 32, 0.3);
          color: ${uaColors.arizonaRed};
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(171, 5, 32, 0.15);
        }

        .navbar-center {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .navbar-title {
          font-size: 20px;
          font-weight: 600;
          color: ${uaColors.slate[900]};
          margin: 0;
          letter-spacing: -0.025em;
        }

        .navbar-right {
          display: flex;
          align-items: center;
          flex: 0 0 auto;
          min-width: 180px;
          justify-content: flex-end;
        }

        .navbar-right .close-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          background: rgba(248, 250, 252, 0.8);
          border: 1px solid rgba(226, 232, 240, 0.8);
          color: ${uaColors.slate[700]};
          cursor: pointer;
          padding: 0;
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(10px);
        }

        .navbar-right .close-button:hover {
          background: rgba(171, 5, 32, 0.08);
          border-color: rgba(171, 5, 32, 0.3);
          color: ${uaColors.arizonaRed};
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(171, 5, 32, 0.15);
        }

        /* Navigation buttons removed for cleaner interface */

        .exam-layout {
          display: flex;
          height: calc(100vh - 72px);
          width: 100%;
          margin-top: 72px;
          padding: 24px;
          gap: 24px;
        }

        /* Tools Panel - Left Side */
        .tools-panel {
          width: 320px;
          background: #FFFFFF;
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 16px;
          padding: 24px;
          overflow-y: auto;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          height: calc(100vh - 120px);
          flex-shrink: 0;
        }

        .panel-title {
          font-size: 18px;
          font-weight: 600;
          color: ${uaColors.slate[900]};
          margin: 0 0 12px 0;
          letter-spacing: -0.025em;
        }

        .panel-subtitle {
          font-size: 13px;
          color: ${uaColors.slate[600]};
          margin: 0 0 20px 0;
          font-weight: 400;
          line-height: 1.5;
        }

        .tools-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          animation: fadeInUp 0.6s ease-out;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .tool-with-menu {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .stethoscope-mode-menu {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          left: auto;
          background: ${uaColors.white};
          border: 1px solid ${uaColors.slate[200]};
          border-radius: 10px;
          box-shadow: 0 10px 26px rgba(0,0,0,0.14);
          z-index: 20;
          min-width: 80px;
          max-width: 120px;
          width: max-content;
          padding: 0.2rem;
        }

        .stethoscope-mode-menu::before {
          content: '';
          position: absolute;
          top: -6px;
          right: 12px;
          width: 10px;
          height: 10px;
          background: ${uaColors.white};
          border-left: 1px solid ${uaColors.slate[200]};
          border-top: 1px solid ${uaColors.slate[200]};
          transform: rotate(45deg);
        }

        .tool-with-menu > .tool-button {
          width: 100%;
          height: 100%;
        }

        .mode-item {
          width: 100%;
          background: none;
          border: none;
          padding: 0.4rem 0.6rem;
          text-align: left;
          font-size: 0.8rem;
          color: ${uaColors.slate[700]};
          border-radius: 6px;
          cursor: pointer;
        }

        .mode-item:hover {
          background: ${uaColors.slate[50]};
        }

        .tool-button {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          aspect-ratio: 1;
          min-height: 88px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .tool-button:hover {
          background: rgba(248, 250, 252, 0.95);
          border-color: rgba(171, 5, 32, 0.3);
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(171, 5, 32, 0.15);
        }

        .tool-button.active {
          background: rgba(171, 5, 32, 0.08);
          border-color: ${uaColors.arizonaRed};
          box-shadow: 0 4px 20px rgba(171, 5, 32, 0.2);
        }

        .tool-button.active:hover {
          background: rgba(171, 5, 32, 0.12);
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(171, 5, 32, 0.25);
        }

        .tool-button img {
          width: 60px;
          height: 60px;
          object-fit: contain;
          transition: transform 0.2s ease;
        }

        .tool-button:hover img {
          transform: scale(1.1);
        }


        /* Center Panel - Body */
        .center-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: transparent;
          position: relative;
          min-width: 0;
        }

        .view-toggle-top {
          display: flex;
          justify-content: flex-start;
          gap: 12px;
          padding: 0;
          background: transparent;
          border: none;
          border-radius: 0;
          margin-bottom: 24px;
          box-shadow: none;
          margin-left: 24px;
        }

        .view-button {
          padding: 12px 24px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          color: ${uaColors.slate[700]};
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
        }

        .view-button.active {
          background: ${uaColors.arizonaRed};
          color: ${uaColors.white};
          border-color: ${uaColors.arizonaRed};
          box-shadow: 0 4px 12px rgba(171, 5, 32, 0.3);
        }

        .view-button:hover:not(.active) {
          background: rgba(248, 250, 252, 0.95);
          border-color: rgba(171, 5, 32, 0.3);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        /* Blood Pressure Monitor */
        .blood-pressure-monitor {
          position: absolute;
          top: 100px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          background: ${uaColors.white};
          border: 2px solid ${uaColors.arizonaRed};
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          animation: slideDown 0.3s ease;
        }

        .bp-monitor-content {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 1rem;
        }

        .bp-reading {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }

        .bp-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: ${uaColors.arizonaRed};
          font-family: 'Monaco', 'Menlo', monospace;
        }

        .bp-unit {
          font-size: 0.875rem;
          color: ${uaColors.slate[600]};
          font-weight: 500;
        }

        .bp-close-button {
          position: absolute;
          top: 1px;
          right: -5px;
          width: 20px;
          height: 20px;
          background: none;
          color: ${uaColors.arizonaRed};
          border: none;
          font-size: 16px;
          font-weight: bold;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .bp-close-button:hover {
          color: ${uaColors.chili};
          transform: scale(1.2);
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        /* Audio Status Indicator */
        .audio-status-indicator {
          position: absolute;
          top: 120px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          background: rgba(239, 68, 68, 0.95);
          color: white;
          border-radius: 8px;
          padding: 0.75rem 1rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          animation: slideDown 0.3s ease;
        }

        .audio-status-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .audio-status-icon {
          font-size: 1.2rem;
        }

        .audio-status-text {
          font-size: 0.875rem;
          font-weight: 500;
        }

        /* Audio Volume Control removed (fixed 5x) */

        .body-examination-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 2rem;
        }

        .patient-body-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          user-select: none;
        }

        /* Floating Trash Area */
        .floating-trash-area {
          position: fixed;
          top: 50%;
          right: 360px;
          transform: translateY(-50%);
          width: 56px;
          height: 56px;
          background: #FFFFFF;
          border: 2px solid rgba(226, 232, 240, 0.8);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          z-index: 1000;
        }

        .floating-trash-area:hover {
          background: #FFFFFF;
          border-color: #AB0520;
          transform: translateY(-50%) scale(1.05);
          box-shadow: 0 8px 25px rgba(171, 5, 32, 0.2);
        }

        .floating-trash-area.trash-active {
          background: #AB0520;
          border-color: #AB0520;
          transform: translateY(-50%) scale(1.1);
          box-shadow: 0 8px 25px rgba(171, 5, 32, 0.3);
        }

        .floating-trash-area svg {
          color: ${uaColors.slate[600]};
          transition: all 0.2s ease;
        }

        .floating-trash-area:hover svg {
          color: #AB0520;
          transform: scale(1.1);
        }

        .floating-trash-area.trash-active svg {
          color: #FFFFFF;
        }

        .examination-tool {
          position: absolute;
          width: 80px;
          height: 80px;
          transform: translate(-50%, -50%);
          z-index: 10;
          will-change: transform;
          transition: transform 0.1s ease;
        }
        
        .stethoscope-tool {
          width: 60px;
          height: 60px;
        }
        
        .blood-pressure-cuff-tool {
          width: 90px;
          height: 90px;
        }
        
        .palpation-tool {
          width: 35px;
          height: 35px;
        }
        
        .examination-tool.dragging {
          transition: none;
          will-change: transform;
        }

        .examination-tool:active {
          transform: translate(-50%, -50%) scale(1.1);
        }

        .tool-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));
        }

        /* Cardiovascular auscultation overlay image */
        .cardio-ausc-overlay {
          position: absolute;
          left: 51.5%;
          top: 34%;
          width: 26%;
          max-width: 120px;
          min-width: 60px;
          transform: translate(-50%, -50%);
          opacity: 0.9;
          pointer-events: none;
          z-index: 6;
        }

        .examination-point {
          position: absolute;
          width: 36px;
          height: 36px;
          transform: translate(-50%, -50%);
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 5;
        }

        .point-indicator {
          width: 32px;
          height: 32px;
          background: transparent;
          border: 2px solid ${uaColors.slate[400]};
          border-radius: 50%;
          box-shadow: 0 0 0 4px rgba(148, 163, 184, 0.15);
          opacity: 1;
          transition: all 0.2s ease;
          animation: none;
          position: relative;
        }

        .point-indicator::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 6px;
          height: 6px;
          background: ${uaColors.slate[700]};
          border-radius: 50%;
          opacity: 1;
        }

        .examination-point.activated .point-indicator {
          opacity: 1;
          background: transparent;
          border-color: ${uaColors.arizonaBlue};
          transform: none;
          animation: none;
          box-shadow: 0 0 0 4px rgba(12, 35, 75, 0.15);
        }

        /* Show cardiac points as well (override previous invisibility) */
        .examination-point.cardiac-point .point-indicator,
        .examination-point.cardiac-point.activated .point-indicator {
          opacity: 1;
          border-color: ${uaColors.arizonaBlue};
          box-shadow: 0 0 0 4px rgba(12, 35, 75, 0.15);
          animation: none;
        }
        .examination-point.cardiac-point .point-indicator::before {
          opacity: 1;
          background: ${uaColors.arizonaBlue};
        }

        /* Make respiratory (lung) activation points visible */
        .examination-point.respiratory-point .point-indicator {
          opacity: 1;
          border-color: ${uaColors.arizonaBlue};
          box-shadow: 0 0 0 4px rgba(12, 35, 75, 0.15);
        }

        .examination-point.respiratory-point .point-indicator::before {
          opacity: 1;
          background: ${uaColors.arizonaBlue};
        }

        .examination-point.respiratory-point.activated .point-indicator {
          opacity: 1;
          border-color: ${uaColors.arizonaBlue};
          box-shadow: 0 0 0 4px rgba(12, 35, 75, 0.15);
        }

        /* Abdomen auscultation points visible */
        .examination-point.abdomen-point .point-indicator {
          opacity: 1;
          border-color: ${uaColors.slate[600]};
          box-shadow: 0 0 0 4px rgba(71, 85, 105, 0.15);
        }

        .examination-point.abdomen-point .point-indicator::before {
          opacity: 1;
          background: ${uaColors.slate[600]};
        }

        .examination-point.abdomen-point.activated .point-indicator {
          opacity: 1;
          border-color: ${uaColors.slate[600]};
          box-shadow: 0 0 0 4px rgba(71, 85, 105, 0.15);
        }

        /* Vascular bruit screening points visible */
        .examination-point.vascular-point .point-indicator {
          opacity: 1;
          border-color: ${uaColors.slate[700]};
          box-shadow: 0 0 0 4px rgba(51, 65, 85, 0.2);
        }

        .examination-point.vascular-point .point-indicator::before {
          opacity: 1;
          background: ${uaColors.slate[700]};
        }

        .examination-point.vascular-point.activated .point-indicator {
          opacity: 1;
          border-color: ${uaColors.slate[700]};
          box-shadow: 0 0 0 4px rgba(51, 65, 85, 0.2);
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.6; }
          100% { opacity: 1; }
        }

        .point-tooltip {
          position: absolute;
          top: -55px;
          left: 50%;
          transform: translateX(-50%);
          background: ${uaColors.slate[800]};
          color: ${uaColors.white};
          padding: 0.375rem 0.75rem;
          border-radius: 6px;
          font-size: 0.75rem;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: all 0.2s ease;
          z-index: 10;
        }

        .examination-point:hover .point-tooltip {
          opacity: 1;
        }

        /* Categories Panel - Right Side */
        .categories-panel {
          width: 320px;
          background: #FFFFFF;
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          height: calc(100vh - 120px);
          flex-shrink: 0;
        }

        .panel-subtitle {
          font-size: 0.875rem;
          color: ${uaColors.slate[600]};
          margin: 0 0 1.5rem 0;
        }

        .categories-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .category-item {
          width: 100%;
          padding: 16px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          cursor: pointer;
          text-align: left;
          font-size: 14px;
          font-weight: 500;
          color: ${uaColors.slate[700]};
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          margin-bottom: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
        }

        .category-item:hover {
          background: rgba(248, 250, 252, 0.95);
          border-color: rgba(171, 5, 32, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .category-item:active {
          transform: translateY(0);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
        }

        .category-content {
          flex: 1;
        }

        .category-description {
          font-size: 0.875rem;
          color: ${uaColors.slate[700]};
          line-height: 1.4;
          font-weight: 500;
        }

        /* Breadcrumb Navigation */
        .breadcrumb-section {
          padding: 0.75rem 0 0.5rem;
          border-bottom: 1px solid ${uaColors.slate[100]};
          background: ${uaColors.slate[25] || '#FAFAFA'};
          margin: 0 -1.5rem 1rem;
          padding-left: 1.5rem;
          padding-right: 1.5rem;
        }

        .breadcrumb-container {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          flex-wrap: wrap;
        }

        .breadcrumb-item {
          background: none;
          border: none;
          color: ${uaColors.slate[600]};
          font-size: 0.875rem;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .breadcrumb-item:hover {
          background: ${uaColors.slate[100]};
          color: ${uaColors.slate[800]};
        }

        .breadcrumb-root {
          color: ${uaColors.arizonaBlue};
          font-weight: 600;
        }

        .breadcrumb-root:hover {
          background: rgba(28, 82, 136, 0.1);
          color: ${uaColors.arizonaBlue};
        }

        .breadcrumb-current {
          color: ${uaColors.slate[900]};
          font-weight: 600;
          cursor: default;
        }

        .breadcrumb-current:hover {
          background: none;
          color: ${uaColors.slate[900]};
        }

        .breadcrumb-separator {
          color: ${uaColors.slate[400]};
          font-size: 0.875rem;
          margin: 0 0.25rem;
          user-select: none;
        }

        /* Search Section */
        .search-section {
          padding: 0 0 1rem;
          border-bottom: 1px solid ${uaColors.slate[200]};
          margin-bottom: 1rem;
        }

        .search-input-container {
          position: relative;
          display: flex;
          align-items: center;
          z-index: 2;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          color: ${uaColors.slate[400]};
          z-index: 1;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          border: 1px solid ${uaColors.slate[300]};
          border-radius: 8px;
          font-size: 0.875rem;
          transition: all 0.2s ease;
          background-color: white !important;
          color: black !important;
          pointer-events: auto !important;
          z-index: 1;
          position: relative;
          user-select: text !important;
          -webkit-user-select: text !important;
        }

        .search-input:focus {
          outline: none;
          border-color: ${uaColors.arizonaBlue};
          box-shadow: 0 0 0 3px rgba(28, 82, 136, 0.1);
        }

        .no-results {
          padding: 2rem;
          text-align: center;
          color: ${uaColors.slate[600]};
        }

        .search-result {
          border-left: 3px solid ${uaColors.arizonaRed};
        }

        .search-result-path {
          font-size: 0.75rem;
          color: ${uaColors.slate[500]};
          margin-top: 0.25rem;
          font-weight: 400;
        }

        /* Back and Close buttons */
        .back-exam-button,
        .close-exam-button {
          position: fixed;
          top: 0.25rem;
          background: none;
          border: none;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10000;
          color: ${uaColors.slate[800]};
          transition: all 0.2s ease;
        }

        .back-exam-button {
          left: -0.5rem;
          top: -0.2rem;
        }

        .close-exam-button {
          right: 0rem;
          top: 0rem;
        }

        .back-exam-button:hover,
        .close-exam-button:hover {
          color: ${uaColors.slate[600]};
          transform: scale(1.1);
        }

        /* Media Player Styles */
        .media-player-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10003;
          animation: fadeIn 0.2s ease;
        }

        .media-player-container {
          background: ${uaColors.white};
          border-radius: 16px;
          width: 95%;
          max-width: 900px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          animation: slideUp 0.3s ease;
        }

        .media-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          border-bottom: 1px solid ${uaColors.slate[200]};
        }

        .media-title-section {
          flex: 1;
          text-align: left;
        }

        .media-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: ${uaColors.slate[900]};
          margin: 0 0 0.25rem 0;
        }

        .media-subtitle {
          font-size: 0.875rem;
          color: ${uaColors.slate[600]};
          margin: 0;
        }

        .back-button, .close-button {
          background: none;
          border: none;
          padding: 0.5rem;
          border-radius: 8px;
          cursor: pointer;
          color: ${uaColors.slate[600]};
          transition: all 0.2s ease;
        }

        .back-button:hover, .close-button:hover {
          background: ${uaColors.slate[100]};
          color: ${uaColors.slate[900]};
        }

        .media-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: ${uaColors.slate[900]};
        }

        .examination-media {
          max-width: 100%;
          max-height: 70vh;
          object-fit: contain;
          border-radius: 8px;
        }

        /* Palpation Icons */
        .palpation-icon {
          position: absolute;
          width: 25px;
          height: 25px;
          transform: translate(-50%, -50%);
          cursor: pointer;
          z-index: 15;
          transition: all 0.2s ease;
        }

        .palpation-icon:hover {
          transform: translate(-50%, -50%) scale(1.1);
        }

        .palpation-icon-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));
          transition: filter 0.2s ease;
        }

        .palpation-icon:hover .palpation-icon-image {
          filter: drop-shadow(0 4px 12px rgba(171, 5, 32, 0.4));
        }

        /* Palpation Modal */
        .palpation-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10004;
          animation: fadeIn 0.2s ease;
        }

        .palpation-modal-container {
          background: ${uaColors.white};
          border-radius: 16px;
          width: 90%;
          max-width: 500px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          animation: slideUp 0.3s ease;
          overflow: hidden;
        }

        .palpation-modal-header {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 1.5rem 1.5rem 1rem;
          border-bottom: 1px solid ${uaColors.slate[200]};
          position: relative;
        }

        .palpation-modal-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: ${uaColors.slate[900]};
          margin: 0;
        }

        .palpation-modal-subtitle {
          font-size: 0.875rem;
          color: ${uaColors.arizonaRed};
          font-weight: 500;
          margin: 0;
        }

        .palpation-modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
          color: ${uaColors.slate[600]};
          font-size: 24px;
          font-weight: bold;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .palpation-modal-close:hover {
          background: ${uaColors.slate[100]};
          color: ${uaColors.slate[900]};
        }

        .palpation-modal-content {
          padding: 1.5rem;
          flex: 1;
        }

        .palpation-findings {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .finding-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem;
          background: ${uaColors.slate[50]};
          border-radius: 12px;
          border-left: 4px solid ${uaColors.arizonaRed};
        }

        .finding-icon {
          font-size: 1.25rem;
          margin-top: 0.125rem;
          flex-shrink: 0;
        }

        .finding-text {
          font-size: 0.875rem;
          line-height: 1.5;
          color: ${uaColors.slate[700]};
          font-weight: 500;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 1200px) {
          .exam-layout {
            padding: 16px;
            gap: 16px;
          }
          
          .tools-panel, .categories-panel {
            width: 280px;
          }
        }

        @media (max-width: 768px) {
          .exam-layout {
            flex-direction: column;
            padding: 16px;
            gap: 16px;
          }
          
          .tools-panel, .categories-panel {
            width: 100%;
            height: auto;
            max-height: 300px;
          }
          
          .center-panel {
            flex: 1;
            min-height: 400px;
          }

          /* Navigation buttons removed */
        }
      `}</style>

      {/* Floating Trash Area - Right Side */}
      <div 
        className={`floating-trash-area ${isOverTrash ? 'trash-active' : ''}`}
        onClick={() => {
          console.log('Trash clicked, isDragging:', isDragging); // Debug log
          if (isDragging) {
            removeTool();
          }
        }}
      >
        <Trash2 size={20} />
      </div>
    </div>
  );
};

export default PhysicalExamInterface;