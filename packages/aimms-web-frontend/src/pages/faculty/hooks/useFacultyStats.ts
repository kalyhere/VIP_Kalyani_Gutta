import { useState, useEffect } from "react"
import { getFacultyStats } from "@/services/facultyService"
import { FacultyUser } from "@/types/faculty-types"

export function useFacultyStats() {
  const [facultyData, setFacultyData] = useState<FacultyUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFacultyStats() {
      try {
        const data = await getFacultyStats()
        setFacultyData(data)
      } catch (err) {
        setError("Failed to load faculty stats. Please try again.")
        console.error("Error loading faculty stats:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFacultyStats()
  }, [])

  const getGreeting = (): string => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  return {
    facultyData,
    isLoading,
    error,
    getGreeting,
  }
}
