FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for Heroku
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Copy requirements first for better caching
COPY requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user for security
RUN groupadd -r aimms && useradd -r -g aimms aimms

# Create necessary directories and change ownership
RUN mkdir -p logs data && \
    chown -R aimms:aimms /app

# Switch to non-root user
USER aimms

# Use Heroku's dynamic port or default to 8000
EXPOSE ${PORT:-8000}

# Run the application
CMD ["python", "entrypoint.py"]