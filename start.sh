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
#                            (skip if you rely on Java's default cacerts)
# ═══════════════════════════════════════════════════════════════════════════════
set -e

JAR_DIR=/app/java-plugin/dist
PLUGIN_DIR=/app/java-plugin/dist/plugins

mkdir -p "$JAR_DIR" "$PLUGIN_DIR"

# ── Download production JAR ────────────────────────────────────────────────────
if [ -n "$MSG_FEED_JAR_URL_PROD" ]; then
  DEST="$JAR_DIR/message-feed-prod.jar"
  if [ ! -f "$DEST" ]; then
    echo "[startup] Downloading production JAR..."
    curl -fsSL "$MSG_FEED_JAR_URL_PROD" -o "$DEST"
    echo "[startup] Production JAR downloaded → $DEST"
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
    curl -fsSL "$MSG_FEED_JAR_URL_PPE" -o "$DEST"
    echo "[startup] PPE JAR downloaded → $DEST"
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
    curl -fsSL "$TRUST_STORE_URL" -o "$DEST"
    echo "[startup] Truststore downloaded → $DEST"
  fi
  export TRUST_STORE="$DEST"
fi

# ── Validate: at least the prod JAR must be present ───────────────────────────
if [ -z "$MSG_FEED_JAR_PROD" ] && [ ! -f "$JAR_DIR/message-feed-prod.jar" ]; then
  echo ""
  echo "╔══════════════════════════════════════════════════════════════════════╗"
  echo "║  ERROR: No production JAR available.                                ║"
  echo "║  Set MSG_FEED_JAR_URL_PROD to a signed download URL for:            ║"
  echo "║    message-feed-<version>.jar   (from your LSEG download package)  ║"
  echo "╚══════════════════════════════════════════════════════════════════════╝"
  echo ""
  # Start anyway so the web UI is reachable — users will see an error when
  # they try to start a session, which is friendlier than a crash loop.
fi

echo "[startup] Starting LSEG Messenger Feed backend on port ${PORT:-3001}..."
exec node /app/backend/server.js
