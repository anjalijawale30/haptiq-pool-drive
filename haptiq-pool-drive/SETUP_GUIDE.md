# 🎓 Haptiq Pool Campus Drive 2026 — Complete Setup Guide
## Indira University

---

## 📁 Folder Structure

```
haptiq-pool-drive/
├── src/
│   ├── lib/
│   │   └── firebase.js          ← Firebase connection
│   ├── components/
│   │   └── ProtectedRoute.jsx   ← Admin auth guard
│   ├── pages/
│   │   ├── StudentPage.jsx      ← Public student verification
│   │   ├── AdminLogin.jsx       ← Admin login
│   │   └── AdminDashboard.jsx   ← Admin panel
│   ├── main.jsx                 ← App entry + routing
│   └── index.css
├── import-students.js           ← Excel → Firestore script
├── firestore.rules              ← Security rules
├── .env.example                 ← Env var template
├── vercel.json                  ← Vercel routing
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## STEP 1 — Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click **"Add project"**
3. Name it: `haptiq-pool-drive-2026`
4. Disable Google Analytics (not needed)
5. Click **Create project**

---

## STEP 2 — Enable Firestore Database

1. In Firebase Console → **Build → Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode**
4. Select region: `asia-south1` (Mumbai — fastest for India)
5. Click **Enable**

---

## STEP 3 — Enable Firebase Authentication

1. Firebase Console → **Build → Authentication**
2. Click **Get started**
3. Go to **Sign-in method** tab
4. Enable **Email/Password**
5. Click Save

---

## STEP 4 — Create Admin Accounts

1. Firebase Console → **Authentication → Users**
2. Click **Add user**
3. Add each coordinator's email + password
4. Repeat for all 8–16 coordinators

**Suggested password format:** `Haptiq@2026` (change after first login)

---

## STEP 5 — Get Firebase Config Keys

1. Firebase Console → **Project Settings** (gear icon)
2. Scroll to **"Your apps"** → Click **Add app → Web**
3. Register app name: `haptiq-web`
4. Copy the `firebaseConfig` object — you need these values:
   - apiKey
   - authDomain
   - projectId
   - storageBucket
   - messagingSenderId
   - appId

---

## STEP 6 — Set Up Firestore Security Rules

1. Firebase Console → **Firestore → Rules**
2. Replace everything with contents of `firestore.rules` file
3. Click **Publish**

---

## STEP 7 — Import Students from Excel

### Excel Format
Your Excel file must have these columns (exact names):
| Haptiq ID | Name | Email | College |
|-----------|------|-------|---------|
| HQ2026001 | Rahul Sharma | rahul@email.com | Indira College of Engineering |

### Steps:
```bash
# 1. Install dependencies
npm install xlsx firebase-admin

# 2. Get Service Account Key:
#    Firebase Console → Project Settings → Service Accounts
#    → Generate new private key → save as serviceAccountKey.json
#    (place it in the project root folder)

# 3. Run the import
node import-students.js students.xlsx
```

The script will import all students with `verified: false` automatically.

---

## STEP 8 — Deploy Frontend on Vercel

### Install & Setup
```bash
# 1. Clone / download the project folder

# 2. Install dependencies
npm install

# 3. Copy env file
cp .env.example .env.local

# 4. Fill in your Firebase values in .env.local
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=haptiq-pool-drive-2026.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=haptiq-pool-drive-2026
VITE_FIREBASE_STORAGE_BUCKET=haptiq-pool-drive-2026.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# 5. Test locally
npm run dev
```

### Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts — Vercel auto-detects Vite
# Add all VITE_ env vars when prompted (or do in Vercel dashboard)
```

**OR use Vercel Dashboard (easier):**
1. Push code to GitHub
2. Go to https://vercel.com → New Project
3. Import your GitHub repo
4. Go to **Settings → Environment Variables**
5. Add all 6 `VITE_FIREBASE_*` variables
6. Click **Redeploy**

---

## STEP 9 — Generate QR Code

**Option A — Free online:**
1. Go to https://qr.io or https://www.qrcode-monkey.com
2. Enter your Vercel URL: `https://your-app.vercel.app`
3. Download PNG (high resolution for printing)

**Option B — Quick terminal:**
```bash
npx qrcode-terminal "https://your-app.vercel.app"
```

Print the QR code and display it at the venue entrance.

---

## 🔗 URLs After Deployment

| Purpose | URL |
|---------|-----|
| **Student Verification** | `https://your-app.vercel.app` |
| **Admin Login** | `https://your-app.vercel.app/admin-haptiq-2026-x9` |
| **Admin Dashboard** | `https://your-app.vercel.app/admin-haptiq-2026-x9/dashboard` |

> ⚠️ **NEVER share the admin URL with students or print it on materials.**

---

## 📊 Firestore Database Structure

Collection: `students`

Each document ID = Haptiq ID (e.g., `HQ2026001`)

```json
{
  "haptiq_id": "HQ2026001",
  "name": "Rahul Sharma",
  "email": "rahul@email.com",
  "college": "Indira College of Engineering",
  "verified": false,
  "verified_time": null
}
```

After verification:
```json
{
  "verified": true,
  "verified_time": "2026-01-15T10:30:00Z"
}
```

---

## ✅ Day-of-Drive Checklist

- [ ] All students imported in Firestore
- [ ] Admin accounts created and tested
- [ ] QR code printed and displayed at entrance
- [ ] Coordinators have admin URL and credentials
- [ ] Test one student verification on mobile
- [ ] Export button tested

---

## 🚨 Troubleshooting

**"Invalid Details" for a valid student:**
- Check if Haptiq ID is uppercase in Firestore
- Check if email exactly matches (lowercase)

**Admin can't login:**
- Verify email/password in Firebase Auth → Users
- Check browser console for Firebase errors

**Import script fails:**
- Ensure `serviceAccountKey.json` is in the same folder
- Check Excel column names match exactly

**Vercel shows blank page:**
- Check all VITE_ env vars are added in Vercel dashboard
- Redeploy after adding env vars

---

## 📞 Support Contact
For technical issues during the drive, contact the system admin immediately.
