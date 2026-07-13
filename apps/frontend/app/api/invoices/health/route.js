/**
 * GET /api/invoices/health
 *
 * Public diagnostic endpoint (no secrets, no session required) that reports
 * whether the invoice-email feature is *configured*, without leaking any
 * secret values. Handy to confirm from a browser tab whether the Vercel
 * deploy has the required env vars and dependencies.
 *
 * Returns HTTP 200 always, so it can be probed by uptime tools too.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const env = {
    INVOICE_ENCRYPTION_KEY: !!process.env.INVOICE_ENCRYPTION_KEY,
    CRON_SECRET: !!process.env.CRON_SECRET,
    MONGODB_URI: !!process.env.MONGODB_URI,
    NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    ADMIN_WHATSAPP: !!process.env.ADMIN_WHATSAPP,
    WHATSAPP_PHONE_ID: !!process.env.WHATSAPP_PHONE_ID,
    WHATSAPP_ACCESS_TOKEN: !!process.env.WHATSAPP_ACCESS_TOKEN,
  };

  const deps = {
    imapflow: safeCanLoad('imapflow'),
    mailparser: safeCanLoad('mailparser'),
  };

  // Only try validating the encryption key if the caller looks like localhost
  // (to avoid revealing details in production error messages).
  let encryptionKeyValid = null;
  if (env.INVOICE_ENCRYPTION_KEY) {
    try {
      // Import lazily so a bad key doesn't crash the endpoint
      const { encrypt, decrypt } = await import('@/lib/crypto');
      const enc = encrypt('healthcheck');
      const dec = decrypt(enc);
      encryptionKeyValid = dec === 'healthcheck';
    } catch (err) {
      encryptionKeyValid = false;
    }
  }

  const missing = [];
  if (!env.INVOICE_ENCRYPTION_KEY) missing.push('INVOICE_ENCRYPTION_KEY (required to encrypt IMAP passwords)');
  if (!env.CRON_SECRET) missing.push('CRON_SECRET (required to authorize the poller)');
  if (!env.MONGODB_URI) missing.push('MONGODB_URI (required for DB access)');
  if (!deps.imapflow) missing.push('imapflow dependency');
  if (!deps.mailparser) missing.push('mailparser dependency');
  if (encryptionKeyValid === false) missing.push('INVOICE_ENCRYPTION_KEY is set but invalid (must be 32 bytes hex/base64)');

  return NextResponse.json({
    ok: missing.length === 0,
    env,
    deps,
    encryptionKeyValid,
    missing,
    hint: missing.length === 0
      ? 'All required config present. Poller endpoint is /api/invoices/process-email?secret=<CRON_SECRET>.'
      : 'Add the missing values to your Vercel env vars and redeploy.',
    now: new Date().toISOString(),
  });
}

function safeCanLoad(mod) {
  try {
    require.resolve(mod);
    return true;
  } catch {
    return false;
  }
}
