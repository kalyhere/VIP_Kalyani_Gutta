import React, { useState, useEffect, useRef } from "react"
import { Box, Skeleton } from "@mui/material"

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number | string
  height?: number | string
  lazy?: boolean
  className?: string
  onLoad?: () => void
  onError?: () => void
}

/**
 * Optimized image component with lazy loading support
 * Uses Intersection Observer for better performance
 *
 * @example
 * <OptimizedImage
 *   src="/images/avatar.jpg"
 *   alt="User avatar"
 *   width={200}
 *   height={200}
 *   lazy={true}
 * />
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  lazy = true,
  className,
  onLoad,
  onError,
}: OptimizedImageProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(!lazy)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (!lazy || !imgRef.current) {
      return
    }

    // Use Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: "50px", // Start loading 50px before entering viewport
      }
    )

    observer.observe(imgRef.current)

    return () => {
      observer.disconnect()
    }
  }, [lazy])

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  return (
    <Box
      ref={imgRef}
      sx={{
        width: width || "100%",
        height: height || "auto",
        position: "relative",
        display: "inline-block",
      }}>
      {isLoading && !hasError && (
        <Skeleton
          variant="rectangular"
          width={width || "100%"}
          height={height || "100%"}
          sx={{ position: "absolute", top: 0, left: 0 }}
        />
      )}
      {hasError ? (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "grey.200",
            color: "grey.500",
          }}>
          Failed to load image
        </Box>
      ) : (
        shouldLoad && (
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={className}
            loading={lazy ? "lazy" : "eager"}
            onLoad={handleLoad}
            onError={handleError}
            style={{
              display: isLoading ? "none" : "block",
              width: width || "100%",
              height: height || "auto",
              objectFit: "cover",
            }}
          />
        )
      )}
    </Box>
  )
}
