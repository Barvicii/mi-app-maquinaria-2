'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Settings, Save, RefreshCw, MessageCircle, Mail, Shield,
  Eye, EyeOff, CheckCircle, AlertCircle, DollarSign, Bell,
  Info, ExternalLink, PlugZap, PlayCircle, ChevronDown, ChevronRight
} from 'lucide-react';

const CURRENCIES = ['NZD', 'AUD', 'USD'];
const CATEGORIES = ['Spare Part', 'Service', 'Oil', 'Filter', 'Tire', 'Fuel', 'Other'];
const MASKED = '••••••••';

export default function InvoiceSettings({ suppressNotifications = false }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isDefault, setIsDefault] = useState(true);
  const [detectedProvider, setDetectedProvider] = useState(null);
  const [resolvedImap, setResolvedImap] = useState(null);
  const [lastPollInfo, setLastPollInfo] = useState({ at: null, error: null });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [polling, setPolling] = useState(false);
  const [pollResult, setPollResult] = useState(null);

  const [showAdvancedImap, setShowAdvancedImap] = useState(false);

  // Password visibility toggles
  const [showEmailPass, setShowEmailPass] = useState(false);
  const [showWaToken, setShowWaToken] = useState(false);
  const [showCronSecret, setShowCronSecret] = useState(false);

  // Track the original email so we can warn when the user changes it while
  // keeping the (now-stale) stored password.
  const [originalEmail, setOriginalEmail] = useState('');

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/organization/settings', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Failed to load settings');
      const data = await res.json();
      setSettings(data.settings);
      setIsDefault(data.isDefault);
      setDetectedProvider(data.detectedProvider || null);
      setResolvedImap(data.resolvedImap || null);
      setOriginalEmail(data.settings?.invoiceEmail || '');
      setLastPollInfo({
        at: data.lastEmailPollAt || null,
        error: data.lastEmailPollError || null,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    // Reset test/poll results if the user edits anything relevant
    if (['invoiceEmail', 'invoiceEmailPassword', 'imapHost', 'imapPort', 'imapSecure'].includes(field)) {
      setTestResult(null);
    }
  };

  // Live detect provider as the user types the email
  useEffect(() => {
    if (!settings?.invoiceEmail) {
      setDetectedProvider(null);
      return;
    }
    const email = String(settings.invoiceEmail).trim();
    const at = email.lastIndexOf('@');
    if (at < 1 || at === email.length - 1) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/invoices/detect-provider?email=${encodeURIComponent(email)}`, {
          credentials: 'same-origin',
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        setDetectedProvider(data.detected ? data.provider : null);
      } catch {
        /* silent */
      }
    }, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, [settings?.invoiceEmail]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const res = await fetch('/api/organization/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(settings),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `Failed to save settings (HTTP ${res.status})`);
      }

      // Build a friendly summary of what actually got saved
      const savedFields = Array.isArray(data.savedFields) ? data.savedFields : [];
      const upserted = data.upserted > 0;
      const modified = data.modified > 0;
      let msg;
      if (upserted) {
        msg = `Settings created (${savedFields.length} field${savedFields.length === 1 ? '' : 's'} saved).`;
      } else if (modified) {
        msg = `Settings updated (${savedFields.length} field${savedFields.length === 1 ? '' : 's'} changed).`;
      } else {
        msg = 'Nothing to update — values already matched what was stored.';
      }
      setSuccess(msg);
      setIsDefault(false);
      setTimeout(() => setSuccess(null), 6000);
      // Refresh so masked fields and resolvedImap come back with fresh state
      fetchSettings();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const res = await fetch('/api/invoices/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          email: settings.invoiceEmail,
          password: settings.invoiceEmailPassword,
          imapHost: settings.imapHost || undefined,
          imapPort: settings.imapPort || undefined,
          imapSecure: settings.imapSecure !== false,
        }),
      });
      const data = await res.json();
      setTestResult({ ok: res.ok && data.ok, ...data });
    } catch (err) {
      setTestResult({ ok: false, error: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handlePollNow = async () => {
    try {
      setPolling(true);
      setPollResult(null);
      const res = await fetch('/api/invoices/poll-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
      });
      const data = await res.json();
      setPollResult({ ok: res.ok && data.ok !== false, ...data });
      // Refresh last-poll info shown in the header
      fetchSettings();
    } catch (err) {
      setPollResult({ ok: false, error: err.message });
    } finally {
      setPolling(false);
    }
  };

  const emailIsValid = useMemo(() => {
    if (!settings?.invoiceEmail) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(settings.invoiceEmail).trim());
  }, [settings?.invoiceEmail]);

  const hasPassword = useMemo(() => {
    const p = settings?.invoiceEmailPassword;
    return !!p && p !== '';
  }, [settings?.invoiceEmailPassword]);

  // Warn if user edited the invoice email but kept the previous encrypted
  // password (which was tied to the OLD email and will fail auth).
  const emailChangedButPasswordUntouched = useMemo(() => {
    if (!originalEmail) return false;
    const current = String(settings?.invoiceEmail || '').trim().toLowerCase();
    const original = originalEmail.trim().toLowerCase();
    return current && current !== original && settings?.invoiceEmailPassword === MASKED;
  }, [originalEmail, settings?.invoiceEmail, settings?.invoiceEmailPassword]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <RefreshCw size={24} className="animate-spin text-emerald-600 mr-2" />
        <span className="text-gray-500">Loading settings...</span>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Settings size={24} />
          Invoice &amp; Notification Settings
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure how invoices are received and how notifications are sent.
        </p>
        {isDefault && (
          <div className="mt-3 flex items-start gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <Info size={16} className="mt-0.5 flex-shrink-0" />
            <span>These are default settings. Configure them to enable automatic invoice processing and WhatsApp notifications.</span>
          </div>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      <div className="space-y-6">
        {/* ─── WhatsApp Notifications ─── */}
        <section className="bg-white border rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <MessageCircle size={18} className="text-green-600" />
            WhatsApp Notifications
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            When an invoice can&apos;t be matched to a machine, you&apos;ll receive a WhatsApp message asking you to identify it.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin WhatsApp Number *
              </label>
              <input
                type="tel"
                value={settings.adminWhatsApp || ''}
                onChange={(e) => handleChange('adminWhatsApp', e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm"
                placeholder="e.g. 6421123456 (country code + number, no +)"
              />
              <p className="text-xs text-gray-400 mt-1">
                International format without the + sign. E.g. for NZ: 642XXXXXXX
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp Phone ID
                  <span className="text-gray-400 font-normal"> (optional)</span>
                </label>
                <input
                  type="text"
                  value={settings.whatsAppPhoneId || ''}
                  onChange={(e) => handleChange('whatsAppPhoneId', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm"
                  placeholder="From Meta Business"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp Access Token
                  <span className="text-gray-400 font-normal"> (optional)</span>
                </label>
                <div className="relative">
                  <input
                    type={showWaToken ? 'text' : 'password'}
                    value={settings.whatsAppAccessToken || ''}
                    onChange={(e) => handleChange('whatsAppAccessToken', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm pr-10"
                    placeholder="From Meta Business"
                  />
                  <button
                    type="button"
                    onClick={() => setShowWaToken(!showWaToken)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showWaToken ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-400 flex items-center gap-1">
              <Info size={12} />
              <span>
                Without Meta Business API credentials, WhatsApp will use a click-to-chat link instead of sending automatically.
              </span>
            </div>
          </div>
        </section>

        {/* ─── Invoice Email ─── */}
        <section className="bg-white border rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <Mail size={18} className="text-blue-600" />
            Invoice Email Inbox
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Configure the email account where vendors send invoices. The system will read incoming emails and create invoices automatically.
            Works with <strong>Gmail, Outlook/Hotmail, Yahoo, iCloud, Zoho, Fastmail</strong> and any IMAP server.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Email Address
              </label>
              <input
                type="email"
                value={settings.invoiceEmail || ''}
                onChange={(e) => handleChange('invoiceEmail', e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm"
                placeholder="e.g. invoices@yourcompany.co.nz"
              />
              {/* Detected provider badge */}
              {detectedProvider ? (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-1">
                    <CheckCircle size={12} />
                    <strong>{detectedProvider.label}</strong> detected
                  </span>
                  <span className="text-gray-500">
                    IMAP: <code className="bg-gray-100 px-1 rounded">{detectedProvider.host}:{detectedProvider.port}</code>
                  </span>
                  {detectedProvider.requiresAppPassword && (
                    <span className="text-amber-700">
                      Requires an <strong>App Password</strong>
                      {detectedProvider.appPasswordUrl && (
                        <> — <a href={detectedProvider.appPasswordUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline-flex items-center gap-0.5">
                          get one here <ExternalLink size={10} />
                        </a></>
                      )}
                    </span>
                  )}
                </div>
              ) : (
                emailIsValid && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-amber-700">
                    <AlertCircle size={12} />
                    Unknown provider — enter IMAP host/port manually below.
                  </div>
                )
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
                <span>Email App Password</span>
                {settings.invoiceEmailPassword === MASKED && !emailChangedButPasswordUntouched && (
                  <span className="inline-flex items-center gap-1 text-xs font-normal text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                    <CheckCircle size={12} />
                    Saved (encrypted)
                  </span>
                )}
                {emailChangedButPasswordUntouched && (
                  <span className="inline-flex items-center gap-1 text-xs font-normal text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                    <AlertCircle size={12} />
                    Password is stale
                  </span>
                )}
              </label>
              {emailChangedButPasswordUntouched && (
                <div className="mb-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-2">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  <span>
                    You changed the email from <code className="bg-white px-1 rounded border">{originalEmail}</code> to{' '}
                    <code className="bg-white px-1 rounded border">{settings.invoiceEmail}</code>, but the stored password
                    was for the previous account. <strong>Enter a new app password below</strong> or the poller will fail
                    authentication.
                  </span>
                </div>
              )}
              <div className="relative">
                <input
                  type={showEmailPass ? 'text' : 'password'}
                  value={settings.invoiceEmailPassword || ''}
                  onChange={(e) => handleChange('invoiceEmailPassword', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm pr-10"
                  placeholder={hasPassword && settings.invoiceEmailPassword === MASKED ? 'Password already saved — type a new one only if you want to replace it' : 'Paste your app password'}
                />
                <button
                  type="button"
                  onClick={() => setShowEmailPass(!showEmailPass)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showEmailPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {settings.invoiceEmailPassword === MASKED
                  ? <span>The password is stored encrypted (AES-256-GCM). Leave this field with dots to keep it. Type a new password to replace it.</span>
                  : <span>Stored encrypted (AES-256-GCM) in the database. For Gmail/Outlook/Yahoo/iCloud you must use an App Password — your normal login password will NOT work over IMAP.</span>
                }
              </p>
            </div>

            {/* Test connection + Process now buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || !emailIsValid || (!hasPassword && !settings.invoiceEmailPassword)}
                className="px-3 py-2 text-sm border border-blue-300 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 flex items-center gap-2"
              >
                <PlugZap size={14} />
                {testing ? 'Testing…' : 'Test connection'}
              </button>
              <button
                type="button"
                onClick={handlePollNow}
                disabled={polling || isDefault || !emailIsValid}
                title={isDefault ? 'Save settings first' : 'Fetch unread emails now'}
                className="px-3 py-2 text-sm border border-emerald-300 text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 disabled:opacity-50 flex items-center gap-2"
              >
                <PlayCircle size={14} />
                {polling ? 'Processing…' : 'Process now'}
              </button>
              {lastPollInfo.at && (
                <div className="text-xs text-gray-400 self-center ml-auto">
                  Last poll: {new Date(lastPollInfo.at).toLocaleString()}
                  {lastPollInfo.error && (
                    <span className="text-red-600 ml-1"> — {lastPollInfo.error}</span>
                  )}
                </div>
              )}
            </div>

            {/* Test result */}
            {testResult && (
              <div className={`text-xs rounded-lg px-3 py-2 border ${testResult.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                {testResult.ok ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle size={12} />
                    Connected. Inbox {testResult.inboxFound ? 'found' : 'not found'} — {testResult.mailboxCount} mailbox(es) visible.
                  </span>
                ) : (
                  <span className="flex items-start gap-1">
                    <AlertCircle size={12} className="mt-0.5" />
                    <span>{testResult.error || 'Connection failed'}</span>
                  </span>
                )}
              </div>
            )}

            {/* Poll result */}
            {pollResult && (
              <div className={`text-xs rounded-lg px-3 py-2 border ${pollResult.ok ? (pollResult.errors?.length > 0 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-emerald-50 border-emerald-200 text-emerald-700') : 'bg-red-50 border-red-200 text-red-700'}`}>
                {pollResult.ok ? (
                  <div>
                    Fetched <strong>{pollResult.fetched ?? 0}</strong> unread — created{' '}
                    <strong>{pollResult.created?.length ?? 0}</strong>, skipped{' '}
                    <strong>{pollResult.skipped?.length ?? 0}</strong>, errors{' '}
                    <strong>{pollResult.errors?.length ?? 0}</strong>.
                    {pollResult.created?.length > 0 && (
                      <ul className="mt-1 list-disc list-inside">
                        {pollResult.created.slice(0, 5).map((c, i) => (
                          <li key={i}>
                            <strong>{c.invoiceId}</strong> — {c.vendor} — {c.amount ?? '?'} —{' '}
                            {c.machineAssigned ? `assigned to ${c.machineName}` : 'unassigned'}
                          </li>
                        ))}
                      </ul>
                    )}
                    {pollResult.skipped?.length > 0 && (
                      <ul className="mt-1 list-disc list-inside text-gray-600">
                        {pollResult.skipped.slice(0, 5).map((s, i) => (
                          <li key={i}>
                            Skipped: {s.invoiceId || s.messageId || 'email'} ({s.reason || 'unknown'})
                          </li>
                        ))}
                      </ul>
                    )}
                    {pollResult.errors?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                        <div className="font-semibold mb-1 flex items-center gap-1">
                          <AlertCircle size={12} />
                          Errors ({pollResult.errors.length}):
                        </div>
                        <ul className="list-disc list-inside space-y-1">
                          {pollResult.errors.slice(0, 5).map((e, i) => (
                            <li key={i} className="break-words">
                              {e.subject && <strong>&quot;{e.subject}&quot;</strong>}
                              {e.subject && ' — '}
                              <span className="font-mono text-[11px]">{e.error || 'Unknown error'}</span>
                              {e.uid && <span className="text-gray-500"> (uid={e.uid})</span>}
                            </li>
                          ))}
                        </ul>
                        {pollResult.errors.length > 5 && (
                          <div className="text-gray-500 mt-1">…and {pollResult.errors.length - 5} more</div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="flex items-start gap-1">
                    <AlertCircle size={12} className="mt-0.5" />
                    <span>{pollResult.error || 'Poll failed'}</span>
                  </span>
                )}
              </div>
            )}

            {/* Advanced IMAP settings */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvancedImap((s) => !s)}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                {showAdvancedImap ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                Advanced IMAP settings (only needed for unknown providers)
              </button>
              {showAdvancedImap && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 border rounded-lg p-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">IMAP Host</label>
                    <input
                      type="text"
                      value={settings.imapHost || ''}
                      onChange={(e) => handleChange('imapHost', e.target.value)}
                      className="w-full border rounded px-2 py-1.5 text-sm"
                      placeholder={resolvedImap?.host || 'e.g. imap.yourprovider.com'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Port</label>
                    <input
                      type="number"
                      value={settings.imapPort ?? 993}
                      onChange={(e) => handleChange('imapPort', Number(e.target.value))}
                      className="w-full border rounded px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Mailbox</label>
                    <input
                      type="text"
                      value={settings.imapMailbox || 'INBOX'}
                      onChange={(e) => handleChange('imapMailbox', e.target.value)}
                      className="w-full border rounded px-2 py-1.5 text-sm"
                      placeholder="INBOX"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={settings.imapSecure !== false}
                      onChange={(e) => handleChange('imapSecure', e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Use TLS (secure IMAP, recommended)</span>
                  </label>
                  {resolvedImap && (
                    <div className="sm:col-span-3 text-xs text-gray-500">
                      Effective config: <code className="bg-white px-1 rounded border">{resolvedImap.host}:{resolvedImap.port}</code>{' '}
                      ({resolvedImap.source === 'custom' ? 'custom override' : 'auto-detected'})
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook Secret (CRON) <span className="text-gray-400 text-xs font-normal">— optional, advanced</span>
              </label>
              <div className="relative">
                <input
                  type={showCronSecret ? 'text' : 'password'}
                  value={settings.cronSecret || ''}
                  onChange={(e) => handleChange('cronSecret', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm pr-10"
                  placeholder="Leave empty unless you need a per-org token"
                />
                <button
                  type="button"
                  onClick={() => setShowCronSecret(!showCronSecret)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCronSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-1 space-y-1">
                <p>
                  <strong>Leave this empty.</strong> The <code className="bg-gray-100 px-1 rounded">/api/invoices/process-email</code> endpoint
                  is protected by the global <code className="bg-gray-100 px-1 rounded">CRON_SECRET</code> environment variable
                  configured in Vercel — not by this field.
                </p>
                <p className="text-amber-700">
                  ⚠️ Do <strong>not</strong> paste values like <code className="bg-gray-100 px-1 rounded">CRON_SECRET=abc…</code> here.
                  Only use this field if your cron provider requires a per-org token and you know what you&apos;re doing.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoProcessEmails || false}
                  onChange={(e) => handleChange('autoProcessEmails', e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">
                  <strong>Enable automatic email processing</strong>
                  <br />
                  <span className="text-xs text-gray-500">
                    When on, the scheduled poller will check this inbox on every run and auto-create invoices.
                    Leave off while you test.
                  </span>
                </span>
              </label>
            </div>
          </div>
        </section>

        {/* ─── Notification Preferences ─── */}
        <section className="bg-white border rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <Bell size={18} className="text-amber-600" />
            Notification Preferences
          </h3>

          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifyOnUnassignedInvoice !== false}
                onChange={(e) => handleChange('notifyOnUnassignedInvoice', e.target.checked)}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">Notify when an invoice can&apos;t be matched to a machine</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifyViaEmail !== false}
                onChange={(e) => handleChange('notifyViaEmail', e.target.checked)}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">Send email notifications</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifyViaWhatsApp !== false}
                onChange={(e) => handleChange('notifyViaWhatsApp', e.target.checked)}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">Send WhatsApp notifications</span>
            </label>
          </div>
        </section>

        {/* ─── Defaults ─── */}
        <section className="bg-white border rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <DollarSign size={18} className="text-emerald-600" />
            Invoice Defaults
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
              <select
                value={settings.defaultCurrency || 'NZD'}
                onChange={(e) => handleChange('defaultCurrency', e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Category</label>
              <select
                value={settings.defaultCategory || 'Other'}
                onChange={(e) => handleChange('defaultCategory', e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name (for invoices)</label>
            <input
              type="text"
              value={settings.companyName || ''}
              onChange={(e) => handleChange('companyName', e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm"
              placeholder="Your company name"
            />
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={fetchSettings}
            className="px-4 py-2.5 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 font-medium"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
