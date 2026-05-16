#!/usr/bin/env node
/**
 * scripts/generateQR.js
 *
 * Generates a QR code image for the student verification page.
 *
 * Usage:
 *   node scripts/generateQR.js https://yourdomain.vercel.app
 *
 * Output: qr-code.png in current directory
 *
 * Install: npm install qrcode
 */

import QRCode from 'qrcode';

const url = process.argv[2] || 'https://yourdomain.vercel.app';

const options = {
  type: 'png',
  width: 600,
  margin: 2,
  color: {
    dark:  '#15803d', // green
    light: '#ffffff',
  },
  errorCorrectionLevel: 'H',
};

QRCode.toFile('./qr-code.png', url, options, (err) => {
  if (err) {
    console.error('Error generating QR:', err);
    process.exit(1);
  }
  console.log(`✓ QR code saved to: qr-code.png`);
  console.log(`  URL: ${url}`);
  console.log('  Print or display this for students to scan.');
});
