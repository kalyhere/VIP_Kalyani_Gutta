"""FastAPI routes for suture analysis."""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import JSONResponse
from typing import Dict, Any, Optional
import cv2
import numpy as np
import io
from PIL import Image
import logging
import traceback
from pathlib import Path
import os

# Enable HEIC/HEIF support for iPhone images
try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
    logger = logging.getLogger(__name__)
    logger.info("HEIC/HEIF support enabled for iPhone images")
except ImportError:
    logger = logging.getLogger(__name__)
    logger.warning("pillow-heif not available, HEIC/HEIF images may not be supported")

from auth.dependencies import require_admin_role
from ml.model import SutureDetector, ModelError, DetectionError, MeasurementError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/suture", tags=["suture-analysis"])

# Initialize model (will be loaded from weights directory)
detector: Optional[SutureDetector] = None

def get_detector() -> SutureDetector:
    """Get or initialize the suture detector."""
    global detector
    if detector is None:
        try:
            # Look for model weights in the weights directory
            weights_dir = Path(__file__).parent.parent.parent / "weights"
            
            # Priority order: trained suture model > generic YOLOv8 > any .pt file
            model_candidates = [
                weights_dir / "suture_yolov8_best.pt",  # Trained suture model
                weights_dir / "yolov8n.pt",             # Generic YOLOv8
                *weights_dir.glob("*.pt")               # Any other .pt files
            ]
            
            model_path = None
            for candidate in model_candidates:
                if candidate.exists():
                    model_path = candidate
                    break
            
            if not model_path:
                raise ModelError("No model weights found in weights directory")
            
            detector = SutureDetector(model_path, conf_threshold=0.25)  # Reset to working threshold
            
            # Log which model was loaded
            if model_path.name == "suture_yolov8_best.pt":
                logger.info(f"✅ Loaded TRAINED suture detection model: {model_path}")
            else:
                logger.info(f"⚠️ Loaded generic model: {model_path} (consider training suture-specific model)")
            
        except Exception as e:
            logger.error(f"Failed to initialize detector: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Model initialization failed: {str(e)}"
            )
    
    return detector

def process_uploaded_image(upload_file: UploadFile) -> np.ndarray:
    """
    Process uploaded image file into numpy array with enhanced iPhone support.
    
    Args:
        upload_file: Uploaded image file
        
    Returns:
        Image as numpy array in BGR format
        
    Raises:
        HTTPException: If image processing fails
    """
    try:
        # Read image data
        image_data = upload_file.file.read()
        
        # Convert to PIL Image (handles HEIC/HEIF if pillow-heif installed)
        pil_image = Image.open(io.BytesIO(image_data))
        
        # Handle iPhone-specific optimizations
        logger.info(f"Processing image: {pil_image.mode}, size: {pil_image.size}, format: {pil_image.format}")
        
        # Convert to sRGB color space if needed (iPhone uses P3 wide gamut)
        if hasattr(pil_image, 'info') and 'icc_profile' in pil_image.info:
            try:
                # Convert from wide gamut to sRGB for better model compatibility
                from PIL import ImageCms
                input_profile = ImageCms.ImageCmsProfile(io.BytesIO(pil_image.info['icc_profile']))
                srgb_profile = ImageCms.createProfile('sRGB')
                pil_image = ImageCms.profileToProfile(pil_image, input_profile, srgb_profile)
                logger.info("Applied color profile conversion from wide gamut to sRGB")
            except Exception as e:
                logger.warning(f"Color profile conversion failed, continuing: {str(e)}")
        
        # Convert to RGB if needed
        if pil_image.mode != 'RGB':
            pil_image = pil_image.convert('RGB')
        
        # Handle high resolution iPhone images - resize if too large
        max_dimension = 2048  # Balance between quality and processing speed
        if max(pil_image.size) > max_dimension:
            ratio = max_dimension / max(pil_image.size)
            new_size = tuple(int(dim * ratio) for dim in pil_image.size)
            pil_image = pil_image.resize(new_size, Image.Resampling.LANCZOS)
            logger.info(f"Resized image from {upload_file.filename} to {new_size}")
        
        # Convert to numpy array
        image_array = np.array(pil_image)
        
        # Convert RGB to BGR for OpenCV
        image_bgr = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
        
        return image_bgr
        
    except Exception as e:
        logger.error(f"Image processing failed for {upload_file.filename}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image format: {str(e)}"
        )

