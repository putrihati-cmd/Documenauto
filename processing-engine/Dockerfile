FROM python:3.9-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1

# Install system dependencies for OpenCV and builds
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "worker_manager.py"]
