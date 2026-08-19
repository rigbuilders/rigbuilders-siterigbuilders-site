# Prompt for Gemini: guide us through the Meta/WhatsApp Cloud API setup

Copy everything below the line into Gemini (or any assistant with live web/search access) to
get step-by-step help finishing the Meta-side setup. This is Meta account/business
configuration only — the actual chatbot code is already built and does not need to change
for any of this.

---

I'm setting up WhatsApp Cloud API auto-replies for a real business (Rig Builders, a custom
PC builder in India, website rigbuilders.in) and need you to walk me through the remaining
Meta-side configuration step by step, one action at a time, telling me exactly what to click
based on what I describe seeing on screen. Ask me to confirm or screenshot before any
destructive/irreversible step (disconnecting a number, deleting an account, publishing the
app). Meta's dashboard UI changes often, so if you're not sure a button/label still matches
current Meta for Developers, say so and ask me to describe what I actually see rather than
guessing.

## Where things stand right now

**Meta app:** Business verification is complete, and App Review has approved
`whatsapp_business_messaging` and `whatsapp_business_management`. The app itself is still
**Unpublished** (Development mode).

**Webhook:** Already configured and working at the dashboard level —
callback URL `https://www.rigbuilders.in/api/webhook/whatsapp`, verify token set and
matching what's in our backend's environment variables, and the `messages` field is already
**Subscribed** (along with several others Meta auto-subscribed: account_alerts,
account_review_update, account_update, flows, message_template_status_update,
messaging_handovers, phone_number_quality_update, security). However, the dashboard itself
warns: *"Apps will only be able to receive test webhooks sent from the app dashboard while
the app is unpublished. No production data... will be delivered unless the app has been
published."* So none of this fires for a real incoming customer message yet.

**WhatsApp Business Account:** WABA ID `1080706961296822`, created through the plain
App Dashboard flow (not Embedded Signup).

**Phone number:** `+91 77078 01014`, Phone Number ID `1167135936493036`, status
**Unverified**. When we tried the standard "verify with SMS/voice code" flow in the App
Dashboard, it failed with: *"This phone number is already registered to a WhatsApp account.
To continue, migrate this phone number or disconnect it from the existing account."* This
number is currently active on the regular WhatsApp Business consumer app, and we do not
want to lose its existing chat history or force it offline if avoidable.

**Tech Provider status:** We recently registered as a Meta Tech Provider / Solution
Partner specifically to unlock the Embedded Signup flow, since Embedded Signup (v4)
supports a "coexistence" onboarding mode for numbers already active on the WhatsApp
Business app — it's supposed to let us migrate the number to Cloud API while it keeps
working in the regular app too, with message history kept in sync. We have not started this
flow yet. It involves, in order: Create a System User Token, Pre-verified phone numbers,
Configure a webhook (already done), Embedded Signup Pre-fill, Session info setup, Embedded
Signup code setup, then Embedded Signup Launch (a "Login with Facebook" popup dialog),
followed by an Exchange Token step, then API integration steps (fetch WhatsApp accounts,
account details, subscribe app to the WABA, register/deregister phone number, Cloud API
phone registration, payment setup).

One open risk we know about: a WABA created via the plain App Dashboard (ours,
`1080706961296822`) may not be selectable from inside Embedded Signup — if so we might end
up with a brand-new WABA and a different phone_number_id than `1167135936493036`, which is
fine, we just need to know the final values.

## What we need help with, in order

1. Confirm whether the coexistence/Embedded Signup path is really the right way to bring
   `+91 77078 01014` onto Cloud API without disconnecting it from the WhatsApp Business app,
   and walk us through the Embedded Signup flow to do that (Login with Facebook → select or
   create the WABA → onboard the existing number via coexistence, not a fresh number).
2. Get us a **permanent System User access token** with `whatsapp_business_messaging` and
   `whatsapp_business_management` permissions (Embedded Signup's Exchange Token step should
   hand us one, but confirm it's actually non-expiring, not a 24-hour token).
3. Get the app switched from Unpublished to **Live/Published mode** so production webhook
   events actually reach our endpoint. We understand this needs a Privacy Policy URL set
   under App Settings → Basic first — help us confirm that's set correctly.
4. At the end, give us a clean summary of the final values we need to plug into our backend:
   final WABA ID, final Phone Number ID, and confirmation the access token is permanent —
   we'll handle putting those into our own environment variables ourselves.

## What NOT to do

Don't have us delete or factory-reset the WhatsApp account on `+91 77078 01014` unless we
explicitly confirm we're okay losing its current chat history — always ask first. Don't have
us set up Tech-Provider features meant for onboarding *other* businesses (client WABAs,
line-of-credit sharing, partner solutions) — we're only onboarding our own single business
number through this flow, using the Tech Provider account purely to access Embedded Signup.
