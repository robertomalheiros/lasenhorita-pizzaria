# Usar imagem COMPLETA do Debian para ter todas dependências
FROM node:18-bullseye

# Instalar Chromium e dependências
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Configurar variáveis de ambiente para Puppeteer/Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    npm_config_platform=linux \
    npm_config_arch=x64

WORKDIR /app

COPY package*.json ./

# Limpar cache npm e instalar dependências com suporte a sharp
RUN npm cache clean --force && \
    npm install --include=optional

COPY . .

# Criar diretório para tokens do WhatsApp
RUN mkdir -p /app/tokens

CMD ["npm", "start"]
