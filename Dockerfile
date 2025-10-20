FROM node:18

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y python3 python3-pip ffmpeg

# Alias python -> python3 para compatibilidad con npm packages
RUN ln -s /usr/bin/python3 /usr/bin/python

# Instalar Python packages
RUN pip3 install --break-system-packages yt-dlp urllib3==1.26.18

WORKDIR /app

# Copiar package.json e instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el resto del proyecto
COPY . .

# Crear carpeta temporal de descargas
RUN mkdir -p controllers/tacones

EXPOSE 5000

CMD ["node", "server.js"]
