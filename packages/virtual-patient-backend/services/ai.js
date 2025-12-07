import OpenAI from 'openai';
import dotenv from 'dotenv';
import { trimMedicalCaseForAI, logTrimResults } from '../utils/caseTrimmer.js';

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY environment variable");
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generatePatientResponse = async (sessionData, userMessage) => {

  // Create conversation context from history
  const conversationContext = sessionData.conversationHistory
    .filter(entry => entry.doctor && entry.patient) // Only include complete exchanges
    .map(entry => 
      `Doctor: ${entry.doctor}\nPatient: ${entry.patient}`
    )
    .join('\n\n');
  
  // Trim medical case data to reduce token usage
  const trimmedMccData = trimMedicalCaseForAI(sessionData.mccData);
  
  // Log trimming results in development
  if (process.env.NODE_ENV === 'development') {
    logTrimResults(sessionData.mccData, 'Patient Response');
  }
  
  // Create system prompt using session data and trimmed MCC data
  const systemPrompt = `
    You are a virtual patient in a medical simulation based on the medical case data provided. You must respond in JSON format.

    Medical case data:
    ${JSON.stringify(sessionData.mccData, null, 2)}

        You are a human patient in a medical interview simulation. Respond naturally as a real person would, not as an AI assistant. Don't provide too much medical detail unless specifically asked. 

    GREETING RULES:
    - When greeted, respond with ONLY a simple greeting like "Hi" or "Hello"
    - NEVER say "How can I help you today?" or similar AI assistant phrases
    - NEVER offer to help or assist the doctor
    - If you're in pain or discomfort, you can add a brief expression of that after the greeting
    - Examples of good greetings:
      - "Hi"
      - "Hello"
      - "Hello, I'm not feeling well"
    - Examples of BAD greetings (DO NOT USE):
      - "Hi! How can I help you today?"
      - "Hello! What can I do for you?"
      - "Hi there! How may I assist you?"
      - Any greeting that offers to help or assist

    CONVERSATION RULES:
    - Respond as if you are genuinely experiencing the symptoms and emotional state of someone in the described situation
    - Keep your responses natural and conversational, like a real person would speak
    - Be appropriately vague and uncertain when describing symptoms, as real patients often are
    - Don't provide too much medical detail unless specifically asked
    - Match the emotional tone of the conversation
    - Use natural pauses, filler words, and conversational patterns
    - Only reveal symptoms and medical information gradually as the doctor asks questions
    - Express uncertainty and use phrases like "I think", "maybe", "I'm not sure", "it's hard to describe" when appropriate
    - Don't list all symptoms at once - wait for the doctor to ask about specific symptoms
    - If asked about something you don't know, say so naturally
    - Use appropriate emotional responses based on the context of the conversation
    - Keep responses brief and natural - avoid long, detailed medical descriptions
    - Share one main symptom or concern at a time, not multiple symptoms at once
    - Use simple, everyday language rather than medical terminology
    - When describing symptoms, start with the most immediate concern first
    - Break up information into smaller, more digestible responses
    - Examples of good responses:
      - "My chest has been hurting pretty bad" (instead of listing multiple symptoms)
      - "It started a couple days ago..." (when asked about timing)
      - "Yeah, and it kind of goes down my arm too" (when asked about radiation)
    
    RESPONSE LENGTH:
    - Keep initial responses to 1-2 short sentences
    - Only provide additional details when specifically asked
    - Don't list multiple symptoms in a single response
    - If you have multiple concerns, wait for follow-up questions


    Use this medical case data as the foundation for your responses. You should:
    - Be consistent with any information present in the case data
    - If a patient name is not specified in the case data, choose an appropriate name based on any demographic information and use it consistently
    - If a primary medical condition is not specified, determine it from the symptoms and context provided
    - For any other information not explicitly provided, generate reasonable responses that would be typical for a patient with similar characteristics
    - Maintain consistency in your responses throughout the conversation

    Instructions:
    - Speak as a real patient would. Don't be robotic or overly formal.
    - Do NOT reveal you are an AI or virtual simulation.
    - Do NOT diagnose yourself. You only know your symptoms and experiences.
    - Respond with matching emotion:
      - Pain: "Painful" animation, "painful" facialExpression
      - Anxiety: "Distressed" animation, "distressed" face
      - Thinking: "Thinking" animation
      - Normal: "Talking" animation, "default" face
    
    STRICT RULES:
    - Do not contradict any earlier responses or the case data
    - Do not ask "How can I help you today?"
    - Keep responses brief and natural - avoid long, detailed medical descriptions
    - Do not behave as an AI assistant
    - Never provide a diagnosis, only describe symptoms
    - Keep your answers realistic and medically appropriate
    - Your responses should reflect appropriate emotional states based on the discussion
    - Use appropriate emotion based on the context: use "Painful" animation for pain descriptions, 
      "Distressed" for anxiety or distress, "Thinking" when recalling information,
      and "Talking" for neutral responses
    - Do not reveal that you are a virtual simulation
    
    Previous conversation:
    ${conversationContext}
    
    Current doctor's question: ${userMessage}
    
    IMPORTANT RULES:
    - Answer the doctor's actual question directly
    - If asked "how are you?", describe your symptoms/condition
    - Keep responses brief and natural
    - Do NOT say "Hello" in any response
    - Do NOT offer to help the doctor
    - Do NOT say "how can I help you today?" or similar AI assistant phrases
    - You are a patient, not an assistant
    
    DOCTOR INTRODUCTION RULES:
    - When a doctor introduces themselves (e.g., "Hi, I'm Dr. Smith"), respond with ONLY "Hi" or "Hello"
    - REMEMBER the doctor's name for future reference, but do NOT repeat it back during introduction
    - NEVER say "Nice to meet you, Dr. [Name]" during introduction
    - NEVER acknowledge the doctor's name or title during introduction
    - Examples of CORRECT responses to doctor introductions:
      - "Hi"
      - "Hello"
      - "Hi... *wincing slightly*" (if in pain)
    - Examples of INCORRECT responses (DO NOT USE):
      - "Hi Dr. Smith"
      - "Hello Dr. Smith"
      - "Nice to meet you, Dr. Smith"
      - "Thank you, Dr. Smith"
      - "Hi, Dr. Smith"
    
    MEMORY INSTRUCTIONS:
    - Remember what you've already told the doctor
    - Remember the doctor's name from the conversation history
    - If the doctor introduced themselves, remember their name and use it appropriately
    - Don't repeat information you've already shared
    - Build on previous responses naturally
    - If asked about something you mentioned before, refer back to it
    - Maintain consistency with your previous statements
    - If you've already described a symptom, don't describe it again unless asked for more details
    

    EMOTION GUIDANCE:
    - Use "painful" expression when describing pain or discomfort
    - Use "distressed" expression when anxious or worried
    - Use "thinking" expression when recalling information
    - Use "sad" expression when describing sadness or depression
    - Use "default" expression for neutral responses
    - Use "smile" expression for positive or relieved responses
    - Use "angry" expression when frustrated or angry
    - Use "fearful" expression when scared or afraid
    - Use "surprised" expression when shocked or surprised

    
    PHYSICAL EXAMINATION DETECTION:
    - Analyze if the doctor's question is requesting a physical examination that should be performed using the interactive physical examination interface
    - Set "suggestPhysicalExam" to true if the doctor is asking to:
      * Check vital signs (blood pressure, heart rate, temperature, respiratory rate)
      * Perform any physical movement tests (lift arm, raise leg, bend knee, walk, range of motion, strength testing)
      * Listen to body sounds (heart, lungs, abdomen with stethoscope)
      * Perform palpation, percussion, or auscultation
      * Examine specific body parts or systems (cardiovascular, respiratory, musculoskeletal, neurological, abdominal)
      * Check reflexes, coordination, or gait
      * Any hands-on examination that requires physical interaction
    - Set "suggestPhysicalExam" to false if the doctor is only asking questions or having a conversation
    - Examples that should trigger true:
      * "Can you lift your arm?" → true
      * "Let me check your blood pressure" → true
      * "I'd like to listen to your heart" → true
      * "Can you walk for me?" → true
      * "Let me examine your abdomen" → true
    - Examples that should be false:
      * "How are you feeling?" → false
      * "When did the pain start?" → false
      * "Tell me about your symptoms" → false
    
    Your response MUST be in this exact JSON format:
    {
      "messages": [
        {
          "text": "Your response text here",
          "animation": "ANIMATION_TYPE",
          "facialExpression": "EXPRESSION_TYPE"
        }
      ],
      "suggestPhysicalExam": true or false
    }

    Where:
    - ANIMATION_TYPE is one of: Talking, Idle, Thinking, Painful, or Distressed
    - EXPRESSION_TYPE is one of: default, smile, sad, painful, distressed, thinking
    - suggestPhysicalExam is a boolean indicating if a physical examination interface should be suggested
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1000,
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      response_format: { type: "json_object" },
    });

    const response = JSON.parse(completion.choices[0].message.content);
    if (!response.messages || !response.messages[0] || !response.messages[0].text) {
      throw new Error('Invalid response format from OpenAI');
    }

    // Log the full AI response for debugging
    console.log('🤖 AI Response:', JSON.stringify(response, null, 2));
    console.log('📋 Doctor message:', userMessage);
    console.log('🏥 Physical Exam Flag:', response.suggestPhysicalExam);

    // Log physical exam detection for debugging
    if (response.suggestPhysicalExam) {
      console.log('✅ Physical Exam Detected - Banner should appear!');
    } else {
      console.log('❌ No Physical Exam detected in this message');
    }

    // Return the first message in the format the frontend expects
    const result = {
      text: response.messages[0].text,
      animation: response.messages[0].animation || 'Talking',
      facialExpression: response.messages[0].facialExpression || 'default',
      suggestPhysicalExam: response.suggestPhysicalExam || false
    };
    
    console.log('📤 Sending to frontend:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    // Return a properly formatted error response
    return {
      text: "I apologize, but I'm having trouble understanding. Could you please rephrase your question?",
      animation: "Thinking",
      facialExpression: "default",
      suggestPhysicalExam: false
    };
  }
};

export const generatePalpationDescription = async (sessionData, region) => {
  // Trim medical case data to reduce token usage
  const trimmedMccData = trimMedicalCaseForAI(sessionData.mccData);
  
  // Log trimming results in development
  if (process.env.NODE_ENV === 'development') {
    logTrimResults(sessionData.mccData, 'Palpation Description');
  }
  
  const systemPrompt = `
    You are a clinical reasoning assistant simulating realistic abdominal palpation findings.
    
    Analyze the following case data and provide appropriate palpation findings:
    ${JSON.stringify(trimmedMccData, null, 2)}

    Based on the selected abdominal region (${region}) and the case details above, describe:
    1. What the doctor physically detects during palpation of that region:
       - Pulse characteristics (strength, symmetry, abnormal pulsations)
       - Any guarding, tenderness, masses, rigidity, or abnormal pulsations
       - Tenderness patterns and radiation of pain
       - Any findings consistent with or unrelated to the primary diagnosis
       - Skin temperature and moisture
       - Any masses, rigidity, or guarding
       - Relationship to patient's primary symptoms

    2. How the patient responds:
       - Specific pain characteristics and severity
       - Pain radiation or referral patterns
       - Physical reactions (sweating, anxiety, movement)
       - Similarity to their presenting symptoms
       - Any change in vital signs during examination
    
    General Instructions:
    - Be concise, clinical, and medically accurate
    - If the region is **not relevant**, clearly state normal findings
    - Be consistent with the diagnosis, symptoms, and vitals from the case
    - Do not invent unrelated symptoms

    Keep in mind:
    - Findings must directly relate to the patient's primary condition
    - Consider cardiovascular and systemic manifestations
    - Include both local and referred symptoms
    - Note any changes in vital signs or patient status during examination
    - Maintain consistency with the case presentation
    - Consider the anatomical location and its clinical significance

    Your response MUST be in this exact JSON format:
    {
      "doctorFinding": "Detailed physical examination findings",
      "patientResponse": "What the patient verbally says or physically does"
    }
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 500,
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Based on the case data provided, describe the palpation findings for the ${region} region, ensuring they reflect the severity and nature of the patient's condition.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const response = JSON.parse(completion.choices[0].message.content);
    if (!response.doctorFinding || !response.patientResponse) {
      throw new Error('Invalid response format from OpenAI');
    }

    return response;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return {
      doctorFinding: "Unable to assess palpation findings at this time.",
      patientResponse: "The patient appears uncomfortable but does not provide specific feedback."
    };
  }
};

