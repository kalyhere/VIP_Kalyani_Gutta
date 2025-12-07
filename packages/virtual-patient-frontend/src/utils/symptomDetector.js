/**
 * Symptom Detection and Auto-Suggestions Utility
 * 
 * Detects symptoms mentioned by patients and provides relevant follow-up questions
 * to help doctors conduct more thorough interviews.
 */

// Comprehensive symptom database with follow-up questions
const SYMPTOM_DATABASE = {
  // Pain-related symptoms
  pain: {
    keywords: [
      'pain', 'ache', 'hurts', 'hurt', 'sore', 'tender', 'discomfort',
      'burning', 'stabbing', 'sharp', 'dull', 'throbbing', 'cramping'
    ],
    followUpQuestions: [
      "On a scale of 1-10, how would you rate your pain?",
      "When did the pain first start?",
      "Can you describe the pain? Is it sharp, dull, burning, or throbbing?",
      "Does the pain radiate to any other parts of your body?",
      "What makes the pain better or worse?",
      "How long does the pain last when it occurs?",
      "Have you taken any medication for the pain?"
    ]
  },

  // Chest symptoms
  chest: {
    keywords: [
      'chest pain', 'chest discomfort', 'chest tightness', 'chest pressure',
      'chest heaviness', 'heartburn', 'indigestion', 'chest burning'
    ],
    followUpQuestions: [
      "Does the chest pain radiate to your arm, neck, or jaw?",
      "Is the chest pain worse with activity or at rest?",
      "Do you feel short of breath with the chest pain?",
      "Have you had similar chest pain before?",
      "Are you experiencing any nausea or sweating with the chest pain?",
      "Does the pain get worse when you lie down or lean forward?"
    ]
  },

  // Breathing/respiratory symptoms
  breathing: {
    keywords: [
      'shortness of breath', 'difficulty breathing', 'can\'t breathe', 'breathing problems',
      'wheezing', 'coughing', 'cough', 'coughing up blood', 'phlegm', 'sputum',
      'chest congestion', 'tight chest', 'breathless'
    ],
    followUpQuestions: [
      "When did you first notice the breathing difficulty?",
      "Is the shortness of breath worse when lying down or sitting up?",
      "Do you have a cough? If so, is it dry or do you bring up phlegm?",
      "What color is the phlegm you're coughing up?",
      "Are you wheezing or making any sounds when breathing?",
      "Have you been exposed to anyone with respiratory symptoms recently?",
      "Do you smoke or have you smoked in the past?"
    ]
  },

  // Head/neurological symptoms
  headache: {
    keywords: [
      'headache', 'head pain', 'migraine', 'head hurts', 'pressure in head',
      'dizzy', 'dizziness', 'lightheaded', 'vertigo', 'spinning'
    ],
    followUpQuestions: [
      "When did the headache start?",
      "On a scale of 1-10, how severe is the headache?",
      "Is this the worst headache you've ever had?",
      "Do you have any vision changes or sensitivity to light?",
      "Are you experiencing any neck stiffness?",
      "Have you had any recent head trauma or injury?",
      "Do you have a fever with the headache?"
    ]
  },

  // Gastrointestinal symptoms
  stomach: {
    keywords: [
      'stomach pain', 'abdominal pain', 'belly pain', 'nausea', 'vomiting',
      'diarrhea', 'constipation', 'bloating', 'gas', 'indigestion',
      'heartburn', 'reflux', 'upset stomach'
    ],
    followUpQuestions: [
      "When did the stomach pain start?",
      "Is the pain constant or does it come and go?",
      "Have you been vomiting? If so, how many times?",
      "What does the vomit look like?",
      "Have you had any changes in your bowel movements?",
      "Are you able to keep food or liquids down?",
      "Have you noticed any blood in your vomit or stool?"
    ]
  },

  // Fatigue/energy symptoms
  fatigue: {
    keywords: [
      'tired', 'fatigue', 'exhausted', 'weak', 'weakness', 'no energy',
      'lethargic', 'sleepy', 'drained', 'can\'t concentrate', 'brain fog'
    ],
    followUpQuestions: [
      "How long have you been feeling tired?",
      "Is the fatigue constant or does it come and go?",
      "How is your sleep quality? Are you sleeping more or less than usual?",
      "Have you noticed any changes in your appetite?",
      "Are you feeling weak in specific parts of your body or all over?",
      "Have you been under more stress than usual recently?",
      "Are you taking any new medications?"
    ]
  },

  // Fever/infection symptoms
  fever: {
    keywords: [
      'fever', 'hot', 'chills', 'sweating', 'night sweats', 'temperature',
      'feeling warm', 'body aches', 'muscle aches'
    ],
    followUpQuestions: [
      "Have you taken your temperature? What was the reading?",
      "How long have you had the fever?",
      "Are you experiencing chills or sweating?",
      "Do you have any body aches or muscle pain?",
      "Have you been exposed to anyone who is sick?",
      "Are you taking any fever-reducing medication?",
      "Do you have any other symptoms like cough or sore throat?"
    ]
  },

  // Sleep-related symptoms
  sleep: {
    keywords: [
      'can\'t sleep', 'insomnia', 'trouble sleeping', 'waking up', 'sleeping too much',
      'nightmares', 'night terrors', 'sleep apnea', 'snoring'
    ],
    followUpQuestions: [
      "How long has your sleep been affected?",
      "Are you having trouble falling asleep or staying asleep?",
      "How many hours of sleep are you getting per night?",
      "Do you wake up feeling rested or tired?",
      "Are you experiencing any stress or anxiety that might be affecting your sleep?",
      "Have you made any recent changes to your routine or medications?",
      "Do you snore or has anyone noticed you stop breathing during sleep?"
    ]
  }
};

