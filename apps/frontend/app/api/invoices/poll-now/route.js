/**
 * POST /api/invoices/poll-now
 *
 * Trigger an immediate poll for the CURRENT organization. Useful for the
 * "Process now" button in InvoiceSettings — user gets instant feedback.
 *
 * Auth: normal session (admin only). Does NOT require CRON_SECRET.
 */

import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '../../auth/[...nextauth]/route';
import { parseInvoiceEmail } from '@/lib/invoice-parser';
import { resolveImapConfig } from '@/lib/imap-providers';
import { pollMailbox } from '@/lib/imap-poller';
import { decryptOrPassthrough } from '@/lib/crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_MESSAGES = 10;
const SOCKET_TIMEOUT_MS = 8000;

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Only administrators can trigger poll' }, { status: 403 });
    }

    const db = await connectDB();
    const orgId = session.user.credentialId;
    const orgName = session.user.organization || session.user.company;

    const orFilter = [];
    if (orgId) {
      orFilter.push({ organizationId: orgId });
      if (ObjectId.isValid(orgId)) {
        orFilter.push({ organizationId: new ObjectId(orgId) });
      }
    }
    if (orgName) orFilter.push({ organization: orgName });

    const org = orFilter.length
      ? await db.collection('organizationSettings').findOne({ $or: orFilter })
      : null;

    if (!org) {
      return NextResponse.json(
        { error: 'No invoice settings configured for this organization.' },
        { status: 400 }
      );
    }
    if (!org.invoiceEmail || !org.invoiceEmailPassword) {
      return NextResponse.json(
        { error: 'Configure email + app password before polling.' },
        { status: 400 }
      );
    }

    const cfg = resolveImapConfig({
      invoiceEmail: org.invoiceEmail,
      imapHost: org.imapHost,
      imapPort: org.imapPort,
      imapSecure: org.imapSecure,
    });
    if (!cfg) {
      return NextResponse.json(
        { error: 'Unknown email provider. Configure IMAP host/port manually.' },
        { status: 400 }
      );
    }

    let password;
    try {
      password = decryptOrPassthrough(org.invoiceEmailPassword);
    } catch {
      return NextResponse.json(
        { error: 'Cannot decrypt stored password. Re-enter it.' },
        { status: 500 }
      );
    }

    const created = [];
    const skipped = [];
    const errors = [];

    try {
      const poll = await pollMailbox({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.secure,
        user: org.invoiceEmail,
        pass: password,
        mailbox: org.imapMailbox || 'INBOX',
        maxMessages: MAX_MESSAGES,
        sinceDays: 30,
        markSeen: true,
        socketTimeoutMs: SOCKET_TIMEOUT_MS,
        onMessage: async (email) => {
          try {
            const outcome = await processOne(db, email, org);
            if (outcome.status === 'created') created.push(outcome);
            else if (outcome.status === 'skipped') skipped.push(outcome);
            else errors.push(outcome);
          } catch (err) {
            console.error('[PollNow] processOne threw for uid', email.uid, 'subject:', email.subject, 'error:', err.message, err.stack);
            errors.push({
              status: 'error',
              uid: email.uid,
              messageId: email.messageId,
              from: email.from,
              subject: email.subject,
              error: err.message,
            });
          }
        },
      });

      await db.collection('organizationSettings').updateOne(
        { _id: org._id },
        { $set: { lastEmailPollAt: new Date(), lastEmailPollError: null } }
      );

      return NextResponse.json({
        ok: true,
        fetched: poll.fetched,
        processed: poll.processed,
        created,
        skipped,
        errors: [...errors, ...poll.errors],
        provider: cfg,
      });
    } catch (err) {
      await db.collection('organizationSettings').updateOne(
        { _id: org._id },
        { $set: { lastEmailPollAt: new Date(), lastEmailPollError: err.message } }
      );
      return NextResponse.json(
        { ok: false, error: err.message, provider: cfg },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[PollNow] Fatal:', error);
    return NextResponse.json(
      { error: 'Failed to poll', details: error.message },
      { status: 500 }
    );
  }
}

/* ─────────────────────────── inline pipeline ─────────────────────────── */

async function processOne(db, email, org) {
  if (email.messageId) {
    const existing = await db.collection('invoices').findOne({
      $or: [
        { 'emailSource.messageId': email.messageId },
        { 'emailMetadata.messageId': email.messageId },
      ],
    });
    if (existing) {
      return { status: 'skipped', reason: 'already_processed', invoiceId: existing.invoiceId };
    }
  }

  const parsed = parseInvoiceEmail(email);
  const machine = await findMachine(db, parsed.machineIds, org);
  const invoice = await createInvoice(db, parsed, machine, org);

  return {
    status: 'created',
    invoiceId: invoice.invoiceId,
    machineAssigned: !!machine,
    machineName: machine ? (machine.machineId || machine.customId || machine.model) : null,
    vendor: parsed.vendor,
    amount: parsed.totalAmount,
    machineIds: parsed.machineIds,
  };
}

async function findMachine(db, ids, org) {
  if (!ids?.length) return null;
  const orgScope = {};
  if (org?.organizationId) {
    const or = [{ organizationId: org.organizationId }];
    if (typeof org.organizationId === 'string' && ObjectId.isValid(org.organizationId)) {
      or.push({ organizationId: new ObjectId(org.organizationId) });
    }
    orgScope.$or = or;
  } else if (org?.organization) {
    orgScope.organization = org.organization;
  }

  for (const candidate of ids) {
    const rx = new RegExp(`^${escapeRegex(candidate)}$`, 'i');
    const machine = await db.collection('vehicles').findOne({
      $or: [
        { machineId: rx }, { customId: rx }, { maquinariaId: rx }, { model: rx },
      ],
      ...orgScope,
    });
    if (machine) return machine;
  }
  return null;
}

async function createInvoice(db, parsed, machine, org) {
  const year = new Date().getFullYear();
  const count = await db.collection('invoices').countDocuments({
    invoiceId: { $regex: `^INV-${year}-` },
  });
  const invoiceId = `INV-${year}-${String(count + 1).padStart(4, '0')}`;
  const invoice = {
    invoiceId,
    date: parsed.date || new Date(),
    vendor: parsed.vendor || 'Unknown',
    description: parsed.description || 'Auto-imported from email',
    category: parsed.category || 'Other',
    items: [],
    subtotal: parsed.totalAmount || 0,
    tax: 0,
    totalAmount: parsed.totalAmount || 0,
    currency: parsed.currency || 'NZD',
    status: machine ? 'Pending Review' : 'Unassigned',
    receivedViaEmail: true,
    emailSource: {
      from: parsed.emailFrom,
      subject: parsed.emailSubject,
      messageId: parsed.emailMessageId,
      processedAt: new Date(),
    },
    ocrConfidence: parsed.confidence,
    parsedMachineIds: parsed.machineIds,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  if (machine) {
    invoice.machineId = machine._id;
    invoice.machineCustomId = machine.machineId || machine.customId || '';
  }
  if (org?.organizationId) invoice.organizationId = org.organizationId;
  if (org?.organization) invoice.organization = org.organization;
  const r = await db.collection('invoices').insertOne(invoice);
  return { ...invoice, _id: r.insertedId };
}

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
