import type { ParsedReport, EvaluationScore } from "../../../types"

export const parseReport = (rawReport: string): ParsedReport => {
  const categoryNames = [
    "Structure of the Lesson",
    "Style of Delivery",
    "Professional Demeanor",
    "Use of Instructional Tools",
    "Student Engagement/Participation",
    "Attentiveness to Students' Active Learning",
    "Overall Effectiveness",
  ]

  // Always create 7 scores with default values
  const scores: EvaluationScore[] = []
  let totalScore = 0

  // Check if report has placeholder text
  const hasPlaceholders =
    rawReport.includes("[TotalScore]") ||
    rawReport.includes("[Score") ||
    rawReport.includes("[COMMENTS") ||
    rawReport.includes("[Evaluator]") ||
    rawReport.includes("[Instructor]")

  // Try to extract scores from the report
  const extractedScores = [3, 3, 3, 3, 3, 3, 3] // Default scores

  if (hasPlaceholders) {
    // Look for any numbers 1-5 in the entire report
    const numberMatches = rawReport.match(/\b[1-5]\b/g)

    if (numberMatches && numberMatches.length > 0) {
      // Use the first 7 numbers found as scores
      for (let i = 0; i < Math.min(7, numberMatches.length); i++) {
        const num = parseInt(numberMatches[i])
        if (num >= 1 && num <= 5) {
          extractedScores[i] = num
        }
      }
    }
  } else {
    // Try to parse actual scores from structured report
    const lines = rawReport.split("\n")
    let scoreIndex = 0

    for (const line of lines) {
      // Look for score patterns
      const scoreMatch = line.match(/Score(\d+):\s*(\d+)|(\d+)\s*\/\s*5|Score:\s*(\d+)/)
      if (scoreMatch && scoreIndex < 7) {
        const score = parseInt(scoreMatch[2] || scoreMatch[3] || scoreMatch[4])
        if (score >= 1 && score <= 5) {
          extractedScores[scoreIndex] = score
          scoreIndex++
        }
      }
    }
  }

  // Create the scores array with specific comments for each category
  const categoryComments = [
    "Lesson structure and organization effectiveness",
    "Presentation style and delivery quality",
    "Professional conduct and classroom management",
    "Effective use of teaching tools and resources",
    "Student participation and engagement levels",
    "Adaptation to student learning needs",
    "Overall lesson effectiveness and learning outcomes",
  ]

  for (let i = 0; i < 7; i++) {
    scores.push({
      category: categoryNames[i],
      score: extractedScores[i],
      comment: hasPlaceholders ? categoryComments[i] : "Evaluated from debriefing session",
      maxScore: 5,
    })
    totalScore += extractedScores[i]
  }

  // Parse metadata
  const evaluator = rawReport.includes("[Evaluator]:")
    ? rawReport.split("[Evaluator]:")[1]?.split("\n")[0]?.trim() || "AIDSET"
    : "AIDSET"

  const instructor = rawReport.includes("[Instructor]:")
    ? rawReport.split("[Instructor]:")[1]?.split("\n")[0]?.trim() || "Not mentioned"
    : "Not mentioned"

  const course = rawReport.includes("[Course]:")
    ? rawReport.split("[Course]:")[1]?.split("\n")[0]?.trim() || "Simulation Training"
    : "Simulation Training"

  const date = rawReport.includes("[Date]:")
    ? rawReport.split("[Date]:")[1]?.split("\n")[0]?.trim() || new Date().toLocaleDateString()
    : new Date().toLocaleDateString()

  const location = rawReport.includes("[Location]:")
    ? rawReport.split("[Location]:")[1]?.split("\n")[0]?.trim() || "ASTEC"
    : "ASTEC"

  const classSize = rawReport.includes("[Class Size]:")
    ? rawReport.split("[Class Size]:")[1]?.split("\n")[0]?.trim() || "Not mentioned"
    : "Not mentioned"

  const context = rawReport.includes("[Context]:")
    ? rawReport.split("[Context]:")[1]?.split("\n")[0]?.trim() || "Not mentioned"
    : "Not mentioned"

  // Extract summary
  let summaryReport = ""
  const summaryStart = rawReport.indexOf("Overall Summary:")
  if (summaryStart !== -1) {
    summaryReport = rawReport
      .substring(summaryStart + 16)
      .replace(/\[TotalScore\]/g, "Total Score")
      .replace(/\[SummaryReport\]/g, "Summary Report")
      .trim()
  }

  return {
    evaluator,
    instructor,
    course,
    date,
    location,
    classSize,
    context,
    scores,
    totalScore,
    summaryReport,
    rawReport,
  }
}
