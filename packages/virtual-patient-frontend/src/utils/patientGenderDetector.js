/**
 * Utility to detect patient gender from MCC data
 * Supports multiple detection methods and normalizes the result
 */

/**
 * Detects patient gender from MCC data structure
 * @param {Object} mccData - The MCC case data object
 * @returns {string} - "male" or "female" (defaults to "female")
 */
export function detectPatientGender(mccData) {
  if (!mccData || !mccData.sections) {
    return "female"; // Default fallback
  }

  // Method 1: Search for cells with originalVariable: "sex"
  const genderFromOriginalVariable = findGenderByOriginalVariable(mccData);
  if (genderFromOriginalVariable) {
    return genderFromOriginalVariable;
  }

  // Method 2: Search for {sex} variable and adjacent cell values
  const genderFromVariable = findGenderByVariable(mccData);
  if (genderFromVariable) {
    return genderFromVariable;
  }

  // Default fallback
  return "female";
}

/**
 * Search for gender using originalVariable: "sex"
 * @param {Object} mccData - The MCC case data object
 * @returns {string|null} - Normalized gender or null if not found
 */
function findGenderByOriginalVariable(mccData) {
  for (const section of mccData.sections) {
    if (section.tables) {
      for (const table of section.tables) {
        if (table.rows) {
          for (const row of table.rows) {
            if (row.cells) {
              for (const cell of row.cells) {
                if (cell.originalVariable === "sex" && cell.content) {
                  return normalizeGender(cell.content);
                }
              }
            }
          }
        }
      }
    }
  }
  return null;
}

/**
 * Search for gender using {sex} variable pattern
 * @param {Object} mccData - The MCC case data object
 * @returns {string|null} - Normalized gender or null if not found
 */
function findGenderByVariable(mccData) {
  for (const section of mccData.sections) {
    if (section.tables) {
      for (const table of section.tables) {
        if (table.rows) {
          for (const row of table.rows) {
            if (row.cells) {
              for (let i = 0; i < row.cells.length; i++) {
                const cell = row.cells[i];
                if (cell.content && cell.content.includes("{sex}")) {
                  // Try to find the resolved value in the next cell
                  if (i < row.cells.length - 1 && row.cells[i + 1].content) {
                    return normalizeGender(row.cells[i + 1].content);
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return null;
}

/**
 * Normalizes gender string to "male" or "female"
 * @param {string} genderString - Raw gender string from MCC data
 * @returns {string} - "male" or "female"
 */
function normalizeGender(genderString) {
  if (!genderString || typeof genderString !== "string") {
    return "female";
  }

  const normalized = genderString.toLowerCase().trim();

  // Male variations
  if (["male", "m", "man", "masculine"].includes(normalized)) {
    return "male";
  }

  // Female variations
  if (["female", "f", "woman", "feminine"].includes(normalized)) {
    return "female";
  }

  // Default to female if unclear
  return "female";
}

export default detectPatientGender;
