# Stage 1: Build
FROM node:22-alpine AS builder

RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

COPY packages/server/ ./

RUN npm install
RUN npx prisma generate
RUN npm run build
RUN ls -la dist/

# Stage 2: Production
FROM node:22-alpine

RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

# Copy package files and install production deps
COPY packages/server/package*.json ./
RUN npm install --omit=dev

# Copy prisma schema and generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy built application
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