def process_uploaded_image_with_metadata(upload_file: UploadFile) -> tuple[np.ndarray, dict, str]:
    """
    Process uploaded image file with metadata for iPhone optimization.
    Automatically converts HEIC/HEIF to JPEG format immediately for ML compatibility.
    
    Returns:
        Tuple of (image_array, metadata_dict, jpeg_data_url)
    """
    try:
        # Read image data
        image_data = upload_file.file.read()
        
        # Convert to PIL Image (handles HEIC/HEIF if pillow-heif installed)
        pil_image = Image.open(io.BytesIO(image_data))
        
        # Check if this is a HEIC/HEIF file
        is_heic = pil_image.format in ['HEIF', 'HEIC'] if pil_image.format else False
        original_format = pil_image.format
        
        logger.info(f"Image format detected: {original_format}, is_heic: {is_heic}")
        
        # Collect metadata
        metadata = {
            'original_size': pil_image.size,
            'format': original_format,
            'mode': pil_image.mode,
            'is_high_res_mobile': max(pil_image.size) > 3000,  # Likely iPhone/high-end mobile
            'has_color_profile': hasattr(pil_image, 'info') and 'icc_profile' in pil_image.info,
            'was_heic': is_heic
        }
        
        # Handle iPhone-specific optimizations
        logger.info(f"Processing image: {pil_image.mode}, size: {pil_image.size}, format: {original_format}")
        
        if is_heic:
            logger.info("Converting HEIC/HEIF image to JPEG format for ML model compatibility")
        
        # Convert to sRGB color space if needed (iPhone uses P3 wide gamut)
        if metadata['has_color_profile']:
            try:
                # Convert from wide gamut to sRGB for better model compatibility
                from PIL import ImageCms
                input_profile = ImageCms.ImageCmsProfile(io.BytesIO(pil_image.info['icc_profile']))
                srgb_profile = ImageCms.createProfile('sRGB')
                pil_image = ImageCms.profileToProfile(pil_image, input_profile, srgb_profile)
                logger.info("Applied color profile conversion from wide gamut to sRGB")
            except Exception as e:
                logger.warning(f"Color profile conversion failed, continuing: {str(e)}")
        
        # Convert to RGB if needed (HEIC images are often in different color modes)
        if pil_image.mode != 'RGB':
            logger.info(f"Converting image from {pil_image.mode} to RGB")
            pil_image = pil_image.convert('RGB')
        
        # Handle high resolution iPhone images - resize if too large
        max_dimension = 2048  # Balance between quality and processing speed
        if max(pil_image.size) > max_dimension:
            ratio = max_dimension / max(pil_image.size)
            new_size = tuple(int(dim * ratio) for dim in pil_image.size)
            pil_image = pil_image.resize(new_size, Image.Resampling.LANCZOS)
            logger.info(f"Resized image from {upload_file.filename} to {new_size}")
            metadata['resized_to'] = new_size
        
        # ALWAYS create JPEG data URL for frontend (whether original was HEIC or not)
        logger.info("Creating JPEG data URL for frontend display")
        jpeg_buffer = io.BytesIO()
        pil_image.save(jpeg_buffer, format='JPEG', quality=90)
        jpeg_bytes = jpeg_buffer.getvalue()
        
        # Convert to base64 for frontend
        import base64
        jpeg_data_url = f"data:image/jpeg;base64,{base64.b64encode(jpeg_bytes).decode('utf-8')}"
        
        if is_heic:
            logger.info("HEIC/HEIF image successfully converted to JPEG for ML processing and display")
            metadata['converted_to_jpeg'] = True
        else:
            logger.info("Image converted to standardized JPEG format for consistent processing")
        
        # Convert to numpy array
        image_array = np.array(pil_image)
        
        # Convert RGB to BGR for OpenCV
        image_bgr = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
        
        return image_bgr, metadata, jpeg_data_url
        
    except Exception as e:
        logger.error(f"Image processing failed for {upload_file.filename}: {str(e)}")
        if "cannot identify image file" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported image format. Please upload JPEG, PNG, or HEIC images."
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image processing failed: {str(e)}"
        )

@router.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        # Try to get detector to verify model is available
        detector = get_detector()
        return {"status": "healthy", "model_loaded": detector is not None}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

