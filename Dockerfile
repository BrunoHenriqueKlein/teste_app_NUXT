FROM node:24-alpine

WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache openssl python3 make g++ git

# PRIMEIRO copiar os arquivos do Prisma
COPY nuxt-app/prisma ./prisma/

# Copiar arquivos de dependências
COPY nuxt-app/package*.json ./

# Instalar dependências (agora o Prisma vai encontrar o schema)
RUN npm install

# FINALMENTE copiar o restante da aplicação
COPY nuxt-app/ .

# Gerar o build de produção
RUN npm run build

# Expor a porta
EXPOSE 3000

# Comando seguro de inicialização em produção
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/seed.ts && node .output/server/index.mjs"]