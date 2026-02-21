FROM node:22-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat

# Work directly in server directory
WORKDIR /app

# Copy server package files
COPY packages/server/package*.json ./
COPY packages/server/prisma ./prisma/

# Install dependencies
RUN npm install

# Copy server source code
COPY packages/server/src ./src/
COPY packages/server/tsconfig*.json ./
COPY packages/server/nest-cli.json ./

# Generate Prisma client
RUN npx prisma generate

# Build the app
RUN npm run build

# Verify dist exists
RUN ls -la dist/

# Expose port
EXPOSE 3000

# Start command - migrate then start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