@router.post("/test-analyze")
async def test_analyze_suture(file: UploadFile = File(...)) -> JSONResponse:
    """
    Test endpoint for analyzing suture images without authentication.
    TEMPORARY - for testing HEIC improvements.
    """
    try:
        logger.info(f"TEST: Processing suture analysis for file: {file.filename}")
        
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )
        
        # Process image and get metadata + JPEG data URL
        image, image_metadata, jpeg_data_url = process_uploaded_image_with_metadata(file)
        
        logger.info(f"TEST: Image metadata: {image_metadata}")
        
        # Get detector
        detector = get_detector()
        
        # Adjust confidence threshold for high-resolution iPhone images
        original_threshold = detector.conf_threshold
        is_high_res_mobile = image_metadata.get('is_high_res_mobile', False)
        
        if is_high_res_mobile:
            detector.conf_threshold = 0.2  # Lower threshold for iPhone photos
            logger.info(f"TEST: High-res mobile image detected, using lower confidence threshold: {detector.conf_threshold}")
        else:
            logger.info(f"TEST: Using standard confidence threshold: {detector.conf_threshold}")
        
        # Perform detection
        boxes, scores, class_ids = detector.detect(image)
        
        # Restore original threshold
        detector.conf_threshold = original_threshold
        logger.info(f"TEST: Detection results: {len(boxes)} boxes, scores: {scores[:5] if len(scores) > 0 else 'none'}")
        
        # Format detection results
        detections = []
        for i, (box, score, class_id) in enumerate(zip(boxes, scores, class_ids)):
            detections.append({
                "id": i,
                "bbox": {
                    "x1": float(box[0]),
                    "y1": float(box[1]),
                    "x2": float(box[2]),
                    "y2": float(box[3])
                },
                "confidence": float(score),
                "class_id": int(class_id)
            })
        
        result = {
            "success": True,
            "test_mode": True,
            "image_info": {
                "filename": file.filename,
                "size": image.shape[:2],
                "metadata": image_metadata
            },
            "detections": detections,
            "detection_summary": {
                "count": len(detections),
                "confidence_scores": [float(score) for score in scores] if len(scores) > 0 else [],
                "avg_confidence": float(scores.mean()) if len(scores) > 0 else 0
            }
        }
        
        logger.info(f"TEST: Analysis completed successfully for {file.filename}")
        return JSONResponse(content=result)
        
    except Exception as e:
        logger.error(f"TEST: Analysis failed: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Test analysis failed: {str(e)}"
        )

@router.post("/analyze")
async def analyze_suture(
    file: UploadFile = File(...),
    user: Dict[str, Any] = Depends(require_admin_role)
) -> JSONResponse:
    """
    Analyze suture image and return detection results with measurements.
    
    Args:
        file: Uploaded image file
        user: Current authenticated user (admin required)
        
    Returns:
        JSON response with analysis results
    """
    try:
        logger.info(f"Processing suture analysis for user: {user.get('email')}")
        
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )
        
        # Process image and get metadata + JPEG data URL
        image, image_metadata, jpeg_data_url = process_uploaded_image_with_metadata(file)
        
        # Get detector
        detector = get_detector()
        
        # Adjust confidence threshold for high-resolution iPhone images
        original_threshold = detector.conf_threshold
        is_high_res_mobile = image_metadata.get('is_high_res_mobile', False)
        
        if is_high_res_mobile:
            detector.conf_threshold = 0.2  # Lower threshold for iPhone photos
            logger.info(f"High-res mobile image detected, using lower confidence threshold: {detector.conf_threshold}")
        else:
            logger.info(f"Using standard confidence threshold: {detector.conf_threshold}")
        
        # Perform detection
        boxes, scores, class_ids = detector.detect(image)
        
        # Restore original threshold
        detector.conf_threshold = original_threshold
        logger.info(f"Detection results: {len(boxes)} boxes, scores: {scores[:5] if len(scores) > 0 else 'none'}")
        
        # Debug: Test same model on known validation image for comparison
        if len(boxes) == 0:
            logger.info("No detections found. Testing same model on validation image for comparison...")
            val_img_path = "/app/data/val/images/s_img_10_jpg.rf.80681f070cfb5a04acde9ebcd65f24dc.jpg"
            try:
                import cv2
                val_img = cv2.imread(val_img_path)
                if val_img is not None:
                    val_boxes, val_scores, val_class_ids = detector.detect(val_img)
                    logger.info(f"Validation image test: {len(val_boxes)} detections (scores: {val_scores[:3] if len(val_scores) > 0 else 'none'})")
                else:
                    logger.info("Could not load validation image for comparison")
            except Exception as e:
                logger.info(f"Validation test failed: {e}")
        
        # Get calibration if possible
        try:
            pixels_per_mm = detector.get_calibration(image)
        except ValueError:
            pixels_per_mm = 1.0
            logger.warning("No calibration available, using pixel measurements")
        
        # Perform measurements
        measurements = {}
        
        try:
            # Basic measurements - pass the detected boxes to avoid re-detection
            stitch_lengths = detector.measure_stitch_lengths(image, pixels_per_mm, boxes)
            angles = detector.analyze_angles(image, boxes)
            
            measurements.update({
                "stitch_count": len(boxes),
                "stitch_lengths": stitch_lengths.tolist(),
                "average_stitch_length": float(np.mean(stitch_lengths)) if len(stitch_lengths) > 0 else 0,
                "stitch_angles": angles.tolist(),
                "average_angle": float(np.mean(angles)) if len(angles) > 0 else 0,
                "pixels_per_mm": float(pixels_per_mm) if pixels_per_mm != 1.0 else None
            })
            
            logger.info(f"Measurements calculated - Detections: {len(boxes)}, Lengths: {len(stitch_lengths)}, Angles: {len(angles)}")
            logger.info(f"Stitch lengths: {stitch_lengths.tolist()}")
            logger.info(f"Stitch angles: {angles.tolist()}")
            
            # Advanced pattern analysis
            try:
                pattern_analysis = detector.analyze_suture_pattern_symmetry(image)
                spacing_analysis = detector.analyze_suture_spacing_uniformity(image)
                
                measurements.update({
                    "pattern_symmetry": pattern_analysis,
                    "spacing_uniformity": spacing_analysis
                })
                
            except Exception as e:
                logger.warning(f"Advanced analysis failed: {str(e)}")
                measurements.update({
                    "pattern_symmetry": None,
                    "spacing_uniformity": None
                })
            
            # Quality prediction
            try:
                quality, quality_metrics = detector.predict_quality(image, boxes)
                measurements.update({
                    "quality_assessment": quality,
                    "quality_metrics": quality_metrics
                })
            except Exception as e:
                logger.warning(f"Quality prediction failed: {str(e)}")
                measurements.update({
                    "quality_assessment": "unknown",
                    "quality_metrics": {}
                })
                
        except MeasurementError as e:
            logger.error(f"Measurement error: {str(e)}")
            measurements = {"error": f"Measurement failed: {str(e)}"}
        
        # Format detection results
        detections = []
        for i, (box, score, class_id) in enumerate(zip(boxes, scores, class_ids)):
            detections.append({
                "id": i,
                "bbox": {
                    "x1": float(box[0]),
                    "y1": float(box[1]),
                    "x2": float(box[2]),
                    "y2": float(box[3])
                },
                "confidence": float(score),
                "class_id": int(class_id)
            })
        
        result = {
            "success": True,
            "image_info": {
                "filename": file.filename,
                "size": image.shape[:2],  # (height, width)
                "metadata": image_metadata
            },
            "detections": detections,
            "measurements": measurements,
            "processed_by": user.get('email'),
            "jpeg_image": jpeg_data_url  # Always provide JPEG version for frontend
        }
        
        logger.info(f"Analysis completed successfully for {file.filename}")
        return JSONResponse(content=result)
        
    except DetectionError as e:
        logger.error(f"Detection error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Detection failed: {str(e)}"
        )
    except ModelError as e:
        logger.error(f"Model error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model error: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during analysis: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Analysis failed due to unexpected error"
        )

