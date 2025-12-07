export interface DetectionResult {
  id: number
  bbox: {
    x1: number
    y1: number
    x2: number
    y2: number
  }
  confidence: number
  class_id: number
}

export interface AnalysisResult {
  success: boolean
  image_info: {
    filename: string
    size: [number, number]
  }
  detections: DetectionResult[]
  measurements: {
    stitch_count: number
    stitch_lengths: number[]
    average_stitch_length: number
    stitch_angles: number[]
    average_angle: number
    pixels_per_mm?: number | null
    quality_assessment: string
    pattern_symmetry?: any
    spacing_uniformity?: any
    quality_metrics?: any
  }
  processed_by: string
}
