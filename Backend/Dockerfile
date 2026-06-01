# FederiGene Backend - Production Environment
FROM python:3.11

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libssl-dev \
    libffi-dev \
    python3-dev \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first (for Docker layer caching)
COPY requirements.txt .

# Install ALL dependencies from requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY . .

# Expose the API port
EXPOSE 8000

# Start Uvicorn for production
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