@router.post("/batch-analyze")
async def batch_analyze_sutures(
    files: list[UploadFile] = File(...),
    user: Dict[str, Any] = Depends(require_admin_role)
) -> JSONResponse:
    """
    Analyze multiple suture images in batch.
    
    Args:
        files: List of uploaded image files
        user: Current authenticated user (admin required)
        
    Returns:
        JSON response with batch analysis results
    """
    if len(files) > 10:  # Limit batch size
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Batch size limited to 10 images"
        )
    
    results = []
    failed_count = 0
    
    for i, file in enumerate(files):
        try:
            # Process each image
            image = process_uploaded_image(file)
            detector = get_detector()
            
            # Perform basic detection only for batch processing
            boxes, scores, class_ids = detector.detect(image)
            
            # Basic measurements - pass detected boxes
            stitch_lengths = detector.measure_stitch_lengths(image, 1.0, boxes)  # Use pixel measurements
            
            result = {
                "filename": file.filename,
                "success": True,
                "stitch_count": len(boxes),
                "average_stitch_length": float(np.mean(stitch_lengths)) if len(stitch_lengths) > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Failed to process {file.filename}: {str(e)}")
            result = {
                "filename": file.filename,
                "success": False,
                "error": str(e)
            }
            failed_count += 1
        
        results.append(result)
    
    return JSONResponse(content={
        "batch_results": results,
        "total_processed": len(files),
        "successful": len(files) - failed_count,
        "failed": failed_count,
        "processed_by": user.get('email')
    })

@router.get("/model-info")
async def get_model_info(
    user: Dict[str, Any] = Depends(require_admin_role)
) -> JSONResponse:
    """
    Get information about the loaded ML model.
    
    Args:
        user: Current authenticated user (admin required)
        
    Returns:
        Model information
    """
    try:
        detector = get_detector()
        
        return JSONResponse(content={
            "model_type": "YOLOv8 Suture Detector",
            "confidence_threshold": detector.conf_threshold,
            "device": str(detector.device),
            "config": detector.config,
            "calibration_available": detector.pixels_per_mm is not None
        })
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get model info: {str(e)}"
        )