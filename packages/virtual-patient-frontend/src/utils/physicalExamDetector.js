/**
 * Physical Examination Keyword Detection Utility
 * 
 * Detects when a doctor's question or statement relates to physical examination
 * and should prompt them to switch to the physical examination tab.
 */

// Comprehensive list of physical examination keywords and phrases
const PHYSICAL_EXAM_KEYWORDS = {
  // General physical examination terms
  general: [
    'physical exam', 'physical examination', 'physical assessment', 'clinical exam',
    'examine', 'examination', 'inspect', 'inspection', 'observe', 'observation',
    'check', 'checking', 'look at', 'take a look', 'see if', 'have a look'
  ],
  
  // Vital signs and measurements
  vitals: [
    'blood pressure', 'bp', 'heart rate', 'pulse', 'temperature', 'temp',
    'respiratory rate', 'breathing rate', 'oxygen saturation', 'o2 sat',
    'vital signs', 'vitals', 'measure', 'measurement', 'check vitals'
  ],
  
  // Cardiovascular examination
  cardiovascular: [
    'heart', 'cardiac', 'cardiovascular', 'chest pain', 'chest discomfort',
    'listen to heart', 'heart sounds', 'murmur', 'gallop', 'rhythm',
    'stethoscope', 'auscultate', 'auscultation', 'percuss', 'percussion',
    'jugular venous', 'jvd', 'edema', 'swelling', 'peripheral pulses'
  ],
  
  // Respiratory examination
  respiratory: [
    'lungs', 'breathing', 'respiratory', 'shortness of breath', 'sob',
    'dyspnea', 'listen to lungs', 'lung sounds', 'breath sounds',
    'crackles', 'wheezing', 'rhonchi', 'stridor', 'chest expansion',
    'respiratory effort', 'work of breathing'
  ],
  
  // Abdominal examination
  abdominal: [
    'abdomen', 'abdominal', 'belly', 'stomach', 'pain in abdomen',
    'abdominal pain', 'palpate', 'palpation', 'tenderness',
    'guarding', 'rigidity', 'rebound', 'bowel sounds', 'distension',
    'mass', 'organomegaly', 'liver', 'spleen', 'kidney'
  ],
  
  // Neurological examination
  neurological: [
    'neurological', 'neurologic', 'neuro exam', 'mental status',
    'cranial nerves', 'reflexes', 'motor', 'sensory', 'coordination',
    'balance', 'gait', 'strength', 'tone', 'cerebellar', 'dermatome'
  ],
  
  // Musculoskeletal examination
  musculoskeletal: [
    'joints', 'muscles', 'bones', 'range of motion', 'rom',
    'movement', 'mobility', 'flexion', 'extension', 'rotation',
    'muscle strength', 'joint swelling', 'deformity', 'tenderness',
    'leg raise', 'straight leg raise', 'slr', 'hand raise', 'arm raise',
    'elevation', 'lifting', 'raise your leg', 'raise your arm', 'raise your hand',
    'lift your leg', 'lift your arm', 'lift your hand', 'straight leg', 'leg elevation',
    'right leg', 'left leg', 'right arm', 'left arm', 'right hand', 'left hand',
    'raise your right leg', 'raise your left leg', 'lift your right leg', 'lift your left leg',
    'raise your right arm', 'raise your left arm', 'lift your right arm', 'lift your left arm',
    'raise your right hand', 'raise your left hand', 'lift your right hand', 'lift your left hand'
  ],
  
  // Skin examination
  skin: [
    'skin', 'rash', 'lesion', 'wound', 'ulcer', 'bruise',
    'discoloration', 'pallor', 'cyanosis', 'jaundice',
    'temperature', 'moisture', 'texture', 'turgor'
  ],
  
  // Head and neck examination
  headNeck: [
    'head', 'neck', 'throat', 'mouth', 'tongue', 'teeth',
    'eyes', 'ears', 'nose', 'lymph nodes', 'thyroid',
    'jugular', 'carotid', 'trachea', 'voice', 'swallowing'
  ],
  
  // Specific examination techniques
  techniques: [
    'stethoscope', 'otoscope', 'ophthalmoscope', 'reflex hammer',
    'tuning fork', 'flashlight', 'penlight', 'gloves',
    'auscultate', 'palpate', 'percuss', 'inspect'
  ]
};

/**
 * Detects if a message contains physical examination keywords
 * @param {string} message - The doctor's message to analyze
 * @returns {Object} - Detection result with details
 */
export function detectPhysicalExamKeywords(message) {
  if (!message || typeof message !== 'string') {
    return { detected: false, confidence: 0, keywords: [], category: null };
  }

  const lowerMessage = message.toLowerCase();
  const detectedKeywords = [];
  const categoryScores = {};

  // Check each category for keywords
  Object.entries(PHYSICAL_EXAM_KEYWORDS).forEach(([category, keywords]) => {
    keywords.forEach(keyword => {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        detectedKeywords.push(keyword);
        categoryScores[category] = (categoryScores[category] || 0) + 1;
      }
    });
  });

  // Calculate confidence based on number of matches and categories
  const totalMatches = detectedKeywords.length;
  const categoryCount = Object.keys(categoryScores).length;
  const confidence = Math.min(totalMatches * 0.3 + categoryCount * 0.2, 1.0);

  // Determine primary category
  const primaryCategory = Object.keys(categoryScores).reduce((a, b) => 
    categoryScores[a] > categoryScores[b] ? a : b, null
  );

  return {
    detected: totalMatches > 0,
    confidence,
    keywords: detectedKeywords,
    category: primaryCategory,
    categoryScores
  };
}

/**
 * Gets a contextual prompt message based on the detected category
 * @param {string} category - The primary category detected
 * @returns {string} - Contextual prompt message
 */
export function getPhysicalExamPromptMessage(category) {
  const prompts = {
    general: "Consider switching to the Physical Examination tab to perform a comprehensive physical assessment.",
    vitals: "You might want to check the patient's vital signs in the Physical Examination tab.",
    cardiovascular: "Consider examining the patient's cardiovascular system using the Physical Examination tab.",
    respiratory: "The Physical Examination tab would be useful for assessing the patient's respiratory system.",
    abdominal: "You may want to perform an abdominal examination using the Physical Examination tab.",
    neurological: "Consider conducting a neurological examination in the Physical Examination tab.",
    musculoskeletal: "The Physical Examination tab would help assess the patient's musculoskeletal system, including leg and hand raise tests.",
    skin: "Consider examining the patient's skin condition in the Physical Examination tab.",
    headNeck: "You might want to examine the patient's head and neck in the Physical Examination tab.",
    techniques: "Consider using the Physical Examination tab to perform hands-on examination techniques."
  };

  return prompts[category] || prompts.general;
}

/**
 * Determines if the prompt should be shown based on confidence threshold
 * @param {Object} detectionResult - Result from detectPhysicalExamKeywords
 * @param {number} threshold - Minimum confidence threshold (default: 0.3)
 * @returns {boolean} - Whether to show the prompt
 */
export function shouldShowPhysicalExamPrompt(detectionResult, threshold = 0.3) {
  return detectionResult.detected && detectionResult.confidence >= threshold;
}

export default {
  detectPhysicalExamKeywords,
  getPhysicalExamPromptMessage,
  shouldShowPhysicalExamPrompt
};
