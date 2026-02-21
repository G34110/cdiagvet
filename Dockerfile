FROM node:22-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

# Copy all server files
COPY packages/server/ ./

# Install dependencies (including devDependencies for build)
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Build the app
RUN npm run build

# Debug: verify dist exists after build
RUN echo "=== Contents of /app ===" && ls -la && echo "=== Contents of /app/dist ===" && ls -la dist/

# Expose port
EXPOSE 3000

# Start command - use npm start instead of node directly
CMD ["sh", "-c", "echo '=== Starting ===' && ls -la && ls -la dist/ && npx prisma migrate deploy && npm start"]
