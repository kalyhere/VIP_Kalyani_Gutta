/**
 * Validates if a string contains properly formatted variable placeholders
 * Variable format: {variable_name}
 */
export const isValidVariableFormat = (content: string): boolean => {
  // Check for matching braces
  const openBraces = (content.match(/\{/g) || []).length
  const closeBraces = (content.match(/\}/g) || []).length

  // Extract variable names and check format
  const matches = content.match(/\{([^}]+)\}/g)
  if (!matches) return openBraces === 0 && closeBraces === 0

  // Check each variable name for valid format - allow any characters except } inside brackets
  return (
    matches.every((match) => {
      const varName = match.slice(1, -1).trim()
      return varName.length > 0
    }) && openBraces === closeBraces
  )
}

/**
 * Returns a human-readable error message for invalid variable format
 */
export const getVariableFormatError = (content: string): string | null => {
  const openBraces = (content.match(/\{/g) || []).length
  const closeBraces = (content.match(/\}/g) || []).length

  if (openBraces !== closeBraces) {
    return "Unmatched braces - please ensure all { have matching }"
  }

  const matches = content.match(/\{([^}]+)\}/g)
  if (!matches) return null

  for (const match of matches) {
    const varName = match.slice(1, -1).trim()
    if (varName.length === 0) {
      return "Variable names cannot be empty"
    }
  }

  return null
}
