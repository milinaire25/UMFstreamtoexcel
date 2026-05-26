@echo off
:: ════════════════════════════════════════════════════════════════════
:: start.bat  —  Quick-start for Windows (development / local use)
:: Reads config from .env in the project root.
:: For production, use Docker Compose or deploy to Render.
:: ════════════════════════════════════════════════════════════════════
setlocal

:: Locate the script's own directory (project root)
set ROOT=%~dp0
set ROOT=%ROOT:~0,-1%

:: Load .env if it exists
if exist "%ROOT%\.env" (
  echo [start] Loading .env...
  for /f "usebackq tokens=1,* delims==" %%A in ("%ROOT%\.env") do (
    set line=%%A
    if not "!line:~0,1!"=="#" (
      set %%A=%%B
    )
  )
)

echo [start] Starting LSEG Messenger Feed...
echo.

:: ── Backend ──────────────────────────────────────────────────────────
start "LSEG Backend" cmd /k "cd /d "%ROOT%\backend" && node server.js"

:: Give backend 2 s to bind the port
timeout /t 2 /nobreak >nul

:: ── Frontend (dev mode with hot-reload) ──────────────────────────────
start "LSEG Frontend" cmd /k "cd /d "%ROOT%\frontend" && npm run dev"

echo.
echo   Backend  ^>  http://localhost:%PORT:-=3001%
echo   Frontend ^>  http://localhost:5173
echo.
echo   Open http://localhost:5173 in your browser.
echo   Log in with username "admin" and the ADMIN_PASSWORD from .env
echo.
pause
