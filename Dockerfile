# Usar Node 18
FROM node:18

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    python3 python3-pip ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Alias python -> python3 para compatibilidad con npm packages
RUN ln -s /usr/bin/python3 /usr/bin/python

# Instalar paquetes Python necesarios globalmente
RUN pip3 install --break-system-packages yt-dlp urllib3==1.26.18

# Crear carpeta de trabajo
WORKDIR /app

# Copiar package.json e instalar dependencias Node
COPY package*.json ./
RUN npm install

# Copiar el resto del proyecto
COPY . .

# Crear carpeta temporal de descargas
RUN mkdir -p controllers/tacones

# Exponer puerto
EXPOSE 5000

# Comando para iniciar el servidor
CMD ["node", "server.js"]