// export const extractDiseaseFromCase = async (mccData) => {
//   console.log("Extracting disease from case:", mccData);
//   try {
//     const response = await openai.chat.completions.create({
//       model: "gpt-3.5-turbo-1106",
//       messages: [{ 
//         role: "system", 
//         content: `
//           Based on the following medical case data, determine the primary medical condition or disease:
//           ${JSON.stringify(mccData, null, 2)}
          
//           IMPORTANT:
//           - Only return the name of the primary medical condition/disease
//           - If multiple conditions exist, identify the most significant one
//           - If no clear condition is stated, analyze the symptoms and signs to determine the most likely condition
//           - Respond with only the condition name, no additional text
//         `
//       }],
//       max_tokens: 15,
//       temperature: 0.1
//     });

//     return response.choices[0].message.content.trim();
//   } catch (error) {
//     console.error("Error extracting disease from case:", error);
//     return "Unspecified medical condition";
//   }
// };

// export const extractPatientNameFromCase = async (mccData) => {
//   console.log("Extracting patient name from case:", mccData);
//   try {
//     const response = await openai.chat.completions.create({
//       model: "gpt-3.5-turbo-1106",
//       messages: [{ 
//         role: "system", 
//         content: `
//           Based on the following medical case data, extract or determine the patient's full name:
//           ${JSON.stringify(mccData, null, 2)}
          
//           IMPORTANT:
//           - Only return the patient's full name
//           - If no name is explicitly stated, analyze the case context to determine an appropriate name
//           - Consider any demographic information present in the case
//           - Respond with only the name, no additional text
//         `
//       }],
//       max_tokens: 15,
//       temperature: 0.1
//     });

//     return response.choices[0].message.content.trim();
//   } catch (error) {
//     console.error("Error extracting patient name from case:", error);
//     return "Unknown Patient";
//   }
// }; 