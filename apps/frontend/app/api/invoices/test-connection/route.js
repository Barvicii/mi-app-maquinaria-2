/**
 * POST /api/invoices/test-connection
 *
 * Test IMAP credentials for the current org WITHOUT saving them.
 * Called by the "Test connection" button in InvoiceSettings.
 *
 * Body:
 *   { email, password?, imapHost?, imapPort?, imapSecure? }
 *
 * If `password` is omitted (or is the masked placeholder), we fall back to the
 * currently stored (encrypted) password for the org.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { ObjectId } from 'mongodb';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '../../auth/[...nextauth]/route';
import { resolveImapConfig, detectProvider } from '@/lib/imap-providers';
import { testConnection } from '@/lib/imap-poller';
import { decryptOrPassthrough } from '@/lib/crypto';

const MASKED = '••••••••';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Only administrators can test connection' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').trim();
    const rawPassword = body.password;
    const imapHost = body.imapHost ? String(body.imapHost).trim() : '';
    const imapPort = body.imapPort ? Number(body.imapPort) : undefined;
    const imapSecure = body.imapSecure !== false;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Resolve password: use the one from body OR fall back to stored
    let password = '';
    const shouldUseStored = !rawPassword || rawPassword === MASKED;

    if (shouldUseStored) {
      const db = await connectDB();
      const orgId = session.user.credentialId;
      const orgName = session.user.organization || session.user.company;

      const filter = orgId
        ? { $or: [{ organizationId: orgId }, ...(ObjectId.isValid(orgId) ? [{ organizationId: new ObjectId(orgId) }] : [])] }
        : { organization: orgName };

      const settings = await db.collection('organizationSettings').findOne(filter);
      if (!settings || !settings.invoiceEmailPassword) {
        return NextResponse.json(
          { error: 'No stored password. Enter your app password in the field and try again.' },
          { status: 400 }
        );
      }
      try {
        password = decryptOrPassthrough(settings.invoiceEmailPassword);
      } catch (err) {
        return NextResponse.json(
          { error: 'Could not decrypt stored password. Re-enter it in the field.' },
          { status: 500 }
        );
      }
    } else {
      password = String(rawPassword);
    }

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    // Resolve IMAP config
    const cfg = resolveImapConfig({
      invoiceEmail: email,
      imapHost: imapHost || undefined,
      imapPort,
      imapSecure,
    });
    if (!cfg) {
      const provider = detectProvider(email);
      return NextResponse.json(
        {
          error: `Unknown email provider for "${email}". Please enter IMAP host/port manually.`,
          detected: provider,
        },
        { status: 400 }
      );
    }

    try {
      const result = await testConnection({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.secure,
        user: email,
        pass: password,
      });
      return NextResponse.json({
        ok: true,
        provider: cfg,
        inboxFound: result.inboxFound,
        mailboxCount: result.mailboxCount,
        sampleMailboxes: result.sampleMailboxes,
      });
    } catch (err) {
      return NextResponse.json(
        {
          ok: false,
          error: friendlyImapError(err.message),
          rawError: err.message,
          provider: cfg,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[InvoiceTest] Error:', error);
    return NextResponse.json(
      { error: 'Failed to test connection', details: error.message },
      { status: 500 }
    );
  }
}

function friendlyImapError(msg) {
  const lower = (msg || '').toLowerCase();
  if (lower.includes('authentication') || lower.includes('invalid credentials') || lower.includes('login failed') || lower.includes('auth')) {
    return 'Authentication failed. Check your email and app password. ' +
      'Gmail/Outlook/Yahoo/iCloud require an APP PASSWORD, not your login password.';
  }
  if (lower.includes('timeout') || lower.includes('etimedout')) {
    return 'Connection timed out. Your provider may block IMAP or the host/port is wrong.';
  }
  if (lower.includes('enotfound') || lower.includes('getaddrinfo')) {
    return 'IMAP host not found. Verify the server address.';
  }
  if (lower.includes('econnrefused')) {
    return 'Connection refused. The IMAP port may be blocked or wrong.';
  }
  if (lower.includes('certificate') || lower.includes('self signed') || lower.includes('tls')) {
    return 'TLS/certificate error. Confirm the provider supports secure IMAP on this port.';
  }
  return `IMAP error: ${msg}`;
}
