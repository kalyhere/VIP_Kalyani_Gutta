#!/usr/bin/env python3
"""
Train custom YOLOv8 model for suture detection using the labeled dataset.
"""

import os
import sys
from pathlib import Path
from ultralytics import YOLO
import torch

def train_suture_model():
    """Train YOLOv8 model specifically for suture detection."""
    
    # Configuration
    model_name = "yolov8n.pt"  # Start with pre-trained YOLOv8 nano
    dataset_config = "/app/data/suture_dataset.yaml"
    output_dir = "/app/weights"
    epochs = 100
    img_size = 640
    batch_size = 16
    
    print(f"🚀 Starting YOLOv8 training for suture detection")
    print(f"📊 Dataset: {dataset_config}")
    print(f"🔧 Model: {model_name}")
    print(f"📈 Epochs: {epochs}")
    print(f"🖼️  Image size: {img_size}")
    print(f"📦 Batch size: {batch_size}")
    
    try:
        # Load pre-trained YOLOv8 model
        model = YOLO(f"/app/weights/{model_name}")
        print(f"✅ Loaded pre-trained model: {model_name}")
        
        # Verify dataset exists
        if not os.path.exists(dataset_config):
            raise FileNotFoundError(f"Dataset config not found: {dataset_config}")
        
        # Check training images
        train_images = Path("/app/data/train/images")
        if not train_images.exists():
            raise FileNotFoundError(f"Training images directory not found: {train_images}")
            
        image_count = len(list(train_images.glob("*.jpg")))
        print(f"📷 Found {image_count} training images")
        
        if image_count == 0:
            raise ValueError("No training images found!")
        
        # Start training
        print("🎯 Starting training...")
        results = model.train(
            data=dataset_config,
            epochs=epochs,
            imgsz=img_size,
            batch=batch_size,
            name="suture_detection",
            patience=20,  # Early stopping
            save_period=10,  # Save every 10 epochs
            device='cpu',  # Use CPU for training (can change to 'cuda' if GPU available)
            verbose=True,
            plots=True  # Generate training plots
        )
        
        # Save the best model with a specific name
        best_model_path = "/app/weights/suture_yolov8_best.pt"
        model.save(best_model_path)
        print(f"✅ Training completed! Best model saved to: {best_model_path}")
        
        # Print training results
        print(f"📊 Final Results:")
        print(f"   - Best mAP50: {results.box.map50:.4f}")
        print(f"   - Best mAP50-95: {results.box.map:.4f}")
        
        # Test the trained model on a sample image
        print("🧪 Testing trained model...")
        test_image = "/app/data/val/images"
        test_images = list(Path(test_image).glob("*.jpg"))
        if test_images:
            test_results = model(str(test_images[0]))
            detections = len(test_results[0].boxes) if test_results[0].boxes is not None else 0
            print(f"✅ Model test: {detections} sutures detected in validation image")
        
        return best_model_path
        
    except Exception as e:
        print(f"❌ Training failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    print("🎓 YOLOv8 Suture Detection Training")
    print("=" * 50)
    
    result = train_suture_model()
    
    if result:
        print("\n🎉 Training completed successfully!")
        print(f"📦 Model saved at: {result}")
        print("\nTo use the trained model:")
        print("1. Restart the suture-analysis-backend service")
        print("2. The API will automatically load the trained model")
        print("3. Test with real suture images for accurate detection")
    else:
        print("\n💥 Training failed. Check logs above for details.")
        sys.exit(1)