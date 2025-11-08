# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files from backend directory
COPY backend/package.json backend/package-lock.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code from backend directory
COPY backend/ .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files from backend directory
COPY backend/package.json backend/package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy Prisma schema from builder (already generated there)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/generated ./generated

# Generate Prisma Client in production
RUN npx prisma generate

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Start the application
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
