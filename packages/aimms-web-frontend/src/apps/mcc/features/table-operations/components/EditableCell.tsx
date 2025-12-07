import React, { useState, useEffect } from "react"
import { TextField, Box, Tooltip, Grid, Slider, Dialog, IconButton, useTheme } from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import ImageIcon from "@mui/icons-material/Image"
import ZoomInIcon from "@mui/icons-material/ZoomIn"
import ZoomOutIcon from "@mui/icons-material/ZoomOut"

interface TableCell {
  id: string
  content: string
  isHeader: boolean
  colSpan?: number
  isAIGenerated?: boolean
  originalVariable?: string
  imageUrls?: string[]
}

interface EditableCellProps {
  cell: TableCell
  tableId: string
  rowId: string
  onCellChange: (
    tableId: string,
    rowId: string,
    cellId: string,
    content: string,
    newImageUrls?: string[]
  ) => void
  attemptedFields: Set<string>
  isValidVariableFormat: (content: string) => boolean
  onRemoveImage?: (cellId: string, imageIndex: number) => void
  onOpenGoogleCloud?: (cellId: string) => void
}

const getDimensionsFromUrl = (url: string): { width: number; height: number } | null => {
  const [, hash] = url.split("#")
  if (!hash) return null

  const params = new URLSearchParams(hash)
  const width = Number(params.get("width"))
  const height = Number(params.get("height"))

  if (!isNaN(width) && !isNaN(height)) {
    return { width, height }
  }
  return null
}

const updateUrlDimensions = (url: string, width: number, height: number): string => {
  const [baseUrl] = url.split("#")
  return `${baseUrl}#width=${Math.round(width)}&height=${Math.round(height)}`
}

const processImage = (imageUrl: string): Promise<string> => new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      // Calculate dimensions to maintain aspect ratio with max height of 256px
      const aspectRatio = img.height / img.width
      const width = Math.min(img.width, Math.round(256 / aspectRatio))
      const height = Math.round(width * aspectRatio)
      resolve(updateUrlDimensions(imageUrl, width, height))
    }
    img.src = imageUrl
  })

