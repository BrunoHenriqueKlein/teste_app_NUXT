FROM node:24-alpine

WORKDIR /app

# Instalar dependências do sistema se necessário
RUN apk add --no-cache openssl

# 1. Primeiro copiar APENAS os arquivos necessários para instalação
COPY nuxt-app/package*.json ./
COPY nuxt-app/prisma ./prisma/

# 2. Instalar dependências
RUN npm install

# 3. Copiar o restante da aplicação
COPY nuxt-app/ .

# Expor a porta
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["sh", "-c", "npx prisma db push && npm run dev"]