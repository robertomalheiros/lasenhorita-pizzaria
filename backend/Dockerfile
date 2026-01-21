FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm install --omit=dev

# Copiar código fonte
COPY . .

# Expor porta
EXPOSE 3001

# Comando de inicialização
CMD ["node", "src/index.js"]
