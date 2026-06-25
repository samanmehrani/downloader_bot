FROM node:22-bookworm

RUN apt-get update && \
  apt-get install -y ffmpeg python3 python3-pip curl && \
  pip3 install --break-system-packages yt-dlp && \
  apt-get clean

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN yt-dlp --version

ENV NODE_ENV=production
ENV PORT=2585

EXPOSE 2585

CMD ["node", "bot/bot.js"]