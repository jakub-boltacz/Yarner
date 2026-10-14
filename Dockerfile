# Stage 1: Build the full-stack Applet
FROM node:20 AS builder

WORKDIR /app

# Copy dependency configs
COPY package*.json ./

# Install development dependencies to execute build compiler
RUN npm ci

# Copy full application codebase 
COPY . .

# Run compiler build - compresses static client with Vite & compiles server with esbuild into dist/server.cjs
RUN npm run build

# Stage 2: Packaging light production runner
FROM node:20-slim

WORKDIR /app

# Ensure curl and better-sqlite3 operating-system prerequisites if any are present
RUN apt-get update && apt-get install -y --no-install-recommends \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Copy build config and production files
COPY package*.json ./

# Install production-only dependencies for a super lightweight layer
RUN npm ci --omit=dev

# Copy compiled bundles from build stage
COPY --from=builder /app/dist ./dist

# Create persistence mount directory for SQLite file
RUN mkdir -p /data && chown -R node:node /data

# Run container process safely as custom non-root Node user
USER node

# Setup environment details
ENV NODE_ENV=production
ENV PORT=3000
ENV SQLITE_DB_PATH=/data/yarn_stash.db

# Expose server entry ports
EXPOSE 3000

# Expose volume to allow user local storage persistence across containers
VOLUME /data

# Launch the compiled unified backend server
CMD ["node", "dist/server.cjs"]
