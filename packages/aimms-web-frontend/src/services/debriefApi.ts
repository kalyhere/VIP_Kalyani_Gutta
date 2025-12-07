import axios from "axios"

const DEBRIEF_API_URL = import.meta.env.VITE_DEBRIEF_API_URL || "http://localhost:8003"

const debriefApi = axios.create({
  baseURL: DEBRIEF_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

export const debriefService = {
  healthCheck: async () => {
    const response = await debriefApi.get("/health")
    return response.data
  },

  uploadTranscript: async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    const response = await debriefApi.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data
  },

  // Generate AI report
  generateReport: async () => {
    const response = await debriefApi.post("/generate-report")
    return response.data
  },
}

export default debriefService
