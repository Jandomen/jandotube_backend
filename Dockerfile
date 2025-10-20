FROM node:18

RUN apt-get update && apt-get install -y python3 python3-pip ffmpeg

RUN pip3 install yt-dlp urllib3==1.26.18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p controllers/tacones

EXPOSE 5000

CMD ["node", "server.js"]
