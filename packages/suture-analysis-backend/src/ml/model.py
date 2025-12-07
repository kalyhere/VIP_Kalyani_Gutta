"""ML model configuration for suture detection and analysis."""

import os
from pathlib import Path
from typing import Tuple, Union, List, Dict, Optional
import math
import yaml

# Import dependencies (errors will be raised on actual usage if missing)
import numpy as np
import cv2
import torch
from ultralytics import YOLO

try:
    import xgboost as xgb
    from sklearn.preprocessing import StandardScaler
except ImportError:
    # These are optional for basic detection
    xgb = None
    StandardScaler = None

from utils.measurements import (
    calculate_angle, euclidean_distance, 
    calculate_perpendicular_distance, analyze_stitch_pattern
)
from utils.image_processing import detect_scale_markers

class ModelError(Exception):
    """Base exception for model-related errors."""
    pass

class DetectionError(ModelError):
    """Exception raised when detection fails."""
    pass

class MeasurementError(ModelError):
    """Exception raised when measurement fails."""
    pass

class SutureDetector:
    """YOLOv8-based suture detection model for AIMMS-Web integration."""
    
    def __init__(self, model_path: Union[str, Path], conf_threshold: float = 0.5):
        """Initialize the detector with model weights and config."""
        try:
            config_path = os.path.join(os.path.dirname(__file__), '..', '..', 'config', 'config.yaml')
            with open(config_path, 'r') as f:
                self.config = yaml.safe_load(f)['ml']
        except Exception as e:
            # Default config if file not found
            self.config = self._get_default_config()
            
        try:
            # Monkey-patch torch.load to use weights_only=False for trusted YOLO models
            original_load = torch.load
            torch.load = lambda *args, **kwargs: original_load(*args, **{**kwargs, 'weights_only': False})

            self.model = YOLO(model_path)

            # Restore original torch.load
            torch.load = original_load

            self.conf_threshold = conf_threshold
            self.device = torch.device(self.config['model']['device'] if torch.cuda.is_available() else 'cpu')
            self.model.to(self.device)
        except Exception as e:
            raise ModelError(f"Failed to initialize model: {str(e)}")
        
        self.scaler = StandardScaler() if StandardScaler else None
        self.score_model = None
        self.pixels_per_mm = None
        
    def _get_default_config(self) -> Dict:
        """Return default configuration if config file not found."""
        return {
            'model': {
                'device': 'cpu',
                'test_time_augmentation': False,
                'nms_iou_threshold': 0.45
            },
            'preprocessing': {
                'image_size': 640,
                'batch_size': 16,
                'normalize': True,
                'clahe': {
                    'enabled': True,
                    'clip_limit': 2.0,
                    'tile_grid_size': [8, 8]
                },
                'bilateral_filter': {
                    'enabled': True,
                    'd': 9,
                    'sigma_color': 75,
                    'sigma_space': 75
                }
            }
        }
        
    def apply_clahe(self, image: np.ndarray) -> np.ndarray:
        """Apply CLAHE enhancement."""
        if not self.config['preprocessing']['clahe']['enabled']:
            return image
            
        clahe = cv2.createCLAHE(
            clipLimit=self.config['preprocessing']['clahe']['clip_limit'],
            tileGridSize=tuple(self.config['preprocessing']['clahe']['tile_grid_size'])
        )
        
        if len(image.shape) == 3:
            lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
            lab_planes = list(cv2.split(lab))
            lab_planes[0] = clahe.apply(lab_planes[0])
            lab = cv2.merge(lab_planes)
            return cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
        return clahe.apply(image)
        
    def apply_bilateral_filter(self, image: np.ndarray) -> np.ndarray:
        """Apply bilateral filtering for noise reduction."""
        if not self.config['preprocessing']['bilateral_filter']['enabled']:
            return image
            
        return cv2.bilateralFilter(
            image,
            d=self.config['preprocessing']['bilateral_filter']['d'],
            sigmaColor=self.config['preprocessing']['bilateral_filter']['sigma_color'],
            sigmaSpace=self.config['preprocessing']['bilateral_filter']['sigma_space']
        )
        
    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """Enhanced preprocessing pipeline."""
        # Convert to RGB if needed
        if len(image.shape) == 2:
            image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
        elif image.shape[2] == 4:
            image = cv2.cvtColor(image, cv2.COLOR_BGRA2RGB)
        elif image.shape[2] == 3:
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
        # Apply basic preprocessing steps
        image = self.apply_clahe(image)
        image = self.apply_bilateral_filter(image)
        
        # Normalize if enabled
        if self.config['preprocessing']['normalize']:
            image = image.astype(np.float32) / 255.0
            
        return image
    
    def preprocess_image_conservative(self, image: np.ndarray) -> np.ndarray:
        """Conservative preprocessing optimized for iPhone photos without breaking basic detection."""
        # Convert to RGB if needed
        if len(image.shape) == 2:
            image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
        elif image.shape[2] == 4:
            image = cv2.cvtColor(image, cv2.COLOR_BGRA2RGB)
        elif image.shape[2] == 3:
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Conservative iPhone improvements
        # 1. Gentle contrast enhancement (CLAHE with conservative settings)
        lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
        l, a, b = cv2.split(lab)
        
        # Apply gentle CLAHE to improve contrast without artifacts
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        
        # Merge back to RGB
        lab = cv2.merge([l, a, b])
        image = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
        
        # 2. Light denoising for iPhone compression artifacts
        image = cv2.bilateralFilter(image, 5, 50, 50)
        
        return image
        
    def detect(self, image: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Detect sutures in an image.
        
        Args:
            image: Input image as numpy array
            
        Returns:
            Tuple of (boxes, scores, class_ids) as numpy arrays
            
        Raises:
            DetectionError: If detection fails
        """
        try:
            # Apply conservative preprocessing for iPhone images
            image = self.preprocess_image_conservative(image)
            
            # Configure test-time augmentation
            if self.config['model']['test_time_augmentation']:
                results = self.model(image, augment=True, conf=self.conf_threshold)[0]
            else:
                results = self.model(image, conf=self.conf_threshold)[0]
            
            # Check if any detections were found
            if results.boxes is None or len(results.boxes) == 0:
                return np.array([]), np.array([]), np.array([])
            
            boxes = results.boxes.xyxy.cpu().numpy()
            scores = results.boxes.conf.cpu().numpy()
            class_ids = results.boxes.cls.cpu().numpy().astype(int)
            
            # Apply NMS
            keep_indices = self.non_max_suppression(
                boxes, scores, iou_threshold=self.config['model']['nms_iou_threshold']
            )
            
            return boxes[keep_indices], scores[keep_indices], class_ids[keep_indices]
            
        except Exception as e:
            raise DetectionError(f"Detection failed: {str(e)}")
        
    def non_max_suppression(self, boxes: np.ndarray, scores: np.ndarray, 
                          iou_threshold: float) -> np.ndarray:
        """Non-Maximum Suppression."""
        if len(boxes) == 0:
            return []
            
        x1 = boxes[:, 0]
        y1 = boxes[:, 1]
        x2 = boxes[:, 2]
        y2 = boxes[:, 3]
        areas = (x2 - x1) * (y2 - y1)
        
        keep = []
        order = scores.argsort()[::-1]
        
        while order.size > 0:
            i = order[0]
            keep.append(i)
            
            if order.size == 1:
                break
                
            xx1 = np.maximum(x1[i], x1[order[1:]])
            yy1 = np.maximum(y1[i], y1[order[1:]])
            xx2 = np.minimum(x2[i], x2[order[1:]])
            yy2 = np.minimum(y2[i], y2[order[1:]])
            
            w = np.maximum(0.0, xx2 - xx1)
            h = np.maximum(0.0, yy2 - yy1)
            inter = w * h
            
            ovr = inter / (areas[i] + areas[order[1:]] - inter)
            ids = np.where(ovr <= iou_threshold)[0]
            order = order[ids + 1]
            
        return np.array(keep)

    def get_calibration(self, image: np.ndarray) -> float:
        """Get pixel to mm calibration factor using automated detection or config."""
        # Try automated detection first
        try:
            scale_result = detect_scale_markers(image)
            if scale_result is not None:
                self.pixels_per_mm, _ = scale_result
                return self.pixels_per_mm
        except:
            pass
            
        # Fall back to configured reference points
        ref_points = self.config.get('measurements', {}).get('pixel_mm_calibration', {}).get('reference_points')
        if ref_points and len(ref_points) == 2:
            h, w = image.shape[:2]
            p1 = [x * w for x in ref_points[0]]
            p2 = [x * w for x in ref_points[1]]
            px_dist = np.sqrt((p2[0] - p1[0])**2 + (p2[1] - p1[1])**2)
            self.pixels_per_mm = px_dist / 10  # Assuming 10mm reference distance
            return self.pixels_per_mm
            
        raise ValueError("No calibration available - neither automated detection nor reference points found")

    def extract_features(self, image: np.ndarray) -> np.ndarray:
        """Extract features for quality scoring."""
        try:
            boxes, _, _ = self.detect(image)
            if len(boxes) == 0:
                return np.zeros(8)  # Return zero features if no detections
                
            # Get calibration
            try:
                pixels_per_mm = self.get_calibration(image)
            except ValueError:
                pixels_per_mm = 1.0  # Use pixel measurements if calibration fails
                
            # Calculate features
            lengths = self.measure_stitch_lengths(image, pixels_per_mm)
            angles = self.analyze_angles(image)
            pattern = self.analyze_suture_pattern_symmetry(image)
            spacing = self.analyze_suture_spacing_uniformity(image)
            
            features = [
                np.mean(lengths) if len(lengths) > 0 else 0,
                np.std(lengths) if len(lengths) > 0 else 0,
                np.mean(angles) if len(angles) > 0 else 0,
                np.std(angles) if len(angles) > 0 else 0,
                pattern.get('symmetry_score', 0),
                spacing.get('spacing_cv', 0),
                pattern.get('max_deviation', 0),
                spacing.get('mean_spacing', 0)
            ]
            return np.array(features)
        except Exception:
            return np.zeros(8)

    def predict_quality(self, image: np.ndarray, boxes: np.ndarray) -> Tuple[str, Dict[str, float]]:
        """Predict suture quality with confidence scores and ablation metrics."""
        features = self.extract_features(image)
        
        if self.score_model is None:
            # Fall back to rule-based if no model trained
            return self._rule_based_quality(image, boxes), {}
            
        # Scale features
        features = self.scaler.transform(features.reshape(1, -1))
        
        # Get prediction and probabilities
        pred_proba = self.score_model.predict_proba(features)[0]
        pred_class = self.score_model.predict(features)[0]
        
        # Map back to labels
        labels = ['good', 'tight', 'loose']
        prediction = labels[pred_class]
        
        # Calculate feature importance for ablation study
        importance = self.score_model.feature_importances_
        feature_names = [
            'mean_length', 'std_length', 'mean_angle', 'std_angle',
            'symmetry', 'spacing_cv', 'max_deviation', 'mean_spacing'
        ]
        
        ablation_metrics = {
            name: float(imp) for name, imp in zip(feature_names, importance)
        }
        ablation_metrics.update({
            f'{label}_probability': float(prob)
            for label, prob in zip(labels, pred_proba)
        })
        
        return prediction, ablation_metrics
        
    def _rule_based_quality(self, image: np.ndarray, boxes: np.ndarray) -> str:
        """Fallback rule-based quality assessment."""
        if len(boxes) == 0:
            return "loose"  # No sutures detected
            
        # Analyze suture characteristics - pass boxes to avoid re-detection
        stitch_lengths = self.measure_stitch_lengths(image, 1.0, boxes)  # Use pixel measurements
        angles = self.analyze_angles(image, boxes)
        
        # Decision logic based on measurements
        avg_length = np.mean(stitch_lengths)
        avg_angle = np.mean(angles) if len(angles) > 0 else 0
        
        if avg_length < 20:  # Too tight
            return "tight"
        elif avg_length > 50 or abs(avg_angle - 90) > 30:  # Too loose or inconsistent
            return "loose"
        else:
            return "good"

    def measure_stitch_lengths(self, image: np.ndarray, scale_px_to_mm: float, boxes: Optional[np.ndarray] = None) -> np.ndarray:
        """
        Measure lengths of detected stitches.
        
        Args:
            image: Input image
            scale_px_to_mm: Scale factor to convert pixels to millimeters
            boxes: Pre-detected boxes (optional). If None, will run detection.
            
        Returns:
            Array of stitch lengths in millimeters
            
        Raises:
            MeasurementError: If measurement fails
        """
        try:
            # Use provided boxes or detect if not provided
            if boxes is None:
                boxes, _, _ = self.detect(image)
            
            if len(boxes) == 0:
                return np.array([], dtype=np.float32)
                
            lengths = []
            for box in boxes:
                x1, y1, x2, y2 = box
                length_px = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
                lengths.append(length_px * scale_px_to_mm)
                
            return np.array(lengths, dtype=np.float32)
            
        except DetectionError as e:
            raise MeasurementError(f"Stitch length measurement failed: {str(e)}")
        except Exception as e:
            raise MeasurementError(f"Unexpected error in stitch length measurement: {str(e)}")

    def analyze_angles(self, image: np.ndarray, boxes: Optional[np.ndarray] = None) -> np.ndarray:
        """Calculate angles of stitches relative to horizontal."""
        try:
            # Use provided boxes or detect if not provided
            if boxes is None:
                boxes, _, _ = self.detect(image)
            
            angles = []
            for box in boxes:
                x1, y1, x2, y2 = box
                angle = math.degrees(math.atan2(y2 - y1, x2 - x1))
                angles.append(abs(angle))
                
            return np.array(angles)
        except:
            return np.array([])

    def analyze_suture_pattern_symmetry(self, image: np.ndarray) -> Dict[str, float]:
        """
        Analyze symmetry of suture pattern relative to incision line.
        
        Args:
            image: Input image
            
        Returns:
            Dictionary containing symmetry metrics as float values
            
        Raises:
            MeasurementError: If analysis fails
        """
        try:
            boxes, _, _ = self.detect(image)
            if len(boxes) == 0:
                return {'mean_distance': 0, 'std_distance': 0, 'max_deviation': 0, 'symmetry_score': 0}
                
            # Simple implementation - calculate relative positions
            centers = []
            for box in boxes:
                mid_x = (box[0] + box[2]) / 2
                mid_y = (box[1] + box[3]) / 2
                centers.append((mid_x, mid_y))
            
            if len(centers) < 2:
                return {'mean_distance': 0, 'std_distance': 0, 'max_deviation': 0, 'symmetry_score': 0}
            
            # Calculate y-coordinate variations
            y_coords = [center[1] for center in centers]
            distances = np.array(y_coords) - np.mean(y_coords)
            
            return {
                'mean_distance': float(np.mean(np.abs(distances))),
                'std_distance': float(np.std(distances)),
                'max_deviation': float(np.max(np.abs(distances))),
                'symmetry_score': float(1 / (1 + np.std(distances)))
            }
            
        except Exception as e:
            return {'mean_distance': 0, 'std_distance': 0, 'max_deviation': 0, 'symmetry_score': 0}

    def analyze_suture_spacing_uniformity(self, image: np.ndarray) -> Dict[str, float]:
        """Analyze uniformity of spacing between sutures."""
        try:
            boxes, _, _ = self.detect(image)
            
            # Extract suture points in order along incision
            suture_points = []
            for box in boxes:
                mid_x = (box[0] + box[2]) / 2
                mid_y = (box[1] + box[3]) / 2
                suture_points.append((mid_x, mid_y))
            
            if len(suture_points) < 2:
                return {'mean_spacing': 0, 'spacing_std': 0, 'spacing_cv': 0, 'min_spacing': 0, 'max_spacing': 0}
            
            # Sort points by x-coordinate (assuming horizontal incision)
            suture_points.sort(key=lambda p: p[0])
            
            # Calculate inter-suture distances
            distances = []
            for i in range(len(suture_points)-1):
                dist = euclidean_distance(suture_points[i], suture_points[i+1])
                distances.append(dist)
            
            distances = np.array(distances)
            return {
                'mean_spacing': float(np.mean(distances)),
                'spacing_std': float(np.std(distances)),
                'spacing_cv': float(np.std(distances) / np.mean(distances)) if np.mean(distances) > 0 else 0,
                'min_spacing': float(np.min(distances)),
                'max_spacing': float(np.max(distances))
            }
        except:
            return {'mean_spacing': 0, 'spacing_std': 0, 'spacing_cv': 0, 'min_spacing': 0, 'max_spacing': 0}