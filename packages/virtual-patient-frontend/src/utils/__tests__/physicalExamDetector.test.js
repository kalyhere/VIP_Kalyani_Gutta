/**
 * Test file for Physical Examination Keyword Detection
 * 
 * This file demonstrates how the physical examination detection system works
 * with various types of doctor questions and statements.
 */

import { detectPhysicalExamKeywords, getPhysicalExamPromptMessage, shouldShowPhysicalExamPrompt } from '../physicalExamDetector';

// Test cases for different types of physical examination scenarios
const testCases = [
  // General physical examination
  {
    message: "Let me perform a physical examination",
    expected: { detected: true, category: 'general' }
  },
  {
    message: "I need to examine you physically",
    expected: { detected: true, category: 'general' }
  },
  
  // Cardiovascular examination
  {
    message: "Can I listen to your heart?",
    expected: { detected: true, category: 'cardiovascular' }
  },
  {
    message: "I'm going to check your blood pressure",
    expected: { detected: true, category: 'vitals' }
  },
  {
    message: "Let me use my stethoscope to listen to your chest",
    expected: { detected: true, category: 'cardiovascular' }
  },
  
  // Respiratory examination
  {
    message: "I need to listen to your lungs",
    expected: { detected: true, category: 'respiratory' }
  },
  {
    message: "Can you take a deep breath so I can hear your breathing?",
    expected: { detected: true, category: 'respiratory' }
  },
  
  // Abdominal examination
  {
    message: "I'm going to palpate your abdomen",
    expected: { detected: true, category: 'abdominal' }
  },
  {
    message: "Does it hurt when I press on your stomach?",
    expected: { detected: true, category: 'abdominal' }
  },
  
  // Neurological examination
  {
    message: "Let me check your reflexes",
    expected: { detected: true, category: 'neurological' }
  },
  {
    message: "I need to perform a neurological exam",
    expected: { detected: true, category: 'neurological' }
  },
  
  // Musculoskeletal examination
  {
    message: "Can you move your arm in different directions?",
    expected: { detected: true, category: 'musculoskeletal' }
  },
  {
    message: "I'm going to check your range of motion",
    expected: { detected: true, category: 'musculoskeletal' }
  },
  
  // Skin examination
  {
    message: "Let me look at that rash on your skin",
    expected: { detected: true, category: 'skin' }
  },
  {
    message: "I need to examine your skin condition",
    expected: { detected: true, category: 'skin' }
  },
  
  // Head and neck examination
  {
    message: "Can you open your mouth so I can look at your throat?",
    expected: { detected: true, category: 'headNeck' }
  },
  {
    message: "I'm going to check your lymph nodes",
    expected: { detected: true, category: 'headNeck' }
  },
  
  // Non-physical examination questions (should not trigger)
  {
    message: "How are you feeling today?",
    expected: { detected: false }
  },
  {
    message: "What medications are you taking?",
    expected: { detected: false }
  },
  {
    message: "When did your symptoms start?",
    expected: { detected: false }
  }
];

// Run tests
console.log('=== Physical Examination Detection Tests ===\n');

testCases.forEach((testCase, index) => {
  const result = detectPhysicalExamKeywords(testCase.message);
  const shouldShow = shouldShowPhysicalExamPrompt(result);
  const promptMessage = shouldShow ? getPhysicalExamPromptMessage(result.category) : null;
  
  console.log(`Test ${index + 1}: "${testCase.message}"`);
  console.log(`  Detected: ${result.detected}`);
  console.log(`  Category: ${result.category || 'N/A'}`);
  console.log(`  Keywords: [${result.keywords.join(', ')}]`);
  console.log(`  Confidence: ${result.confidence.toFixed(2)}`);
  console.log(`  Should Show Prompt: ${shouldShow}`);
  if (promptMessage) {
    console.log(`  Prompt Message: "${promptMessage}"`);
  }
  console.log(`  Expected: ${testCase.expected.detected ? 'Should detect' : 'Should not detect'}`);
  
  // Check if result matches expectation
  const passed = result.detected === testCase.expected.detected && 
                 (!testCase.expected.category || result.category === testCase.expected.category);
  console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');
});

// Test confidence thresholds
console.log('=== Confidence Threshold Tests ===\n');

const confidenceTestCases = [
  { message: "Let me examine you", threshold: 0.3 },
  { message: "I need to check your heart and lungs", threshold: 0.5 },
  { message: "Physical examination", threshold: 0.2 }
];

confidenceTestCases.forEach((testCase, index) => {
  const result = detectPhysicalExamKeywords(testCase.message);
  const shouldShow = shouldShowPhysicalExamPrompt(result, testCase.threshold);
  
  console.log(`Confidence Test ${index + 1}: "${testCase.message}"`);
  console.log(`  Confidence: ${result.confidence.toFixed(2)}`);
  console.log(`  Threshold: ${testCase.threshold}`);
  console.log(`  Should Show (threshold ${testCase.threshold}): ${shouldShow}`);
  console.log('');
});

export { testCases, confidenceTestCases };
