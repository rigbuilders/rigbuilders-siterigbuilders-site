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

## 5. Import the workflow

Use **`rigbuilders-email-quotations.json`** — the IMAP version.

`info@rigbuilders.in` is hosted at Hostinger, not Google, so the Gmail API
can't reach it: that API only sees mailboxes Google actually hosts. Reading
the mailbox over IMAP is both the only direct route and the simpler one — no
Cloud project, no OAuth consent screen, and none of the 7-day refresh-token
expiry that catches people out with unverified Google apps.

(`rigbuilders-gmail-quotations.json` is kept for reference in case the address
ever moves to Google Workspace.)

In n8n: **Workflows → Import from file →** `rigbuilders-email-quotations.json`.

Then fill two placeholders:

- **IMAP credential** — click the trigger node, create an IMAP credential:

  | Field | Value |
  |---|---|
  | User | `info@rigbuilders.in` |
  | Password | the mailbox password (not your Hostinger account password) |
  | Host | `imap.hostinger.com` — or `imap.titan.email` if Hostinger set you up on Titan |
  | Port | `993` |
  | SSL/TLS | on |

  Confirm the host in hPanel → Emails → your domain → *Configuration /
  Connect apps*, as Hostinger uses both depending on when the mailbox was
  created.

- **`REPLACE_WITH_EMAIL_WEBHOOK_SECRET`** in the HTTP Request node — the value
  from step 2.

Save, then toggle the workflow **Active**.

## Running across multiple Windows profiles

n8n's default data folder is `%USERPROFILE%\.n8n`, which lives **inside one
Windows profile**. Start n8n from a different profile and it finds a fresh
install: no workflow, no credentials. The startup method isn't the problem —
the data location is.

### Move the data somewhere machine-wide

1. Stop n8n.
2. Create `C:\n8n\data`.
3. Copy the **contents** of `C:\Users\<the profile that has it>\.n8n` into it —
   including the `config` file.
4. `start-n8n.bat` already points `N8N_USER_FOLDER` at `C:\n8n\data`.
5. Start it and check the workflow and IMAP credential are both there.

**About that `config` file.** If you created the IMAP credential by running
`n8n` directly rather than through the batch file, n8n generated its own
encryption key into `config` — not the one in the batch file. Those two
disagreeing is what makes a credential come back as unreadable. If that
happens, open the old `config`, copy `encryptionKey`, and paste it into
`start-n8n.bat`. Or just re-enter the mailbox password; it's one field.

### Start at boot, for every profile

Task Scheduler, triggered at **startup** rather than logon, so it runs before
anyone signs in and regardless of which profile is used.

1. **Task Scheduler → Create Task.**
2. **General:** name `n8n`. Select **Run whether user is logged on or not**
   and tick **Run with highest privileges**. Leave the account as an admin
   user — Windows asks for that password once and stores it.
3. **Triggers → New:** *At startup*, with a **1 minute delay** so networking
   and the disk are ready.
4. **Actions → New:** *Start a program*
   - Program: `C:\Users\ginni\rigbuilders-site\n8n\start-n8n.bat`
   - Start in: `C:\Users\ginni\rigbuilders-site\n8n`
5. **Conditions:** untick **Start only if on AC power**.
6. **Settings:** tick **If the task fails, restart every** 1 minute, 3 times.
   Set **If the task is already running: Do not start a new instance** —
   without that, a restart can leave two copies fighting over port 5678.

Any profile can then open <http://127.0.0.1:5678> — it's the same machine, so
the editor is reachable from all of them.

There'll be no console window, since the task runs in the background. To check
it's alive, load that URL, or look in Task Manager for a `node` process.

### Opening the editor automatically

`start-n8n.bat --open` launches the browser 12 seconds after starting, once
the server is listening. Use that when running it by hand.

The scheduled task must **not** pass `--open`. Running "whether user is logged
on or not" puts it in session 0, which has no desktop — a browser window
can't appear there, so the flag would either do nothing or leave stray
processes behind.

