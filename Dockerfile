FROM node:22-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

# Copy all server files
COPY packages/server/ ./

# Install dependencies
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Build the app and show output
RUN npm run build && echo "=== Build complete ===" && ls -la && ls -la dist/

# Expose port
EXPOSE 3000

# Start command
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
