'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings, Save, RefreshCw, MessageCircle, Mail, Shield,
  Eye, EyeOff, CheckCircle, AlertCircle, DollarSign, Bell,
  Info, ExternalLink
} from 'lucide-react';

const CURRENCIES = ['NZD', 'AUD', 'USD'];
const CATEGORIES = ['Spare Part', 'Service', 'Oil', 'Filter', 'Tire', 'Fuel', 'Other'];

export default function InvoiceSettings({ suppressNotifications = false }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isDefault, setIsDefault] = useState(true);

  // Password visibility toggles
  const [showEmailPass, setShowEmailPass] = useState(false);
  const [showWaToken, setShowWaToken] = useState(false);
  const [showCronSecret, setShowCronSecret] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/organization/settings', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Failed to load settings');
      const data = await res.json();
      setSettings(data.settings);
      setIsDefault(data.isDefault);
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
  };

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

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save settings');
      }

      setSuccess('Settings saved successfully');
      setIsDefault(false);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email App Password
              </label>
              <div className="relative">
                <input
                  type={showEmailPass ? 'text' : 'password'}
                  value={settings.invoiceEmailPassword || ''}
                  onChange={(e) => handleChange('invoiceEmailPassword', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm pr-10"
                  placeholder="Gmail App Password"
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
                For Gmail, generate an App Password at{' '}
                <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline-flex items-center gap-0.5">
                  myaccount.google.com/apppasswords <ExternalLink size={10} />
                </a>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook Secret (CRON)
              </label>
              <div className="relative">
                <input
                  type={showCronSecret ? 'text' : 'password'}
                  value={settings.cronSecret || ''}
                  onChange={(e) => handleChange('cronSecret', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm pr-10"
                  placeholder="Secret key to authorize the email processing webhook"
                />
                <button
                  type="button"
                  onClick={() => setShowCronSecret(!showCronSecret)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCronSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Used to secure the <code className="bg-gray-100 px-1 rounded">/api/invoices/process-email</code> endpoint.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoProcessEmails || false}
                  onChange={(e) => handleChange('autoProcessEmails', e.target.checked)}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">Enable automatic email processing</span>
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
