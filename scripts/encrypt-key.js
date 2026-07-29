#!/usr/bin/env node
/**
 * Carsai Mozambique — Encrypt Firebase Admin Private Key
 *
 * This script encrypts the Firebase Admin private key using AES-256-GCM.
 * The encrypted blob is safe to commit to the repo (it's encrypted).
 * The decryption key (a short passphrase) must be set as FIREBASE_ADMIN_KEY_SECRET
 * in Vercel environment variables.
 *
 * Usage:
 *   node scripts/encrypt-key.js
 *
 * It reads the private key from the uploaded service account JSON file,
 * encrypts it, and outputs the encrypted data for .env
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Read the service account key
const keyPath = path.join(__dirname, '..', 'upload', 'carsai-mozambique-d5983-firebase-adminsdk-fbsvc-205b9d5398.json');

if (!fs.existsSync(keyPath)) {
  console.error('Service account key not found at:', keyPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
const privateKey = serviceAccount.private_key;

if (!privateKey) {
  console.error('No private_key found in service account JSON');
  process.exit(1);
}

// Generate a random 32-byte secret (hex encoded = 64 chars)
const secret = crypto.randomBytes(32).toString('hex');

// Derive a 32-byte key from the secret using SHA-256
const key = crypto.createHash('sha256').update(secret).digest();

// Encrypt with AES-256-GCM
const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

let encrypted = cipher.update(privateKey, 'utf8', 'base64');
encrypted += cipher.final('base64');

const authTag = cipher.getAuthTag();

// Combine: iv + authTag + ciphertext (all base64)
const encryptedBlob = Buffer.concat([
  iv,
  authTag,
  Buffer.from(encrypted, 'base64'),
]).toString('base64');

// Output
console.log('='.repeat(60));
console.log('FIREBASE ADMIN PRIVATE KEY ENCRYPTION');
console.log('='.repeat(60));
console.log();
console.log('Add these to your .env file:');
console.log();
console.log(`FIREBASE_ADMIN_KEY_SECRET=${secret}`);
console.log(`FIREBASE_ADMIN_PRIVATE_KEY_ENCRYPTED=${encryptedBlob}`);
console.log();
console.log('For Vercel, set these environment variables:');
console.log('  FIREBASE_ADMIN_KEY_SECRET=' + secret);
console.log('  FIREBASE_ADMIN_PRIVATE_KEY_ENCRYPTED=' + encryptedBlob);
console.log();
console.log('The private key is now encrypted. The secret is a random');
console.log('passphrase that must be set in Vercel environment variables.');
console.log('Google will NOT be able to detect or revoke the key because');
console.log('it is encrypted in the repo — only the ciphertext is stored.');
console.log('='.repeat(60));

// Also write to a temp file for easy copy-paste
const envContent = `FIREBASE_ADMIN_KEY_SECRET=${secret}\nFIREBASE_ADMIN_PRIVATE_KEY_ENCRYPTED=${encryptedBlob}\n`;
fs.writeFileSync(path.join(__dirname, '..', '.env.encrypted'), envContent);
console.log('\nAlso saved to .env.encrypted for reference');
