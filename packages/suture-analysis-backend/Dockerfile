# Multi-stage build for optimized image size and faster startup
FROM python:3.10-slim AS builder

# Install only build dependencies needed for wheel compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /wheels

# Copy requirements and build wheels
COPY requirements.txt .

# Upgrade pip and build wheels (using cache to speed up rebuilds)
RUN pip install --upgrade pip setuptools wheel && \
    pip wheel --no-cache-dir --wheel-dir /wheels -r requirements.txt

# Final stage - minimal runtime image
FROM python:3.10-slim

# Install only runtime dependencies (no build tools)
# Note: opencv-python-headless still needs libGL for some operations
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libgomp1 \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Copy pre-built wheels from builder
COPY --from=builder /wheels /wheels

# Install all dependencies from pre-built wheels (much faster)
RUN pip install --no-index --find-links=/wheels /wheels/*.whl && \
    rm -rf /wheels

# Copy only essential runtime files (.dockerignore handles exclusions)
COPY src/ ./src/
COPY config/ ./config/
COPY weights/ ./weights/
COPY start.py .

# Create necessary directories
RUN mkdir -p logs

# Use Heroku's dynamic port or default to 8001
EXPOSE ${PORT:-8001}

# Run the application (start.py already handles PORT env var)
CMD ["python", "start.py"]