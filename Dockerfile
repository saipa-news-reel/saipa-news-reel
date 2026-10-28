FROM node:22-bookworm

RUN apt-get update && apt-get install -y \
    chromium \
    ffmpeg \
    fonts-noto-core \
    fonts-noto-extra \
    fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV CHROME_BIN=/usr/bin/chromium

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["sh", "-c", "npx hyperframes --help"]
