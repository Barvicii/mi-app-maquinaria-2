/**
 * IMAP provider auto-detection.
 *
 * Given an email address, returns the IMAP host/port/tls config for the most
 * common providers. Consumers can always override with custom settings.
 */

const PROVIDERS = {
  // Google
  'gmail.com':       { host: 'imap.gmail.com',           port: 993, secure: true, label: 'Gmail',            appPasswordUrl: 'https://myaccount.google.com/apppasswords', requiresAppPassword: true },
  'googlemail.com':  { host: 'imap.gmail.com',           port: 993, secure: true, label: 'Gmail',            appPasswordUrl: 'https://myaccount.google.com/apppasswords', requiresAppPassword: true },

  // Microsoft (Outlook / Hotmail / Live / MSN — Office 365 personal shares the same server)
  'outlook.com':     { host: 'outlook.office365.com',    port: 993, secure: true, label: 'Outlook',          appPasswordUrl: 'https://account.microsoft.com/security', requiresAppPassword: true },
  'hotmail.com':     { host: 'outlook.office365.com',    port: 993, secure: true, label: 'Hotmail',          appPasswordUrl: 'https://account.microsoft.com/security', requiresAppPassword: true },
  'live.com':        { host: 'outlook.office365.com',    port: 993, secure: true, label: 'Outlook (Live)',   appPasswordUrl: 'https://account.microsoft.com/security', requiresAppPassword: true },
  'msn.com':         { host: 'outlook.office365.com',    port: 993, secure: true, label: 'Outlook (MSN)',    appPasswordUrl: 'https://account.microsoft.com/security', requiresAppPassword: true },
  'office365.com':   { host: 'outlook.office365.com',    port: 993, secure: true, label: 'Office 365',       appPasswordUrl: 'https://account.microsoft.com/security', requiresAppPassword: true },

  // Yahoo
  'yahoo.com':       { host: 'imap.mail.yahoo.com',      port: 993, secure: true, label: 'Yahoo Mail',       appPasswordUrl: 'https://login.yahoo.com/account/security', requiresAppPassword: true },
  'yahoo.co.nz':     { host: 'imap.mail.yahoo.com',      port: 993, secure: true, label: 'Yahoo Mail (NZ)',  appPasswordUrl: 'https://login.yahoo.com/account/security', requiresAppPassword: true },
  'yahoo.co.uk':     { host: 'imap.mail.yahoo.com',      port: 993, secure: true, label: 'Yahoo Mail (UK)',  appPasswordUrl: 'https://login.yahoo.com/account/security', requiresAppPassword: true },
  'ymail.com':       { host: 'imap.mail.yahoo.com',      port: 993, secure: true, label: 'Yahoo Mail',       appPasswordUrl: 'https://login.yahoo.com/account/security', requiresAppPassword: true },

  // Apple iCloud
  'icloud.com':      { host: 'imap.mail.me.com',         port: 993, secure: true, label: 'iCloud Mail',      appPasswordUrl: 'https://appleid.apple.com/account/manage', requiresAppPassword: true },
  'me.com':          { host: 'imap.mail.me.com',         port: 993, secure: true, label: 'iCloud Mail',      appPasswordUrl: 'https://appleid.apple.com/account/manage', requiresAppPassword: true },
  'mac.com':         { host: 'imap.mail.me.com',         port: 993, secure: true, label: 'iCloud Mail',      appPasswordUrl: 'https://appleid.apple.com/account/manage', requiresAppPassword: true },

  // Zoho (common for small business)
  'zoho.com':        { host: 'imap.zoho.com',            port: 993, secure: true, label: 'Zoho Mail',        appPasswordUrl: 'https://accounts.zoho.com/home#security/app_passwords', requiresAppPassword: true },
  'zohomail.com':    { host: 'imap.zoho.com',            port: 993, secure: true, label: 'Zoho Mail',        appPasswordUrl: 'https://accounts.zoho.com/home#security/app_passwords', requiresAppPassword: true },

  // AOL
  'aol.com':         { host: 'imap.aol.com',             port: 993, secure: true, label: 'AOL Mail',         appPasswordUrl: 'https://login.aol.com/account/security', requiresAppPassword: true },

  // GMX
  'gmx.com':         { host: 'imap.gmx.com',             port: 993, secure: true, label: 'GMX Mail',         requiresAppPassword: false },
  'gmx.net':         { host: 'imap.gmx.net',             port: 993, secure: true, label: 'GMX Mail',         requiresAppPassword: false },

  // Fastmail
  'fastmail.com':    { host: 'imap.fastmail.com',        port: 993, secure: true, label: 'Fastmail',         appPasswordUrl: 'https://www.fastmail.com/settings/security/apppasswords', requiresAppPassword: true },
  'fastmail.fm':     { host: 'imap.fastmail.com',        port: 993, secure: true, label: 'Fastmail',         appPasswordUrl: 'https://www.fastmail.com/settings/security/apppasswords', requiresAppPassword: true },

  // ProtonMail (needs Bridge, but at least surface the info)
  'proton.me':       { host: '127.0.0.1',                port: 1143, secure: false, label: 'Proton Mail (Bridge required)', requiresAppPassword: true, note: 'Requires Proton Bridge running locally' },
  'protonmail.com':  { host: '127.0.0.1',                port: 1143, secure: false, label: 'Proton Mail (Bridge required)', requiresAppPassword: true, note: 'Requires Proton Bridge running locally' },
};

/**
 * Detect the IMAP config for an email address.
 * @param {string} email
 * @returns {{host:string,port:number,secure:boolean,label:string,appPasswordUrl?:string,requiresAppPassword:boolean,note?:string,domain:string}|null}
 */
export function detectProvider(email) {
  if (!email || typeof email !== 'string') return null;
  const at = email.lastIndexOf('@');
  if (at < 0) return null;
  const domain = email.slice(at + 1).toLowerCase().trim();
  if (!domain) return null;

  const cfg = PROVIDERS[domain];
  if (!cfg) return null;
  return { ...cfg, domain };
}

/**
 * Resolve the final IMAP settings for a given org's stored settings.
 * Precedence: explicit custom host/port > auto-detect > null.
 *
 * @param {object} settings — { invoiceEmail, imapHost?, imapPort?, imapSecure? }
 * @returns {{host:string,port:number,secure:boolean,source:'custom'|'auto'|'unknown'}|null}
 */
export function resolveImapConfig(settings) {
  if (!settings) return null;
  if (settings.imapHost) {
    return {
      host: String(settings.imapHost).trim(),
      port: Number(settings.imapPort) || 993,
      secure: settings.imapSecure !== false,
      source: 'custom',
    };
  }
  const detected = detectProvider(settings.invoiceEmail);
  if (detected) {
    return {
      host: detected.host,
      port: detected.port,
      secure: detected.secure,
      source: 'auto',
    };
  }
  return null;
}

/**
 * Return the list of supported providers for the UI (docs / hints).
 */
export function listSupportedProviders() {
  const seen = new Map();
  for (const [domain, cfg] of Object.entries(PROVIDERS)) {
    if (!seen.has(cfg.label)) {
      seen.set(cfg.label, { label: cfg.label, host: cfg.host, port: cfg.port, requiresAppPassword: cfg.requiresAppPassword, appPasswordUrl: cfg.appPasswordUrl, note: cfg.note, domains: [] });
    }
    seen.get(cfg.label).domains.push(domain);
  }
  return [...seen.values()];
}
