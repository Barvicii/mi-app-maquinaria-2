/**
 * Invoice Email Parser
 * 
 * Extracts invoice data from email body/subject:
 *  - Machine ID (from purchase order reference like "PO_TR03", "MachineID: TR03", etc.)
 *  - Vendor name
 *  - Total amount
 *  - Invoice number
 *  - Date
 *  - Line items (if structured)
 * 
 * The expected flow:
 *  1. User buys parts and gives a purchase order with machine ID (e.g. "PO_TR03")
 *  2. Vendor puts that reference on the invoice
 *  3. Invoice is emailed to the designated inbox
 *  4. This parser extracts the data
 */

// Patterns to find machine IDs in invoice text
// Matches: PO_TR03, PO-TR03, Machine: TR03, Machine ID: TR03, Ref: TR03, Order# TR03
const MACHINE_ID_PATTERNS = [
  /(?:PO[_\-\s]?)([A-Z0-9][A-Z0-9\-_]{1,20})/gi,              // PO_TR03, PO-MULE01
  /(?:machine\s*(?:id|#|no\.?)?[\s:]*?)([A-Z0-9][A-Z0-9\-_]{1,20})/gi, // Machine ID: TR03
  /(?:order\s*(?:#|no\.?|number)?[\s:]*?)([A-Z0-9][A-Z0-9\-_]{1,20})/gi, // Order# TR03
  /(?:ref(?:erence)?[\s:#]*?)([A-Z0-9][A-Z0-9\-_]{1,20})/gi,   // Ref: TR03
  /(?:unit[\s:#]*?)([A-Z0-9][A-Z0-9\-_]{1,20})/gi,             // Unit: TR03
  /(?:asset[\s:#]*?)([A-Z0-9][A-Z0-9\-_]{1,20})/gi,            // Asset: TR03
  /(?:equipment[\s:#]*?)([A-Z0-9][A-Z0-9\-_]{1,20})/gi,        // Equipment: TR03
];

// Patterns for amounts (NZD, AUD, USD or $ prefix)
const AMOUNT_PATTERNS = [
  /(?:total|amount|grand\s*total|balance\s*due|amount\s*due)[\s:$]*?\$?\s*([\d,]+\.?\d{0,2})/gi,
  /\$\s*([\d,]+\.\d{2})/g,    // $1,234.56
  /(?:NZD|AUD|USD)\s*([\d,]+\.?\d{0,2})/gi,
];

// Invoice number patterns
const INVOICE_NUMBER_PATTERNS = [
  /(?:invoice|inv)[\s#.:-]*?([A-Z0-9][A-Z0-9\-/]{2,20})/gi,
  /(?:bill|receipt)[\s#.:-]*?([A-Z0-9][A-Z0-9\-/]{2,20})/gi,
];

// Date patterns (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, etc.)
const DATE_PATTERNS = [
  /(?:date|dated|invoice\s*date)[\s:]*?(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/gi,
  /(\d{4}-\d{2}-\d{2})/g,  // ISO format
  /(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/g,
];

/**
 * Strip HTML tags from email body
 */
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#?\w+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract all potential machine IDs from text
 */
function extractMachineIds(text) {
  const ids = new Set();

  for (const pattern of MACHINE_ID_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const id = match[1].trim().toUpperCase();
      // Filter out common false positives
      if (id.length >= 2 && id.length <= 20 &&
          !['THE', 'AND', 'FOR', 'PER', 'TAX', 'GST', 'NZD', 'AUD', 'USD', 'INV', 'PO'].includes(id)) {
        ids.add(id);
      }
    }
  }

  return [...ids];
}

/**
 * Extract the most likely total amount
 */
function extractAmount(text) {
  const amounts = [];

  for (const pattern of AMOUNT_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const num = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(num) && num > 0 && num < 1000000) {
        amounts.push(num);
      }
    }
  }

  if (amounts.length === 0) return null;

  // Return the largest amount (usually the total)
  return Math.max(...amounts);
}

/**
 * Extract invoice number
 */
function extractInvoiceNumber(text) {
  for (const pattern of INVOICE_NUMBER_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) return match[1].trim();
  }
  return null;
}

/**
 * Extract date from text
 */
function extractDate(text) {
  for (const pattern of DATE_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      const dateStr = match[1];
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) return parsed;

      // Try DD/MM/YYYY format (NZ standard)
      const parts = dateStr.split(/[/\-.]/);
      if (parts.length === 3) {
        const [d, m, y] = parts;
        const year = y.length === 2 ? `20${y}` : y;
        const tryDate = new Date(`${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
        if (!isNaN(tryDate.getTime())) return tryDate;
      }
    }
  }
  return null;
}

/**
 * Extract vendor from email sender
 */
function extractVendor(fromHeader) {
  if (!fromHeader) return 'Unknown Vendor';

  // "Vendor Name <email@example.com>"
  const nameMatch = fromHeader.match(/^"?([^"<]+)"?\s*</);
  if (nameMatch) return nameMatch[1].trim();

  // Just email
  const emailMatch = fromHeader.match(/<([^>]+)>/);
  if (emailMatch) {
    const parts = emailMatch[1].split('@');
    return parts[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return fromHeader.trim() || 'Unknown Vendor';
}

/**
 * Detect currency from text
 */
function extractCurrency(text) {
  if (/NZD|\bNZ\$/i.test(text)) return 'NZD';
  if (/AUD|\bA\$/i.test(text)) return 'AUD';
  if (/USD|\bUS\$/i.test(text)) return 'USD';
  return 'NZD'; // Default for NZ operations
}

/**
 * Guess the category based on keywords in text
 */
function guessCategory(text) {
  const lower = text.toLowerCase();
  if (/\b(filter|oil filter|air filter|fuel filter|hydraulic filter)\b/.test(lower)) return 'Filter';
  if (/\b(oil|lubricant|grease|hydraulic oil|engine oil)\b/.test(lower)) return 'Oil';
  if (/\b(tire|tyre|wheel|rim)\b/.test(lower)) return 'Tire';
  if (/\b(fuel|diesel|petrol|gasoline)\b/.test(lower)) return 'Fuel';
  if (/\b(service|repair|maintenance|labour|labor)\b/.test(lower)) return 'Service';
  if (/\b(part|spare|bolt|bearing|belt|hose|gasket|seal|valve)\b/.test(lower)) return 'Spare Part';
  return 'Other';
}

/**
 * Main parsing function: takes email data, returns structured invoice data
 * 
 * @param {object} email - { from, subject, textBody, htmlBody, date, attachments }
 * @returns {object} parsed invoice data
 */
export function parseInvoiceEmail(email) {
  const text = [
    email.subject || '',
    email.textBody || '',
    stripHtml(email.htmlBody || ''),
  ].join('\n');

  const machineIds = extractMachineIds(text);
  const totalAmount = extractAmount(text);
  const invoiceNumber = extractInvoiceNumber(text);
  const invoiceDate = extractDate(text) || (email.date ? new Date(email.date) : new Date());
  const vendor = extractVendor(email.from);
  const currency = extractCurrency(text);
  const category = guessCategory(text);

  return {
    machineIds,            // Array of potential machine IDs found
    primaryMachineId: machineIds[0] || null,  // Best candidate
    vendor,
    totalAmount,
    invoiceNumber,
    date: invoiceDate,
    currency,
    category,
    description: email.subject || 'Invoice from email',
    source: 'email',
    emailFrom: email.from,
    emailSubject: email.subject,
    emailMessageId: email.messageId,
    confidence: calculateConfidence({ machineIds, totalAmount, invoiceNumber }),
    rawText: text.substring(0, 2000), // Keep first 2000 chars for reference
  };
}

/**
 * Calculate a confidence score (0-100) for the parsed data
 */
function calculateConfidence({ machineIds, totalAmount, invoiceNumber }) {
  let score = 0;
  if (machineIds.length > 0) score += 40;
  if (machineIds.length === 1) score += 10; // Only one = more confident
  if (totalAmount) score += 30;
  if (invoiceNumber) score += 20;
  return Math.min(score, 100);
}

export default {
  parseInvoiceEmail,
  stripHtml,
  extractMachineIds,
  extractAmount,
};
