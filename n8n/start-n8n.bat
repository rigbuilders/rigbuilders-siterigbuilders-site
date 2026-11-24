@echo off
REM ---------------------------------------------------------------------
REM  Starts n8n for the Rig Builders Gmail workflow.
REM
REM  Run by Task Scheduler at logon (see README-n8n.md). Minimised rather
REM  than hidden on purpose: a window in the taskbar is the only cue that
REM  it's running, and silent failure is the main risk with a local poller.
REM ---------------------------------------------------------------------

REM Keeps saved Gmail credentials readable across restarts. Without a fixed
REM key n8n generates a new one and every stored credential becomes
REM undecryptable — you'd be re-authorising Gmail after every reboot.
REM CHANGE THIS to your own long random string, then never change it again.
set N8N_ENCRYPTION_KEY=lidufgbuygdfbdjkfniperm85f8419gb84189gb1rb19187n1n89mn1y9m56

REM Local only. Do not expose this port — the editor has no password by
REM default and anyone reaching it can read your Gmail credential.
set N8N_HOST=127.0.0.1
set N8N_PORT=5678
set N8N_LISTEN_ADDRESS=127.0.0.1

REM Timezone matters: the poll schedule and any cron nodes use it.
set GENERIC_TIMEZONE=Asia/Kolkata
set TZ=Asia/Kolkata

REM Workflow data lives here. Back this folder up — it holds the workflow
REM and the encrypted credentials.
set N8N_USER_FOLDER=%USERPROFILE%\.n8n

REM Suppress the permission warning on Windows, where the POSIX file-mode
REM check n8n performs doesn't apply.
set N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=false

echo Starting n8n on http://127.0.0.1:5678

REM Uses the globally installed n8n (the one `n8n` runs in your terminal),
REM NOT npx — npx would fetch its own copy and could run a different version
REM than the one holding your saved Gmail credential.
REM
REM Task Scheduler sometimes starts with a thinner PATH than an interactive
REM shell, so if the PATH lookup fails we fall back to the standard npm
REM global location before giving up.
REM This machine runs nvm4w, so n8n lives under the nvm symlink rather than
REM the usual %APPDATA%\npm. Note C:\nvm4w\nodejs points at whichever Node
REM version is ACTIVE, and nvm4w installs global packages per version — so
REM running `nvm use` with a different version makes this path still exist
REM but no longer contain n8n. If that happens, reinstall with
REM `npm install -g n8n` under the version you've switched to.
set "N8N_CMD=C:\nvm4w\nodejs\n8n.cmd"

if exist "%N8N_CMD%" (
  call "%N8N_CMD%" start
) else (
  where n8n >nul 2>&1
  if %errorlevel%==0 (
    call n8n start
  ) else (
    echo.
    echo n8n not found at %N8N_CMD% or on PATH.
    echo If you switched Node versions with nvm, run: npm install -g n8n
  )
)

REM If n8n exits, keep the window open so the error is readable rather than
REM the window vanishing and the poller silently being gone.
echo.
echo n8n has stopped. Press any key to close.
pause >nul
