@echo off
REM ---------------------------------------------------------------------
REM  Starts n8n for the Rig Builders email workflows (IMAP -> rigbuilders.in).
REM
REM  Run by Task Scheduler AT STARTUP with "run whether user is logged on or
REM  not", so it comes up before anyone signs in and works from any Windows
REM  profile. See README-n8n.md for the task setup.
REM
REM  Can also be double-clicked to run it by hand.
REM ---------------------------------------------------------------------

REM Encrypts stored credentials. Once credentials exist, this value can never
REM change — a different key makes them unreadable and the mailbox password
REM has to be re-entered.
REM
REM IF YOU CREATED THE IMAP CREDENTIAL BY RUNNING `n8n` DIRECTLY rather than
REM through this file, n8n used a key it generated into .n8n\config instead
REM of this one. In that case copy "encryptionKey" out of that config file
REM and paste it here, or the credential won't decrypt after the move below.
REM
REM SECURITY: this file lives in the git repo, so this key is in your history.
REM See README-n8n.md — it should move to an untracked file.
set N8N_ENCRYPTION_KEY=lidufgbuygdfbdjkfniperm85f8419gb84189gb1rb19187n1n89mn1y9m56

REM Local only. Binding to 127.0.0.1 is what makes the next setting safe:
REM nothing outside this machine can reach the editor at all.
set N8N_HOST=127.0.0.1
set N8N_PORT=5678
set N8N_LISTEN_ADDRESS=127.0.0.1

REM n8n 1.x has no auto-login and no way to disable auth — the old
REM N8N_USER_MANAGEMENT_DISABLED flag was removed. This doesn't affect the
REM automation: the login gates only the EDITOR UI, and an Active workflow
REM polls and runs headlessly with nobody signed in.
REM
REM What this does is stretch the session to a year, so you log in once after
REM a restart and the cookie carries you from then on — no password manager
REM required. Safe here only because the editor is bound to 127.0.0.1 above
REM and unreachable from the network.
set N8N_USER_MANAGEMENT_JWT_DURATION_HOURS=8760

REM Timezone matters: the poll schedule and any cron nodes use it.
set GENERIC_TIMEZONE=Asia/Kolkata
set TZ=Asia/Kolkata

REM MACHINE-WIDE data folder, deliberately NOT %USERPROFILE%\.n8n.
REM
REM The default lives inside one Windows profile, so n8n started from any
REM other profile — or as a service, which runs as a different account
REM entirely — finds an empty install with no workflow and no credentials.
REM A fixed path means every profile and the service all see the same data.
REM
REM Migrating: copy the CONTENTS of %USERPROFILE%\.n8n into C:\n8n\data,
REM including the `config` file. That file holds the encryption key your
REM saved Gmail/IMAP credential was encrypted with — leave it behind and the
REM credential is unreadable and has to be re-entered.
set N8N_USER_FOLDER=C:\n8n\data

REM Where to log when running without a console (service / startup task).
if not exist "C:\n8n\logs" mkdir "C:\n8n\logs"

REM Suppress the permission warning on Windows, where the POSIX file-mode
REM check n8n performs doesn't apply.
set N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=false

REM Optional browser launch: start-n8n.bat --open
REM
REM Deliberately opt-in rather than automatic. The Task Scheduler entry runs
REM with "whether user is logged on or not", which puts it in session 0 — a
REM context with no desktop, where opening a window is impossible. Doing it
REM unconditionally would either fail silently at boot or leave orphaned
REM browser processes, so the scheduled task omits the flag and only a manual
REM run passes it.
REM
REM Runs in a detached shell because the n8n call below blocks: the delay
REM gives the server time to start listening, otherwise the browser lands on
REM a connection error and you reload it by hand anyway.
if /i "%~1"=="--open" (
  start "" /min cmd /c "timeout /t 12 >nul && explorer http://127.0.0.1:5678"
)

echo Starting n8n on http://127.0.0.1:5678

REM Absolute path rather than npx or a bare `n8n`, for two reasons: npx would
REM fetch its own copy and could run a different version than the one holding
REM your saved credential, and Task Scheduler often starts with a thinner
REM PATH than an interactive shell, so a bare command can fail at boot while
REM working perfectly when you test it by hand.
REM
REM This machine uses nvm4w, so C:\nvm4w\nodejs points at whichever Node
REM version is ACTIVE — and nvm4w installs global packages per version. Run
REM `nvm use` with a different version and this path still exists but no
REM longer contains n8n; reinstall with `npm install -g n8n` under that
REM version. The PATH lookup below is the fallback if that happens.
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

REM If n8n exits, record it and hold the window briefly so the error is
REM readable when run by hand.
REM
REM `timeout`, NOT `pause`: as a scheduled task there is no console to press a
REM key at, so pause would wait forever. The task would then sit marked as
REM Running long after n8n had died — and with "do not start a new instance"
REM set, that blocks the restart that was meant to recover it.
echo [%date% %time%] n8n exited>>"C:\n8n\logs\n8n-exit.log"
echo.
echo n8n has stopped. See C:\n8n\logs\n8n-exit.log
timeout /t 30 >nul
