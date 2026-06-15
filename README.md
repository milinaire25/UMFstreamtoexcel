# StreamtoExcel - LSEGMSGFEED

A full-stack web application that lets multiple users log in, add their LSEG
Service Account credentials, and see real-time messages from LSEG Messenger
streamed to their browser via WebSocket.

This fork also includes the **StreamtoExcel** Excel add-in for writing live UMF
WebSocket messages into a worksheet with the latest message first.

---

## ⚡ One-click deploy to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/milinaire25/UMFstreamtoexcel)

> **Before clicking:** you must host your LSEG JAR files at an HTTPS URL.
> See [Cloud deployment (Render)](#cloud-deployment-render) below.

---

## Architecture

```
Browser  ←──WebSocket──→  Node.js backend  ←──stdout──→  Java message-feed process
                                ↑
                         REST API (JWT auth)
                                ↑
                         React frontend (Vite)
```

---

## Prerequisites

| Tool    | Version               |
|---------|-----------------------|
| Node.js | ≥ 18                  |
| Java    | SE 17+                |
| Docker  | ≥ 24 *(cloud deploy)* |

### LSEG JARs (required — not included)

This repo does **not** ship the proprietary LSEG message-feed JARs.
You must obtain them from LSEG and supply them via one of the methods below.

| JAR | Used for |
|-----|----------|
| `message-feed-<version>.jar` | `prod`, `qa`, `trd`, `dev` environments |
| `message-feed-ppe-<version>.jar` | `beta` / PPE environment |
| `message-feed-handler-<version>.jar` | Build-time dependency for the plugin |

---

## Local development (Windows / macOS / Linux)

### 1 — Build the Java plugin

The `WebSocketPlugin` bridges the LSEG Java SDK to Node.js stdout:

```bash
cd java-plugin

# Copy the LSEG handler JAR into libs/
mkdir -p libs
cp /path/to/message-feed-handler-*.jar libs/

# Build the fat jar (requires Gradle 8+)
./gradlew shadowJar

# Install into plugins/
cp build/libs/lseg-websocket-plugin-1.0.0.jar dist/plugins/
```

### 2 — Place the LSEG JARs

```
java-plugin/dist/
├── message-feed-0.0.42.0.jar        ← production JAR
├── message-feed-ppe-0.0.41.0.jar    ← PPE/beta JAR
└── plugins/
    └── lseg-websocket-plugin-1.0.0.jar   ← built above
```

### 3 — Configure environment

```bash
cp .env.example .env
# Edit .env — set JWT_SECRET, ADMIN_PASSWORD, and the JAR paths
```

### 4 — Start (dev mode)

**Terminal 1 — Backend:**
```bash
cd backend
npm install
node server.js
# → http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173  (proxies /api and /ws to :3001)
```

### 4 (alternative) — Docker Compose

```bash
# Build the React frontend first
cd frontend && npm install && npm run build && cd ..

# Start backend + nginx
docker-compose up -d --build

# Logs
docker-compose logs -f backend
```

The app is available at **http://localhost** (port 80).

---

## StreamtoExcel Excel add-in

The Excel add-in is a frontend-only Office task pane in `excel-addin/`. It does
not add or change backend routes. It uses the same contract as the React
dashboard:

1. `POST /api/auth/login` to get a JWT.
2. `GET /api/sessions` to choose an existing feed session.
3. Connect to `ws://localhost:3001/ws`.
4. Send `{ "type": "auth", "token": "...", "sessionId": "..." }` as the first
   WebSocket message.
5. Write each `{ "type": "message", "data": ... }` payload to Excel.

Incoming messages are written to the `UMF Feed` worksheet in the
`UMFFeedMessages` table. Each message gets its own row, and new rows are
inserted at the top of the table so the latest message appears first.

### Run the add-in locally

Start the existing backend and frontend as usual:

```bash
cd backend
npm install
node server.js
```

```bash
cd frontend
npm install
npm run dev
```

Start the Excel add-in task pane:

```bash
cd excel-addin
npm install
npm run dev
# task pane URL: http://localhost:5174/index.html
```

### Sideload locally in Excel

1. In Excel, open **Insert → Add-ins → My Add-ins → Upload My Add-in**.
2. Select `excel-addin/manifest.xml`.
3. Open the **StreamtoExcel** task pane from the Home ribbon.
4. Enter:
   - Backend URL: `http://localhost:3001`
   - WebSocket URL: `ws://localhost:3001/ws`
   - The same username/password used in the dashboard
5. Click **Login & load sessions**.
6. Pick a session, make sure it is started in the dashboard, then click
   **Connect feed**.

### Sideload the Render-hosted add-in

Use this mode on another computer when you do not want to run the local
`excel-addin` dev server.

1. Make sure the Render service is deployed and live.
2. Download or sideload this hosted manifest:
   `https://umfstreamtoexcel.onrender.com/excel-addin/manifest.xml`
3. In Excel, open **Insert → Add-ins → My Add-ins → Upload My Add-in**.
4. Select the downloaded hosted manifest.
5. Open the **StreamtoExcel** task pane from the Home ribbon.
6. The task pane auto-fills:
   - Backend URL: `https://umfstreamtoexcel.onrender.com`
   - WebSocket URL: `wss://umfstreamtoexcel.onrender.com/ws`
7. Log in with the same dashboard username/password, choose a started feed
   session, then click **Connect feed**.

The source file for the hosted manifest is `excel-addin/manifest.render.xml`.
During the Render Docker build, it is copied into the add-in build output as
`/excel-addin/manifest.xml`.

### Add-in checks

```bash
cd excel-addin
npm test
npm run build
```

---

## Cloud deployment (Render)

### Step 1 — Host your LSEG JARs at an HTTPS URL

The JARs are **not** in this repo. You need to make them downloadable:

| Option | How |
|--------|-----|
| **AWS S3** | Upload to a private bucket, generate a pre-signed URL |
| **Google Cloud Storage** | Upload to a bucket, generate a signed URL |
| **Azure Blob Storage** | Upload to a container, generate a SAS URL |
| **Dropbox** | Share file → change `?dl=0` to `?dl=1` in the link |
| **Google Drive** | Share file → use `https://drive.google.com/uc?export=download&id=FILE_ID` |

You'll need one URL for the production JAR and optionally one for the PPE/beta JAR.

### Step 2 — Use this repo

Deploy from **[milinaire25/UMFstreamtoexcel](https://github.com/milinaire25/UMFstreamtoexcel)**.
For private deployments, fork it to your own GitHub account first.

### Step 3 — Deploy to Render

Click the button at the top of this README, or:

1. Go to [render.com](https://render.com) → **New → Blueprint**
2. Connect your forked repo
3. Render reads `render.yaml` and prompts for env vars

### Step 4 — Fill in environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ADMIN_PASSWORD` | ✅ | Password for the `admin` account |
| `MSG_FEED_JAR_URL_PROD` | ✅ | HTTPS URL for the production JAR |
| `MSG_FEED_JAR_URL_PPE` | ☐ | HTTPS URL for the PPE/beta JAR (leave blank if unused) |
| `TRUST_STORE_URL` | ☐ | HTTPS URL for `lseg-truststore.jks` (usually not needed on cloud) |
| `JWT_SECRET` | auto | Auto-generated by Render |
| `MAX_MESSAGES` | auto | Default: 500 |

> Render will build the Docker image, download your JARs at startup via
> `start.sh`, and launch the Node.js server.

---

## First login

1. Open the app URL in your browser.
2. Log in with username `admin` and the `ADMIN_PASSWORD` you set.
3. Go to **Admin** → create user accounts for each team member.
4. Each user logs in → **+ Add session** → enters:
   - Service Account UUID (e.g. `GE-D7WT7HTECM4U`)
   - Service Account Password
   - Email or UUID to track
   - Environment (`prod`, `qa`, `beta`, etc.)
5. Click **▶ Start feed** — messages appear in real time.

---

## LSEG domain whitelist

Ensure the server can reach these on TCP 443:

```
api.refinitiv.com
cdn.refinitiv.com
messenger.collaboration.refinitiv.com
*.collaboration.refinitiv.com
realtime.ably.io
```

For the **PPE/beta** environment, also allow:
```
api.ppe.refinitiv.com
cdn.ppe.refinitiv.com
```

---

## Security notes

- Passwords are **bcrypt-hashed** before storage.
- LSEG service account passwords are stored **in memory only** — never written to disk or logged.
- JWTs expire after 12 hours.
- Rate limiting is applied to all API endpoints.
- Set `JWT_SECRET` to a cryptographically random value in production (`openssl rand -hex 32`).
- In production, serve the app behind TLS (Render provides free TLS automatically).

---

## Folder structure

```
lseg-messenger-feed/
├── backend/
│   ├── server.js                       ← Express + WebSocket server
│   ├── middleware/auth.js              ← JWT verification
│   ├── routes/auth.js                  ← Login, register, user CRUD
│   ├── routes/sessions.js              ← Session CRUD + start/stop
│   ├── services/processManager.js      ← Spawns & manages Java processes
│   ├── store/sessions.js               ← In-memory session store
│   ├── store/users.js                  ← In-memory user store
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── pages/
│   │   └── components/
│   └── package.json
├── java-plugin/
│   ├── src/main/java/.../WebSocketPlugin.java
│   ├── dist/plugins/lseg-websocket-plugin-1.0.0.jar   ← our plugin (committed)
│   └── build.gradle
├── nginx/nginx.conf
├── Dockerfile                          ← root Dockerfile for Render / cloud
├── docker-compose.yml                  ← local Docker Compose (VPS)
├── render.yaml                         ← Render Blueprint
├── start.sh                            ← container entrypoint (downloads JARs)
├── .env.example
└── README.md
```
