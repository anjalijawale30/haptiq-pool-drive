# Haptiq Pool Drive — Attendance & Verification System

A cloud-based, mobile-first attendance verification system for ~1,500 students.
Students self-verify via QR code. Coordinators monitor live attendance via a hidden admin panel.

---

## 📁 Folder Structure

```
haptiq-pool-drive/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── AdminLogin.jsx       # Admin sign-in form
│   │   └── AdminDashboard.jsx   # Live attendance panel
│   ├── hooks/
│   │   └── useAuth.js           # Firebase Auth hook
│   ├── pages/
│   │   ├── StudentPage.jsx      # Public verification page (/)
│   │   ├── AdminPage.jsx        # Admin wrapper page
│   │   └── NotFound.jsx         # 404 page
│   ├── firebase.js              # Firebase initialization
│   ├── main.jsx                 # Router + app entry
│   └── index.css                # Tailwind + animations
├── scripts/
│   ├── importStudents.js        # Excel → Firestore importer
│   └── generateQR.js            # QR code generator
├── .env.example                 # Environment variable template
├── vercel.json                  # SPA routing for Vercel
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## 🚀 Step-by-Step Setup

### STEP 1 — Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click **Add project** → name it (e.g. `haptiq-pool-drive`)
3. Disable Google Analytics (optional) → **Create project**

---

### STEP 2 — Enable Firestore

1. In Firebase Console → **Build → Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode**
4. Select a region (e.g. `asia-south1` for India)
5. Click **Enable**

**Set Firestore Security Rules** (Rules tab):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Students: read by anyone (needed for verification), write only by auth'd users
    match /students/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```
Click **Publish**.

---

### STEP 3 — Enable Firebase Authentication

1. Firebase Console → **Build → Authentication**
2. Click **Get started**
3. Under **Sign-in method** → enable **Email/Password**
4. Go to **Users** tab → **Add user**
5. Add each coordinator's email + password
   - Repeat for all 8–16 coordinators
   - Recommended format: `coord1@yourorg.com` / strong password

---

### STEP 4 — Get Firebase Config

1. Firebase Console → **Project Settings** (⚙ gear icon)
2. Scroll to **Your apps** → click **</>** (Web app)
3. Register app → copy the `firebaseConfig` object values

---

### STEP 5 — Setup Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc

VITE_ADMIN_ROUTE=admin-haptiq-2026-x9
```

> ⚠️ Change `VITE_ADMIN_ROUTE` to something unique and hard to guess.
> Never share this URL publicly.

---

### STEP 6 — Install & Run Locally

```bash
npm install
npm run dev
```

Open:
- Student page: http://localhost:5173/
- Admin panel:  http://localhost:5173/admin-haptiq-2026-x9

---

### STEP 7 — Import Students from Excel

**Excel file format** (first row must be headers):

| Haptiq-ID | Email | Name | College |
|-----------|-------|------|---------|
| HQ2026001 | alice@college.edu | Alice Sharma | ABC Engineering College |
| HQ2026002 | bob@college.edu | Bob Patel | XYZ Institute |

**Run import:**
```bash
# Install firebase-admin first (only for import script)
npm install firebase-admin --save-dev

# Set your service account key
# Download from: Firebase Console → Project Settings → Service accounts → Generate new private key
export GOOGLE_APPLICATION_CREDENTIALS="./serviceAccountKey.json"
export FIREBASE_PROJECT_ID="your-project-id"

node scripts/importStudents.js students.xlsx
```

> ℹ️ The script uses the student's Haptiq-ID as the Firestore document ID for fast lookups.

---

### STEP 8 — Deploy to Vercel

1. Push your code to GitHub

2. Go to https://vercel.com → **New Project** → import your repo

3. Add Environment Variables in Vercel Dashboard:
   - Go to **Settings → Environment Variables**
   - Add all variables from your `.env.local` (same keys, same values)

4. Click **Deploy**

Your URLs:
- Student page: `https://your-app.vercel.app/`
- Admin panel:  `https://your-app.vercel.app/admin-haptiq-2026-x9`

> The `vercel.json` file handles SPA routing automatically.

---

### STEP 9 — Generate QR Code

```bash
node scripts/generateQR.js https://your-app.vercel.app
```

This creates `qr-code.png` — print and display for students to scan.

---

## 🗄️ Firestore Schema

**Collection: `students`**

| Field | Type | Description |
|-------|------|-------------|
| `haptiq_id` | string | Unique student ID (also document ID) |
| `email` | string | Student email (lowercase) |
| `name` | string | Full name |
| `college` | string | College/institution name |
| `verified` | boolean | `false` by default |
| `verified_time` | timestamp | Set when verified |
| `token_number` | number | Sequential entry token |

---

## 🔐 Security Summary

| What | How |
|------|-----|
| Admin route | Hidden URL, not linked from student page |
| Admin login | Firebase Authentication (email/password) |
| Student writes | Firestore rules allow only authenticated users to write |
| Student reads | Firestore allows reads (needed for verification query) |
| Env variables | Never committed to Git; set in Vercel dashboard |

---

## 📱 How It Works

### Student Flow
1. Student scans QR code → opens `https://your-app.vercel.app`
2. Enters Haptiq-ID + email
3. System queries Firestore, matches both fields
4. If matched & not verified → marks verified, assigns token → green success screen
5. If matched & already verified → amber "already verified" screen with token
6. If not matched → red "invalid details" screen

### Admin Flow
1. Coordinator opens the hidden admin URL
2. Signs in with Firebase credentials
3. Sees live dashboard: counts, progress bar, student list
4. Can search, filter by tab (All / Verified / Pending / Recent)
5. Can manually verify/unverify any student
6. Can export verified list to Excel

---

## 🛠 Maintenance

### Add more coordinators
Firebase Console → Authentication → Users → Add user

### Reset all verifications (for testing)
Firestore Console → students collection → select all → bulk edit
Or write a one-time script using firebase-admin.

### Change admin route
Update `VITE_ADMIN_ROUTE` in Vercel environment variables → Redeploy.

---

## ⚡ Performance Notes

- Firestore `onSnapshot` gives real-time updates to all open admin tabs simultaneously
- Student page is extremely lightweight (~50 KB gzipped)
- Firebase SDK is code-split separately for fast initial load
- No images, no heavy libraries on student page

---

## 🙋 Support

If something goes wrong:
- Check browser console for errors
- Verify `.env.local` values match Firebase exactly
- Ensure Firestore rules are published
- Check Firebase Console → Usage for quota issues
