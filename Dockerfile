FROM node:18

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y python3 python3-pip ffmpeg

# Instalar yt-dlp usando --break-system-packages para evitar error PEP 668
RUN pip3 install --break-system-packages yt-dlp urllib3==1.26.18

WORKDIR /app

# Copiar package.json e instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el resto del proyecto
COPY . .

# Crear carpeta temporal de descargas si no existe
RUN mkdir -p controllers/tacones

EXPOSE 5000

CMD ["node", "server.js"]
