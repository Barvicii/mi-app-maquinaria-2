/**
 * IMAP Poller — reusable, environment-agnostic.
 *
 * Works from:
 *  - Vercel serverless (short-lived: connect → fetch → close, under ~10s)
 *  - A standalone Node worker on a VPS (`node worker.js`)
 *
 * It intentionally does NOT talk to DB or Next.js. Callers wire it up.
 * Uses `imapflow` + `mailparser` (kept as regular deps).
 */

import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

/**
 * Connect to an IMAP server, fetch unread messages, mark them seen, close.
 *
 * @param {object} opts
 * @param {string} opts.host              — IMAP hostname
 * @param {number} opts.port              — IMAP port (usually 993)
 * @param {boolean} [opts.secure=true]    — use TLS
 * @param {string} opts.user              — email address
 * @param {string} opts.pass              — password / app password
 * @param {string} [opts.mailbox='INBOX'] — mailbox to open
 * @param {number} [opts.maxMessages=20]  — hard cap per poll (safety for timeouts)
 * @param {number} [opts.sinceDays=14]    — only fetch messages newer than N days
 * @param {boolean} [opts.markSeen=true]  — flag messages as \Seen after processing
 * @param {number} [opts.socketTimeoutMs=8000] — connection timeout budget
 * @param {(msg:ParsedEmail) => Promise<any>} opts.onMessage — callback per email
 * @returns {Promise<{fetched:number, processed:number, errors:Array<{uid:number,error:string}>}>}
 */
export async function pollMailbox({
  host,
  port,
  secure = true,
  user,
  pass,
  mailbox = 'INBOX',
  maxMessages = 20,
  sinceDays = 14,
  markSeen = true,
  socketTimeoutMs = 8000,
  onMessage,
}) {
  if (!host || !user || !pass) {
    throw new Error('pollMailbox: host, user and pass are required');
  }
  if (typeof onMessage !== 'function') {
    throw new Error('pollMailbox: onMessage callback is required');
  }

  const client = new ImapFlow({
    host,
    port,
    secure,
    auth: { user, pass },
    logger: false,
    // Keep it snappy for serverless
    socketTimeout: socketTimeoutMs,
    greetingTimeout: socketTimeoutMs,
    connectionTimeout: socketTimeoutMs,
    // Some Microsoft / Yahoo servers dislike ID capability
    disableAutoIdle: true,
  });

  const result = { fetched: 0, processed: 0, errors: [] };

  try {
    await client.connect();
  } catch (err) {
    throw new Error(`IMAP connect failed (${host}:${port}): ${err.message}`);
  }

  let lock;
  try {
    lock = await client.getMailboxLock(mailbox);
  } catch (err) {
    await safeLogout(client);
    throw new Error(`Cannot open mailbox "${mailbox}": ${err.message}`);
  }

  try {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    const searchResult = await client.search({ seen: false, since });
    const uids = Array.isArray(searchResult) ? searchResult : [];
    result.fetched = uids.length;

    if (uids.length === 0) return result;

    // Process oldest first, cap to maxMessages
    const toProcess = uids.slice(0, maxMessages);

    for (const uid of toProcess) {
      try {
        // Download the raw RFC-822 source for accurate MIME parsing
        const download = await client.download(uid, undefined, { uid: true });
        if (!download || !download.content) {
          result.errors.push({ uid, error: 'No content returned' });
          continue;
        }

        const parsed = await simpleParser(download.content);
        const attachments = (parsed.attachments || []).map((a) => ({
          filename: a.filename || null,
          contentType: a.contentType || null,
          size: a.size || 0,
          contentBase64: a.content ? Buffer.from(a.content).toString('base64') : null,
        }));

        const email = {
          uid,
          messageId: parsed.messageId || null,
          from: formatAddress(parsed.from),
          to: formatAddress(parsed.to),
          subject: parsed.subject || '',
          date: parsed.date || null,
          textBody: parsed.text || '',
          htmlBody: parsed.html || '',
          attachments,
        };

        await onMessage(email);
        result.processed += 1;

        if (markSeen) {
          try {
            await client.messageFlagsAdd({ uid }, ['\\Seen'], { uid: true });
          } catch (flagErr) {
            // Non-fatal: worst case we re-process next tick and dedupe by messageId
            console.warn(`[imap] Could not mark uid=${uid} as seen: ${flagErr.message}`);
          }
        }
      } catch (err) {
        console.error(`[imap] onMessage failed for uid=${uid} subject="${(typeof email !== 'undefined' && email?.subject) || 'n/a'}": ${err.message}`, err.stack);
        result.errors.push({ uid, subject: (typeof email !== 'undefined' ? email?.subject : null) || null, error: err.message });
      }
    }
  } finally {
    if (lock) {
      try { lock.release(); } catch {}
    }
    await safeLogout(client);
  }

  return result;
}

/**
 * Just test that credentials work — connect, open INBOX, close.
 * Returns { ok: true, mailboxes: [...] } or throws.
 */
export async function testConnection({ host, port, secure = true, user, pass, socketTimeoutMs = 6000 }) {
  const client = new ImapFlow({
    host,
    port,
    secure,
    auth: { user, pass },
    logger: false,
    socketTimeout: socketTimeoutMs,
    greetingTimeout: socketTimeoutMs,
    connectionTimeout: socketTimeoutMs,
    disableAutoIdle: true,
  });

  await client.connect();
  try {
    const list = await client.list();
    const inbox = list.find((m) => m.path.toUpperCase() === 'INBOX');
    return {
      ok: true,
      inboxFound: !!inbox,
      mailboxCount: list.length,
      sampleMailboxes: list.slice(0, 5).map((m) => m.path),
    };
  } finally {
    await safeLogout(client);
  }
}

async function safeLogout(client) {
  try {
    await client.logout();
  } catch {
    try { client.close(); } catch {}
  }
}

function formatAddress(addr) {
  if (!addr) return '';
  if (addr.text) return addr.text;
  if (Array.isArray(addr.value)) {
    return addr.value
      .map((a) => (a.name ? `"${a.name}" <${a.address}>` : a.address))
      .join(', ');
  }
  return '';
}
