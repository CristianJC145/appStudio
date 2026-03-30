FROM python:3.13-slim

WORKDIR /app

# Instalar ffmpeg
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

RUN mkdir -p /app/data/voice_calibrations /app/data/configs

# Pre-descargar el modelo Whisper durante el build para que el primer
# request de calibración no tenga que descargarlo (244 MB).
# Si el volumen whisper_cache ya contiene el modelo, este paso no hace nada.
RUN python -c "import whisper; whisper.load_model('small')" || true

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