const EditableCell = React.memo(
  ({
    cell,
    tableId,
    rowId,
    onCellChange,
    attemptedFields,
    isValidVariableFormat,
    onRemoveImage,
    onOpenGoogleCloud,
  }: EditableCellProps) => {
    const theme = useTheme()
    const [localContent, setLocalContent] = useState(cell.content)
    const [showControls, setShowControls] = useState(false)
    const [hoveredImageIndex, setHoveredImageIndex] = useState<number | null>(null)
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)

    useEffect(() => {
      setLocalContent(cell.content)
    }, [cell.content])

    const handleImageLoad = (imageUrl: string, event: React.SyntheticEvent<HTMLImageElement>) => {
      const img = event.target as HTMLImageElement
      const dimensions = getDimensionsFromUrl(imageUrl)
      if (!dimensions) {
        const newUrl = updateUrlDimensions(imageUrl, img.naturalWidth, img.naturalHeight)
        onCellChange(
          tableId,
          rowId,
          cell.id,
          cell.content,
          cell.imageUrls?.map((url) => (url === imageUrl ? newUrl : url)),
        )
      }
    }

    const handleResize = (imageUrl: string, scale: number) => {
      const dimensions = getDimensionsFromUrl(imageUrl)
      if (dimensions) {
        const newUrl = updateUrlDimensions(
          imageUrl,
          dimensions.width * scale,
          dimensions.height * scale,
        )
        onCellChange(
          tableId,
          rowId,
          cell.id,
          cell.content,
          cell.imageUrls?.map((url) => (url === imageUrl ? newUrl : url)),
        )
      }
    }

    // Update main state immediately when brackets are typed
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newContent = e.target.value
      setLocalContent(newContent)

      // If brackets are added/removed or if the content becomes valid, update main state immediately
      if (
        newContent.includes("{") !== localContent.includes("{")
        || (newContent.includes("{") && isValidVariableFormat(newContent))
      ) {
        onCellChange(tableId, rowId, cell.id, newContent)
      }
    }

    const handleImageDrop = async (file: File) => {
      const reader = new FileReader()
      reader.onload = async () => {
        const imageUrl = reader.result as string
        const processedUrl = await processImage(imageUrl)

        onCellChange(
          tableId,
          rowId,
          cell.id,
          "",
          cell.imageUrls ? [...cell.imageUrls, processedUrl] : [processedUrl],
        )
      }
      reader.readAsDataURL(file)
    }

    const getImageAspectRatio = (url: string): Promise<number> => new Promise((resolve) => {
        const img = new Image()
        img.onload = () => resolve(img.height / img.width)
        img.src = url
      })

    if (cell.imageUrls && cell.imageUrls.length > 0) {
      return (
        <>
          <Box
            sx={{
              position: "relative",
              width: "100%",
              display: "flex",
              justifyContent: "center",
            }}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => {
              setShowControls(false)
              setHoveredImageIndex(null)
            }}>
            <Grid container spacing={1} sx={{ maxWidth: "100%" }}>
              {cell.imageUrls.map((imageUrl, index) => {
                const dimensions = getDimensionsFromUrl(imageUrl)
                return (
                  <Grid item key={index} xs={12}>
                    <Box
                      sx={{
                        position: "relative",
                        display: "inline-flex",
                        justifyContent: "center",
                        width: "100%",
                      }}
                      onMouseEnter={() => setHoveredImageIndex(index)}
                      onMouseLeave={() => setHoveredImageIndex(null)}>
                      <Box
                        sx={{
                          position: "relative",
                          display: "inline-block",
                          maxWidth: "100%",
                          cursor: "pointer",
                          "& img": {
                            transition: "transform 0.2s ease-in-out",
                          },
                          "&:hover img": {
                            transform: "scale(1.02)",
                          },
                        }}>
                        <img
                          src={imageUrl.split("#")[0]}
                          alt=""
                          onLoad={(e) => handleImageLoad(imageUrl, e)}
                          onClick={() => setSelectedImageUrl(imageUrl)}
                          style={{
                            width: dimensions?.width || "auto",
                            height: dimensions?.height || "auto",
                            maxWidth: "100%",
                            display: "block",
                          }}
                        />
                        {showControls && hoveredImageIndex === index && (
                          <Box
                            sx={{
                              position: "absolute",
                              top: 4,
                              right: 4,
                              display: "flex",
                              gap: 1,
                              backgroundColor:
                                theme.palette.mode === "dark"
                                  ? "rgba(0, 0, 0, 0.7)"
                                  : "rgba(255, 255, 255, 0.9)",
                              padding: "4px",
                              borderRadius: "4px",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                              zIndex: 2,
                            }}>
                            <Tooltip title="Zoom out">
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: 24,
                                  height: 24,
                                  cursor: "pointer",
                                  "&:hover": {
                                    color: "primary.main",
                                  },
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleResize(imageUrl, 0.9)
                                }}>
                                <ZoomOutIcon sx={{ fontSize: "1rem" }} />
                              </Box>
                            </Tooltip>
                            <Tooltip title="Zoom in">
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: 24,
                                  height: 24,
                                  cursor: "pointer",
                                  "&:hover": {
                                    color: "primary.main",
                                  },
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleResize(imageUrl, 1.1)
                                }}>
                                <ZoomInIcon sx={{ fontSize: "1rem" }} />
                              </Box>
                            </Tooltip>
                            {onRemoveImage && (
                              <Tooltip title="Remove image">
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: 24,
                                    height: 24,
                                    cursor: "pointer",
                                    "&:hover": {
                                      color: "error.main",
                                    },
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onRemoveImage(cell.id, index)
                                  }}>
                                  <CloseIcon sx={{ fontSize: "1rem" }} />
                                </Box>
                              </Tooltip>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                )
              })}
            </Grid>
            {showControls && (
              <Box
                sx={{
                  position: "absolute",
                  right: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "flex",
                  opacity: 1,
                  transition: "all 0.2s ease-in-out",
                  zIndex: 1,
                  p: 0.5,
                }}>
                <Tooltip title="Add image from Google Cloud">
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(255, 255, 255, 0.7)"
                          : "rgba(0, 0, 0, 0.54)",
                      borderRadius: "4px",
                      padding: "2px 4px",
                      height: "20px",
                      width: "24px",
                      cursor: "pointer",
                      "&:hover": {
                        color: (theme) =>
                          theme.palette.mode === "dark"
                            ? "rgba(255, 255, 255, 0.9)"
                            : "rgba(0, 0, 0, 0.87)",
                        backgroundColor: "rgba(255, 255, 255, 0.08)",
                      },
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenGoogleCloud?.(cell.id)
                    }}>
                    <ImageIcon sx={{ fontSize: "0.875rem" }} />
                  </Box>
                </Tooltip>
              </Box>
            )}
          </Box>

          <Dialog
            open={!!selectedImageUrl}
            onClose={() => setSelectedImageUrl(null)}
            maxWidth={false}
            PaperProps={{
              sx: {
                backgroundColor: "transparent",
                boxShadow: "none",
                position: "relative",
                overflow: "visible",
              },
            }}>
            <IconButton
              onClick={() => setSelectedImageUrl(null)}
              sx={{
                position: "absolute",
                right: -40,
                top: -40,
                color: "white",
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                },
              }}>
              <CloseIcon />
            </IconButton>
            {selectedImageUrl && (
              <img
                src={selectedImageUrl}
                alt=""
                style={{
                  maxHeight: "90vh",
                  maxWidth: "90vw",
                  objectFit: "contain",
                  borderRadius: "4px",
                }}
              />
            )}
          </Dialog>
        </>
      )
    }

    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          position: "relative",
          pr: showControls ? 5 : 0,
          transition: "padding 0.2s ease-in-out",
        }}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onDrop={async (e) => {
          e.preventDefault()
          e.stopPropagation()

          const file = e.dataTransfer.files[0]
          if (file && file.type.startsWith("image/")) {
            await handleImageDrop(file)
          }
        }}>
        <TextField
          fullWidth
          multiline
          variant="standard"
          value={localContent}
          onChange={handleChange}
          onBlur={() => {
            if (localContent !== cell.content) {
              onCellChange(tableId, rowId, cell.id, localContent)
            }
          }}
          placeholder="Enter content or {variable_name}"
          error={
            attemptedFields.has(cell.id)
            && localContent.includes("{")
            && !isValidVariableFormat(localContent)
          }
          InputProps={{
            disableUnderline: true,
            sx: {
              fontSize: "0.875rem",
              "& textarea": {
                padding: "0",
                backgroundColor: "transparent",
              },
            },
          }}
        />
        {showControls && (
          <Box
            sx={{
              position: "absolute",
              right: 0,
              display: "flex",
              opacity: 1,
              transition: "all 0.2s ease-in-out",
              transform: "translateX(0)",
              zIndex: 1,
              p: 0.5,
            }}>
            <Tooltip title="Add image from Google Cloud">
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.7)"
                      : "rgba(0, 0, 0, 0.54)",
                  borderRadius: "4px",
                  padding: "2px 4px",
                  height: "20px",
                  width: "24px",
                  cursor: "pointer",
                  "&:hover": {
                    color: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255, 255, 255, 0.9)"
                        : "rgba(0, 0, 0, 0.87)",
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                  },
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenGoogleCloud?.(cell.id)
                }}>
                <ImageIcon sx={{ fontSize: "0.875rem" }} />
              </Box>
            </Tooltip>
          </Box>
        )}
      </Box>
    )
  },
)

export default EditableCell
