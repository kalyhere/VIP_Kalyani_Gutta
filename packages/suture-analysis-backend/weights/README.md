# Model Weights Directory

This directory should contain the trained YOLOv8 model weights for suture detection.

## Required Files

- `*.pt` files: YOLOv8 model weights trained for suture detection

## Getting Model Weights

The original model weights from the Auto-Suture-Pad-Analysis project should be copied here. Look for `.pt` files in the original project's weights or models directory.

## Usage

The suture analysis API will automatically load the first `.pt` file found in this directory when the service starts.