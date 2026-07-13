# Build context: raiz do monorepo (docker compose já configura isso)
FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/

RUN npm ci --workspace apps/api

COPY apps/api apps/api

RUN npx -w apps/api prisma generate

EXPOSE 3001

CMD ["sh", "-c", "npx -w apps/api prisma migrate deploy && npm run start -w apps/api"]