If you want the editor to appear when you sign in, keep the startup task as
it is (headless, serving every profile) and add a **separate** shortcut:

1. Right-click your desktop → New → Shortcut.
2. Location: `explorer http://127.0.0.1:5678`
3. Name it "n8n", then move it into
   `shell:startup` (press `Win+R`, type `shell:startup`, Enter).

That opens the editor at logon for that profile only, and leaves the
automation independent of it.

### Sturdier alternative

If you want proper service behaviour — automatic restart on crash, Windows
service management, log files — wrap it with
[NSSM](https://nssm.cc): `nssm install n8n "C:\nvm4w\nodejs\n8n.cmd" start`,
then set the same environment variables and the log paths in NSSM's UI. Task
Scheduler is enough to start with; NSSM is what you'd move to if it proves
flaky.

## ⚠ Move the encryption key out of the repo

`start-n8n.bat` currently holds `N8N_ENCRYPTION_KEY` in plain text, and this
folder is inside the git repo — so that key is in your commit history and in
GitHub. It unlocks the stored mailbox password.

Fix it: create `C:\n8n\env.bat` containing just

```
set N8N_ENCRYPTION_KEY=<your key>
```

replace the line in `start-n8n.bat` with `call C:\n8n\env.bat`, and add
`n8n/start-n8n.bat` to `.gitignore`. The key then lives outside the repo
entirely.

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

## Clearing the backlog of unanswered mail

`rigbuilders-email-backlog.json` is a **one-off** workflow for mail that was
never replied to. Keep it separate from the live poller and deactivate it when
you're done — it searches `UNANSWERED` with no date floor, so leaving it active
would keep re-reading the same threads.

It differs from the live workflow in four deliberate ways:

- Searches **`UNANSWERED`** rather than unread, since read-but-ignored is
  exactly the backlog you're trying to clear.
- Sends `receivedAt`, so anything older than **7 days** gets an apology added
  in front of the normal reply. One pipeline, one extra line — not a separate
  reply path.
- **Waits 8 seconds between emails.** Firing a hundred replies in a minute
  looks like a compromised mailbox to spam filters, and your domain reputation
  is not worth the time saved.
- **Does not mark anything as answered or read**, so a failed run changes
  nothing and can simply be re-run.

### Run it in two passes

**Pass one is a dry run** — the workflow ships with `dryRun: true` in the HTTP
node. Nothing is sent. Each execution shows what *would* go out: the address,
the age in days, whether an apology was added, and the first 500 characters of
the reply.

Read through those. You're checking three things: that nothing already handled
by a human is about to get an automated reply, that spam is being skipped
(spam returns `"replied": false` and sends nothing — it does not get an
apology), and that the replies make sense out of context.

**Pass two sends for real.** Edit the HTTP node's JSON body and change
`dryRun: true` to `dryRun: false`. Re-run.

### One caveat worth knowing

`UNANSWERED` relies on the `\Answered` IMAP flag, which is set by whichever
client sent the reply. If you've answered some of these from a client that
doesn't set it, they'll appear unanswered and get replied to again. The dry
run is how you catch that before it happens.

Worth checking before going live. If Gmail is fetching `info@rigbuilders.in`
via POP3 ("Check mail from other accounts"), POP **deletes from the server by
default** — in which case n8n's IMAP connection will find an empty mailbox,
because Gmail got there first.

Two ways out:

- In Gmail → Settings → Accounts → that account → tick **Leave a copy of
  retrieved message on the server**. Both can then read it.
- Or stop the Gmail fetch entirely and let n8n read Hostinger directly. You'd
  use Hostinger webmail (or add the account to Gmail over **IMAP** rather than
  POP, which doesn't delete).

The workflow marks mail as read once processed, so if you keep Gmail in the
picture, expect quotation mail to already be read when you open it.

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
