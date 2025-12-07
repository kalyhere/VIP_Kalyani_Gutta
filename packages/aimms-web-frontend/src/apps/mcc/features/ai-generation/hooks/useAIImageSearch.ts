import OpenAI from "openai"
import { useState, useCallback, useRef, useEffect } from "react"
import * as jose from "jose"

// Initialize OpenAI client conditionally
const getOpenAIClient = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) {
    return null // Return null instead of throwing error
  }
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  })
}

interface ImageSearchResult {
  magicKingdom: Array<{
    name: string
    url: string
    description?: string
    tags?: string[]
  }>
  web: Array<{
    url: string
    title: string
  }>
}

interface Message {
  role: "user" | "assistant"
  content: string
  images?: ImageSearchResult
}

interface UseAIImageSearchProps {
  onImageSelect: (imageUrls: string[]) => void
  onClose: () => void
}

// Helper function to get access token
const getAccessToken = async (): Promise<string> => {
  const privateKey = import.meta.env.VITE_GOOGLE_CLOUD_PRIVATE_KEY
  const clientEmail = import.meta.env.VITE_GOOGLE_CLOUD_CLIENT_EMAIL
  const projectId = import.meta.env.VITE_GOOGLE_CLOUD_PROJECT_ID

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }

  const key = await jose.importPKCS8(privateKey, "RS256")
  const token = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key)

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: token,
    }),
  })

  const data = await response.json()
  return data.access_token
}

// Helper function to get signed URL
const getSignedUrl = async (objectName: string): Promise<string> => {
  try {
    const response = await fetch(
      `https://storage.googleapis.com/storage/v1/b/${import.meta.env.VITE_GOOGLE_CLOUD_BUCKET_NAME}/o/${encodeURIComponent(objectName)}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${await getAccessToken()}`,
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || "Failed to get signed URL")
    }

    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error("Failed to convert blob to data URL"))
      reader.readAsDataURL(blob)
    })
  } catch (err) {
    console.error("Get signed URL error:", err)
    throw new Error("Failed to generate signed URL")
  }
}

export const useAIImageSearch = ({ onImageSelect, onClose }: UseAIImageSearchProps) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Speech recognition setup
  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window)) {
      setError("Speech recognition is not supported in your browser.")
      return
    }

    const recognition = new (window as any).webkitSpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
    }

    recognition.onresult = (event: any) => {
      const { transcript } = event.results[0][0]
      setInput(transcript)
      setIsListening(false)
    }

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error)
      setError("Error with speech recognition. Please try again.")
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }, [])

  const stopListening = useCallback(() => {
    setIsListening(false)
  }, [])

  const searchMagicKingdom = async (query: string) => {
    try {
      const response = await fetch(
        `https://storage.googleapis.com/storage/v1/b/${import.meta.env.VITE_GOOGLE_CLOUD_BUCKET_NAME}/o`,
        {
          headers: {
            Authorization: `Bearer ${await getAccessToken()}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error("Failed to load images")
      }

      const data = await response.json()

      if (!data.items) return []

      // Filter and process images
      const imageItems = await Promise.all(
        data.items
          .filter(
            (item: any) =>
              item.contentType?.startsWith("image/") ||
              item.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
          )
          .map(async (item: any) => {
            const url = await getSignedUrl(item.name)
            return {
              name: item.name,
              url,
              description: item.metadata?.description || "",
              tags: item.metadata?.tags ? item.metadata.tags.split(",") : [],
            }
          })
      )

      // Filter based on AI's search terms
      return imageItems.filter((item) => {
        const searchTerms = query.toLowerCase().split(" ")
        return searchTerms.some(
          (term) =>
            item.name.toLowerCase().includes(term) ||
            item.description.toLowerCase().includes(term) ||
            (item.tags || []).some((tag: string) => tag.toLowerCase().includes(term))
        )
      })
    } catch (err) {
      console.error("Error searching Magic Kingdom:", err)
      return []
    }
  }

  const searchWebImages = async (query: string) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${import.meta.env.VITE_GOOGLE_SEARCH_API_KEY}&cx=${import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&searchType=image`
      )

      if (!response.ok) {
        throw new Error("Failed to fetch search results")
      }

      const data = await response.json()
      return (
        data.items?.map((item: any) => ({
          url: item.link,
          title: item.title,
        })) || []
      )
    } catch (err) {
      console.error("Error searching web images:", err)
      return []
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return

    const userMessage = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setIsProcessing(true)
    setError(null)

    try {
      // Create a context-aware prompt that includes previous messages
      const contextPrompt =
        messages.length > 0
        ? `Previous conversation:\n${messages.map((m) => `${m.role}: ${m.content}`).join("\n")}\n\nCurrent query: ${userMessage}`
        : userMessage

      const openai = getOpenAIClient()
      if (!openai) {
        throw new Error(
          "AI features are not available. Please configure your OpenAI API key in the environment variables."
        )
      }
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a friendly and helpful AI assistant helping users find images. 
            When responding to users:
            1. Be conversational and engaging
            2. Acknowledge their request and provide a natural response
            3. If they're continuing a previous conversation, reference the context
            4. Keep your responses concise but friendly
            5. Format your response as a JSON object with:
               - message: Your conversational response to the user
               - searchTerms: Array of search terms for finding images
            Example response:
            {
              "message": "I understand you're looking for a realistic human brain image. I'll search for detailed anatomical brain images that show the complex structure.",
              "searchTerms": ["anatomical brain", "human brain", "brain structure"]
            }`,
          },
          {
            role: "user",
            content: contextPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
      })

      const response = completion.choices[0].message.content || ""
      let searchTerms: string[] = []
      let assistantMessage = ""

      try {
        // Try to parse as JSON first
        const parsedResponse = JSON.parse(response)
        if (Array.isArray(parsedResponse.searchTerms)) {
          searchTerms = parsedResponse.searchTerms
          assistantMessage = parsedResponse.message || response
        }
      } catch {
        // If JSON parsing fails, use the raw response
        assistantMessage = response
        searchTerms = response
          .toLowerCase()
          .split(/\s+/)
          .filter(
            (word) =>
              word.length > 2 &&
              ![
                "the",
                "and",
                "or",
                "but",
                "in",
                "on",
                "at",
                "to",
                "for",
                "of",
                "with",
                "by",
              ].includes(word)
          )
      }

      // Search for images using the extracted terms
      const [magicKingdomResults, webResults] = await Promise.all([
        searchMagicKingdom(searchTerms.join(" ")),
        searchWebImages(searchTerms.join(" ")),
      ])

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: assistantMessage,
          images: {
            magicKingdom: magicKingdomResults,
            web: webResults,
          },
        },
      ])
    } catch (err) {
      console.error("Error in handleSend:", err)
      setError("Failed to process your request")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImageSelect = (imageUrl: string) => {
    setSelectedImages((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(imageUrl)) {
        newSet.delete(imageUrl)
      } else {
        newSet.add(imageUrl)
      }
      return newSet
    })
  }

  const handleConfirmSelection = () => {
    onImageSelect(Array.from(selectedImages))
    onClose()
  }

  const handleClearSelection = () => {
    setSelectedImages(new Set())
  }

  return {
    messages,
    input,
    setInput,
    isProcessing,
    error,
    handleSend,
    handleImageSelect,
    handleConfirmSelection,
    handleClearSelection,
    isListening,
    startListening,
    stopListening,
    selectedImages,
    messagesEndRef,
  }
}
