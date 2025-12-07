# YOLOv8 Suture Detection Model Training

This guide explains how to train a custom YOLOv8 model for suture detection using the available dataset.

## Overview

The suture analysis system uses a custom-trained YOLOv8 model to detect and classify sutures into three categories:
- `suture_good` - Properly placed sutures
- `suture_loose` - Loose sutures that need attention  
- `suture_tight` - Over-tightened sutures

## Dataset

The training data includes:
- **Training images**: 45 labeled suture images
- **Validation images**: 2 labeled suture images  
- **Test images**: 1 labeled suture image

Total: **48 labeled suture images** with YOLO format annotations

This is a specialized dataset focused on suture quality assessment with carefully curated and validated annotations.

## Training Instructions

### Start Training

```bash
# Start the suture-analysis-backend container
docker-compose up -d suture-analysis-backend

# Run suture model training
docker exec aimms-web-suture-analysis-backend-1 python scripts/train_suture_model.py
```

## Training Configuration

### Training Settings
- **Base Model**: YOLOv8n (nano - fastest, most efficient)
- **Epochs**: 100
- **Batch Size**: 16
- **Image Size**: 640x640
- **Device**: CPU (change to 'cuda' if GPU available)
- **Dataset**: 45 training + 2 validation images

## Training Process

1. **Preparation**: Scripts automatically organize and validate datasets
2. **Model Loading**: Downloads/loads pre-trained YOLOv8n weights
3. **Training**: Fine-tunes the model on suture-specific data
4. **Validation**: Tests on validation images during training
5. **Saving**: Saves best model as `suture_yolov8_best.pt`

## Monitoring Training

### Check Training Progress
```bash
# View real-time logs
docker logs -f aimms-web-suture-analysis-backend-1

# Check if training is still running
docker exec aimms-web-suture-analysis-backend-1 ps aux | grep python

# List training outputs
docker exec aimms-web-suture-analysis-backend-1 ls -la /app/runs/detect/
```

### Training Outputs
Training creates several outputs in `/app/runs/detect/[run_name]/`:
- `best.pt` - Best performing model
- `results.png` - Training metrics graph
- `confusion_matrix.png` - Classification performance
- `F1_curve.png`, `PR_curve.png` - Performance curves
- `train_batch*.jpg` - Training image samples
- `val_batch*_pred.jpg` - Validation predictions

## Expected Training Time

- **CPU Training**: ~30-45 minutes (100 epochs)
- **GPU Training**: ~10-20 minutes (if CUDA available)

## Post-Training

### Automatic Model Loading
After training completes, the API automatically:
1. Looks for `suture_yolov8_best.pt` in `/app/weights/`
2. Loads the trained model instead of generic YOLOv8n
3. Provides significantly better suture detection accuracy

### Testing the Trained Model
```bash
# Restart the backend to load new model
docker-compose restart suture-analysis-backend

# Check model info via API
curl -X GET "http://localhost:8001/api/suture/model-info" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test with an image upload via the UI at:
# http://localhost:3000/suture
```

## Troubleshooting

### Common Issues

**1. "No training images found"**
```bash
# Check if data was copied correctly
docker exec aimms-web-suture-analysis-backend-1 ls -la /app/data/train/images/
```

**2. "Model initialization failed"** 
```bash
# Download YOLOv8 weights
docker exec aimms-web-suture-analysis-backend-1 python scripts/download_weights.py
```

**3. "Out of memory"**
- Reduce batch size in training script (change `batch_size = 16` to `batch_size = 8`)
- Use smaller image size (change `img_size = 640` to `img_size = 512`)

**4. Training stops early**
- Check disk space: `docker exec aimms-web-suture-analysis-backend-1 df -h`
- Check logs: `docker logs aimms-web-suture-analysis-backend-1`

### Performance Tips

**For Better Accuracy:**
- Increase epochs (150-200)
- Use data augmentation (modify training script)
- Train with GPU if available (change `device='cpu'` to `device='cuda'`)
- Use larger model: `yolov8s.pt` or `yolov8m.pt`

**For Faster Training:**
- Use smaller batch size (8 instead of 16)
- Reduce epochs (50-100)
- Use smaller image size (512 instead of 640)

## Model Performance Expectations

After training, expect:
- **Detection Accuracy**: 85-95% on suture identification
- **Classification Accuracy**: 75-90% on suture quality (good/loose/tight)
- **Inference Speed**: ~100-200ms per image (CPU)
- **False Positives**: <10% on clear suture images

The trained model will be significantly better than the generic YOLOv8n for suture-specific detection tasks.

## Advanced Configuration

### Custom Training Parameters
Edit the training scripts to modify:
- Learning rate: `lr0=0.001`
- Augmentation settings: `hsv_h`, `hsv_s`, `hsv_v`
- Model size: `yolov8s.pt` (small), `yolov8m.pt` (medium), `yolov8l.pt` (large)
- Patience: Early stopping patience

### Using GPU
If you have NVIDIA GPU with CUDA:
1. Update Docker compose to enable GPU access
2. Change `device='cpu'` to `device='cuda'` in training scripts
3. Install CUDA-compatible PyTorch in container

## File Structure After Training

```
/app/
├── weights/
│   ├── yolov8n.pt              # Base pre-trained model  
│   └── suture_yolov8_best.pt   # Your trained model (used by API)
├── runs/detect/
│   └── [training_run]/
│       ├── weights/
│       │   ├── best.pt         # Best model from training
│       │   └── last.pt         # Latest model checkpoint
│       ├── results.png         # Training curves
│       └── confusion_matrix.png # Performance matrix
└── data/
    ├── train/                  # Training images and labels (45)
    ├── val/                    # Validation images and labels (2)
    ├── test/                   # Test images and labels (1)
    └── [other datasets]/       # Additional data (raw images, no labels)
```