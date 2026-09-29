# Arsheon Loan Requestor

Public website (Arsheon Group) where a business owner submits a funding request and tracks its status
with a **Request ID + Access Code**. No Google login, no account, no public list of requests.

Stack: React 18 + Vite + Firebase (Realtime Database + Anonymous Auth). Companion project: `arsheon-loan-center`.

## 1. Installation
Requires Node.js 18+ and a Firebase project.

## 2. npm install
```bash
npm install
```

## 3. Environment setup
Copy `.env.example` to `.env` locally and insert your own Firebase configuration.
```bash
cp .env.example .env
```
Never commit `.env` (it is in `.gitignore`) and never put real values in this README.

## 4. Firebase configuration
1. Create a Firebase project and a **Realtime Database**.
2. Add a Web App and copy its config values into `.env` (`VITE_FIREBASE_*`).
3. Authentication → Sign-in method → enable **Anonymous** (used silently so the database can accept a submission; the requestor never logs in).
4. Realtime Database → Rules → paste the contents of `database.rules.json` and publish.
   The same file exists in `arsheon-loan-center`; both sites share one database, publish it once.
   Do not replace it with `".read": true` / `".write": true`.

All Firebase initialization lives in `src/config/firebase.js`. To switch projects, change only `.env`.

## 5. Running locally
```bash
npm run dev      # http://localhost:5173
```

## 6. Building
```bash
npm run build    # output in dist/
npm run preview
```

## 7. Deployment
Any static host works (Firebase Hosting, Netlify, Vercel, GitHub Pages). Set the `VITE_FIREBASE_*`
variables in the host's environment settings before building. Routing uses hash URLs (`/#/status`),
so no server rewrite rules are needed.

## 8. GitHub push
```bash
git init && git add . && git status   # confirm .env is NOT listed
git commit -m "Arsheon Loan Requestor"
git remote add origin <your-repo-url> && git push -u origin main
```
Run `npm run scan` before pushing.

## 9. Security
- **Privacy model:** each request has a public mirror at `publicStatus/<SHA-256(requestId + accessCode)>`.
  Rules allow reading only that exact key and deny listing, so a requestor can only reach the request whose ID **and** code they know. Nothing else (admin notes, audit logs, other applicants, private records) is readable.
- Requestors can create a new request once; they can never modify or delete existing records or change status. Status changes are admin-only and validated by the rules.
- Access Codes are 10 characters from a 32-character alphabet (about 50 bits) and are never stored in plain text.
- Rate limits in the browser (3 submissions / 10 min, 10 lookups / 10 min) reduce accidental abuse but **can be bypassed by a determined attacker**. For hard enforcement enable Firebase App Check and, if needed, put submission behind a Cloud Function.
- Never place service account keys or Firebase Admin credentials in this project. Firebase web config values are not secrets, but keep them in `.env` so they are easy to rotate.

## 10. Troubleshooting
- **"Firebase is not configured"** — `.env` is missing or incomplete; restart `npm run dev` after editing it.
- **Submission fails with "Permintaan ditolak"** — Anonymous sign-in is not enabled, or `database.rules.json` was not published.
- **"Request ID atau Access Code tidak cocok"** — check both values; the code is case-insensitive.
- **Status page does not update** — check the network and that the rules from step 4 are published.
