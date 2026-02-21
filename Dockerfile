FROM node:22-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/server/package*.json ./packages/server/

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY packages/server ./packages/server

# Generate Prisma client and build
WORKDIR /app/packages/server
RUN npx prisma generate
RUN npm run build

# Expose port
EXPOSE 3000

# Start command - migrate then start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