/**
 * Detects symptoms in a patient message
 * @param {string} message - The patient's message to analyze
 * @returns {Object} - Detection result with symptoms and suggested questions
 */
export function detectSymptoms(message) {
  if (!message || typeof message !== 'string') {
    return { detected: false, symptoms: [], suggestions: [] };
  }

  const lowerMessage = message.toLowerCase();
  const detectedSymptoms = [];
  const suggestions = [];

  // Check each symptom category
  Object.entries(SYMPTOM_DATABASE).forEach(([category, data]) => {
    data.keywords.forEach(keyword => {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        // Avoid duplicates
        if (!detectedSymptoms.some(s => s.category === category)) {
          detectedSymptoms.push({
            category,
            keyword,
            confidence: 1.0
          });
        }
      }
    });
  });

  // Generate suggestions based on detected symptoms
  detectedSymptoms.forEach(symptom => {
    const categoryData = SYMPTOM_DATABASE[symptom.category];
    if (categoryData && categoryData.followUpQuestions) {
      // Add 2-3 random questions from the category
      const shuffled = [...categoryData.followUpQuestions].sort(() => 0.5 - Math.random());
      suggestions.push(...shuffled.slice(0, 3));
    }
  });

  // Remove duplicate suggestions
  const uniqueSuggestions = [...new Set(suggestions)];

  return {
    detected: detectedSymptoms.length > 0,
    symptoms: detectedSymptoms,
    suggestions: uniqueSuggestions.slice(0, 6), // Limit to 6 suggestions
    confidence: detectedSymptoms.length > 0 ? Math.min(detectedSymptoms.length * 0.3, 1.0) : 0
  };
}

/**
 * Gets contextual follow-up questions based on detected symptoms
 * @param {Array} symptoms - Array of detected symptoms
 * @returns {Array} - Array of relevant follow-up questions
 */
export function getFollowUpQuestions(symptoms) {
  if (!symptoms || symptoms.length === 0) return [];

  const allQuestions = [];
  
  symptoms.forEach(symptom => {
    const categoryData = SYMPTOM_DATABASE[symptom.category];
    if (categoryData && categoryData.followUpQuestions) {
      allQuestions.push(...categoryData.followUpQuestions);
    }
  });

  // Remove duplicates and return top suggestions
  return [...new Set(allQuestions)].slice(0, 5);
}

/**
 * Determines if suggestions should be shown based on confidence
 * @param {Object} detectionResult - Result from detectSymptoms
 * @param {number} threshold - Minimum confidence threshold (default: 0.3)
 * @returns {boolean} - Whether to show suggestions
 */
export function shouldShowSuggestions(detectionResult, threshold = 0.3) {
  return detectionResult.detected && detectionResult.confidence >= threshold;
}

export default {
  detectSymptoms,
  getFollowUpQuestions,
  shouldShowSuggestions,
  SYMPTOM_DATABASE
};
