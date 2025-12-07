import React, { useState, useRef, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Grid,
  Card,
  CardMedia,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  Pagination,
  Tabs,
  Tab,
  Tooltip,
} from "@mui/material"
import SearchIcon from "@mui/icons-material/Search"
import CloudIcon from "@mui/icons-material/Cloud"
import ImageSearchIcon from "@mui/icons-material/ImageSearch"
import FolderIcon from "@mui/icons-material/Folder"
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"
import MicIcon from "@mui/icons-material/Mic"
import MicOffIcon from "@mui/icons-material/MicOff"
import SendIcon from "@mui/icons-material/Send"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline"
import CloseIcon from "@mui/icons-material/Close"
import * as jose from "jose"
import { useTheme } from "@mui/material/styles"
import { AIImageSearchModal } from "./AIImageSearchModal"
import { useAIImageSearch } from "../hooks/useAIImageSearch"

interface GoogleCloudModalProps {
  open: boolean
  onClose: () => void
  onImageSelect?: (imageUrls: string[]) => void
  existingImages?: string[]
}

interface ImageItem {
  name: string
  url?: string // URL is now optional since we'll load it lazily
  uploadedAt: Date
  folder: string
  metadata?: {
    description?: string
    tags?: string[]
    [key: string]: any
  }
}

interface StorageItem {
  name: string
  contentType?: string
  timeCreated?: string
  metadata?: {
    description?: string
    tags?: string
  }
}

interface WebImageResult {
  url: string
  title: string
}

interface MagicKingdomImage {
  name: string
  url: string
  description: string
  tags: string[]
}

interface AiSearchResults {
  magicKingdom: MagicKingdomImage[]
  web: WebImageResult[]
}

interface Message {
  role: "user" | "assistant"
  content: string
  images?: {
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
}

interface SelectedImage {
  url: string
  title?: string
  name?: string
}

const ITEMS_PER_PAGE = 6
const MAX_IMAGE_HEIGHT = 256 // Maximum height for processed images
const MAX_CACHE_SIZE = 100 // Maximum number of cached URLs
const CACHE_KEY = "google_cloud_modal_cache"

// Debounce utility
const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), ms)
  }
}

// Error handler for ResizeObserver
const handleResizeObserverError = (error: ErrorEvent) => {
  if (
    error.message === "ResizeObserver loop completed with undelivered notifications." ||
    error.message === "ResizeObserver loop limit exceeded"
  ) {
    error.stopImmediatePropagation()
  }
}

// Cache management utility
const manageCacheSize = (cache: Map<string, string>): Map<string, string> => {
  if (cache.size > MAX_CACHE_SIZE) {
    // Convert to array to sort by last accessed
    const entries = Array.from(cache.entries())
    // Keep only the most recent MAX_CACHE_SIZE/2 entries
    const newEntries = entries.slice(-MAX_CACHE_SIZE / 2)
    return new Map(newEntries)
  }
  return cache
}

const processImage = (imageUrl: string): Promise<string> =>
  new Promise((resolve, reject) => {
  const img = new Image()

  // Timeout to prevent hanging
  const timeoutId = setTimeout(() => {
    reject(new Error("Image processing timed out"))
  }, 10000) // 10 second timeout

  img.onload = () => {
    clearTimeout(timeoutId)
    // Calculate dimensions maintaining aspect ratio with max height of 256px
    const aspectRatio = img.naturalHeight / img.naturalWidth
    const width = Math.min(img.naturalWidth, Math.round(MAX_IMAGE_HEIGHT / aspectRatio))
    const height = Math.round(width * aspectRatio)

    // Append dimensions to URL
    const processedUrl = `${imageUrl}#width=${width}&height=${height}`

    // Clean up
    URL.revokeObjectURL(img.src)
    resolve(processedUrl)
  }

  img.onerror = () => {
    clearTimeout(timeoutId)
    URL.revokeObjectURL(img.src)
    reject(new Error("Failed to load image"))
  }

  img.src = imageUrl
})

