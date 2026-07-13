/**
 * POST/GET /api/invoices/process-email
 *
 * Multi-tenant invoice-email processor. Two invocation modes:
 *
 * 1) POLL MODE (default when body is empty or { mode: "poll" })
 *    - Reads every organizationSettings with `autoProcessEmails === true`.
 *    - Iterates the orgs in round-robin (oldest `lastEmailPollAt` first).
 *    - For each org, opens IMAP with THAT org's stored + encrypted credentials,
 *      fetches unread messages since last poll, parses them, matches machine,
 *      creates invoice, and notifies admin if the machine can't be matched.
 *    - Respects the `pollBudgetMs` to stay well under Vercel's 10s Hobby cap.
 *
 * 2) WEBHOOK MODE (body has `from` / `subject` / `textBody` / `emails[]`)
 *    - Accept email payloads from Zapier/Make/Postmark and run them through
 *      the same pipeline.
 *
 * Auth: `x-cron-secret` header, `?secret=` query, or `Authorization: Bearer …`.
 * Secret comes from env var `CRON_SECRET` (global). Users don't share it —
 * they just paste it into their cron-job.org / GitHub Actions.
 */

import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectDB } from '@/lib/mongodb';
import { parseInvoiceEmail } from '@/lib/invoice-parser';
import { resolveImapConfig } from '@/lib/imap-providers';
import { pollMailbox } from '@/lib/imap-poller';
import { decryptOrPassthrough } from '@/lib/crypto';
import { notifyUnassignedInvoice } from '@/lib/whatsapp';
import { sendEmail } from '@/lib/email';

const GLOBAL_CRON_SECRET = process.env.CRON_SECRET || '';

// Keep the whole request under Vercel Hobby's 10s hard cap
const DEFAULT_POLL_BUDGET_MS = Number(process.env.INVOICE_POLL_BUDGET_MS) || 8500;
const DEFAULT_MAX_MESSAGES_PER_ORG = Number(process.env.INVOICE_MAX_PER_ORG) || 10;
const DEFAULT_ORGS_PER_TICK = Number(process.env.INVOICE_ORGS_PER_TICK) || 3;

// Force Node.js runtime — IMAP needs raw TCP, not Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ─────────────────────────── AUTH ─────────────────────────── */

function isAuthorized(request) {
  if (!GLOBAL_CRON_SECRET) return false;
  const authHeader = request.headers.get('authorization') || '';
  const cronHeader = request.headers.get('x-cron-secret') || '';
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get('secret') || '';
  return (
    cronHeader === GLOBAL_CRON_SECRET ||
    querySecret === GLOBAL_CRON_SECRET ||
    authHeader === `Bearer ${GLOBAL_CRON_SECRET}`
  );
}

/* ─────────────────────────── HANDLERS ─────────────────────────── */

export async function POST(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  // Webhook mode: payload contains an email
  if (body && (body.from || body.subject || body.textBody || Array.isArray(body.emails))) {
    return handleWebhookMode(body);
  }

  // Poll mode (default)
  return handlePollMode(body);
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // GET is also poll mode — makes URL-only cron setups trivial
  return handlePollMode({});
}

/* ─────────────────────────── POLL MODE ─────────────────────────── */

async function handlePollMode(body) {
  const startedAt = Date.now();
  const budgetMs = Number(body.pollBudgetMs) || DEFAULT_POLL_BUDGET_MS;
  const orgsPerTick = Number(body.orgsPerTick) || DEFAULT_ORGS_PER_TICK;
  const maxPerOrg = Number(body.maxMessagesPerOrg) || DEFAULT_MAX_MESSAGES_PER_ORG;

  const db = await connectDB();

  // Pick eligible orgs, oldest-polled first
  const candidates = await db
    .collection('organizationSettings')
    .find({
      autoProcessEmails: true,
      invoiceEmail: { $exists: true, $ne: '' },
      invoiceEmailPassword: { $exists: true, $ne: '' },
    })
    .sort({ lastEmailPollAt: 1 })
    .limit(orgsPerTick)
    .toArray();

  const results = [];
  for (const org of candidates) {
    if (Date.now() - startedAt > budgetMs) {
      results.push({ organizationId: String(org.organizationId), status: 'skipped_budget' });
      continue;
    }
    const perOrgBudget = budgetMs - (Date.now() - startedAt);
    const orgResult = await processOrganization(db, org, {
      maxMessages: maxPerOrg,
      socketTimeoutMs: Math.min(8000, Math.max(3000, perOrgBudget - 1500)),
    });
    results.push(orgResult);
  }

  return NextResponse.json({
    mode: 'poll',
    tookMs: Date.now() - startedAt,
    orgsConsidered: candidates.length,
    results,
  });
}

