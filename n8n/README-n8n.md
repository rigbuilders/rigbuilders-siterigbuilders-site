# n8n — Gmail quotation intake

n8n does **ingestion only**: poll Gmail, strip the quoted reply chain, POST to
the app. Catalogue lookup, the distributor loop, PDF generation and the reply
all stay server-side with the other channels, so email never becomes a second
divergent copy of the quotation logic.

Email tolerates a few minutes' delay in a way chat doesn't, which is what makes
running this on a laptop acceptable.

---

## 1. Install

Already installed if `n8n` works in your terminal. Otherwise:

```
npm install -g n8n
```

To see where it lives:

```
where n8n
```

Usually `C:\Users\<you>\AppData\Roaming\npm\n8n.cmd`. The start script finds it
on PATH and falls back to that location, since Task Scheduler sometimes runs
with a thinner PATH than an interactive shell — if `where n8n` shows something
different, put that full path in `start-n8n.bat`.

## 2. Set the shared secret

In Vercel (Production), add:

```
EMAIL_WEBHOOK_SECRET = <a long random string you invent>
```

Redeploy. Then confirm the endpoint is live:

```
https://www.rigbuilders.in/api/webhook/email
```

A GET should return `{"ok":true,"configured":true}`. If `configured` is false,
either the secret or `RESEND_API_KEY` is missing.

## 3. Edit `start-n8n.bat`

Change `N8N_ENCRYPTION_KEY` to your own long random string. Set it **once** and
never change it — it's what decrypts the stored Gmail credential, so changing
it later means re-authorising Gmail.

## 4. First run

Double-click `start-n8n.bat`, then open <http://127.0.0.1:5678>.

## 5. Create the Gmail label

In Gmail, make a label called `rb-processed`. The workflow applies it so a
restart doesn't reprocess the backlog and send customers duplicate quotes.

## 6. Import the workflow

In n8n: **Workflows → Import from file →** `rigbuilders-gmail-quotations.json`.

Then replace three placeholders:

- **Gmail credential** — click either Gmail node, create a Gmail OAuth2
  credential, authorise. n8n's setup screen gives the exact redirect URL to
  paste into Google Cloud.
- **`REPLACE_WITH_EMAIL_WEBHOOK_SECRET`** in the HTTP Request node — the value
  from step 2.
- **`REPLACE_WITH_RB_PROCESSED_LABEL_ID`** in the label node — once the Gmail
  credential is connected, that field becomes a dropdown; pick `rb-processed`.

Save, then toggle the workflow **Active**.

## 7. Start automatically at logon

Task Scheduler is more reliable than a Startup-folder shortcut: it restarts on
failure and runs whether or not Explorer has finished loading.

1. Open **Task Scheduler** → **Create Task** (not *Basic* Task).
2. **General:** name it `n8n`. Tick **Run only when user is logged on** —
   n8n needs your user profile for `%USERPROFILE%\.n8n`.
3. **Triggers → New:** *At log on*, your user. Add a **30 second delay** so
   networking is up before the first poll.
4. **Actions → New:** *Start a program*
   - Program: `C:\Users\ginni\rigbuilders-site\n8n\start-n8n.bat`
   - Start in: `C:\Users\ginni\rigbuilders-site\n8n`
5. **Conditions:** untick **Start the task only if the computer is on AC
   power** — otherwise it won't run on battery.
6. **Settings:** tick **If the task fails, restart every** → 1 minute, up to
   3 times.

Reboot and confirm the n8n window appears and <http://127.0.0.1:5678> loads.

---

## Things that will bite you

**The laptop has to be awake.** Sleep stops polling and mail queues silently.
Either leave it on during business hours, or set
Settings → System → Power → *Screen and sleep* → **Never** while plugged in.

**Never expose port 5678.** The editor has no password by default, and anyone
who reaches it can read your Gmail credential. The batch file binds to
`127.0.0.1` for this reason — don't change it without adding auth.

**Back up `%USERPROFILE%\.n8n`.** It holds the workflow and the encrypted
credentials. Losing it means redoing all of the above.

**The HTTP node retries 3 times, then stops the workflow.** That's deliberate:
on failure the mail stays unlabelled and unread, so the next poll picks it up
again rather than the request being lost. The app returns 500 on a processing
error for the same reason.

## Checking it works

Send yourself an email asking for a quote on a couple of parts. Within about
five minutes you should see an execution in n8n, the `rb-processed` label on
the mail in Gmail, and either a reply from `info@rigbuilders.in` or a
`QUOTE — PARTS TO SOURCE` alert in Telegram.

If executions show but nothing happens downstream, open the execution and look
at the HTTP node's response — a 403 means the secret doesn't match.