const MessageBubble: React.FC<{
  message: Message
  onImageSelect: (url: string) => void
  selectedImages: Set<string>
}> = ({ message, onImageSelect, selectedImages }) => {
  const isUser = message.role === "user"
  const theme = useTheme()

  if (message.images) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          maxWidth: "100%",
        }}>
        <Box
          sx={{
            position: "relative",
            display: "inline-block",
            maxWidth: "80%",
            alignSelf: isUser ? "flex-end" : "flex-start",
            "&::before": {
              content: '""',
              position: "absolute",
              top: "50%",
              transform: "translateY(-50%)",
              ...(isUser
                ? {
                    right: "-8px",
                    borderLeft: "8px solid",
                    borderRight: "0",
                    borderColor: "primary.main",
                  }
                : {
                    left: "-8px",
                    borderRight: "8px solid",
                    borderLeft: "0",
                    borderColor:
                      theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.12)" : "grey.100",
                  }),
              borderTop: "8px solid transparent",
              borderBottom: "8px solid transparent",
            },
          }}>
          <Typography
            variant="body1"
            sx={{
              bgcolor: isUser
                ? "primary.main"
                : theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.08)"
                  : "grey.100",
              color: isUser ? "primary.contrastText" : "text.primary",
              p: 2,
              borderRadius: 2,
              boxShadow: 1,
            }}>
            {message.content}
          </Typography>
        </Box>

        {message.images.magicKingdom.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Magic Kingdom Results
            </Typography>
            <Grid container spacing={2}>
              {message.images.magicKingdom.map((image, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card
                    sx={{
                      cursor: "pointer",
                      position: "relative",
                      "&:hover": { boxShadow: 6 },
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(255, 255, 255, 0.05)"
                          : "background.paper",
                      border: selectedImages.has(image.url) ? "2px solid" : "none",
                      borderColor: "primary.main",
                    }}
                    onClick={() => onImageSelect(image.url)}>
                    <Box
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        zIndex: 1,
                        bgcolor:
                          theme.palette.mode === "dark"
                            ? "rgba(0, 0, 0, 0.5)"
                            : "rgba(255, 255, 255, 0.9)",
                        borderRadius: "50%",
                        p: 0.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "24px",
                        height: "24px",
                      }}>
                      {selectedImages.has(image.url) ? (
                        <CheckCircleIcon color="primary" sx={{ fontSize: "20px" }} />
                      ) : (
                        <CheckCircleOutlineIcon color="action" sx={{ fontSize: "20px" }} />
                      )}
                    </Box>
                    <CardMedia component="img" height="200" image={image.url} alt={image.name} />
                    <Box sx={{ p: 1 }}>
                      <Typography variant="subtitle2" noWrap>
                        {image.name.split("/").pop()}
                      </Typography>
                      {image.description && (
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {image.description}
                        </Typography>
                      )}
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {message.images.web.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Web Results
            </Typography>
            <Grid container spacing={2}>
              {message.images.web.map((image, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card
                    sx={{
                      cursor: "pointer",
                      position: "relative",
                      "&:hover": { boxShadow: 6 },
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(255, 255, 255, 0.05)"
                          : "background.paper",
                      border: selectedImages.has(image.url) ? "2px solid" : "none",
                      borderColor: "primary.main",
                    }}
                    onClick={() => onImageSelect(image.url)}>
                    <Box
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        zIndex: 1,
                        bgcolor:
                          theme.palette.mode === "dark"
                            ? "rgba(0, 0, 0, 0.5)"
                            : "rgba(255, 255, 255, 0.9)",
                        borderRadius: "50%",
                        p: 0.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "24px",
                        height: "24px",
                      }}>
                      {selectedImages.has(image.url) ? (
                        <CheckCircleIcon color="primary" sx={{ fontSize: "20px" }} />
                      ) : (
                        <CheckCircleOutlineIcon color="action" sx={{ fontSize: "20px" }} />
                      )}
                    </Box>
                    <CardMedia component="img" height="200" image={image.url} alt={image.title} />
                    <Box sx={{ p: 1 }}>
                      <Typography variant="subtitle2" noWrap>
                        {image.title}
                      </Typography>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>
    )
  }

  return (
    <Box
      sx={{
        position: "relative",
        display: "inline-block",
        maxWidth: "80%",
        alignSelf: isUser ? "flex-end" : "flex-start",
        "&::before": {
          content: '""',
          position: "absolute",
          top: "50%",
          transform: "translateY(-50%)",
          ...(isUser
            ? {
                right: "-8px",
                borderLeft: "8px solid",
                borderRight: "0",
                borderColor: "primary.main",
              }
            : {
                left: "-8px",
                borderRight: "8px solid",
                borderLeft: "0",
                borderColor:
                  theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.12)" : "grey.100",
              }),
          borderTop: "8px solid transparent",
          borderBottom: "8px solid transparent",
        },
      }}>
      <Typography
        variant="body1"
        sx={{
          bgcolor: isUser
            ? "primary.main"
            : theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.08)"
              : "grey.100",
          color: isUser ? "primary.contrastText" : "text.primary",
          p: 2,
          borderRadius: 2,
          boxShadow: 1,
        }}>
        {message.content}
      </Typography>
    </Box>
  )
}