async function processOrganization(db, org, { maxMessages, socketTimeoutMs }) {
  const orgLabel = org.organization || String(org.organizationId || 'unknown');
  const cfg = resolveImapConfig({
    invoiceEmail: org.invoiceEmail,
    imapHost: org.imapHost,
    imapPort: org.imapPort,
    imapSecure: org.imapSecure,
  });

  if (!cfg) {
    await touchLastPoll(db, org, { lastEmailPollError: 'No IMAP config for provider' });
    return { organizationId: String(org.organizationId), org: orgLabel, status: 'no_imap_config' };
  }

  let password;
  try {
    password = decryptOrPassthrough(org.invoiceEmailPassword);
  } catch (err) {
    await touchLastPoll(db, org, { lastEmailPollError: 'Cannot decrypt password' });
    return { organizationId: String(org.organizationId), org: orgLabel, status: 'decrypt_failed' };
  }

  let poll;
  try {
    poll = await pollMailbox({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      user: org.invoiceEmail,
      pass: password,
      mailbox: org.imapMailbox || 'INBOX',
      maxMessages,
      sinceDays: 14,
      markSeen: true,
      socketTimeoutMs,
      onMessage: async (email) => {
        await processOneEmail(db, email, org);
      },
    });
  } catch (err) {
    await touchLastPoll(db, org, { lastEmailPollError: err.message });
    return { organizationId: String(org.organizationId), org: orgLabel, status: 'imap_error', error: err.message };
  }

  await touchLastPoll(db, org, { lastEmailPollError: null });

  return {
    organizationId: String(org.organizationId),
    org: orgLabel,
    status: 'ok',
    fetched: poll.fetched,
    processed: poll.processed,
    errors: poll.errors,
  };
}

async function touchLastPoll(db, org, extra = {}) {
  try {
    await db.collection('organizationSettings').updateOne(
      { _id: org._id },
      { $set: { lastEmailPollAt: new Date(), ...extra } }
    );
  } catch (err) {
    console.warn('[InvoiceEmail] Could not update lastEmailPollAt:', err.message);
  }
}

/* ─────────────────────────── WEBHOOK MODE ─────────────────────────── */

async function handleWebhookMode(body) {
  const db = await connectDB();
  if (body.from || body.subject || body.textBody) {
    const result = await processOneEmail(db, body, null);
    return NextResponse.json(result, { status: result.status === 'error' ? 500 : 200 });
  }
  if (Array.isArray(body.emails)) {
    const results = [];
    for (const email of body.emails) {
      results.push(await processOneEmail(db, email, null));
    }
    return NextResponse.json({ processed: results.length, results });
  }
  return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
}

/* ─────────────────────────── CORE PIPELINE ─────────────────────────── */

/**
 * @param {*} db
 * @param {object} email — normalized email (from webhook or from imap-poller)
 * @param {object|null} org — organizationSettings doc (poll mode) or null (webhook mode)
 */
async function processOneEmail(db, email, org) {
  try {
    // 1. Dedupe by messageId
    if (email.messageId) {
      const existing = await db.collection('invoices').findOne({
        $or: [
          { 'emailSource.messageId': email.messageId },
          { 'emailMetadata.messageId': email.messageId },
        ],
      });
      if (existing) {
        return {
          status: 'skipped',
          reason: 'already_processed',
          invoiceId: existing.invoiceId,
        };
      }
    }

    // 2. Parse
    const parsed = parseInvoiceEmail(email);

    // 3. Find machine (scoped to org if we have one)
    const machine = await findMachine(db, parsed.machineIds, org);

    // 4. Create invoice
    const invoice = await createInvoiceFromEmail(db, parsed, machine, org);

    // 5. Notify if unassigned and org opted in
    let notification = null;
    const shouldNotify = !machine && (!org || org.notifyOnUnassignedInvoice !== false);
    if (shouldNotify) {
      notification = await sendUnassignedNotifications({ invoice, parsed, org });
    }

    return {
      status: 'created',
      invoiceId: invoice.invoiceId,
      machineAssigned: !!machine,
      machineName: machine ? (machine.machineId || machine.customId || machine.model) : null,
      parsedData: {
        vendor: parsed.vendor,
        amount: parsed.totalAmount,
        machineIds: parsed.machineIds,
        confidence: parsed.confidence,
      },
      notification: notification
        ? { method: notification.method, success: notification.success, waLink: notification.waLink || null }
        : null,
    };
  } catch (err) {
    console.error('[InvoiceEmail] processOneEmail error:', err);
    return { status: 'error', error: err.message };
  }
}

