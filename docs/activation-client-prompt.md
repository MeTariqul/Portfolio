# Prompt: add the activation window to the shipped software

Copy everything inside the box below into the agent working on the software
project (the folder that holds the app users install). Fill in the two
placeholders first.

---

```text
Add a software activation window to this project, talking to the licensing
server I already run at https://metariqul.vercel.app.

CONFIG (put these in the app's settings file, not in the UI):
  LICENSE_SERVER = "https://metariqul.vercel.app"
  APP_API_KEY    = "<paste this app's API key from Admin → Apps>"
  APP_SLUG       = "<this app's slug, shown next to the API key>"

The app must never print, log or show APP_API_KEY to the user.

────────────────────────────────────────────────────────────────────
1. THE FLOW THE USER SEES
────────────────────────────────────────────────────────────────────
A single "Activation" window with two states:

  (a) Not activated — shows:
      • an email field + "Send me a key" button
      • a key field + "Activate" button
      • one status line for success/failure messages

  (b) Activated — shows the license label (or the email), the expiry date
      ("Lifetime" when none) and a "Deactivate this device" / "Sign out"
      button that clears the stored licence.

On first launch, and on every launch after, the app checks the licence
offline first (section 4) and only talks to the network when the stored
token has passed its re-check time or is missing.

────────────────────────────────────────────────────────────────────
2. DEVICE FINGERPRINT
────────────────────────────────────────────────────────────────────
Compute a stable, machine-specific device id once and store it:
  • Windows: MachineGuid from HKLM\SOFTWARE\Microsoft\Cryptography, or
    a UUID you generate on first run inside a per-machine store
  • macOS: IOPlatformUUID (ioreg -rd1 -c IOPlatformExpertDevice)
  • Linux: /etc/machine-id, else /var/lib/dbus/machine-id
  • Mobile/web: the platform's own persistent device identifier
Rules: 8–200 characters, no spaces needed, and it must survive app
updates and restarts without changing. If it changes, the server treats
the machine as a new device and may refuse it at the device limit.

────────────────────────────────────────────────────────────────────
3. REQUEST A KEY (the "email me a key" button)
────────────────────────────────────────────────────────────────────
POST {LICENSE_SERVER}/api/license/request
  headers: { "content-type": "application/json", "x-app-key": APP_API_KEY }
  body:    { "email": "<what the user typed>", "platform": "<os name>" }

Responses (JSON always has { ok, status } plus message or error):
  200 "sent"          → "Your key is on its way — check your email."
  200 "pending"       → "Request received. Your key will arrive shortly."
                        (the server is holding it for manual review, or the
                        mail provider was slow; either way: don't retry in a
                        loop, tell the user to wait a few minutes)
  400 "invalid"       → the email address looks wrong; fix it client-side
                        first, and only send a well-formed address
  403 "closed"        → "Activation requests are closed for this app."
  403 "blocked"       → "This email cannot be used. Contact support."
  403 "suspended" / "expired"
                      → "This license was suspended/expired. Contact support."
  409 "device_limit"  → "This key is already activated on a device. Contact
                        support if you changed computers."
  429 "rate_limited"  → "Too many requests. Try again later."

Show `error` (or `message`) verbatim — the server already writes them for
end users. Do not retry anything except network timeouts.

────────────────────────────────────────────────────────────────────
4. ACTIVATE AND STORE
────────────────────────────────────────────────────────────────────
POST {LICENSE_SERVER}/api/license/activate
  headers: { "content-type": "application/json", "x-app-key": APP_API_KEY }
  body:    { "key": "<user's key>", "deviceId": "<fingerprint>",
             "deviceName": "<computer name>", "platform": "<os name>" }

Success 200:
  { ok: true, status: "active",
    token: "<payload>.<signature>",     // signed, verify offline
    issuedAt: ISO, recheckAt: ISO, expiresAt: ISO|null, label: string|null }

Refusals (show `error`, then stay locked):
  403 "banned" | "banned_device"  → this key/device was blocked
  403 "suspended" | "expired" | "revoked_device"
  409 "device_limit"              → all device slots are used
  404 "invalid"                   → wrong key for this app

Store, in the app's own settings/data file (never in plain-text logs):
  the token, the key, the deviceId, the label and expiresAt.

────────────────────────────────────────────────────────────────────
5. OFFLINE VERIFICATION (what "works without internet" means)
────────────────────────────────────────────────────────────────────
The token is  payload.signature : the payload is base64url JSON, the
signature is Ed25519 over the *exact payload bytes* (not the decoded
JSON). Get the public key once and cache it:

  GET {LICENSE_SERVER}/api/license/pubkey
  → { "publicKey": "-----BEGIN PUBLIC KEY-----...",
      "algorithm": "ed25519" }

Payload claims:
  v = 1                 format version
  l = license id
  a = app slug          must equal APP_SLUG
  d = device id         must equal the fingerprint computed here
  e = expiry (ms), 0 = lifetime
  i = issued at (ms)
  r = re-check by (ms)  start the app offline until this time

Rules:
  • Signature must verify against the public key, or refuse to start.
  • `a` and `d` must match this app and this machine, or refuse.
  • If now > `e` (and `e` != 0) → expired, refuse.
  • If now <= `r` → run offline, no network needed.
  • If now > `r` → re-check online before/while starting (section 6). If
    the network is unreachable, give a short offline grace (a few days)
    rather than locking a paying customer out, then require the network.
  • Verifying must never require the API key; the public key alone is
    enough, so the app can be checked by anyone.

────────────────────────────────────────────────────────────────────
6. ONLINE RE-CHECK
────────────────────────────────────────────────────────────────────
POST {LICENSE_SERVER}/api/license/verify
  headers: { "content-type": "application/json", "x-app-key": APP_API_KEY }
  body:    { "key": "<stored key>", "deviceId": "<fingerprint>" }

  200 { ok: true, status: "active", token: … } → replace the stored token
      with the fresh one (it carries a new re-check date) and continue.
  403/409 with the statuses from section 4 → the licence is no longer
      good: lock the app, show `error`, and offer the activation window
      again so the user can enter a new key.
  409 "not_activated" → this device was removed from the licence; show
      the activation window so it can claim a slot again.
Network failure → section 5's grace rule applies.

Run it silently: no dialogs, no spinners on the main screen; a failed
re-check must not interrupt a working session mid-action.

────────────────────────────────────────────────────────────────────
7. ERRORS, TIME AND EDGE CASES
────────────────────────────────────────────────────────────────────
  • Treat the clock as untrusted: if the system clock jumps backwards,
    keep the last known good `i` and don't extend the licence.
  • Never store the API key where the user can read it easily, and never
    send the license key to any host other than LICENSE_SERVER.
  • One key = one device. "Deactivate this device" should just clear the
    local licence (tell the user to ask support to free the slot).
  • All requests need a timeout (~15s) and must fail soft.
  • Phone-home calls must be HTTPS only.

────────────────────────────────────────────────────────────────────
8. WHAT TO WRITE
────────────────────────────────────────────────────────────────────
  • a small `licensing` module: fingerprint, requestKey, activate,
    verify, verifyTokenOffline, plus load/save of the stored licence
  • the activation window/dialog wired to that module
  • a startup gate that runs the offline check and, when needed, the
    online re-check
  • unit tests for: valid token passes, tampered signature fails, wrong
    device id fails, expired token fails, `r` in the future skips the
    network

Tell me the language/framework this project uses if you want the module
written for it specifically; otherwise implement it with the platform's
standard HTTP + crypto libraries.
```

---

## Where the values come from

| Value | Where to get it |
| --- | --- |
| `APP_SLUG` | Admin → **Apps** → the app's page, above **Endpoint** |
| `APP_API_KEY` | same page — the `appk_…` value. Use **Rotate key** if it ever leaks, then update the app config |
| Request behaviour | same page → **Key requests**: `Off` / `Auto` / `Review` |
| Keys, requests, bans | Admin → **Apps** → **Keys** / **Requests** / **Bans** |

## Notes for the server side (nothing to do in the app)

* A request that arrives while the app is in `Review` waits in **Requests**
  until you approve it; approving emails the key. A new app starts in `Auto`,
  so requests are answered by email without you touching anything.
* The request email is sent by the server itself (Gmail SMTP). If the send
  fails the request shows as **Failed** and **Retry send** re-sends the same
  key — a key is never minted twice for one address.
* **Bans** are global and reversible: banning an email blocks new requests
  and every key on that address; banning a device blocks that machine on
  every app.
