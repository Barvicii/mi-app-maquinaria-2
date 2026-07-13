/**
 * WhatsApp Notification Service
 * 
 * Sends WhatsApp messages to the admin when the system can't
 * auto-assign an invoice to a machine.
 * 
 * Uses WhatsApp Cloud API (Meta) — free tier: 1000 conversations/month
 * Fallback: generates wa.me link for manual sending
 * 
 * Required env vars:
 *   ADMIN_WHATSAPP        — Admin's phone number (e.g. "5491112345678")
 *   WHATSAPP_PHONE_ID     — WhatsApp Business phone number ID (from Meta)
 *   WHATSAPP_ACCESS_TOKEN — Permanent access token from Meta Business
 */

const ADMIN_WHATSAPP = process.env.ADMIN_WHATSAPP || '';
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || '';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const APP_URL = process.env.NEXTAUTH_URL || 'https://orchardservices.co.nz';

/**
 * Send a WhatsApp message via Meta Cloud API
 * @param {string} to - Phone number in international format (no + sign)
 * @param {string} message - Text message to send
 * @param {object} [creds] - Optional per-org credentials to override env vars
 * @returns {{ success: boolean, method: string, messageId?: string }}
 */
async function sendViaCloudAPI(to, message, creds = {}) {
  const phoneId = creds.whatsAppPhoneId || WHATSAPP_PHONE_ID;
  const token = creds.whatsAppAccessToken || WHATSAPP_ACCESS_TOKEN;

  if (!phoneId || !token) {
    return { success: false, method: 'cloud_api', error: 'WhatsApp Cloud API not configured' };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { body: message },
        }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        method: 'cloud_api',
        messageId: data.messages?.[0]?.id,
      };
    }

    const err = await res.json().catch(() => ({}));
    console.error('[WhatsApp] Cloud API error:', err);
    return { success: false, method: 'cloud_api', error: err.error?.message || `HTTP ${res.status}` };
  } catch (err) {
    console.error('[WhatsApp] Cloud API fetch error:', err.message);
    return { success: false, method: 'cloud_api', error: err.message };
  }
}

/**
 * Generate a wa.me click-to-chat link (fallback when API is not configured)
 */
function generateWaLink(to, message) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${to}?text=${encoded}`;
}

/**
 * Build the unassigned invoice notification message
 */
function buildUnassignedInvoiceMessage(invoiceData) {
  const {
    invoiceId, vendor, totalAmount, currency, date,
    emailSubject, machineIds, description
  } = invoiceData;

  const dateStr = date ? new Date(date).toLocaleDateString('en-NZ') : 'N/A';

  let msg = `🔔 *Orchard Services — Invoice Needs Assignment*\n\n`;
  msg += `An invoice arrived by email but the system couldn't match it to a machine.\n\n`;
  msg += `📄 *Invoice:* ${invoiceId || 'N/A'}\n`;
  msg += `🏪 *Vendor:* ${vendor || 'Unknown'}\n`;
  msg += `💰 *Amount:* ${currency || 'NZD'} ${totalAmount || '?'}\n`;
  msg += `📅 *Date:* ${dateStr}\n`;

  if (machineIds && machineIds.length > 0) {
    msg += `🔍 *IDs found in email:* ${machineIds.join(', ')}\n`;
    msg += `(None matched an existing machine)\n`;
  } else {
    msg += `⚠️ *No machine ID found in the email*\n`;
  }

  if (description) {
    msg += `📝 *Subject:* ${description}\n`;
  }

  msg += `\n👉 Please reply with the correct Machine ID to assign this invoice, or resolve it in the app:\n`;
  msg += `${APP_URL}/dashboard\n`;

  return msg;
}

/**
 * Send notification about an unassigned invoice
 * Tries Cloud API first, falls back to generating a wa.me link
 *
 * @param {object} invoiceData - Parsed invoice data. May also include
 *   `adminWhatsApp`, `whatsAppPhoneId`, `whatsAppAccessToken` from the org
 *   settings — these override env vars for that call.
 * @returns {{ success: boolean, method: string, waLink?: string }}
 */
export async function notifyUnassignedInvoice(invoiceData) {
  const to = invoiceData.adminWhatsApp || ADMIN_WHATSAPP;
  if (!to) {
    console.warn('[WhatsApp] adminWhatsApp not configured — skipping notification');
    return { success: false, method: 'none', error: 'adminWhatsApp not set' };
  }

  const message = buildUnassignedInvoiceMessage(invoiceData);

  // Try Cloud API first
  const apiResult = await sendViaCloudAPI(to, message, {
    whatsAppPhoneId: invoiceData.whatsAppPhoneId,
    whatsAppAccessToken: invoiceData.whatsAppAccessToken,
  });
  if (apiResult.success) {
    console.log('[WhatsApp] ✅ Notification sent via Cloud API:', apiResult.messageId);
    return apiResult;
  }

  // Fallback: generate wa.me link (will be stored for manual sending)
  const waLink = generateWaLink(to, message);
  console.log('[WhatsApp] ⚠️ Cloud API not available, generated wa.me link');

  return {
    success: true,
    method: 'wa_link',
    waLink,
    message,
  };
}

/**
 * Send a generic WhatsApp message to admin
 */
export async function sendWhatsAppToAdmin(message) {
  if (!ADMIN_WHATSAPP) {
    return { success: false, error: 'ADMIN_WHATSAPP not set' };
  }

  const apiResult = await sendViaCloudAPI(ADMIN_WHATSAPP, message);
  if (apiResult.success) return apiResult;

  return {
    success: true,
    method: 'wa_link',
    waLink: generateWaLink(ADMIN_WHATSAPP, message),
    message,
  };
}

export default {
  notifyUnassignedInvoice,
  sendWhatsAppToAdmin,
  generateWaLink,
  buildUnassignedInvoiceMessage,
};
