import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Search, ArrowLeft, Check } from 'lucide-react';

// UA Brand Colors from your design system
const uaColors = {
  arizonaRed: '#AB0520',
  arizonaBlue: '#0C234B',
  midnight: '#001C48',
  azurite: '#1E5288',
  oasis: '#378DBD',
  chili: '#8B0015',
  white: '#FFFFFF',
  warmGray: '#F4EDE5',
  coolGray: '#E2E9EB',
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
    { id: 'upper_abdomen', label: 'Upper Abdomen' },
    { id: 'lower_abdomen', label: 'Lower Abdomen' },
    { id: 'left_side', label: 'Left Side' },
    { id: 'right_side', label: 'Right Side' },
    { id: 'pelvis', label: 'Pelvis' },
    { id: 'lower_back', label: 'Lower Back' },
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

// Comprehensive physical exam categories and subcategories
const examCategories = {
  General: {
    Appearance: [
      "Level of consciousness",
      "Apparent age",
      "Signs of distress",
      "Hygiene and grooming",
      "Nutritional status"
    ]
  },

  "HEENT (Head, Eyes, Ears, Nose, Throat)": {
    Head: [
      "Scalp inspection",
      "Head shape and size",
      "Hair distribution",
      "Facial symmetry",
      "Temporal artery tenderness"
    ],
    Eyes: [
      "Inspection of conjunctiva and sclera",
      "Pupillary response to light",
      "Pupillary light reflex — swinging flashlight test (RAPD)",
      "PERRLA (direct & consensual)",
      "Accommodation (PERRLA)",
      "Visual acuity",
      "Visual fields by confrontation",
      "Extraocular movements (EOM)",
      "Fundoscopic exam (retina, optic disc)"
    ],
    Ears: [
      "External ear inspection",
      "Palpation for tenderness (tragus/mastoid)",
      "Otoscopy (canal, tympanic membrane)",
      "Hearing tests (whisper, Rinne, Weber)"
    ],
    Nose: [
      "External nose inspection",
      "Nasal patency",
      "Septum and mucosa inspection",
      "Sinus tenderness (frontal/maxillary)"
    ],
    "Throat/Mouth": [
      "Lips and oral mucosa",
      "Teeth and gums",
      "Oral cavity examination",
      "Tonsils and uvula",
      "Oropharynx (say 'ah')",
      "Gag reflex",
      "Mucosal hydration"
    ]
  },

  Neck: {
    Inspection: [
      "Trachea position",
      "Thyroid enlargement",
      "Neck masses"
    ],
    Palpation: [
      "Lymph nodes (cervical chain)",
      "Thyroid gland"
    ],
    Auscultation: [
      "Thyroid bruit",
      "Carotid bruits"
    ],
    "Range of Motion": [
      "Flexion",
      "Extension",
      "Rotation",
      "Lateral bending"
    ],
    "Airway Assessment": [
      "Mallampati classification (mouth open, tongue out)",
      "Mouth opening (interincisor distance)",
      "Thyromental distance (airway assessment)",
      "Say \"ah\" — palatal elevation (CN IX/X)"
    ]
  },

  Breast: {
    Inspection: [
      "Symmetry",
      "Skin changes (dimpling, peau d'orange)",
      "Nipple inversion or retraction",
      "Arms at sides, overhead, hands on hips (dynamic)"
    ],
    Palpation: [
      "Systematic breast palpation (all quadrants, tail of Spence)",
      "Nipple discharge",
      "Axillary nodes (central, pectoral, subscapular, lateral)",
      "Supraclavicular/infraclavicular nodes"
    ],
    Education: [
      "Self-awareness and routine screening discussion"
    ]
  },

  Cardiovascular: {
    Inspection: [
      "Precordial pulsations",
      "Jugular venous distension (JVD)"
    ],
    Palpation: [
      "Point of maximal impulse (PMI)",
      "Peripheral pulses (carotid, radial, femoral, popliteal, dorsalis pedis, posterior tibial)",
      "Edema"
    ],
    Auscultation: [
      "Heart sounds (Aortic, Pulmonic, Tricuspid, Mitral)",
      "Heart sounds (APTM normal S1/S2)",
      "Murmurs, rubs, gallops",
      "Aortic stenosis murmur (systolic ejection)",
      "Dynamic maneuvers (squat/valsalva if applicable)"
    ],
    "Capillary Refill": []
  },

  Respiratory: {
    Inspection: [
      "Chest shape",
      "Respiratory effort",
      "Symmetry of chest movement",
      "Accessory muscle use"
    ],
    Palpation: [
      "Chest expansion",
      "Tactile fremitus"
    ],
    Percussion: [
      "General resonance",
      "Diaphragmatic excursion"
    ],
    Auscultation: [
      "Breath sounds (vesicular/bronchial)",
      "Adventitious sounds (crackles, wheezes, rhonchi)",
      "Egophony/whispered pectoriloquy"
    ]
  },

  Abdomen: {
    Inspection: [
      "Contour",
      "Scars, masses, distension",
      "Pulsations"
    ],
    Auscultation: [
      "Bowel sounds",
      "Bruits (aorta, renal, iliac, femoral)"
    ],
    Percussion: [
      "General percussion",
      "Liver span",
      "Splenic dullness",
      "Shifting dullness (ascites)"
    ],
    Palpation: [
      "Tenderness (light and deep)",
      "Rebound tenderness",
      "Guarding",
      "Masses",
      "Organomegaly (liver, spleen)"
    ],
    "Special Tests": [
      "Murphy sign (cholecystitis)",
      "Rovsing, psoas, obturator (appendicitis)",
      "CVA tenderness (kidneys)",
      "Fluid wave (ascites)"
    ]
  },

  Genitourinary: {
    Male: [
      "External genitalia inspection",
      "Hernia check",
      "Testicular palpation",
      "Epididymis tenderness"
    ],
    Female: [
      "External genital inspection",
      "Speculum exam (cervix/vaginal walls)",
      "Bimanual exam (uterus/adnexa)",
      "Cervical motion tenderness"
    ]
  },

  Rectal: {
    "Digital Rectal Exam (DRE)": [
      "Tone",
      "Masses",
      "Stool guaiac (if indicated)"
    ],
    Male: [
      "Prostate size, contour, tenderness"
    ],
    Female: [
      "Posterior pelvic structures (if indicated)"
    ]
  },

  "Peripheral Vascular": {
    Arterial: [
      "Pulse symmetry and amplitude",
      "Temperature, pallor",
      "Bruits"
    ],
    Venous: [
      "Edema (pitting)",
      "Varicosities",
      "Homan sign (historical; note limitations)"
    ]
  },

  Musculoskeletal: {
    Inspection: [
      "Gait",
      "Posture",
      "Deformities",
      "Atrophy"
    ],
    Palpation: [
      "Tenderness",
      "Swelling",
      "Temperature",
      "Crepitus"
    ],
    "ROM Testing": [
      "Neck",
      "Shoulders",
      "Elbows",
      "Wrists",
      "Fingers",
      "Hips",
      "Knees",
      "Ankles",
      "Toes",
      "Spine"
    ],
    "Strength Testing (0–5)": [
      "Upper and lower extremities"
    ],
    "Joint Specific Tests": [
      "Shoulder (Neer, Hawkins, empty can, apprehension/relocation)",
      "Elbow (valgus/varus stress)",
      "Wrist/Hand (Phalen, Tinel, Finkelstein)",
      "Hip (FABER, FADIR, log roll)",
      "Knee (Lachman, anterior/posterior drawer, McMurray, Thessaly)",
      "Ankle (anterior drawer, talar tilt)",
      "Cervical/Lumbar (Spurling, Straight-Leg Raise)"
    ]
  },

  Neurological: {
    "Mental Status": [
      "Orientation",
      "Attention/concentration",
      "Memory",
      "Language and speech"
    ],
    "Cranial Nerves (I–XII)": [
      "I Olfaction",
      "II Visual fields/acuity/fundus",
      "III/IV/VI EOMs and pupils",
      "V Facial sensation/masseter",
      "VII Facial movements",
      "VIII Hearing/vestibular",
      "IX/X Palate/voice/gag",
      "XI SCM/trapezius strength",
      "XII Tongue"
    ],
    "Motor Function": [
      "Bulk",
      "Tone",
      "Strength (proximal/distal)",
      "Pronator drift"
    ],
    "Sensory Testing": [
      "Light touch",
      "Pinprick",
      "Temperature",
      "Vibration",
      "Proprioception",
      "Dermatomal mapping (as indicated)"
    ],
    Reflexes: [
      "Upper Limbs",
      "Lower Limbs"
    ],
    Coordination: [
      "Finger-to-nose",
      "Heel-to-shin",
      "Rapid alternating movements"
    ],
    "Gait and Balance": [
      "Normal gait",
      "Heel/toe/tandem walking",
      "Romberg test"
    ],
    "Meningeal Signs (if indicated)": [
      "Nuchal rigidity",
      "Kernig",
      "Brudzinski"
    ]
  },

  "Skin / Hair / Nails": {
    Inspection: [
      "Color",
      "Lesions",
      "Rashes",
      "Scars",
      "Ecchymoses",
      "Ulcers/pressure injuries"
    ],
    Palpation: [
      "Moisture",
      "Temperature",
      "Texture",
      "Turgor"
    ],
    Nails: [
      "Clubbing",
      "Koilonychia",
      "Splinter hemorrhages",
      "Onychomycosis"
    ],
    "Lesion Assessment": [
      "ABCDE for pigmented lesions",
      "Dermatoscopy (ABCDE for pigmented lesions)"
    ]
  },

  Lymphatic: {
    "Head/Neck": [
      "Preauricular",
      "Postauricular",
      "Occipital",
      "Tonsillar",
      "Submandibular",
      "Submental",
      "Anterior/posterior cervical",
      "Supraclavicular"
    ],
    Axillary: [
      "Central",
      "Pectoral",
      "Subscapular",
      "Lateral"
    ],
    Epitrochlear: [
      "Near medial elbow"
    ],
    Inguinal: [
      "Horizontal and vertical chains"
    ]
  },

  Endocrine: {
    Thyroid: [
      "Size",
      "Nodules",
      "Tenderness",
      "Bruit"
    ],
    "Systemic Signs": [
      "Skin/hair changes",
      "Weight change",
      "Heat/cold intolerance",
      "Tremor",
      "Proximal muscle weakness",
      "Gynecomastia/galactorrhea (if applicable)"
    ]
  },

  Back: {
    Inspection: [
      "Alignment",
      "Curvatures (kyphosis/lordosis/scoliosis)"
    ],
    Palpation: [
      "Spinal tenderness",
      "Paraspinal muscle tone"
    ],
    Percussion: [
      "CVA tenderness"
    ],
    "Range of Motion": [
      "Flexion",
      "Extension",
      "Lateral bending",
      "Rotation"
    ],
    "Special Tests": [
      "Straight-Leg Raise",
      "Schober (if ankylosing spondylitis suspected)"
    ]
  },


};



const PhysicalExamInterface = ({ onClose }) => {
  const [selectedBodyPart, setSelectedBodyPart] = useState(null);
  const [selectedAnatomyPart, setSelectedAnatomyPart] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCategories, setShowCategories] = useState(false);
  const [categoryPath, setCategoryPath] = useState([]); // array of keys down the tree
  const [showStethoscopeExam, setShowStethoscopeExam] = useState(false);
  const [showPenlightExam, setShowPenlightExam] = useState(false);
  const [showAirwayExam, setShowAirwayExam] = useState(false);
  const [showTuningForkExam, setShowTuningForkExam] = useState(false);
  const [showTongueDepressorExam, setShowTongueDepressorExam] = useState(false);
  const [showReflexHammerExam, setShowReflexHammerExam] = useState(false);
  const [showOtoscopeExam, setShowOtoscopeExam] = useState(false);
  const [showOphthalmoscopeExam, setShowOphthalmoscopeExam] = useState(false);
  const [showDermatoscopeExam, setShowDermatoscopeExam] = useState(false);
  const [showMediaPlayer, setShowMediaPlayer] = useState(false);
  const [currentMedia, setCurrentMedia] = useState(null);
  const [currentView, setCurrentView] = useState('front'); // 'front' or 'back'
  const [stethoscopePosition, setStethoscopePosition] = useState({ x: 50, y: 50 });
  const [penlightPosition, setPenlightPosition] = useState({ x: 60, y: 15 });
  const [tuningForkPosition, setTuningForkPosition] = useState({ x: 60, y: 15 });
  const [tongueDepressorPosition, setTongueDepressorPosition] = useState({ x: 60, y: 15 });
  const [reflexHammerPosition, setReflexHammerPosition] = useState({ x: 60, y: 15 });
  const [otoscopePosition, setOtoscopePosition] = useState({ x: 60, y: 15 });
  const [ophthalmoscopePosition, setOphthalmoscopePosition] = useState({ x: 60, y: 15 });
  const [dermatoscopePosition, setDermatoscopePosition] = useState({ x: 60, y: 15 });
  const [isDragging, setIsDragging] = useState(false);
  const [activatedPoints, setActivatedPoints] = useState(new Set());
  const [audioElement, setAudioElement] = useState(null);
  const [dragTimer, setDragTimer] = useState(null);
  const [tongueDepressorExamType, setTongueDepressorExamType] = useState('default');
  const [reflexHammerExamType, setReflexHammerExamType] = useState('upper');
  const [currentlyPlayingPoint, setCurrentlyPlayingPoint] = useState(null);
  const [hoveredAirwayArea, setHoveredAirwayArea] = useState(false);
  const [categoriesSearchTerm, setCategoriesSearchTerm] = useState('');
  const [previousCategoryPath, setPreviousCategoryPath] = useState([]); // Store path before opening examinations
  const [cameFromCategories, setCameFromCategories] = useState(false); // Track if we came from categories vs body parts
  const searchInputRef = useRef(null);

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
    };
  }, [audioElement, dragTimer]);

  // Auto-open categories when component mounts
  useEffect(() => {
    if (!selectedBodyPart && !showCategories) {
      openCategories();
    }
  }, []);

  // Auto-focus search input when categories modal opens
  useEffect(() => {
    if (showCategories) {
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [showCategories]);

  // Event shield to prevent Unity/global listeners from blocking typing
  useEffect(() => {
    const el = searchInputRef.current;
    if (!el || !showCategories) return;
    
    const stopBubble = (e) => {
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
    };
    
    const types = ['keydown', 'keypress', 'beforeinput', 'input'];
    types.forEach((t) => el.addEventListener(t, stopBubble, { capture: true }));
    
    return () => {
      types.forEach((t) => el.removeEventListener(t, stopBubble, { capture: true }));
    };
  }, [showCategories]);

  // Global keydown capture fallback for search input
  useEffect(() => {
    if (!showCategories) return;
    
    const onDocKeyDown = (e) => {
      const el = searchInputRef.current;
      if (!el || document.activeElement !== el || e.isComposing) return;

      const isPrintable = e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
      const isBackspace = e.key === 'Backspace';
      const isDelete = e.key === 'Delete';

      if (!(isPrintable || isBackspace || isDelete)) return;

      // Prevent default so we fully control the value
      e.preventDefault();
      e.stopPropagation();

      const start = el.selectionStart ?? categoriesSearchTerm.length;
      const end = el.selectionEnd ?? start;
      const before = categoriesSearchTerm.slice(0, start);
      const after = categoriesSearchTerm.slice(end);

      let nextValue = categoriesSearchTerm;
      let nextCaret = start;

      if (isPrintable) {
        nextValue = `${before}${e.key}${after}`;
        nextCaret = start + 1;
      } else if (isBackspace) {
        if (start !== end) {
          nextValue = `${before}${after}`;
          nextCaret = start;
        } else if (start > 0) {
          nextValue = `${categoriesSearchTerm.slice(0, start - 1)}${after}`;
          nextCaret = start - 1;
        }
      } else if (isDelete) {
        if (start !== end) {
          nextValue = `${before}${after}`;
          nextCaret = start;
        } else if (start < categoriesSearchTerm.length) {
          nextValue = `${before}${categoriesSearchTerm.slice(start + 1)}`;
          nextCaret = start;
        }
      }

      setCategoriesSearchTerm(nextValue);

      // Restore caret position after React updates value
      requestAnimationFrame(() => {
        try {
          el.selectionStart = el.selectionEnd = nextCaret;
        } catch (_) {}
      });
    };

    document.addEventListener('keydown', onDocKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', onDocKeyDown, { capture: true });
  }, [categoriesSearchTerm, showCategories]);

  // Focus management for search input
  useEffect(() => {
    if (!showCategories) return;
    
    const maintainFocus = () => {
      if (searchInputRef.current && document.activeElement !== searchInputRef.current) {
        searchInputRef.current.focus();
      }
    };

    const interval = setInterval(maintainFocus, 1000);
    return () => clearInterval(interval);
  }, [showCategories]);

  // Media URLs for different examinations
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
    }
  };

  // Auscultation points for front and back views
  const auscultationPoints = {
    front: [
      { id: 1, x: 50, y: 25, label: 'Aortic Area' },
      { id: 2, x: 53.5, y: 25, label: 'Tricuspid Area' },
      { id: 3, x: 50, y: 33, label: 'Pulmonary Area' },
      { id: 4, x: 53.5, y: 33, label: 'Mitral Area' },
    ],
    back: [
      { id: 5, x: 46, y: 25, label: 'Upper Left Lung' },
      { id: 6, x: 45, y: 45, label: 'Lower Left Lung' },
      { id: 7, x: 55, y: 25, label: 'Upper Right Lung' },
      { id: 8, x: 56, y: 45, label: 'Lower Right Lung' },
    ]
  };

  // Eye examination points for penlight
  const eyePoints = [
    { id: 1, x: 42, y: 7, label: 'Left Eye' },
    { id: 2, x: 47, y: 7, label: 'Right Eye' },
  ];

  // Threshold for showing/activating eye overlays
  const EYE_ACTIVATION_THRESHOLD = 4;

  // Airway examination point
  const airwayPoints = [
    { id: 1, x: 45, y: 13, label: 'Mouth/Airway' },
  ];

  // Threshold for showing/activating airway overlays
  const AIRWAY_ACTIVATION_THRESHOLD = 8;





  const playMedia = (mediaKey) => {
    const media = mediaUrls[mediaKey];
    if (media) {
      console.log('Playing media:', mediaKey, media);
      setCurrentMedia(media);
      setShowMediaPlayer(true);
    } else {
      console.error('Media not found for key:', mediaKey);
    }
  };

  const playCardiacSound = (pointId) => {
    const cardiacMedia = mediaUrls.cardiac;
    if (cardiacMedia && cardiacMedia.url) {
      console.log(`Playing cardiac auscultation sound for point ${pointId}`);
      
      // Stop any existing audio
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
      
      // Create new audio element
      const audio = new Audio(cardiacMedia.url);
      audio.volume = 0.7; // Set volume to 70%
      
      audio.addEventListener('loadstart', () => console.log('Cardiac audio loading started'));
      audio.addEventListener('canplay', () => console.log('Cardiac audio can play'));
      audio.addEventListener('play', () => console.log('Cardiac audio started playing'));
      audio.addEventListener('ended', () => {
        console.log('Cardiac audio finished playing');
        setCurrentlyPlayingPoint(null);
      });
      audio.addEventListener('error', (e) => console.error('Cardiac audio error:', e));
      
      // Play the audio
      audio.play().catch(error => {
        console.error('Failed to play cardiac audio:', error);
      });
      
      setAudioElement(audio);
      setCurrentlyPlayingPoint(pointId);
    } else {
      console.error('Cardiac media not found');
    }
  };

  const stopCardiacSound = () => {
    if (audioElement) {
      console.log('Stopping cardiac auscultation sound');
      audioElement.pause();
      audioElement.currentTime = 0;
      setCurrentlyPlayingPoint(null);
    }
  };



  const handleAnatomyPartSelect = (anatomyPart) => {
    setSelectedAnatomyPart(anatomyPart);
    
    // Handle tool-based examinations directly
    if (anatomyPart.type === 'tool') {
      if (anatomyPart.tool === 'stethoscope') {
        setShowStethoscopeExam(true);
      } else if (anatomyPart.tool === 'penlight') {
        setShowPenlightExam(true);
      } else if (anatomyPart.tool === 'visual') {
        setShowAirwayExam(true);
      } else if (anatomyPart.tool === 'tuning_fork') {
        setShowTuningForkExam(true);
      } else if (anatomyPart.tool === 'tongue_depressor') {
        setTongueDepressorExamType('default');
        setShowTongueDepressorExam(true);
      } else if (anatomyPart.tool === 'reflex_hammer') {
        setShowReflexHammerExam(true);
      } else if (anatomyPart.tool === 'otoscope') {
        setShowOtoscopeExam(true);
      } else if (anatomyPart.tool === 'ophthalmoscope') {
        setShowOphthalmoscopeExam(true);
      } else if (anatomyPart.tool === 'dermatoscope') {
        setShowDermatoscopeExam(true);
      }
    } else {
      // Handle direct anatomy part selections with media
      const mediaKey = getMediaKeyForAnatomyPart(anatomyPart.id);
      if (mediaKey) {
        playMedia(mediaKey);
      } else {
        console.log('Selected anatomy part:', anatomyPart);
      }
    }
  };

  const getMediaKeyForAnatomyPart = (anatomyId) => {
    const mediaMap = {
      'eyes': 'eyes',
      'forehead': 'head',
      'nose': 'nose',
      'left_forearm': 'leftforearm',
      'right_forearm': 'rightforearm',
      'left_knee': 'leftknee',
      'right_knee': 'rightknee'
    };
    return mediaMap[anatomyId];
  };



  const handleClose = () => {
    setSelectedBodyPart(null);
    setSelectedAnatomyPart(null);

    setSearchTerm('');
    setShowStethoscopeExam(false);
    setShowPenlightExam(false);
    setShowAirwayExam(false);
    setShowTuningForkExam(false);
    setShowTongueDepressorExam(false);
    setShowReflexHammerExam(false);
    setShowOtoscopeExam(false);
    setShowOphthalmoscopeExam(false);
    setShowDermatoscopeExam(false);
    setShowMediaPlayer(false);
    setCurrentMedia(null);
    setCurrentView('front');
    setActivatedPoints(new Set());
    setIsDragging(false);
    setCategoriesSearchTerm('');
    setPreviousCategoryPath([]); // Clear previous category path
    setCameFromCategories(false); // Clear navigation flag
    setTongueDepressorExamType('default'); // Reset tongue depressor exam type
    setReflexHammerExamType('upper'); // Reset reflex hammer exam type
    
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
      // Reset dragging state when media player closes to prevent glitchy behavior
      setIsDragging(false);
      // Return to the correct view based on where we came from
      if (cameFromCategories) {
        setShowCategories(true);
        setCategoryPath([...previousCategoryPath]);
      }
      // If not from categories, the body part selection modal will still be active
    } else if (showStethoscopeExam || showPenlightExam || showAirwayExam || showTuningForkExam || showTongueDepressorExam || showReflexHammerExam || showOtoscopeExam || showOphthalmoscopeExam || showDermatoscopeExam) {
      setShowStethoscopeExam(false);
      setShowPenlightExam(false);
      setShowAirwayExam(false);
      setShowTuningForkExam(false);
      setShowTongueDepressorExam(false);
      setShowReflexHammerExam(false);
      setShowOtoscopeExam(false);
      setShowOphthalmoscopeExam(false);
      setShowDermatoscopeExam(false);
      setSelectedAnatomyPart(null);
      setTongueDepressorExamType('default');
      // Return to categories if we came from there, restoring the previous path
      if (cameFromCategories) {
        setShowCategories(true);
        setCategoryPath([...previousCategoryPath]);
      }
    } else if (showCategories) {
      // If categories are showing, close the entire interface and return to main page
      handleClose();
    } else {
      setSelectedBodyPart(null);
      setSearchTerm('');
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

  const openCategories = () => {
    setShowCategories(true);
    setCategoryPath([]);
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

  const closeCategories = () => {
    setShowCategories(false);
    setCategoryPath([]);
  };

  // Helper function to handle tool drag activation with timer
  const handleToolDragStart = (toolName) => {
    console.log('handleToolDragStart called with toolName:', toolName);
    setIsDragging(true);
    
    // Clear any existing timer
    if (dragTimer) {
      clearTimeout(dragTimer);
    }
    
    // Set timer for 0.5 seconds
    const timer = setTimeout(() => {
      console.log('Timer triggered for toolName:', toolName);
      console.log('Playing media for:', toolName);
      setActivatedPoints(prev => new Set([...prev, toolName]));
      playMedia(toolName);
    }, 500);
    
    setDragTimer(timer);
    
    // Add document-level mouseup listener to handle cases where mouse goes outside element
    const handleDocumentMouseUp = () => {
      console.log('Document mouseup triggered');
      handleToolDragEnd();
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };
    document.addEventListener('mouseup', handleDocumentMouseUp);
  };

  const handleToolDragEnd = () => {
    console.log('handleToolDragEnd called');
    setIsDragging(false);
    
    // Clear the timer if it exists
    if (dragTimer) {
      console.log('Clearing timer in handleToolDragEnd');
      clearTimeout(dragTimer);
      setDragTimer(null);
    }
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
    if (Array.isArray(next)) {
      // bottom list → just open this list for selection
      setCategoryPath(prev => [...prev, key]);
    } else if (typeof next === 'object') {
      // go deeper into object
      setCategoryPath(prev => [...prev, key]);
    }
  };

  const handleCategoryItemSelect = (label) => {
    // Store current category path before opening examination
    setPreviousCategoryPath([...categoryPath]);
    setCameFromCategories(true);
    
    // Map certain known labels to existing actions/media
    const normalized = label.toLowerCase();
    if (normalized.includes('pupillary') || normalized.includes('perrla') || normalized.includes('rapd') || normalized.includes('flashlight test')) {
      setShowPenlightExam(true);
      closeCategories();
      return;
    }
    if (normalized.includes('heart sounds') || normalized.includes('aortic') || normalized.includes('pulmonic') || normalized.includes('tricuspid') || normalized.includes('mitral') || normalized.includes('aptm') || normalized.includes('stenosis murmur')) {
      setShowStethoscopeExam(true);
      closeCategories();
      return;
    }
    if (normalized.includes('breath sounds') || normalized.includes('adventitious')) {
      setShowStethoscopeExam(true);
      setCurrentView('back');
      closeCategories();
      return;
    }
    if (normalized.includes('oral cavity examination')) {
      playMedia('oral_cavity');
      closeCategories();
      return;
    }
    if (normalized.includes('upper limbs')) {
      setReflexHammerExamType('upper');
      setShowReflexHammerExam(true);
      closeCategories();
      return;
    }
    if (normalized.includes('lower limbs')) {
      setReflexHammerExamType('lower');
      setShowReflexHammerExam(true);
      closeCategories();
      return;
    }
    if (normalized.includes('oropharynx')) {
      setTongueDepressorExamType('oropharynx');
      setShowTongueDepressorExam(true);
      closeCategories();
      return;
    }
    if (normalized.includes('gag') || normalized.includes('tongue') || normalized.includes('uvula') || normalized.includes('mouth') || normalized.includes('mallampati') || normalized.includes('thyromental') || normalized.includes('interincisor')) {
      setShowAirwayExam(true);
      closeCategories();
      return;
    }
    if (normalized.includes('visual acuity') || normalized.includes('visual fields') || normalized.includes('eom') || normalized.includes('conjunctiva') || normalized.includes('sclera')) {
      // Reuse existing eye image
      playMedia('eyes');
      closeCategories();
      return;
    }
    if (normalized.includes('fundoscopic') || normalized.includes('retina') || normalized.includes('optic disc') || normalized.includes('vessels')) {
      setShowOphthalmoscopeExam(true);
      closeCategories();
      return;
    }
    if (normalized.includes('otoscopy') || normalized.includes('canal') || normalized.includes('tympanic membrane') || normalized.includes('ear canal') || normalized.includes('external ear') || normalized.includes('ear inspection') || normalized.includes('normal tympanic')) {
      setShowOtoscopeExam(true);
      closeCategories();
      return;
    }
    if (normalized.includes('hearing') || normalized.includes('weber') || normalized.includes('rinne')) {
      setShowTuningForkExam(true);
      closeCategories();
      return;
    }
    if (normalized.includes('oral mucosa') || normalized.includes('teeth') || normalized.includes('gums') || normalized.includes('tonsils and uvula') || normalized.includes('tonsils') || normalized.includes('uvula') || normalized.includes('gag reflex') || normalized.includes('mucosal hydration')) {
      setTongueDepressorExamType('default');
      setShowTongueDepressorExam(true);
      closeCategories();
      return;
    }
    if (normalized.includes('patellar') || normalized.includes('achilles') || normalized.includes('reflex') || normalized.includes('brachioradialis') || normalized.includes('grading')) {
      setShowReflexHammerExam(true);
      closeCategories();
      return;
    }
    if (normalized.includes('lesions') || normalized.includes('pigmented') || normalized.includes('abcde') || (normalized.includes('skin') && !normalized.includes('skin changes')) || normalized.includes('lesion assessment') || normalized.includes('abcde for pigmented lesions') || normalized.includes('dermatoscopy')) {
      setShowDermatoscopeExam(true);
      closeCategories();
      return;
    }
    if (normalized.includes('nose')) {
      playMedia('nose');
      closeCategories();
      return;
    }
    // Fallback: no media mapped yet
    console.log('No media/action mapped for category item:', label);
  };

  const handleStethoscopeDrag = (e) => {
    if (!isDragging) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setStethoscopePosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const handlePenlightDrag = (e) => {
    if (!isDragging) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setPenlightPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
    
    // Play pupillary video whenever penlight is dragged
    if (showPenlightExam) {
      setActivatedPoints(prev => new Set([...prev, 'pupillary']));
      playMedia('pupillary');
    }
  };

  const handleAirwayHover = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Check if hover is near the airway point
    const point = airwayPoints[0];
    const distance = Math.sqrt(
      Math.pow(x - point.x, 2) + 
      Math.pow(y - point.y, 2)
    );
    
    setHoveredAirwayArea(distance < AIRWAY_ACTIVATION_THRESHOLD);
  };

  const checkPointActivation = () => {
    const points = showPenlightExam ? eyePoints : auscultationPoints[currentView];
    const threshold = showPenlightExam ? EYE_ACTIVATION_THRESHOLD : 4; // Reduced distance threshold for more precise activation
    const currentPosition = showPenlightExam ? penlightPosition : stethoscopePosition;
    
    let foundActivePoint = false;
    let closestPoint = null;
    let closestDistance = Infinity;
    
    // Find the closest point within threshold
    points.forEach(point => {
      const distance = Math.sqrt(
        Math.pow(currentPosition.x - point.x, 2) + 
        Math.pow(currentPosition.y - point.y, 2)
      );
      
      console.log(`Point ${point.id} distance: ${distance}, threshold: ${threshold}`);
      
      if (distance < threshold && distance < closestDistance) {
        closestDistance = distance;
        closestPoint = point;
      }
    });
    
    // Only activate the closest point
    if (closestPoint) {
      foundActivePoint = true;
      
      if (!activatedPoints.has(closestPoint.id)) {
        console.log(`Activating point ${closestPoint.id}: ${closestPoint.label}`);
        setActivatedPoints(prev => new Set([...prev, closestPoint.id]));
        if (showPenlightExam) {
          // Play pupillary response video
          console.log('Playing pupillary video...');
          playMedia('pupillary');
        } else {
          // Play cardiac auscultation sound
          console.log(`Playing cardiac sound for point ${closestPoint.id}: ${closestPoint.label}`);
          playCardiacSound(closestPoint.id);
        }
      } else if (currentlyPlayingPoint !== closestPoint.id) {
        // Point is already activated but audio is not playing for this point
        console.log(`Resuming cardiac sound for point ${closestPoint.id}: ${closestPoint.label}`);
        playCardiacSound(closestPoint.id);
      }
    }
    
    // If no active point found and audio is playing, stop it
    if (!foundActivePoint && currentlyPlayingPoint && audioElement) {
      console.log(`Stopping cardiac sound - stethoscope moved away from point ${currentlyPlayingPoint}`);
      stopCardiacSound();
    }
  };

  const filteredAnatomyParts = selectedBodyPart 
    ? anatomyData[selectedBodyPart.id]?.filter(part => 
        part.label.toLowerCase().includes(searchTerm.toLowerCase())
      ) || []
    : [];

  return (
    <div className="physical-exam-container">
      {/* Media Player Overlay */}
      {showMediaPlayer && currentMedia && (
        <div className="media-player-overlay" style={{border: '2px solid red'}}>
          {console.log('Rendering media player overlay')}
          <div className="media-player-container">
            <div className="stethoscope-header">
              <button className="back-button" onClick={handleBack}>
                <ArrowLeft size={20} />
              </button>
              <div className="stethoscope-title-section">
                <h3 className="stethoscope-title">Examination Findings</h3>
                <p className="stethoscope-subtitle">
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
                  onLoadStart={() => console.log('Video loading started')}
                  onCanPlay={() => console.log('Video can play')}
                  onError={(e) => console.error('Video error:', e)}
                  onLoadedData={() => console.log('Video loaded')}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img 
                  src={currentMedia.url} 
                  alt="Examination findings"
                  className="examination-media"
                  onLoad={() => console.log('Image loaded')}
                  onError={(e) => console.error('Image error:', e)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* No Physical Examination Page - Categories open automatically */}

      {/* Airway Examination Interface */}
      {showAirwayExam && (
        <div className="stethoscope-exam-overlay">
          <div className="stethoscope-exam-container">
            <div className="stethoscope-header">
              <button className="back-button" onClick={handleBack}>
                <ArrowLeft size={20} />
              </button>
              <div className="stethoscope-title-section">
                <h3 className="stethoscope-title">Airway Examination</h3>
                <p className="stethoscope-subtitle">Click on the mouth/airway area to examine</p>
              </div>
              <button className="close-button" onClick={handleClose}>
                <X size={20} />
              </button>
            </div>

            <div 
              className="body-examination-area"
              onMouseMove={handleAirwayHover}
              onMouseLeave={() => setHoveredAirwayArea(false)}
            >
              {/* Body Image - Front view only for airway */}
              <img 
                src="https://storage.googleapis.com/vp-model-storage/frontfpimage.png"
                alt="Front view for airway examination"
                className="examination-body-image"
                draggable={false}
              />

              {/* Airway Button Overlay */}
              {airwayPoints.map(point => (
                <div
                  key={point.id}
                  className="airway-overlay-button"
                  style={{
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                    opacity: hoveredAirwayArea ? 1 : 0,
                    pointerEvents: hoveredAirwayArea ? 'auto' : 'none'
                  }}
                >
                  <button
                    className="airway-button"
                    onClick={() => {
                      setActivatedPoints(prev => new Set([...prev, point.id]));
                      playMedia('airway');
                    }}
                    aria-label={`View ${point.label} examination`}
                  >
                    View
                  </button>
                </div>
              ))}
          </div>
          
            <div className="examination-instructions">
              <p>Click on the mouth/airway point to display airway examination findings</p>
              <div className="points-status">
                Examined: {activatedPoints.size} / {airwayPoints.length} airway point
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tuning Fork Examination Interface */}
      {showTuningForkExam && (
        <div className="stethoscope-exam-overlay">
          <div className="stethoscope-exam-container">
            <div className="stethoscope-header">
              <button className="back-button" onClick={handleBack}>
                <ArrowLeft size={20} />
              </button>
              <div className="stethoscope-title-section">
                <h3 className="stethoscope-title">Hearing Tests (Tuning Fork)</h3>
                <p className="stethoscope-subtitle">Drag the tuning fork to test hearing</p>
              </div>
              <button className="close-button" onClick={handleClose}>
                <X size={20} />
              </button>
            </div>

            <div 
              className="body-examination-area"
              onMouseMove={(e) => {
                if (!isDragging) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                setTuningForkPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
              }}
              onMouseUp={handleToolDragEnd}
            >
              {/* Body Image - Front view only for tuning fork */}
              <img 
                src="https://storage.googleapis.com/vp-model-storage/frontfpimage.png"
                alt="Front view for hearing examination"
                className="examination-body-image"
                draggable={false}
              />



              {/* Draggable Tuning Fork */}
              <div
                className="stethoscope-icon penlight-icon"
                style={{
                  left: `${tuningForkPosition.x}%`,
                  top: `${tuningForkPosition.y}%`,
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={() => handleToolDragStart('tuning_fork')}
                draggable={false}
              >
                <img 
                  src="https://storage.googleapis.com/vp-model-storage/tuning_fork.png"
                  alt="Tuning Fork"
                  className="stethoscope-image"
                  draggable={false}
                />
              </div>
            </div>

            <div className="examination-instructions">
              <p>Drag the tuning fork around to perform Weber and Rinne hearing tests</p>
              <div className="points-status">
                Tool examination: {activatedPoints.has('tuning_fork') ? 'Completed' : 'Not started'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Penlight Examination Interface */}
      {showPenlightExam && (
        <div className="stethoscope-exam-overlay">
          <div className="stethoscope-exam-container">
            <div className="stethoscope-header">
              <button className="back-button" onClick={handleBack}>
                <ArrowLeft size={20} />
              </button>
              <div className="stethoscope-title-section">
                <h3 className="stethoscope-title">Pupillary Response Examination</h3>
                <p className="stethoscope-subtitle">Move the penlight to view findings</p>
              </div>
              <button className="close-button" onClick={handleClose}>
                <X size={20} />
              </button>
            </div>

            <div 
              className="body-examination-area"
              onMouseMove={handlePenlightDrag}
              onMouseUp={() => {
                setIsDragging(false);
                checkPointActivation();
              }}
            >
              {/* Body Image - Front view only for penlight */}
              <img 
                src="https://storage.googleapis.com/vp-model-storage/frontfpimage.png"
                alt="Front view for pupillary examination"
                className="examination-body-image"
                draggable={false}
              />



              {/* Draggable Penlight */}
              <div
                className="stethoscope-icon penlight-icon"
                  style={{
                  left: `${penlightPosition.x}%`,
                  top: `${penlightPosition.y}%`,
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={() => {
                  setIsDragging(true);
                  // Play pupillary video immediately when penlight is touched
                  if (showPenlightExam) {
                    setActivatedPoints(prev => new Set([...prev, 'pupillary']));
                    playMedia('pupillary');
                  }
                }}
                draggable={false}
              >
                <img 
                  src="https://storage.googleapis.com/vp-model-storage/penlight.png"
                  alt="Penlight"
                  className="stethoscope-image"
                  draggable={false}
                />
              </div>
            </div>


          </div>
        </div>
      )}

      {/* Tongue Depressor Examination Interface */}
      {showTongueDepressorExam && (
        <div className="stethoscope-exam-overlay">
          <div className="stethoscope-exam-container">
            <div className="stethoscope-header">
              <button className="back-button" onClick={handleBack}>
                <ArrowLeft size={20} />
              </button>
              <div className="stethoscope-title-section">
                <h3 className="stethoscope-title">Oral Cavity Examination</h3>
                <p className="stethoscope-subtitle">Use tongue depressor to examine oral cavity</p>
              </div>
              <button className="close-button" onClick={handleClose}>
                <X size={20} />
              </button>
            </div>

            <div 
              className="body-examination-area"
              onMouseMove={(e) => {
                if (!isDragging) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                setTongueDepressorPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
              }}
              onMouseUp={handleToolDragEnd}
            >
              {/* Body Image - Front view only for tongue depressor */}
              <img 
                src="https://storage.googleapis.com/vp-model-storage/frontfpimage.png"
                alt="Front view for oral examination"
                className="examination-body-image"
                draggable={false}
              />



              {/* Draggable Tongue Depressor */}
              <div
                className="stethoscope-icon penlight-icon"
                style={{
                  left: `${tongueDepressorPosition.x}%`,
                  top: `${tongueDepressorPosition.y}%`,
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={() => {
                  const mediaKey = tongueDepressorExamType === 'oropharynx' ? 'oropharynx' : 'tongue_depressor';
                  handleToolDragStart(mediaKey);
                }}
                draggable={false}
              >
                <img 
                  src="https://storage.googleapis.com/vp-model-storage/tongue_depressor.png"
                  alt="Tongue Depressor"
                  className="stethoscope-image"
                  draggable={false}
                />
              </div>
            </div>

            <div className="examination-instructions">
              <p>Use the tongue depressor to examine the {tongueDepressorExamType === 'oropharynx' ? 'oropharynx' : 'oral cavity and throat'}</p>
              <div className="points-status">
                Tool examination: {(activatedPoints.has('tongue_depressor') || activatedPoints.has('oropharynx')) ? 'Completed' : 'Not started'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reflex Hammer Examination Interface */}
      {showReflexHammerExam && (
        <div className="stethoscope-exam-overlay">
          <div className="stethoscope-exam-container">
            <div className="stethoscope-header">
              <button className="back-button" onClick={handleBack}>
                <ArrowLeft size={20} />
              </button>
              <div className="stethoscope-title-section">
                <h3 className="stethoscope-title">Reflex Testing</h3>
                <p className="stethoscope-subtitle">Drag the reflex hammer to test reflexes</p>
              </div>
              <button className="close-button" onClick={handleClose}>
                <X size={20} />
              </button>
            </div>

            <div 
              className="body-examination-area"
              onMouseMove={(e) => {
                if (!isDragging) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                setReflexHammerPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
              }}
              onMouseUp={handleToolDragEnd}
            >
              {/* Body Image - Front view for reflex hammer */}
              <img 
                src="https://storage.googleapis.com/vp-model-storage/frontfpimage.png"
                alt="Front view for reflex testing"
                className="examination-body-image"
                draggable={false}
              />



              {/* Draggable Reflex Hammer */}
              <div
                className="stethoscope-icon penlight-icon"
                style={{
                  left: `${reflexHammerPosition.x}%`,
                  top: `${reflexHammerPosition.y}%`,
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={() => {
                  const mediaKey = reflexHammerExamType === 'lower' ? 'lower_limbs_reflexes' : 'upper_limbs_reflexes';
                  handleToolDragStart(mediaKey);
                }}
                onMouseUp={handleToolDragEnd}
                draggable={false}
              >
                <img 
                  src="https://storage.googleapis.com/vp-model-storage/reflex_hammer.png"
                  alt="Reflex Hammer"
                  className="stethoscope-image"
                  draggable={false}
                />
              </div>
            </div>

            <div className="examination-instructions">
              <p>Use the reflex hammer to test {reflexHammerExamType === 'lower' ? 'lower limbs' : 'upper limbs'} reflexes</p>
              <div className="points-status">
                {reflexHammerExamType === 'lower' ? 'Lower limbs' : 'Upper limbs'} reflex examination: {activatedPoints.has(reflexHammerExamType === 'lower' ? 'lower_limbs_reflexes' : 'upper_limbs_reflexes') ? 'Last tested' : 'Ready to test'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Otoscope Examination Interface */}
      {showOtoscopeExam && (
        <div className="stethoscope-exam-overlay">
          <div className="stethoscope-exam-container">
            <div className="stethoscope-header">
              <button className="back-button" onClick={handleBack}>
                <ArrowLeft size={20} />
              </button>
              <div className="stethoscope-title-section">
                <h3 className="stethoscope-title">Otoscopic Examination</h3>
                <p className="stethoscope-subtitle">Use otoscope to examine ear canals</p>
              </div>
              <button className="close-button" onClick={handleClose}>
                <X size={20} />
              </button>
            </div>

            <div 
              className="body-examination-area"
              onMouseMove={(e) => {
                if (!isDragging) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                setOtoscopePosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
              }}
              onMouseUp={handleToolDragEnd}
            >
              {/* Body Image - Front view for otoscope */}
              <img 
                src="https://storage.googleapis.com/vp-model-storage/frontfpimage.png"
                alt="Front view for ear examination"
                className="examination-body-image"
                draggable={false}
              />



              {/* Draggable Otoscope */}
              <div
                className="stethoscope-icon penlight-icon"
                style={{
                  left: `${otoscopePosition.x}%`,
                  top: `${otoscopePosition.y}%`,
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={() => handleToolDragStart('otoscope')}
                draggable={false}
              >
                <img 
                  src="https://storage.googleapis.com/vp-model-storage/otoscope.png"
                  alt="Otoscope"
                  className="stethoscope-image"
                  draggable={false}
                />
              </div>
            </div>

            <div className="examination-instructions">
              <p>Use the otoscope to examine ear canals and tympanic membranes</p>
              <div className="points-status">
                Tool examination: {activatedPoints.has('otoscope') ? 'Completed' : 'Not started'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ophthalmoscope Examination Interface */}
      {showOphthalmoscopeExam && (
        <div className="stethoscope-exam-overlay">
          <div className="stethoscope-exam-container">
            <div className="stethoscope-header">
              <button className="back-button" onClick={handleBack}>
                <ArrowLeft size={20} />
              </button>
              <div className="stethoscope-title-section">
                <h3 className="stethoscope-title">Fundoscopic Examination</h3>
                <p className="stethoscope-subtitle">Use ophthalmoscope for fundus examination</p>
              </div>
              <button className="close-button" onClick={handleClose}>
                <X size={20} />
              </button>
            </div>

            <div 
              className="body-examination-area"
              onMouseMove={(e) => {
                if (!isDragging) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                setOphthalmoscopePosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
              }}
              onMouseUp={handleToolDragEnd}
            >
              {/* Body Image - Front view for ophthalmoscope */}
              <img 
                src="https://storage.googleapis.com/vp-model-storage/frontfpimage.png"
                alt="Front view for fundoscopic examination"
                className="examination-body-image"
                draggable={false}
              />



              {/* Draggable Ophthalmoscope */}
              <div
                className="stethoscope-icon penlight-icon"
                style={{
                  left: `${ophthalmoscopePosition.x}%`,
                  top: `${ophthalmoscopePosition.y}%`,
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={() => handleToolDragStart('ophthalmoscope')}
                draggable={false}
              >
                <img 
                  src="https://storage.googleapis.com/vp-model-storage/ophthalmoscope.png"
                  alt="Ophthalmoscope"
                  className="stethoscope-image"
                  draggable={false}
                />
              </div>
            </div>

            <div className="examination-instructions">
              <p>Use the ophthalmoscope to examine the fundus (retina and optic disc)</p>
              <div className="points-status">
                Tool examination: {activatedPoints.has('ophthalmoscope') ? 'Completed' : 'Not started'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dermatoscope Examination Interface */}
      {showDermatoscopeExam && (
        <div className="stethoscope-exam-overlay">
          <div className="stethoscope-exam-container">
            <div className="stethoscope-header">
              <button className="back-button" onClick={handleBack}>
                <ArrowLeft size={20} />
              </button>
              <div className="stethoscope-title-section">
                <h3 className="stethoscope-title">Skin Lesion Examination</h3>
                <p className="stethoscope-subtitle">Use dermatoscope to examine skin lesions</p>
              </div>
              <button className="close-button" onClick={handleClose}>
                <X size={20} />
              </button>
            </div>

            <div 
              className="body-examination-area"
              onMouseMove={(e) => {
                if (!isDragging) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                setDermatoscopePosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
              }}
              onMouseUp={handleToolDragEnd}
            >
              {/* Body Image - Front view for dermatoscope */}
              <img 
                src="https://storage.googleapis.com/vp-model-storage/frontfpimage.png"
                alt="Front view for skin examination"
                className="examination-body-image"
                draggable={false}
              />



              {/* Draggable Dermatoscope */}
              <div
                className="stethoscope-icon penlight-icon"
                style={{
                  left: `${dermatoscopePosition.x}%`,
                  top: `${dermatoscopePosition.y}%`,
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={() => handleToolDragStart('dermatoscope')}
                draggable={false}
              >
                <img 
                  src="https://storage.googleapis.com/vp-model-storage/dermatoscope.png"
                  alt="Dermatoscope"
                  className="stethoscope-image"
                  draggable={false}
                />
              </div>
            </div>

            <div className="examination-instructions">
              <p>Use the dermatoscope to examine skin lesions using ABCDE criteria</p>
              <div className="points-status">
                Tool examination: {activatedPoints.has('dermatoscope') ? 'Completed' : 'Not started'}
              </div>
            </div>
          </div>
        </div>
      )}




      {/* Categories Modal */}
      {showCategories && (
        <div className="icd-modal-overlay">
          <div className="icd-modal">
            <div className="icd-modal-header">
              <button className="back-button" onClick={() => {
                if (categoryPath.length > 0) {
                  setCategoryPath(prev => prev.slice(0, -1));
                } else {
                  handleClose();
                }
              }}>
                <ArrowLeft size={20} />
              </button>
              <div className="modal-title-section">
                <h3 className="modal-title">Categories</h3>
                <p className="modal-subtitle">Browse examination categories</p>
              </div>
              <button className="close-button" onClick={handleClose}>
                <X size={20} />
              </button>
            </div>

            {/* Breadcrumb Navigation */}
            {categoryPath.length > 0 && (
              <div className="breadcrumb-section">
                <div className="breadcrumb-container">
                  <button 
                    className="breadcrumb-item breadcrumb-root"
                    onClick={() => setCategoryPath([])}
                  >
                    Categories
                  </button>
                  {categoryPath.map((pathSegment, index) => (
                    <React.Fragment key={index}>
                      <span className="breadcrumb-separator">›</span>
                      <button
                        className={`breadcrumb-item ${index === categoryPath.length - 1 ? 'breadcrumb-current' : ''}`}
                        onClick={() => setCategoryPath(prev => prev.slice(0, index + 1))}
                      >
                        {pathSegment}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            <div className="search-section">
              <div className="search-input-container">
                <Search size={18} className="search-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search examination categories..."
                  value={categoriesSearchTerm}
                  onChange={(e) => setCategoriesSearchTerm(e.target.value)}
                  onInput={(e) => setCategoriesSearchTerm(e.target.value)}
                  onFocus={() => {
                    console.log('Search input focused');
                  }}
                  onBlur={() => {
                    console.log('Search input blurred');
                  }}
                  className="search-input"
                  style={{
                    pointerEvents: 'auto',
                    zIndex: 10000,
                    position: 'relative',
                    cursor: 'text',
                    backgroundColor: 'white',
                    color: 'black'
                  }}
                />
              </div>
            </div>

            <div className="icd-list">
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
                      className="icd-item search-result" 
                      onClick={() => handleSearchResultSelect(result)}
                    >
                      <div className="icd-content">
                        <div className="icd-description">
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
                    <button key={item} className="icd-item" onClick={() => handleCategoryItemSelect(item)}>
                      <div className="icd-content">
                        <div className="icd-description">{item}</div>
                      </div>
                    </button>
                  ));
                }
                // Render next-level keys
                return Object.keys(node).map((key) => (
                  <button key={key} className="icd-item" onClick={() => handleCategoryClick(key)}>
                    <div className="icd-content">
                      <div className="icd-description">{key}</div>
                    </div>
                  </button>
                ));
              })()}
            </div>
          </div>
        </div>
      )}
      {showStethoscopeExam && (
        <div className="stethoscope-exam-overlay">
          <div className="stethoscope-exam-container">
            <div className="stethoscope-header">
              <button className="back-button" onClick={handleBack}>
                <ArrowLeft size={20} />
              </button>
              <div className="stethoscope-title-section">
                <h3 className="stethoscope-title">Stethoscope Examination</h3>
                <p className="stethoscope-subtitle">Drag the stethoscope to auscultation points</p>
              </div>
              <button className="close-button" onClick={handleClose}>
                <X size={20} />
              </button>
            </div>

            <div className="view-toggle">
              <button 
                className={`view-button ${currentView === 'front' ? 'active' : ''}`}
                onClick={() => setCurrentView('front')}
              >
                Front View
              </button>
              <button 
                className={`view-button ${currentView === 'back' ? 'active' : ''}`}
                onClick={() => setCurrentView('back')}
              >
                Back View
              </button>
            </div>

            <div 
              className="body-examination-area"
              onMouseMove={(e) => {
                handleStethoscopeDrag(e);
                if (isDragging) {
                  checkPointActivation();
                }
              }}
              onMouseUp={() => {
                setIsDragging(false);
                checkPointActivation();
              }}
            >
              {/* Body Image */}
              <img 
                src={currentView === 'front' 
                  ? "https://storage.googleapis.com/vp-model-storage/frontfpimage.png"
                  : "https://storage.googleapis.com/vp-model-storage/backfpimage.png"
                }
                alt={`${currentView} view of torso`}
                className="examination-body-image"
                draggable={false}
              />

              {/* Auscultation Points */}
              {auscultationPoints[currentView].map(point => (
                <div
                  key={point.id}
                  className={`auscultation-point ${activatedPoints.has(point.id) ? 'activated' : ''}`}
                  style={{
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                  }}
                >
                  <div className="point-number">{point.id}</div>
                  <div className="point-tooltip">{point.label}</div>
                </div>
              ))}

              {/* Draggable Stethoscope */}
              <div
                className="stethoscope-icon"
                style={{
                  left: `${stethoscopePosition.x}%`,
                  top: `${stethoscopePosition.y}%`,
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={() => setIsDragging(true)}
                draggable={false}
              >
                <img 
                  src="https://storage.googleapis.com/vp-model-storage/StethoscopeIcon.png"
                  alt="Stethoscope"
                  className="stethoscope-image"
                  draggable={false}
                />
              </div>
            </div>

            <div className="examination-instructions">
              <p>Drag the stethoscope to the numbered points to hear heart and lung sounds</p>
              <div className="points-status">
                Activated: {activatedPoints.size} / {auscultationPoints[currentView].length}
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedBodyPart && (
        <div className="icd-modal-overlay">
          <div className="icd-modal">
            <div className="icd-modal-header">
              <button className="back-button" onClick={handleBack}>
                <ArrowLeft size={20} />
              </button>
              <div className="modal-title-section">
                <h3 className="modal-title">{selectedBodyPart.label} Examination</h3>
                <p className="modal-subtitle">Select specific area to examine</p>
              </div>
              <button className="close-button" onClick={handleClose}>
                <X size={20} />
              </button>
            </div>

            <div className="search-section">
              <div className="search-input-container">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search anatomy parts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            <div className="icd-list">
              {filteredAnatomyParts.map((part) => (
                <button
                  key={part.id}
                  className={`icd-item ${selectedAnatomyPart?.id === part.id ? 'selected' : ''}`}
                  onClick={() => handleAnatomyPartSelect(part)}
                >
                  <div className="icd-content">
                    <div className="icd-description">
                      {part.label}
                      {part.type === 'tool' && (
                        <span className="examination-badge">Tool Examination</span>
                      )}
                    </div>
                  </div>
                  {selectedAnatomyPart?.id === part.id && (
                    <Check size={18} className="check-icon" />
                  )}
                </button>
              ))}
            </div>

            {selectedAnatomyPart && selectedAnatomyPart.type !== 'tool' && (
              <div className="modal-footer">
                <button className="confirm-button" onClick={handleClose}>
                  Confirm Selection
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .physical-exam-container {
          width: 100%;
          height: 100vh;
          background: linear-gradient(135deg, ${uaColors.slate[50]} 0%, ${uaColors.white} 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: system-ui, -apple-system, sans-serif;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 9999;
        }



        /* Selection Modal Overlays - Lower z-index than tool examinations */
        .icd-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.2s ease;
        }

        .icd-modal {
          background: ${uaColors.white};
          border-radius: 16px;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          animation: slideUp 0.3s ease;
          z-index: 10000;
          position: relative;
          pointer-events: auto;
        }

        .icd-modal-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          border-bottom: 1px solid ${uaColors.slate[200]};
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

        .modal-title-section {
          flex: 1;
          text-align: left;
        }

        .modal-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: ${uaColors.slate[900]};
          margin: 0 0 0.25rem 0;
        }

        .modal-subtitle {
          font-size: 0.875rem;
          color: ${uaColors.slate[600]};
          margin: 0;
        }

        .breadcrumb-section {
          padding: 0.75rem 1.5rem 0.5rem;
          border-bottom: 1px solid ${uaColors.slate[100]};
          background: ${uaColors.slate[25] || '#FAFAFA'};
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

        .search-section {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid ${uaColors.slate[200]};
          position: relative;
          z-index: 9999;
          pointer-events: auto;
        }

        .search-input-container {
          position: relative;
          display: flex;
          align-items: center;
          pointer-events: auto !important;
          z-index: 10000;
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
          pointer-events: auto !important;
          position: relative;
          z-index: 10000 !important;
          cursor: text !important;
          background-color: white !important;
          color: black !important;
          user-select: text !important;
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
        }

        .search-input:focus {
          outline: none;
          border-color: ${uaColors.arizonaBlue};
          box-shadow: 0 0 0 3px rgba(28, 82, 136, 0.1);
        }

        .icd-list {
          flex: 1;
          overflow-y: auto;
          padding: 0.5rem;
        }

        .icd-item {
          width: 100%;
          background: none;
          border: none;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 0.5rem;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 1rem;
          border: 1px solid transparent;
        }

        .icd-item:hover {
          background: ${uaColors.slate[50]};
          border-color: ${uaColors.slate[200]};
        }

        .icd-item.selected {
          background: rgba(171, 5, 32, 0.05);
          border-color: ${uaColors.arizonaRed};
        }

        .icd-content {
          flex: 1;
        }

        .icd-description {
          font-size: 0.875rem;
          color: ${uaColors.slate[700]};
          line-height: 1.4;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .examination-badge {
          background: ${uaColors.arizonaRed};
          color: ${uaColors.white};
          font-size: 0.75rem;
          padding: 0.125rem 0.5rem;
          border-radius: 12px;
          font-weight: 500;
        }

        .check-icon {
          color: ${uaColors.arizonaRed};
        }

        .modal-footer {
          padding: 1.5rem;
          border-top: 1px solid ${uaColors.slate[200]};
        }

        .confirm-button {
          width: 100%;
          background: ${uaColors.arizonaRed};
          color: ${uaColors.white};
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .confirm-button:hover {
          background: ${uaColors.chili};
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(171, 5, 32, 0.3);
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
          z-index: 10002;
          position: relative;
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

        /* Stethoscope Examination Styles */
        /* Tool Examination Overlays - Higher z-index than selection modals */
        .stethoscope-exam-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10001;
          animation: fadeIn 0.2s ease;
        }

        .stethoscope-exam-container {
          background: ${uaColors.white};
          border-radius: 16px;
          width: 95%;
          max-width: 900px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          animation: slideUp 0.3s ease;
          z-index: 10002;
          position: relative;
        }

        .stethoscope-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          border-bottom: 1px solid ${uaColors.slate[200]};
        }

        .stethoscope-title-section {
          flex: 1;
          text-align: left;
        }

        .stethoscope-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: ${uaColors.slate[900]};
          margin: 0 0 0.25rem 0;
        }

        .stethoscope-subtitle {
          font-size: 0.875rem;
          color: ${uaColors.slate[600]};
          margin: 0;
        }

        .view-toggle {
          display: flex;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid ${uaColors.slate[200]};
        }

        .view-button {
          padding: 0.5rem 1rem;
          border: 1px solid ${uaColors.slate[300]};
          background: ${uaColors.white};
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
          color: ${uaColors.slate[700]};
        }

        .view-button.active {
          background: ${uaColors.arizonaRed};
          color: ${uaColors.white};
          border-color: ${uaColors.arizonaRed};
        }

        .categories-button {
          padding: 0.5rem 0.75rem;
          border: 1px solid ${uaColors.slate[300]};
          background: ${uaColors.white};
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
          color: ${uaColors.slate[700]};
        }

        .categories-button:hover {
          background: ${uaColors.slate[50]};
          border-color: ${uaColors.slate[400]};
        }

        .view-button:hover:not(.active) {
          background: ${uaColors.slate[50]};
          border-color: ${uaColors.slate[400]};
        }

        .body-examination-area {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          min-height: 400px;
          overflow: hidden;
        }

        .examination-body-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: 8px;
          user-select: none;
        }

        .auscultation-point {
          position: absolute;
          width: 40px;
          height: 40px;
          transform: translate(-50%, -50%);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .point-number {
          width: 30px;
          height: 30px;
          background: ${uaColors.arizonaRed};
          color: ${uaColors.white};
          border: 3px solid ${uaColors.white};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          transition: all 0.2s ease;
        }

        .auscultation-point.activated .point-number {
          background: ${uaColors.sage};
          transform: scale(1.1);
        }

        .point-tooltip {
          position: absolute;
          top: -45px;
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
        }

        .auscultation-point:hover .point-tooltip {
          opacity: 1;
        }

        .stethoscope-icon {
          position: absolute;
          width: 50px;
          height: 50px;
          transform: translate(-50%, -50%);
          z-index: 10;
          transition: transform 0.1s ease;
        }

        .stethoscope-icon:active {
          transform: translate(-50%, -50%) scale(1.1);
        }

        .penlight-icon {
          width: 100px;
          height: 100px;
        }

        .stethoscope-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          filter: drop-shadow(0 2px 8px rgba(0,0,0,0.2));
        }

        /* Penlight Eye Button Overlay */
        .eye-overlay-button {
          position: absolute;
          transform: translate(-50%, -50%);
          z-index: 11;
          transition: opacity 0.15s ease;
        }

        .eye-button {
          background: ${uaColors.arizonaRed};
          color: ${uaColors.white};
          border: none;
          padding: 0.25rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        .eye-button:hover {
          background: ${uaColors.chili};
        }

        /* Airway Button Overlay */
        .airway-overlay-button {
          position: absolute;
          transform: translate(-50%, -50%);
          z-index: 11;
        }

        .airway-button {
          background: ${uaColors.arizonaRed};
          color: ${uaColors.white};
          border: none;
          padding: 0.25rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        .airway-button:hover {
          background: ${uaColors.chili};
        }

        .examination-instructions {
          padding: 1.5rem;
          border-top: 1px solid ${uaColors.slate[200]};
          background: ${uaColors.slate[50]};
          text-align: center;
        }

        .examination-instructions p {
          margin: 0 0 0.75rem 0;
          color: ${uaColors.slate[700]};
          font-size: 0.875rem;
        }

        .points-status {
          font-size: 0.875rem;
          font-weight: 600;
          color: ${uaColors.arizonaBlue};
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

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (max-width: 768px) {
          .physical-exam-container {
            padding: 1rem;
          }



          .icd-modal {
            width: 95%;
            max-height: 90vh;
          }


        }
      `}</style>
    </div>
  );
};

export default PhysicalExamInterface;