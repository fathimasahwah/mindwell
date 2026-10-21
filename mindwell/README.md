# 🌿 MindWell — a private mental wellness journal

MindWell is a MERN app where **privacy is the core feature**. Journal entries are encrypted before they reach MongoDB, so a database admin sees only ciphertext.

**Features**

- Encrypted journaling with a guided daily prompt (and "another prompt" shuffle)
- Mood and energy logging (1–10) with emotion tags
- Mood analytics with Chart.js: "Mood over Time" line chart and "Most Common Emotions" chart, built on MongoDB aggregation (daily / weekly / monthly averages)
- 4-7-8 Breathing Assistant: a smooth expanding/contracting circle (Framer Motion)
- Dark mode (saved, follows system preference by default)
- Freemium: premium unlocks advanced analytics and unlimited history search
- Data export (JSON or PDF) and account deletion

## Tech stack

| Layer    | Tech |
| -------- | ---- |
| Frontend | React 18, Vite, React Router, Chart.js (react-chartjs-2), Framer Motion |
| Backend  | Node.js, Express, Mongoose, JWT, bcryptjs, PDFKit |
| Database | MongoDB |
| Crypto   | Node's built-in `crypto` (AES-256-GCM, scrypt) |

## Security note: encryption strategy

> We use **AES-256-GCM** to encrypt the `title` and `content` fields of every journal entry (and the optional mood `note`) before saving to MongoDB.

How it works (`server/src/utils/crypto.js`):

1. **Per-user data key.** At registration each user gets a random 256-bit key (the DEK).
2. **Key wrapping.** The DEK is encrypted with a key derived from the user's password using **scrypt** and a per-user random salt. Only the *wrapped* DEK is stored in MongoDB.
3. **Encryption.** Each value is encrypted with the DEK using AES-256-GCM with a fresh random 96-bit IV. GCM is authenticated, so any tampering with stored data is detected on decrypt. Stored format: `iv.authTag.ciphertext` (base64).
4. **Login.** The password unwraps the DEK. The DEK is then sealed (AES-256-GCM again) with `SERVER_SECRET` and placed in the session token (JWT), so it never touches the database.
5. **Decrypt on request.** Entries are decrypted only when the logged-in user requests them, using the key from their own token.
6. **Passwords** are hashed with bcrypt (cost 12) for authentication, separately from the key derivation.

What a database admin sees: ciphertext only, plus the wrapped DEK, which is useless without the user's password.

Be aware of these honest limits:

- This is **encryption at rest**, not end-to-end encryption. The server briefly holds the key in memory while handling a request.
- Someone with **both** database access **and** your `SERVER_SECRET`/`JWT_SECRET` could still not decrypt without a user's password, but a compromised running server could observe plaintext in memory. Keep secrets out of the database host.
- **Forgotten password = unrecoverable data**, because the password protects the key. The register screen warns users about this.
- Mood scores and emotion tags are stored in plain form so MongoDB can aggregate them for charts. Only free-text (titles, content, notes) is encrypted.
- Searching decrypts a user's own entries in memory (MongoDB cannot search ciphertext). It is scoped to that user only.

### Privacy demo (screenshot for your submission)

1. Run the app and create an entry.
2. In `server/`, run: `npm run raw`
3. Screenshot the output. `title` and `content` show as gibberish like `kF3x…==.Qm9…==.8sd…`.

(You can also screenshot the collection in MongoDB Compass or Atlas.)

## Run locally

Requirements: Node 18+ and a MongoDB instance (local or Atlas).

```bash
# 1. API
cd server
cp .env.example .env      # then edit the values
npm install
npm run dev               # http://localhost:5000

# 2. Web app (new terminal)
cd client
npm install
npm run dev               # http://localhost:5173
```

Generate secrets (use two different ones):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Environment variables

`server/.env`

| Name | Description |
| ---- | ----------- |
| `PORT` | API port (default 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Signs session tokens |
| `SERVER_SECRET` | Seals each user's data key inside the token. Must differ from `JWT_SECRET` |
| `CLIENT_URL` | Allowed frontend origin(s), comma-separated (CORS) |

`client/.env` (production only)

| Name | Description |
| ---- | ----------- |
| `VITE_API_URL` | Full API base URL, e.g. `https://mindwell-api.onrender.com/api` |

## Deploy

**API → Render (Web Service)**

- Root directory: `server`, build command: `npm install`, start command: `npm start`
- Add the env vars above. Use MongoDB Atlas for `MONGODB_URI`.
- Set `CLIENT_URL` to your Vercel URL.

**Web → Vercel**

- Root directory: `client`, framework: Vite
- Set `VITE_API_URL` to `https://<your-render-app>.onrender.com/api`
- `vercel.json` already rewrites all routes to `index.html` for React Router.

## API overview

| Method | Route | Notes |
| ------ | ----- | ----- |
| POST | `/api/auth/register`, `/api/auth/login` | Returns token + user |
| GET | `/api/auth/me` | Current user |
| GET | `/api/journal/prompt/today` | Daily prompt (`?shuffle=1` for another) |
| GET/POST | `/api/journal` | List/search (`?q=&page=&limit=`), create |
| GET/PUT/DELETE | `/api/journal/:id` | Read, update, delete |
| POST | `/api/mood` | Log mood, energy, emotions, note |
| GET | `/api/mood/recent` | Latest 10 logs |
| GET | `/api/mood/analytics?range=&group=` | Averages by `day`/`week`/`month` (free: 7 days, daily) |
| GET | `/api/mood/emotions?range=` | Emotion counts (**premium**) |
| GET | `/api/export?format=json\|pdf` | Download all data, decrypted |
| POST | `/api/billing/upgrade`, `/api/billing/downgrade` | Demo premium toggle |
| DELETE | `/api/account` | Delete account and data (needs password) |

## Free vs Premium

| | Free | Premium |
| - | ---- | ------- |
| Journaling, prompts, mood logging | ✅ | ✅ |
| Mood chart | Last 7 days, daily | Up to 12 months, daily/weekly/monthly |
| Emotions chart | — | ✅ |
| Journal search | Last 30 days | Unlimited |
| Breathing tool, dark mode, export | ✅ | ✅ |

The premium flag lives on the user document and is enforced **on the server** (`requirePremium` middleware and checks in the analytics route), not just hidden in the UI.

> **Billing is a demo.** `/api/billing/upgrade` simply sets the flag. For real payments, replace it with Stripe Checkout and a webhook that sets `isPremium`.

## Project structure

```
mindwell/
├── server/
│   ├── server.js
│   ├── scripts/showRaw.js        # privacy demo
│   └── src/
│       ├── app.js
│       ├── config/db.js
│       ├── data/prompts.js
│       ├── middleware/{auth,error}.js
│       ├── models/{User,JournalEntry,MoodLog}.js
│       ├── routes/{auth,journal,mood,account}.js
│       └── utils/{crypto,asyncHandler}.js
└── client/
    └── src/
        ├── api.js
        ├── context/{Auth,Theme}Context.jsx
        ├── components/{Navbar,ProtectedRoute,MoodLogger,BreathingCircle,PremiumLock}.jsx
        ├── pages/{Auth,Journal,Mood,Breathe,Settings}.jsx
        └── styles.css
```

## Suggested next steps

- Stripe Checkout + webhook for real premium billing
- Password change flow (re-wrap the data key with the new password)
- Tests (Jest/Supertest) and a CI workflow
