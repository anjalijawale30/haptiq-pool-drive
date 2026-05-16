#!/usr/bin/env node
/**
 * scripts/importStudents.js
 *
 * Imports student records from an Excel file into Firestore.
 *
 * Usage:
 *   node scripts/importStudents.js students.xlsx
 *
 * Excel columns expected (header row):
 *   Haptiq-ID | Email | Name | College
 *
 * Setup:
 *   npm install xlsx firebase-admin dotenv
 *   Set GOOGLE_APPLICATION_CREDENTIALS to your service account key JSON path.
 *   Or paste your serviceAccount JSON directly below.
 */

import XLSX from 'xlsx';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ─── CONFIG ───────────────────────────────────────────
// Option A: Service account JSON file
// const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

// Option B: Use environment variable GOOGLE_APPLICATION_CREDENTIALS
// (just set the env var and remove the credential line below)

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID';

admin.initializeApp({
  // credential: admin.credential.cert(serviceAccount), // uncomment for Option A
  credential: admin.credential.applicationDefault(),    // uses GOOGLE_APPLICATION_CREDENTIALS
  projectId: PROJECT_ID,
});

const db = admin.firestore();
// ──────────────────────────────────────────────────────

const XLSX_FILE = process.argv[2];
if (!XLSX_FILE) {
  console.error('Usage: node scripts/importStudents.js <path-to-excel.xlsx>');
  process.exit(1);
}

const BATCH_SIZE = 400; // Firestore batch limit is 500

function normalizeRow(row) {
  // Try various column name formats
  const id     = (row['Haptiq-ID'] || row['HaptiqID'] || row['haptiq_id'] || row['ID'] || '').toString().trim().toUpperCase();
  const email  = (row['Email'] || row['email'] || '').toString().trim().toLowerCase();
  const name   = (row['Name'] || row['name'] || '').toString().trim();
  const college = (row['College'] || row['college'] || '').toString().trim();
  return { id, email, name, college };
}

async function importStudents() {
  const filePath = resolve(process.cwd(), XLSX_FILE);
  console.log(`Reading file: ${filePath}`);

  const wb   = XLSX.readFile(filePath);
  const ws   = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

  console.log(`Found ${rows.length} rows.`);

  let imported = 0, skipped = 0, errors = 0;
  const batches = [];
  let batch = db.batch();
  let count = 0;

  for (const row of rows) {
    const { id, email, name, college } = normalizeRow(row);

    if (!id || !email || !name) {
      console.warn(`⚠ Skipping row (missing data):`, row);
      skipped++;
      continue;
    }

    const docRef = db.collection('students').doc(id); // use haptiq_id as doc ID
    batch.set(docRef, {
      haptiq_id:    id,
      email,
      name,
      college,
      verified:     false,
      verified_time: null,
      token_number:  null,
    }, { merge: false }); // set merge: true to update existing without overwriting

    count++;
    imported++;

    if (count === BATCH_SIZE) {
      batches.push(batch);
      batch = db.batch();
      count = 0;
    }
  }

  if (count > 0) batches.push(batch);

  console.log(`Committing ${batches.length} batch(es) to Firestore…`);

  for (let i = 0; i < batches.length; i++) {
    try {
      await batches[i].commit();
      console.log(`  ✓ Batch ${i + 1}/${batches.length} committed`);
    } catch (e) {
      console.error(`  ✗ Batch ${i + 1} failed:`, e.message);
      errors++;
    }
  }

  console.log('\n─── Import Summary ───────────────────');
  console.log(`  Imported : ${imported}`);
  console.log(`  Skipped  : ${skipped}`);
  console.log(`  Errors   : ${errors}`);
  console.log('──────────────────────────────────────');
}

importStudents().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
