# Physical Examination Prompt System

This system automatically detects when a doctor's conversation with a virtual patient contains questions or statements related to physical examination, and prompts them to switch to the physical examination tab.

## Features

- **Intelligent Keyword Detection**: Recognizes over 100 physical examination terms across 9 medical categories
- **Contextual Prompts**: Provides specific guidance based on the type of examination mentioned
- **Non-intrusive Notifications**: Beautiful, auto-dismissing prompts that don't interrupt the conversation flow
- **Confidence-based Triggering**: Only shows prompts when detection confidence is above threshold

## Components

### 1. Physical Examination Detector (`physicalExamDetector.js`)

**Purpose**: Analyzes doctor messages to identify physical examination keywords.

**Key Functions**:
- `detectPhysicalExamKeywords(message)`: Main detection function
- `getPhysicalExamPromptMessage(category)`: Returns contextual prompt messages
- `shouldShowPhysicalExamPrompt(result, threshold)`: Determines if prompt should be shown

**Categories Detected**:
- **General**: Physical exam, examination, inspect, observe
- **Vitals**: Blood pressure, heart rate, temperature, oxygen saturation
- **Cardiovascular**: Heart sounds, stethoscope, murmur, chest pain
- **Respiratory**: Lung sounds, breathing, dyspnea, breath sounds
- **Abdominal**: Palpation, tenderness, guarding, bowel sounds
- **Neurological**: Reflexes, cranial nerves, motor, sensory
- **Musculoskeletal**: Range of motion, joints, muscle strength
- **Skin**: Rash, lesion, wound, discoloration
- **Head/Neck**: Throat, mouth, lymph nodes, thyroid

### 2. Physical Examination Prompt Component (`PhysicalExamPrompt.jsx`)

**Purpose**: Displays contextual notifications to guide doctors to the physical examination interface.

**Features**:
- Gradient background with glassmorphism effect
- Auto-hide functionality with progress bar
- Hover to pause auto-hide
- Category-specific messaging
- Smooth animations and transitions
- "Go to Physical Exam" and "Maybe Later" actions

### 3. Chat Interface Integration (`ChatInterface.jsx`)

**Purpose**: Integrates detection system with the conversation flow.

**Integration Points**:
- Analyzes messages before sending to backend
- Shows prompt after 1-second delay to avoid interrupting message flow
- Manages prompt state and dismissal
- Handles mode switching actions

## Usage Examples

### Basic Detection
```javascript
import { detectPhysicalExamKeywords } from './utils/physicalExamDetector';

const result = detectPhysicalExamKeywords("Can I listen to your heart?");
// Returns: {
//   detected: true,
//   confidence: 0.4,
//   keywords: ["listen", "heart"],
//   category: "cardiovascular"
// }
```

### Prompt Display
```jsx
import PhysicalExamPrompt from './components/PhysicalExamPrompt';

<PhysicalExamPrompt
  isVisible={showPrompt}
  message="Consider examining the patient's cardiovascular system using the Physical Examination tab."
  category="cardiovascular"
  onSwitchToPhysicalExam={handleSwitch}
  onDismiss={handleDismiss}
  autoHide={true}
  autoHideDelay={10000}
/>
```

## Configuration

### Confidence Threshold
Adjust the sensitivity of detection by changing the confidence threshold:

```javascript
// More sensitive (shows prompts more often)
shouldShowPhysicalExamPrompt(result, 0.2);

// Less sensitive (shows prompts less often)
shouldShowPhysicalExamPrompt(result, 0.5);
```

### Auto-hide Timing
Customize how long prompts stay visible:

```jsx
<PhysicalExamPrompt
  autoHideDelay={15000} // 15 seconds
  autoHide={true}
/>
```

## Test Cases

The system includes comprehensive test cases covering:

- **Positive Cases**: Messages that should trigger prompts
- **Negative Cases**: Messages that should not trigger prompts
- **Edge Cases**: Boundary conditions and special scenarios
- **Confidence Testing**: Different threshold levels

Run tests:
```bash
# In the virtual-patient-frontend directory
node src/utils/__tests__/physicalExamDetector.test.js
```

## Example Scenarios

### Scenario 1: Cardiovascular Examination
**Doctor**: "I need to listen to your heart with my stethoscope"
**System Response**: 
- Detects keywords: "listen", "heart", "stethoscope"
- Category: cardiovascular
- Confidence: 0.5
- Shows prompt: "Consider examining the patient's cardiovascular system using the Physical Examination tab."

### Scenario 2: Abdominal Examination
**Doctor**: "Does it hurt when I palpate your abdomen?"
**System Response**:
- Detects keywords: "palpate", "abdomen"
- Category: abdominal
- Confidence: 0.4
- Shows prompt: "You may want to perform an abdominal examination using the Physical Examination tab."

### Scenario 3: Non-physical Question
**Doctor**: "How are you feeling today?"
**System Response**:
- No physical examination keywords detected
- No prompt shown

## Integration with Virtual Patient System

The system integrates seamlessly with the existing virtual patient architecture:

1. **ChatInterface**: Analyzes outgoing messages
2. **VirtualPatientUnity**: Provides mode switching functionality
3. **MedicalUI**: Contains the physical examination interface
4. **PhysicalExamInterface**: The actual examination tools

## Customization

### Adding New Keywords
Edit `physicalExamDetector.js` to add new keywords:

```javascript
const PHYSICAL_EXAM_KEYWORDS = {
  // Add new category
  newCategory: [
    'new keyword 1',
    'new keyword 2'
  ],
  
  // Or add to existing category
  cardiovascular: [
    // existing keywords...
    'new heart-related keyword'
  ]
};
```

### Customizing Prompt Messages
Modify the prompts in `getPhysicalExamPromptMessage()`:

```javascript
const prompts = {
  newCategory: "Custom prompt message for new category.",
  // existing prompts...
};
```

### Styling the Prompt Component
Customize the appearance in `PhysicalExamPrompt.jsx`:

```jsx
// Change colors, animations, positioning, etc.
style={{
  background: 'linear-gradient(135deg, #your-colors)',
  // other style properties...
}}
```

## Performance Considerations

- **Lightweight Detection**: Keyword matching is O(n) where n is message length
- **Minimal Memory Usage**: No persistent state storage required
- **Efficient Rendering**: Prompts only render when needed
- **Non-blocking**: Detection runs asynchronously and doesn't delay message sending

## Future Enhancements

Potential improvements for future versions:

1. **Machine Learning**: Use NLP models for more sophisticated detection
2. **Context Awareness**: Consider conversation history for better accuracy
3. **User Preferences**: Allow doctors to customize detection sensitivity
4. **Analytics**: Track prompt effectiveness and user interactions
5. **Multilingual Support**: Extend keyword detection to other languages
6. **Smart Suggestions**: Provide specific examination tool recommendations

## Troubleshooting

### Common Issues

**Prompt not showing**: Check confidence threshold and keyword detection
**False positives**: Increase confidence threshold or refine keyword lists
**Styling issues**: Verify CSS-in-JS syntax and component props

### Debug Mode

Enable detailed logging:

```javascript
// In physicalExamDetector.js
const DEBUG = true;
if (DEBUG) {
  console.log('Detection result:', result);
}
```

## Contributing

When adding new features:

1. Add test cases for new functionality
2. Update documentation
3. Ensure backward compatibility
4. Test with various message types
5. Consider performance impact

## License

This feature is part of the AIMMS Web Platform and follows the same licensing terms.