async function findMachine(db, parsedMachineIds, org) {
  if (!parsedMachineIds || parsedMachineIds.length === 0) return null;

  const orgScope = buildOrgScope(org);

  for (const candidate of parsedMachineIds) {
    const rx = new RegExp(`^${escapeRegex(candidate)}$`, 'i');
    const filter = {
      $or: [
        { machineId: rx },
        { customId: rx },
        { maquinariaId: rx },
        { model: rx },
      ],
      ...orgScope,
    };
    const machine = await db.collection('vehicles').findOne(filter);
    if (machine) return machine;
  }
  return null;
}

function buildOrgScope(org) {
  if (!org) return {};
  const scope = {};
  if (org.organizationId) {
    const or = [{ organizationId: org.organizationId }];
    if (typeof org.organizationId === 'string' && ObjectId.isValid(org.organizationId)) {
      or.push({ organizationId: new ObjectId(org.organizationId) });
    }
    if (org.organizationId?.toString) {
      or.push({ organizationId: org.organizationId.toString() });
    }
    scope.$or = or;
  } else if (org.organization) {
    scope.organization = org.organization;
  }
  return scope;
}

async function createInvoiceFromEmail(db, parsed, machine, org) {
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

  // Multi-tenant scoping
  if (org) {
    if (org.organizationId) invoice.organizationId = org.organizationId;
    if (org.organization) invoice.organization = org.organization;
  } else if (machine) {
    // Webhook mode: inherit from the matched machine
    if (machine.organizationId) invoice.organizationId = machine.organizationId;
    if (machine.organization) invoice.organization = machine.organization;
  }

  const result = await db.collection('invoices').insertOne(invoice);
  return { ...invoice, _id: result.insertedId };
}

async function sendUnassignedNotifications({ invoice, parsed, org }) {
  const wantsWhatsApp = !org || org.notifyViaWhatsApp !== false;
  const wantsEmail = !org || org.notifyViaEmail !== false;
  const adminWhatsApp = org?.adminWhatsApp;
  const notifyEmail = org?.invoiceEmail || process.env.EMAIL_USER || 'orchardservices96@gmail.com';

  let notification = null;

  if (wantsWhatsApp) {
    try {
      notification = await notifyUnassignedInvoice({
        invoiceId: invoice.invoiceId,
        vendor: parsed.vendor,
        totalAmount: parsed.totalAmount,
        currency: parsed.currency,
        date: parsed.date,
        emailSubject: parsed.emailSubject,
        machineIds: parsed.machineIds,
        description: parsed.description,
        adminWhatsApp,
        whatsAppPhoneId: org?.whatsAppPhoneId,
        whatsAppAccessToken: org?.whatsAppAccessToken,
      });
    } catch (err) {
      console.warn('[InvoiceEmail] WhatsApp notification failed:', err.message);
    }
  }

  if (wantsEmail) {
    try {
      await sendEmail({
        to: notifyEmail,
        subject: `⚠️ Invoice ${invoice.invoiceId} needs machine assignment`,
        html: `
          <h2>Invoice Needs Machine Assignment</h2>
          <p>An invoice was received by email but couldn't be automatically assigned to a machine.</p>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Invoice ID</td><td style="padding:8px;border:1px solid #ddd">${invoice.invoiceId}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Vendor</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(parsed.vendor)}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Amount</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(parsed.currency)} ${parsed.totalAmount ?? 'N/A'}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">IDs Found</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml((parsed.machineIds || []).join(', ') || 'None')}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Email Subject</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(parsed.emailSubject || 'N/A')}</td></tr>
          </table>
          <p style="margin-top:16px">
            <a href="${process.env.NEXTAUTH_URL || 'https://orchardservices.co.nz'}/dashboard"
               style="background:#059669;color:white;padding:10px 20px;border-radius:6px;text-decoration:none">
              Resolve in App
            </a>
          </p>
        `,
      });
    } catch (emailErr) {
      console.warn('[InvoiceEmail] Email notification failed:', emailErr.message);
    }
  }

  return notification;
}

/* ─────────────────────────── utils ─────────────────────────── */

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
