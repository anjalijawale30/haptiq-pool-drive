/**
 * EXCEL IMPORT SCRIPT — Haptiq Pool Drive 2026
 * 
 * SETUP:
 *   npm install xlsx firebase-admin
 * 
 * USAGE:
 *   node import-students.js students.xlsx
 *
 * EXCEL FORMAT (columns in order):
 *   Haptiq ID | Name | Email | College
 */

const XLSX = require('xlsx')
const admin = require('firebase-admin')
const path = require('path')

// ── CONFIGURE THIS ──────────────────────────────────────────
// Download serviceAccountKey.json from Firebase Console →
// Project Settings → Service Accounts → Generate new private key
const serviceAccount = require('./serviceAccountKey.json')
// ────────────────────────────────────────────────────────────

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

async function importStudents(filePath) {
  console.log(`\n📂 Reading: ${filePath}\n`)

  const wb = XLSX.readFile(filePath)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })

  if (rows.length === 0) {
    console.log('❌ No rows found in the Excel file.')
    return
  }

  console.log(`Found ${rows.length} students. Starting import...\n`)

  let success = 0
  let skipped = 0
  let errors = 0

  const BATCH_SIZE = 400
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = db.batch()
    const chunk = rows.slice(i, i + BATCH_SIZE)

    for (const row of chunk) {
      const haptiqId = String(row['Haptiq ID'] || row['haptiq_id'] || row['HaptiqID'] || '').trim().toUpperCase()
      const name = String(row['Name'] || row['name'] || '').trim()
      const email = String(row['Email'] || row['email'] || '').trim().toLowerCase()
      const college = String(row['College'] || row['college'] || '').trim()

      if (!haptiqId || !email) {
        console.log(`  ⚠️  Skipping row — missing Haptiq ID or Email: ${JSON.stringify(row)}`)
        skipped++
        continue
      }

      const docRef = db.collection('students').doc(haptiqId)
      batch.set(docRef, {
        haptiq_id: haptiqId,
        name,
        email,
        college,
        verified: false,
        verified_time: null,
      }, { merge: false })

      success++
    }

    await batch.commit()
    console.log(`  ✅ Imported ${Math.min(i + BATCH_SIZE, rows.length)} / ${rows.length}`)
  }

  console.log(`\n🎉 Done!`)
  console.log(`   ✅ Imported: ${success}`)
  console.log(`   ⚠️  Skipped:  ${skipped}`)
  console.log(`   ❌ Errors:   ${errors}\n`)
  process.exit(0)
}

const file = process.argv[2]
if (!file) {
  console.error('Usage: node import-students.js <path-to-excel.xlsx>')
  process.exit(1)
}
importStudents(path.resolve(file)).catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
