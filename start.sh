#!/bin/sh
# ═══════════════════════════════════════════════════════════════════════════════
# start.sh — LSEG Messenger Feed container entrypoint
#
# Downloads the proprietary LSEG JAR(s) from signed URLs (set via env vars)
# then starts the Node.js backend.  The JARs are NOT bundled in the image
# because they are LSEG-licensed software.
#
# Required env vars (set in Render / docker-compose / .env):
#   MSG_FEED_JAR_URL_PROD  — HTTPS URL to message-feed-*.jar (prod/qa/dev)
#   MSG_FEED_JAR_URL_PPE   — HTTPS URL to message-feed-ppe-*.jar (beta)
#
# Optional:
#   TRUST_STORE_URL        — HTTPS URL to lseg-truststore.jks
# ═══════════════════════════════════════════════════════════════════════════════
set -e

JAR_DIR=/app/java-plugin/dist
PLUGIN_DIR=/app/java-plugin/dist/plugins

mkdir -p "$JAR_DIR" "$PLUGIN_DIR"

# ── Helper: download a file, handling Google Drive virus-scan bypass ───────────
# Google Drive blocks direct JAR downloads via curl with a virus scan warning.
# Switching to drive.usercontent.google.com bypasses this for programmatic use.
fetch_file() {
  local url="$1"
  local dest="$2"

  # Convert drive.google.com share/uc URLs → drive.usercontent.google.com
  if echo "$url" | grep -q "drive\.google\.com"; then
    # Extract the file ID from either format:
    #   https://drive.google.com/uc?export=download&id=FILE_ID
    #   https://drive.google.com/file/d/FILE_ID/view
    FILE_ID=$(echo "$url" | grep -oE 'id=([^&]+)' | cut -d= -f2)
    if [ -z "$FILE_ID" ]; then
      FILE_ID=$(echo "$url" | grep -oE '/d/([^/]+)' | cut -d/ -f3)
    fi
    url="https://drive.usercontent.google.com/download?id=${FILE_ID}&export=download&confirm=t&authuser=0"
    echo "[startup] Converted to direct Google Drive download URL (id=${FILE_ID})"
  fi

  curl -fsSL "$url" -o "$dest"
}

# ── Download production JAR ────────────────────────────────────────────────────
if [ -n "$MSG_FEED_JAR_URL_PROD" ]; then
  DEST="$JAR_DIR/message-feed-prod.jar"
  if [ ! -f "$DEST" ]; then
    echo "[startup] Downloading production JAR..."
    fetch_file "$MSG_FEED_JAR_URL_PROD" "$DEST"
    echo "[startup] Production JAR downloaded ($(du -h $DEST | cut -f1))"
  else
    echo "[startup] Production JAR already present — skipping download"
  fi
  export MSG_FEED_JAR_PROD="$DEST"
fi

# ── Download PPE / beta JAR ────────────────────────────────────────────────────
if [ -n "$MSG_FEED_JAR_URL_PPE" ]; then
  DEST="$JAR_DIR/message-feed-ppe.jar"
  if [ ! -f "$DEST" ]; then
    echo "[startup] Downloading PPE/beta JAR..."
    fetch_file "$MSG_FEED_JAR_URL_PPE" "$DEST"
    echo "[startup] PPE JAR downloaded ($(du -h $DEST | cut -f1))"
  else
    echo "[startup] PPE JAR already present — skipping download"
  fi
  export MSG_FEED_JAR_PPE="$DEST"
fi

# ── Download truststore (optional) ────────────────────────────────────────────
if [ -n "$TRUST_STORE_URL" ]; then
  DEST="$JAR_DIR/lseg-truststore.jks"
  if [ ! -f "$DEST" ]; then
    echo "[startup] Downloading LSEG truststore..."
    fetch_file "$TRUST_STORE_URL" "$DEST"
  fi
  export TRUST_STORE="$DEST"
fi

# ── Validate ──────────────────────────────────────────────────────────────────
if [ -z "$MSG_FEED_JAR_PROD" ] && [ ! -f "$JAR_DIR/message-feed-prod.jar" ]; then
  echo ""
  echo "╔══════════════════════════════════════════════════════════════════════╗"
  echo "║  WARNING: No production JAR available.                              ║"
  echo "║  Set MSG_FEED_JAR_URL_PROD to a signed download URL for:            ║"
  echo "║    message-feed-<version>.jar   (from your LSEG download package)  ║"
  echo "╚══════════════════════════════════════════════════════════════════════╝"
  echo ""
fi

echo "[startup] Starting LSEG Messenger Feed backend on port ${PORT:-3001}..."
exec node /app/backend/server.js
