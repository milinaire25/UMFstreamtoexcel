# ═══════════════════════════════════════════════════════════════════════════════
# LSEG Messenger Feed — Production Dockerfile
# Multi-stage: builds the React UI, then runs Node.js backend + Java 17
# ═══════════════════════════════════════════════════════════════════════════════

# ── Stage 1: build the React frontend ─────────────────────────────────────────
FROM node:20-slim AS frontend-build

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build
# Output: /frontend/dist

# ── Stage 2: build the Excel add-in task pane ────────────────────────────────
FROM node:20-slim AS excel-addin-build

WORKDIR /excel-addin
COPY excel-addin/package*.json ./
RUN npm ci
COPY excel-addin/ ./
RUN npm run build && cp manifest.render.xml dist/manifest.xml

# ── Stage 3: production runtime (Node.js 20 + Java 17) ────────────────────────
FROM node:20-slim

# Install Java 17 runtime + curl (needed for JAR download at startup)
RUN apt-get update && apt-get install -y --no-install-recommends \
        openjdk-17-jre-headless \
        curl \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install backend dependencies (production only)
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copy backend source
COPY backend/ ./backend/

# Copy React build output so backend can serve it statically
COPY --from=frontend-build /frontend/dist ./frontend/dist

# Copy Excel add-in build output so backend can serve it for hosted manifests
COPY --from=excel-addin-build /excel-addin/dist ./excel-addin/dist

# Copy the java-plugin dist folder structure.
# The proprietary LSEG JARs are NOT included in this repo — they are downloaded
# at container startup via the MSG_FEED_JAR_URL_PROD / MSG_FEED_JAR_URL_PPE
# environment variables (see start.sh).
# We DO ship our custom WebSocket plugin JAR because it is our own code.
COPY java-plugin/dist/plugins/ ./java-plugin/dist/plugins/

# Create the dist directory (JARs land here at startup)
RUN mkdir -p ./java-plugin/dist

# Entrypoint script — downloads JARs then starts Node
COPY start.sh ./
RUN chmod +x start.sh

EXPOSE 3001
ENV PORT=3001 \
    JAVA_BIN=java \
    MAX_MESSAGES=500

CMD ["./start.sh"]
