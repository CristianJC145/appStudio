FROM python:3.13-slim

WORKDIR /app

# Instalar ffmpeg
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# El directorio /app/data almacena calibraciones y configuraciones.
# Montar como volumen para persistencia entre redespliegues:
#   docker run -v medi_data:/app/data ...
RUN mkdir -p /app/data/voice_calibrations /app/data/configs
VOLUME /app/data

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