type TabType = "cloud" | "web" | "local" | "ai"

const GoogleCloudModal: React.FC<GoogleCloudModalProps> = ({
  open,
  onClose,
  onImageSelect = () => {},
  existingImages = [],
}) => {
  const theme = useTheme()
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>("ai")
  const [selectedImages, setSelectedImages] = useState<Map<string, SelectedImage>>(new Map())
  const [localSelectedImages, setLocalSelectedImages] = useState<Set<string>>(new Set())
  const [webSearchQuery, setWebSearchQuery] = useState("")
  const [webSearchResults, setWebSearchResults] = useState<Array<{ url: string; title: string }>>(
    []
  )
  const [isSearching, setIsSearching] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [cloudImages, setCloudImages] = useState<Array<{ url: string; name: string }>>([])
  const [isLoadingCloud, setIsLoadingCloud] = useState(false)
  const [cloudPage, setCloudPage] = useState(1)
  const [hasMoreCloud, setHasMoreCloud] = useState(true)
  const observer = useRef<IntersectionObserver | null>(null)
  const [images, setImages] = useState<ImageItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [folders, setFolders] = useState<string[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string>("all")
  const [urlCache, setUrlCache] = useState<Map<string, string>>(() => {
    try {
      const savedCache = localStorage.getItem(CACHE_KEY)
      return savedCache ? new Map(JSON.parse(savedCache)) : new Map()
    } catch {
      return new Map()
    }
  })
  const [webSearchError, setWebSearchError] = useState<string | null>(null)
  const [isProcessingLocal, setIsProcessingLocal] = useState(false)

  // Initialize AI image search hook
  const {
    messages,
    input: aiInput,
    setInput: setAiInput,
    isProcessing: isAiProcessing,
    error: aiError,
    handleSend: handleAiSend,
    handleImageSelect: handleAiImageSelect,
    handleConfirmSelection: handleAiConfirmSelection,
    handleClearSelection: handleAiClearSelection,
    isListening,
    startListening,
    stopListening,
    selectedImages: aiSelectedImages,
  } = useAIImageSearch({
    onImageSelect: (urls) => {
      // Add AI selected images to the main selectedImages Map
      setSelectedImages((prev) => {
        const next = new Map(prev)
        urls.forEach((url) => {
          next.set(url, { url, name: "AI Generated" })
        })
        return next
      })
    },
    onClose,
  })

  // Sync AI selected images with main selectedImages Map
  useEffect(() => {
    setSelectedImages((prev) => {
      const next = new Map(prev)
      // Remove AI images that are no longer selected
      Array.from(prev.entries()).forEach(([url, image]) => {
        if (image.name === "AI Generated" && !aiSelectedImages.has(url)) {
          next.delete(url)
        }
      })
      // Add newly selected AI images
      aiSelectedImages.forEach((url) => {
        if (!next.has(url)) {
          next.set(url, { url, name: "AI Generated" })
        }
      })
      return next
    })
  }, [aiSelectedImages])

  // Load images when modal opens
  useEffect(() => {
    if (open) {
      loadImages()
    }
  }, [open])

  // Clear selected images when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedImages(new Map())
      setPage(1)
      setSelectedFolder("all")
      setSearchQuery("")
    }
  }, [open])

  useEffect(() => {
    window.addEventListener("error", handleResizeObserverError)
    return () => {
      window.removeEventListener("error", handleResizeObserverError)
    }
  }, [])

  // Setup intersection observer for lazy loading with debounce
  useEffect(() => {
    const handleIntersection = debounce((entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const imageName = entry.target.getAttribute("data-image-name")
          if (imageName && !urlCache.has(imageName)) {
            getSignedUrl(imageName).then((url) => {
              setUrlCache((prev) => new Map(prev).set(imageName, url))
            })
          }
        }
      })
    }, 100)

    observer.current = new IntersectionObserver(handleIntersection, { threshold: 0.1 })

    return () => observer.current?.disconnect()
  }, [])

  // Save cache to localStorage when it changes
  useEffect(() => {
    try {
      const cacheArray = Array.from(urlCache.entries())
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheArray))
    } catch (error) {
      console.warn("Failed to save cache to localStorage:", error)
    }
  }, [urlCache])

  // Clear cache when modal closes
  useEffect(() => {
    if (!open) {
      setUrlCache((prev) => manageCacheSize(prev))
    }
  }, [open])

  const updateUrlCache = useCallback((imageName: string, url: string) => {
    setUrlCache((prev) => {
      const newCache = new Map(prev)
      newCache.set(imageName, url)
      return manageCacheSize(newCache)
    })
  }, [])

  const createJWT = async () => {
    try {
      const now = Math.floor(Date.now() / 1000)
      const privateKeyString = import.meta.env.VITE_GOOGLE_CLOUD_PRIVATE_KEY

      if (!privateKeyString) {
        throw new Error("Private key not found in environment variables")
      }

      // Try parsing as JSON first (local development format)
      let cleanPrivateKey
      try {
        const parsedKey = JSON.parse(privateKeyString)
        cleanPrivateKey = parsedKey.private_key || parsedKey
      } catch {
        // If JSON parsing fails, treat it as a raw key string (Heroku format)
        cleanPrivateKey = privateKeyString
      }

      // Replace escaped newlines with actual newlines
      cleanPrivateKey = cleanPrivateKey.replace(/\\n/g, "\n")

      // Import the private key
      const privateKey = await jose.importPKCS8(cleanPrivateKey, "RS256")

      const jwt = await new jose.SignJWT({
        scope: "https://www.googleapis.com/auth/cloud-platform",
      })
        .setProtectedHeader({ alg: "RS256", typ: "JWT" })
        .setIssuedAt(now)
        .setExpirationTime(now + 3600)
        .setIssuer(import.meta.env.VITE_GOOGLE_CLOUD_CLIENT_EMAIL)
        .setAudience("https://oauth2.googleapis.com/token")
        .setSubject(import.meta.env.VITE_GOOGLE_CLOUD_CLIENT_EMAIL)
        .setJti(Math.random().toString(36).substring(2))
        .sign(privateKey)

      return jwt
    } catch (err) {
      console.error("JWT creation error:", err)
      throw new Error("Failed to create JWT token")
    }
  }

  const getAccessToken = async () => {
    try {
      const jwt = await createJWT()
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
          assertion: jwt,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Token response error:", errorData)
        throw new Error(errorData.error_description || "Failed to get access token")
      }

      const data = await response.json()
      return data.access_token
    } catch (err) {
      console.error("Authentication error:", err)
      throw new Error("Failed to authenticate with Google Cloud")
    }
  }

  const loadImages = async () => {
    setIsLoadingCloud(true)
    setError(null)
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
        const errorData = await response.json()
        throw new Error(errorData.error?.message || "Failed to load images")
      }

      const data = await response.json()

      if (!data.items || data.items.length === 0) {
        setImages([])
        return
      }

      // Filter image files and prepare items
      const imageItems = data.items
        .filter(
          (item: StorageItem) =>
            item.contentType?.startsWith("image/") || item.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
        )
        .map((item: StorageItem) => ({
          name: item.name,
          uploadedAt: new Date(item.timeCreated || ""),
          folder: item.name.split("/").slice(0, -1).join("/") || "Root",
          metadata: {
            description: item.metadata?.description || "",
            tags: item.metadata?.tags ? item.metadata.tags.split(",") : [],
            ...item.metadata,
          },
        }))

      // Extract unique folders
      const uniqueFolders: string[] = Array.from(
        new Set<string>(imageItems.map((item: ImageItem) => item.folder))
      ).sort()
      setFolders(uniqueFolders)

      // Sort by folder and then by name
      imageItems.sort((a: ImageItem, b: ImageItem) => {
        if (a.folder === b.folder) {
          return a.name.localeCompare(b.name)
        }
        return a.folder.localeCompare(b.folder)
      })

      setImages(imageItems)
    } catch (err) {
      console.error("Load images error:", err)
      setError(err instanceof Error ? err.message : "Failed to load images")
      setImages([])
    } finally {
      setIsLoadingCloud(false)
    }
  }

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

  // Filter images based on search query and selected folder
  const filteredImages = images.filter((image) => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = image.name.toLowerCase().includes(searchLower)
    image.metadata?.description?.toLowerCase().includes(searchLower) ||
      image.metadata?.tags?.some((tag) => tag.toLowerCase().includes(searchLower))

    const matchesFolder = selectedFolder === "all" || image.folder === selectedFolder

    return matchesSearch && matchesFolder
  })

  // Get paginated images
  const paginatedImages = filteredImages.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const handleImageClick = (image: ImageItem) => {
    if (!image.name) return

    if (!urlCache.has(image.name)) {
      getSignedUrl(image.name)
        .then(async (url) => {
          try {
            const processedUrl = await processImage(url)
            updateUrlCache(image.name, processedUrl)
            setSelectedImages((prev) => {
              const next = new Map(prev)
              if (next.has(processedUrl)) {
                next.delete(processedUrl)
              } else {
                next.set(processedUrl, { url: processedUrl, name: image.name })
              }
              return next
            })
          } catch (error) {
            console.error("Failed to process image:", error)
            setError("Failed to process image")
          }
        })
        .catch((error) => {
          console.error("Failed to get signed URL:", error)
          setError("Failed to load image")
        })
    } else {
      // Even if URL is cached, we need to ensure it's processed
      const cachedUrl = urlCache.get(image.name)!
      if (!cachedUrl.includes("#width=")) {
        // If the URL hasn't been processed yet, process it now
        processImage(cachedUrl).then((processedUrl) => {
          setUrlCache((prev) => new Map(prev).set(image.name, processedUrl))
          setSelectedImages((prev) => {
            const next = new Map(prev)
            if (next.has(processedUrl)) {
              next.delete(processedUrl)
            } else {
              next.set(processedUrl, { url: processedUrl, name: image.name })
            }
            return next
          })
        })
      } else {
        // URL is already processed, just toggle selection
        setSelectedImages((prev) => {
          const next = new Map(prev)
          if (next.has(cachedUrl)) {
            next.delete(cachedUrl)
          } else {
            next.set(cachedUrl, { url: cachedUrl, name: image.name })
          }
          return next
        })
      }
    }
  }

  const handleSelectImages = () => {
    if (selectedImages.size > 0 && onImageSelect) {
      const newImages = Array.from(selectedImages.keys())
      onImageSelect([...existingImages, ...newImages])
      onClose()
    }
  }

  const handleWebSearch = async () => {
    if (!webSearchQuery.trim()) return

    setIsSearching(true)
    setWebSearchError(null)

    try {
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${import.meta.env.VITE_GOOGLE_SEARCH_API_KEY}&cx=${import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(webSearchQuery)}&searchType=image`
      )

      if (!response.ok) {
        throw new Error("Failed to fetch search results")
      }

      const data = await response.json()
      setWebSearchResults(
        data.items?.map((item: any) => ({
          url: item.link,
          title: item.title,
        })) || []
      )
    } catch (err) {
      console.error("Web search error:", err)
      setWebSearchError("Failed to fetch search results")
    } finally {
      setIsSearching(false)
    }
  }

  const handleWebImageSelect = async (url: string, title: string) => {
    try {
      const processedUrl = await processImage(url)
      setSelectedImages((prev) => {
        const next = new Map(prev)
        // Check for both original and processed URL
        if (next.has(url) || next.has(processedUrl)) {
          next.delete(url)
          next.delete(processedUrl)
        } else {
          next.set(processedUrl, { url: processedUrl, title })
        }
        return next
      })
    } catch (err) {
      console.error("Error processing web image:", err)
      setError("Failed to process image")
    }
  }

  const handleLocalFiles = async (files: File[]) => {
    if (files.length === 0) return
    setIsProcessingLocal(true)
    setError(null)

    try {
      const imageUrls = await Promise.all(
        files.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = () => reject(new Error("Failed to read file"))
            reader.readAsDataURL(file)
          })
        )
      )

      const processedUrls = await Promise.all(imageUrls.map((url) => processImage(url)))

      // Add processed URLs to the main selectedImages Map
      setSelectedImages((prev) => {
        const next = new Map(prev)
        processedUrls.forEach((url) => {
          next.set(url, { url, name: "Local File" })
        })
        return next
      })
    } catch (err) {
      console.error("Error processing local images:", err)
      setError("Failed to process local images")
    } finally {
      setIsProcessingLocal(false)
    }
  }

  const handleRemoveSelectedImage = (url: string) => {
    // Remove from main selectedImages Map
    setSelectedImages((prev) => {
      const next = new Map(prev)
      next.delete(url)
      // Also remove any variants of the same URL (with or without processing parameters)
      const baseUrl = url.split("#")[0]
      Array.from(next.entries()).forEach(([key, img]) => {
        if (img.url.split("#")[0] === baseUrl) {
          next.delete(key)
        }
      })
      return next
    })

    // Also remove from AI selected images if it exists there
    if (aiSelectedImages.has(url)) {
      handleAiClearSelection()
    }
  }

  const handleUnifiedSelect = () => {
    if (selectedImages.size > 0) {
      const imageUrls = Array.from(selectedImages.keys())
      onImageSelect([...existingImages, ...imageUrls])
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: "80vh",
          maxHeight: "800px",
          m: 0,
        },
      }}>
      <DialogTitle>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ mb: -1 }}>
            <Tab icon={<AutoAwesomeIcon />} label="AI Search" value="ai" />
            <Tab icon={<CloudIcon />} label="Cloud Storage" value="cloud" />
            <Tab icon={<ImageSearchIcon />} label="Web Search" value="web" />
            <Tab icon={<FolderIcon />} label="Local Files" value="local" />
          </Tabs>
        </Box>
      </DialogTitle>
      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          pb: 0,
        }}>
        {(error || aiError) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || aiError}
          </Alert>
        )}

        {activeTab === "ai" ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              maxHeight: "60vh",
            }}>
            <Box
              sx={{
                flexGrow: 1,
                overflowY: "auto",
                p: 2,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                position: "relative",
              }}>
              {messages.length === 0 ? (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    textAlign: "center",
                    p: 4,
                    gap: 2,
                  }}>
                  <AutoAwesomeIcon sx={{ fontSize: 48, color: "primary.main" }} />
                  <Typography variant="h6" color="primary">
                    Welcome to Magic Kingdom Image Search
                  </Typography>
                  <Typography color="text.secondary" sx={{ maxWidth: 400 }}>
                    Describe the image you're looking for, or explore other options using the other
                    tabs.
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      mt: 2,
                      flexWrap: "wrap",
                      justifyContent: "center",
                    }}>
                    <Box
                      onClick={() => setActiveTab("cloud")}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        p: 1.5,
                        borderRadius: 1,
                        bgcolor: "background.paper",
                        border: 1,
                        borderColor: "divider",
                        cursor: "pointer",
                        "&:hover": {
                          bgcolor: "action.hover",
                          borderColor: "primary.main",
                        },
                      }}>
                      <CloudIcon color="action" />
                      <Typography variant="body2">Cloud Storage</Typography>
                    </Box>
                    <Box
                      onClick={() => setActiveTab("web")}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        p: 1.5,
                        borderRadius: 1,
                        bgcolor: "background.paper",
                        border: 1,
                        borderColor: "divider",
                        cursor: "pointer",
                        "&:hover": {
                          bgcolor: "action.hover",
                          borderColor: "primary.main",
                        },
                      }}>
                      <ImageSearchIcon color="action" />
                      <Typography variant="body2">Web Search</Typography>
                    </Box>
                    <Box
                      onClick={() => setActiveTab("local")}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        p: 1.5,
                        borderRadius: 1,
                        bgcolor: "background.paper",
                        border: 1,
                        borderColor: "divider",
                        cursor: "pointer",
                        "&:hover": {
                          bgcolor: "action.hover",
                          borderColor: "primary.main",
                        },
                      }}>
                      <FolderIcon color="action" />
                      <Typography variant="body2">Local Files</Typography>
                    </Box>
                  </Box>
                </Box>
              ) : (
                messages.map((message, index) => (
                  <MessageBubble
                    key={index}
                    message={message}
                    onImageSelect={handleAiImageSelect}
                    selectedImages={aiSelectedImages}
                  />
                ))
              )}
              <div style={{ height: "20px" }} />
            </Box>

            <Box
              sx={{
                p: 2,
                borderTop: 1,
                borderColor: "divider",
                display: "flex",
                gap: 1,
              }}>
              <TextField
                fullWidth
                placeholder="Describe the image you want..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAiSend()}
                disabled={isAiProcessing || isListening}
                sx={{
                  "& .MuiInputBase-input": {
                    padding: "12px 14px",
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Tooltip title={isListening ? "Stop recording" : "Start voice input"}>
                          <IconButton
                            onClick={isListening ? stopListening : startListening}
                            disabled={isAiProcessing}
                            color={isListening ? "error" : "default"}>
                            {isListening ? <MicOffIcon /> : <MicIcon />}
                          </IconButton>
                        </Tooltip>
                        <IconButton
                          onClick={handleAiSend}
                          disabled={isAiProcessing || !aiInput.trim() || isListening}>
                          {isAiProcessing ? <CircularProgress size={24} /> : <SendIcon />}
                        </IconButton>
                      </Box>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>
        ) : activeTab === "cloud" ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              pb: 2,
            }}>
            <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Folder</InputLabel>
                <Select
                  value={selectedFolder}
                  label="Folder"
                  onChange={(e) => {
                    setSelectedFolder(e.target.value)
                    setPage(1)
                  }}>
                  <MenuItem value="all">All Folders</MenuItem>
                  {folders.map((folder) => (
                    <MenuItem key={folder} value={folder}>
                      {folder}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search cloud storage images..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: 48,
                  },
                }}
              />
            </Box>

            {isLoadingCloud ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                <CircularProgress />
              </Box>
            ) : filteredImages.length === 0 ? (
              <Box sx={{ textAlign: "center", p: 3 }}>
                <Typography color="text.secondary">
                  {searchQuery ? "No images found matching your search." : "No images available."}
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
                  <Grid container spacing={2}>
                    {paginatedImages.map((image) => (
                      <Grid item xs={12} sm={6} md={4} key={image.name}>
                        <Card
                          sx={{
                            cursor: "pointer",
                            "&:hover": { boxShadow: 6 },
                            position: "relative",
                            border:
                              urlCache.has(image.name) &&
                              selectedImages.has(urlCache.get(image.name)!)
                                ? "2px solid"
                                : "none",
                            borderColor: "primary.main",
                          }}
                          onClick={() => handleImageClick(image)}>
                          <Box
                            sx={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              zIndex: 1,
                              bgcolor:
                                theme.palette.mode === "dark"
                                  ? "rgba(0, 0, 0, 0.5)"
                                  : "rgba(255, 255, 255, 0.9)",
                              borderRadius: "50%",
                              p: 0.5,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "24px",
                              height: "24px",
                            }}>
                            {urlCache.has(image.name) &&
                            selectedImages.has(urlCache.get(image.name)!) ? (
                              <CheckCircleIcon color="primary" sx={{ fontSize: "20px" }} />
                            ) : (
                                <CheckCircleOutlineIcon color="action" sx={{ fontSize: "20px" }} />
                            )}
                          </Box>
                          <Box
                            ref={(el: HTMLDivElement | null) => {
                              if (el) {
                                el.setAttribute("data-image-name", image.name)
                                observer.current?.observe(el)
                              }
                            }}
                            sx={{
                              height: 200,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              bgcolor: "grey.100",
                            }}>
                            {urlCache.has(image.name) ? (
                              <CardMedia
                                component="img"
                                height="200"
                                image={urlCache.get(image.name)}
                                alt={image.name}
                              />
                            ) : (
                              <CircularProgress size={24} />
                            )}
                          </Box>
                          <Box sx={{ p: 1 }}>
                            <Typography variant="subtitle2" noWrap>
                              {image.name.split("/").pop()}
                            </Typography>
                            {image.metadata?.description && (
                              <Typography variant="body2" color="text.secondary" noWrap>
                                {image.metadata.description}
                              </Typography>
                            )}
                            {image.metadata?.tags && image.metadata.tags.length > 0 && (
                              <Box sx={{ mt: 1, display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                                {image.metadata.tags.map((tag, index) => (
                                  <Typography
                                    key={index}
                                    variant="caption"
                                    sx={{
                                      bgcolor: "primary.light",
                                      color: "primary.contrastText",
                                      px: 1,
                                      py: 0.5,
                                      borderRadius: 1,
                                    }}>
                                    {tag}
                                  </Typography>
                                ))}
                              </Box>
                            )}
                          </Box>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                <Box
                  sx={{
                    mt: 3,
                    display: "flex",
                    justifyContent: "center",
                    pb: 2,
                  }}>
                  <Pagination
                    count={Math.ceil(filteredImages.length / ITEMS_PER_PAGE)}
                    page={page}
                    onChange={(_, value) => setPage(value)}
                    color="primary"
                  />
                </Box>
              </>
            )}
          </Box>
        ) : activeTab === "web" ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              pb: 2,
            }}>
            <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search for images on the web..."
                value={webSearchQuery}
                onChange={(e) => setWebSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleWebSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                onClick={handleWebSearch}
                disabled={isSearching}
                sx={{
                  minWidth: "100px",
                  height: "40px", // Match TextField height
                  marginTop: "7px",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                }}>
                {isSearching ? <CircularProgress size={24} color="inherit" /> : "Search"}
              </Button>
            </Box>

            {webSearchError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {webSearchError}
              </Alert>
            )}

            {isSearching ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                <CircularProgress />
              </Box>
            ) : webSearchResults.length > 0 ? (
              <Grid container spacing={2}>
                {webSearchResults.map((image, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card
                      sx={{
                        cursor: "pointer",
                        "&:hover": { boxShadow: 6 },
                        position: "relative",
                        border: Array.from(selectedImages.values()).some(
                          (img) => img.url.split("#")[0] === image.url
                        )
                          ? "2px solid"
                          : "none",
                        borderColor: "primary.main",
                      }}
                      onClick={() => handleWebImageSelect(image.url, image.title)}>
                      <Box
                        sx={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          zIndex: 1,
                          bgcolor:
                            theme.palette.mode === "dark"
                              ? "rgba(0, 0, 0, 0.5)"
                              : "rgba(255, 255, 255, 0.9)",
                          borderRadius: "50%",
                          p: 0.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "24px",
                          height: "24px",
                        }}>
                        {Array.from(selectedImages.values()).some(
                          (img) => img.url.split("#")[0] === image.url
                        ) ? (
                          <CheckCircleIcon color="primary" sx={{ fontSize: "20px" }} />
                        ) : (
                            <CheckCircleOutlineIcon color="action" sx={{ fontSize: "20px" }} />
                        )}
                      </Box>
                      <Box sx={{ position: "relative", paddingTop: "75%" }}>
                        <CardMedia
                          component="img"
                          image={image.url}
                          alt={image.title}
                          sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </Box>
                      <Box sx={{ p: 1 }}>
                        <Typography variant="subtitle2" noWrap>
                          {image.title}
                        </Typography>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              webSearchResults.length === 0 &&
              !isSearching &&
              webSearchQuery && (
                <Box sx={{ textAlign: "center", p: 3 }}>
                  <Typography color="text.secondary">No results found</Typography>
                </Box>
              )
            )}

            {webSearchResults.length === 0 && !isSearching && !webSearchQuery && (
              <Box sx={{ textAlign: "center", p: 3 }}>
                <Typography color="text.secondary">Enter a search term to find images</Typography>
              </Box>
            )}
          </Box>
        ) : activeTab === "local" ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              pb: 2,
            }}>
            <Box sx={{ p: 3, textAlign: "center" }}>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={async (e) => {
                  const files = Array.from(e.target.files || [])
                  handleLocalFiles(files)
                }}
                style={{ display: "none" }}
                id="local-image-input"
              />
              <Box
                sx={{
                  border: "2px dashed",
                  borderColor: "divider",
                  borderRadius: 2,
                  p: 6,
                  cursor: isProcessingLocal ? "wait" : "pointer",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: "action.hover",
                  },
                  position: "relative",
                }}
                onClick={() =>
                  !isProcessingLocal && document.getElementById("local-image-input")?.click()
                }
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (!isProcessingLocal) {
                    const box = e.currentTarget
                    box.style.borderColor = theme.palette.secondary.main
                    box.style.backgroundColor = theme.palette.action.hover
                  }
                }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const box = e.currentTarget
                  box.style.borderColor = theme.palette.divider
                  box.style.backgroundColor = "transparent"
                }}
                onDrop={async (e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const box = e.currentTarget
                  box.style.borderColor = theme.palette.divider
                  box.style.backgroundColor = "transparent"

                  if (isProcessingLocal) return

                  const files = Array.from(e.dataTransfer.files).filter((file) =>
                    file.type.startsWith("image/")
                  )
                  handleLocalFiles(files)
                }}>
                {isProcessingLocal ? (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "rgba(255, 255, 255, 0.8)",
                    }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    <FolderIcon sx={{ fontSize: 48, color: "action.active", mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Click to Select Images
                    </Typography>
                    <Typography color="text.secondary">
                      or drag and drop image files here
                    </Typography>
                  </>
                )}
              </Box>
            </Box>
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: 1,
          borderColor: "divider",
          bgcolor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "background.paper",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}>
        {selectedImages.size > 0 && (
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                Selected Images ({selectedImages.size})
              </Typography>
              <IconButton
                size="small"
                onClick={() => setSelectedImages(new Map())}
                sx={{
                  color: "text.secondary",
                  "&:hover": {
                    color: "error.main",
                  },
                }}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                overflowX: "auto",
                pb: 1,
                "&::-webkit-scrollbar": {
                  height: 6,
                },
                "&::-webkit-scrollbar-track": {
                  bgcolor: "background.paper",
                },
                "&::-webkit-scrollbar-thumb": {
                  bgcolor: "divider",
                  borderRadius: 3,
                },
              }}>
              {Array.from(selectedImages.entries()).map(([url, image], index) => (
                <Box
                  key={index}
                  sx={{
                    position: "relative",
                    width: 100,
                    height: 100,
                    flexShrink: 0,
                    borderRadius: 1,
                    overflow: "hidden",
                    border: "1px solid",
                    borderColor: "divider",
                  }}>
                  <CardMedia
                    component="img"
                    image={url}
                    alt={image.title || image.name || `Selected image ${index + 1}`}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveSelectedImage(url)}
                    sx={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      bgcolor: "rgba(0, 0, 0, 0.5)",
                      "&:hover": {
                        bgcolor: "rgba(0, 0, 0, 0.7)",
                        color: "error.main",
                      },
                    }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>
        )}
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-end",
            gap: 1,
          }}>
          <Button onClick={onClose}>Cancel</Button>
          {selectedImages.size > 0 && (
            <Button
              variant="contained"
              onClick={handleUnifiedSelect}
              startIcon={<CheckCircleIcon />}>
              Add Selected Images ({selectedImages.size})
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  )
}

export default GoogleCloudModal
