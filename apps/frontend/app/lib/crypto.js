/**
 * Symmetric encryption for storing sensitive credentials (IMAP passwords,
 * API tokens, etc.) in MongoDB.
 *
 * Uses AES-256-GCM with a random IV per ciphertext.
 * Master key comes from env var INVOICE_ENCRYPTION_KEY (32 bytes hex or base64).
 *
 * Ciphertext format (base64): [12 bytes IV][16 bytes auth tag][N bytes ciphertext]
 */

import crypto from 'node:crypto';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;

let cachedKey = null;

function getKey() {
  if (cachedKey) return cachedKey;

  const raw = process.env.INVOICE_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      'INVOICE_ENCRYPTION_KEY is not set. Generate one with:\n' +
      '  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }

  // Accept hex (64 chars), base64 (44 chars), or raw utf8 (32 bytes)
  let key;
  if (/^[0-9a-f]{64}$/i.test(raw)) {
    key = Buffer.from(raw, 'hex');
  } else if (/^[A-Za-z0-9+/=]{43,44}$/.test(raw)) {
    key = Buffer.from(raw, 'base64');
  } else {
    key = Buffer.from(raw, 'utf8');
  }

  if (key.length !== 32) {
    throw new Error(`INVOICE_ENCRYPTION_KEY must be 32 bytes (got ${key.length})`);
  }

  cachedKey = key;
  return key;
}

/**
 * Encrypt a plaintext string.
 * @param {string} plaintext
 * @returns {string} base64-encoded ciphertext package, or '' if plaintext is empty
 */
export function encrypt(plaintext) {
  if (plaintext == null || plaintext === '') return '';
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(String(plaintext), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

/**
 * Decrypt a base64 ciphertext package previously produced by encrypt().
 * Returns '' for empty input. Throws on tamper / bad key.
 * @param {string} ciphertext
 * @returns {string} plaintext
 */
export function decrypt(ciphertext) {
  if (ciphertext == null || ciphertext === '') return '';
  const key = getKey();
  const buf = Buffer.from(String(ciphertext), 'base64');
  if (buf.length < IV_LEN + TAG_LEN + 1) {
    throw new Error('Ciphertext too short or malformed');
  }
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const data = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(data), decipher.final()]);
  return plaintext.toString('utf8');
}

/**
 * Best-effort decrypt: if the value looks like a legacy plaintext password
 * (does not decode as our base64 package), return it as-is.
 * Useful during the migration window from plaintext -> encrypted storage.
 */
export function decryptOrPassthrough(value) {
  if (!value) return '';
  try {
    return decrypt(value);
  } catch {
    return String(value);
  }
}

/**
 * Cheap check to see whether a stored value looks like our ciphertext format.
 */
export function looksEncrypted(value) {
  if (!value || typeof value !== 'string') return false;
  try {
    const buf = Buffer.from(value, 'base64');
    return buf.length >= IV_LEN + TAG_LEN + 1;
  } catch {
    return false;
  }
}
