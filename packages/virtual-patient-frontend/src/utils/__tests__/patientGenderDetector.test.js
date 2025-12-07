/**
 * Test file for patientGenderDetector utility
 */

import { detectPatientGender } from '../patientGenderDetector';

describe('detectPatientGender', () => {
  // Mock MCC data structure for testing
  const createMockMccData = (sexValue, originalVariable = true) => {
    return {
      sections: [
        {
          tables: [
            {
              rows: [
                {
                  cells: [
                    { content: 'Sex:', isHeader: false },
                    { 
                      content: sexValue, 
                      isHeader: false,
                      ...(originalVariable && { originalVariable: 'sex' })
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };
  };

  test('should detect male gender from originalVariable', () => {
    const mccData = createMockMccData('Male');
    expect(detectPatientGender(mccData)).toBe('male');
  });

  test('should detect female gender from originalVariable', () => {
    const mccData = createMockMccData('Female');
    expect(detectPatientGender(mccData)).toBe('female');
  });

  test('should detect male gender from variable pattern', () => {
    const mccData = {
      sections: [
        {
          tables: [
            {
              rows: [
                {
                  cells: [
                    { content: 'Sex:', isHeader: false },
                    { content: '{sex}', isHeader: false },
                    { content: 'M', isHeader: false }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };
    expect(detectPatientGender(mccData)).toBe('male');
  });

  test('should handle case-insensitive gender detection', () => {
    expect(detectPatientGender(createMockMccData('male'))).toBe('male');
    expect(detectPatientGender(createMockMccData('FEMALE'))).toBe('female');
    expect(detectPatientGender(createMockMccData('m'))).toBe('male');
    expect(detectPatientGender(createMockMccData('F'))).toBe('female');
    expect(detectPatientGender(createMockMccData('man'))).toBe('male');
    expect(detectPatientGender(createMockMccData('woman'))).toBe('female');
  });

  test('should default to female when gender is unclear', () => {
    expect(detectPatientGender(createMockMccData('unknown'))).toBe('female');
    expect(detectPatientGender(createMockMccData(''))).toBe('female');
    expect(detectPatientGender(createMockMccData(null))).toBe('female');
  });

  test('should default to female when no MCC data provided', () => {
    expect(detectPatientGender(null)).toBe('female');
    expect(detectPatientGender(undefined)).toBe('female');
    expect(detectPatientGender({})).toBe('female');
  });

  test('should handle empty sections gracefully', () => {
    const mccData = { sections: [] };
    expect(detectPatientGender(mccData)).toBe('female');
  });
});
