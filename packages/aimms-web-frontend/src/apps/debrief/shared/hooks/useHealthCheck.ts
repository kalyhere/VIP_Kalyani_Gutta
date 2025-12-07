import { useEffect, useCallback } from "react"
import { useDebriefStore } from "../../stores"
import debriefService from "../../../../services/debriefApi"

export const useHealthCheck = () => {
  const setHealthData = useDebriefStore((state) => state.setHealthData)
  const setLoading = useDebriefStore((state) => state.setLoading)
  const setError = useDebriefStore((state) => state.setError)

  const fetchHealthStatus = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const health = await debriefService.healthCheck()
      setHealthData(health)
    } catch (err) {
      console.error("Error fetching health status:", err)
      setError(
        "Unable to connect to Debrief backend. Please ensure the backend is running on port 8003."
      )
    } finally {
      setLoading(false)
    }
  }, [setHealthData, setLoading, setError])

  useEffect(() => {
    fetchHealthStatus()
  }, [fetchHealthStatus])

  return { fetchHealthStatus }
}
