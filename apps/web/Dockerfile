# Build context: raiz do monorepo (docker compose já configura isso)
FROM node:24-alpine AS builder

WORKDIR /app

ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/

RUN npm ci --workspace apps/web

COPY apps/web apps/web

RUN npm run build -w apps/web

FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/apps/web/package.json apps/web/
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/apps/web/.next apps/web/.next
COPY --from=builder /app/apps/web/public apps/web/public
COPY --from=builder /app/apps/web/next.config.ts apps/web/

EXPOSE 3000

CMD ["npm", "run", "start", "-w", "apps/web"]
