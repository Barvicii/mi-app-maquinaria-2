'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Eye, Trash2, RefreshCw, FileText, Plus, Check, X,
  Filter, DollarSign, Calendar, Search, ChevronLeft, ChevronRight,
  AlertCircle, CheckCircle, Clock, Upload, MessageCircle, HelpCircle, Mail, Link2
} from 'lucide-react';
import '@/styles/tables.css';
import Notification from './Notification';

const CATEGORIES = ['Spare Part', 'Service', 'Oil', 'Filter', 'Tire', 'Fuel', 'Other'];
const STATUSES = ['Pending Review', 'Confirmed', 'Rejected', 'Unassigned'];
const CURRENCIES = ['NZD', 'AUD', 'USD'];

const statusColors = {
  'Pending Review': 'bg-yellow-100 text-yellow-800',
  'Confirmed': 'bg-green-100 text-green-800',
  'Rejected': 'bg-red-100 text-red-800',
  'Unassigned': 'bg-gray-100 text-gray-600'
};

const statusIcons = {
  'Pending Review': <Clock size={14} />,
  'Confirmed': <CheckCircle size={14} />,
  'Rejected': <AlertCircle size={14} />,
  'Unassigned': <AlertCircle size={14} />
};

const TabInvoices = ({ maquinas = [], suppressNotifications = false }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Notification state
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success');

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    machineId: '',
    status: '',
    category: '',
    from: '',
    to: ''
  });

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    vendor: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Other',
    totalAmount: '',
    tax: '',
    currency: 'NZD',
    machineId: '',
    machineCustomId: '',
    items: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail / Review modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [reviewAction, setReviewAction] = useState(null); // 'confirm' | 'reject'
  const [rejectionReason, setRejectionReason] = useState('');

  // Summary
  const [summary, setSummary] = useState(null);
  const [showSummary, setShowSummary] = useState(false);

  // WhatsApp inquiry
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryInvoice, setInquiryInvoice] = useState(null);
  const [inquiryMessage, setInquiryMessage] = useState('');

  // Assign machine modal (for unassigned invoices)
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignInvoice, setAssignInvoice] = useState(null);
  const [assignMachineId, setAssignMachineId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [unassignedCount, setUnassignedCount] = useState(0);

  // Support WhatsApp number (NZ format without +)
  const SUPPORT_WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '6431234567';

  const notify = useCallback((message, type = 'success') => {
    if (suppressNotifications) return;
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
  }, [suppressNotifications]);

  // ─── Fetch Invoices ───
  const fetchInvoices = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filters.machineId) params.append('machineId', filters.machineId);
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);

      const res = await fetch(`/api/invoices?${params}`, { credentials: 'same-origin' });
      if (!res.ok) throw new Error(`Error: ${res.status}`);

      const data = await res.json();
      setInvoices(data.invoices || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
      setCurrentPage(page);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchInvoices(1);
  }, [fetchInvoices]);

  // ─── Fetch Summary ───
  const fetchSummary = async () => {
    try {
      const params = new URLSearchParams({ groupBy: 'category' });
      if (filters.machineId) params.append('machineId', filters.machineId);
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);

      const res = await fetch(`/api/invoices/summary?${params}`, { credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
        setShowSummary(true);
      }
    } catch (err) {
      console.error('Failed to load summary:', err);
    }
  };

  // ─── Fetch Unassigned Count ───
  const fetchUnassignedCount = useCallback(async () => {
    try {
      const res = await fetch('/api/invoices?status=Unassigned&limit=1', { credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        setUnassignedCount(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch unassigned count:', err);
    }
  }, []);

  useEffect(() => {
    fetchUnassignedCount();
  }, [fetchUnassignedCount]);

  // ─── Assign Machine to Invoice ───
  const handleAssignMachine = async () => {
    if (!assignInvoice || !assignMachineId) return;

    try {
      setIsAssigning(true);
      const selected = maquinas.find((m) => m._id === assignMachineId);

      const res = await fetch(`/api/invoices/${assignInvoice._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          machineId: assignMachineId,
          machineCustomId: selected?.machineId || '',
          status: 'Pending Review'
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to assign machine');
      }

      notify('Machine assigned successfully — invoice moved to Pending Review');
      setShowAssignModal(false);
      setAssignInvoice(null);
      setAssignMachineId('');
      fetchInvoices(currentPage);
      fetchUnassignedCount();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  // ─── Create Invoice ───
  const handleCreate = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const payload = {
        ...formData,
        totalAmount: Number(formData.totalAmount),
        tax: Number(formData.tax) || 0
      };

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create invoice');
      }

      notify('Invoice created successfully');
      setShowCreateForm(false);
      resetForm();
      fetchInvoices(1);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Delete Invoice ───
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin'
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete');
      }

      notify('Invoice deleted');
      fetchInvoices(currentPage);
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  // ─── Review (Confirm / Reject) ───
  const handleReview = async (action) => {
    if (!selectedInvoice) return;

    try {
      const body = { status: action === 'confirm' ? 'Confirmed' : 'Rejected' };
      if (action === 'reject') body.rejectionReason = rejectionReason;

      const res = await fetch(`/api/invoices/${selectedInvoice._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update');
      }

      notify(`Invoice ${action === 'confirm' ? 'confirmed' : 'rejected'}`);
      setShowDetailModal(false);
      setSelectedInvoice(null);
      setReviewAction(null);
      setRejectionReason('');
      fetchInvoices(currentPage);
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      vendor: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      category: 'Other',
      totalAmount: '',
      tax: '',
      currency: 'NZD',
      machineId: '',
      machineCustomId: '',
      items: []
    });
  };

  const getMachineName = (inv) => {
    if (inv.machineCustomId) return inv.machineCustomId;
    if (inv.machineId) {
      const m = maquinas.find(
        (mq) => mq._id === inv.machineId || mq._id?.toString() === inv.machineId?.toString()
      );
      return m ? (m.machineId || m.model || 'Unknown') : inv.machineId;
    }
    return '—';
  };

  // ─── WhatsApp Inquiry ───
  const openInquiryModal = (invoice) => {
    const machineName = getMachineName(invoice);
    const defaultMsg = `Hi, I have a question about an invoice in Orchard Services:\n\n` +
      `📄 Invoice: ${invoice.invoiceId || invoice._id?.toString().slice(-8)}\n` +
      `📅 Date: ${invoice.date ? new Date(invoice.date).toLocaleDateString('en-NZ') : 'N/A'}\n` +
      `🏪 Vendor: ${invoice.vendor || 'N/A'}\n` +
      `💰 Amount: ${invoice.totalAmount || 'N/A'} ${invoice.currency || 'NZD'}\n` +
      `🚜 Machine: ${machineName}\n\n` +
      `I need help identifying which machine this invoice belongs to. Can you assist?`;
    setInquiryInvoice(invoice);
    setInquiryMessage(defaultMsg);
    setShowInquiryModal(true);
  };

  const sendWhatsAppInquiry = () => {
    const encoded = encodeURIComponent(inquiryMessage);
    const url = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encoded}`;
    window.open(url, '_blank');
    setShowInquiryModal(false);
    setInquiryInvoice(null);
    setInquiryMessage('');
    notify('WhatsApp opened — your inquiry has been sent', 'success');
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-NZ', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount, currency = 'NZD') => {
    if (amount == null) return '—';
    return new Intl.NumberFormat('en-NZ', { style: 'currency', currency }).format(amount);
  };

  // ─── Render ───
  return (
    <div className="p-4 md:p-6">
      {/* Notification */}
      {showNotification && (
        <Notification
          message={notificationMessage}
          type={notificationType}
          onClose={() => setShowNotification(false)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText size={24} />
            Invoices
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {totalCount} invoice{totalCount !== 1 ? 's' : ''} total
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setIsRefreshing(true); fetchInvoices(currentPage); }}
            className="flex items-center gap-1 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 transition"
            disabled={isRefreshing}
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 transition ${showFilters ? 'bg-blue-50 border-blue-300' : ''}`}
          >
            <Filter size={16} />
            Filters
          </button>

          <button
            onClick={fetchSummary}
            className="flex items-center gap-1 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 transition"
          >
            <DollarSign size={16} />
            Summary
          </button>

          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            <Plus size={16} />
            New Invoice
          </button>
        </div>
      </div>

      {/* Unassigned Invoices Banner */}
      {unassignedCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-full">
              <AlertCircle size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-amber-800">
                {unassignedCount} invoice{unassignedCount !== 1 ? 's' : ''} need machine assignment
              </p>
              <p className="text-sm text-amber-600">These invoices were received by email but couldn&apos;t be matched to a machine automatically.</p>
            </div>
          </div>
          <button
            onClick={() => setFilters({ ...filters, status: 'Unassigned' })}
            className="flex items-center gap-1 px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition whitespace-nowrap"
          >
            <Link2 size={14} />
            Review &amp; Assign
          </button>
        </div>
      )}

      {/* Filters Bar */}
      {showFilters && (
        <div className="bg-gray-50 border rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <select
              value={filters.machineId}
              onChange={(e) => setFilters({ ...filters, machineId: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Machines</option>
              {maquinas.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.machineId || m.model || m._id}
                </option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="From date"
            />

            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="To date"
            />
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => fetchInvoices(1)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Search size={14} className="inline mr-1" /> Apply
            </button>
            <button
              onClick={() => {
                setFilters({ machineId: '', status: '', category: '', from: '', to: '' });
              }}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Summary Panel */}
      {showSummary && summary && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-emerald-800 flex items-center gap-2">
              <DollarSign size={18} />
              Cost Summary (Confirmed Invoices)
            </h3>
            <button onClick={() => setShowSummary(false)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-500 uppercase">Total</p>
              <p className="text-lg font-bold text-emerald-700">
                {formatCurrency(summary.totals?.grandTotal)}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-500 uppercase">Invoices</p>
              <p className="text-lg font-bold text-gray-800">{summary.totals?.totalInvoices || 0}</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-500 uppercase">Average</p>
              <p className="text-lg font-bold text-gray-800">
                {formatCurrency(summary.totals?.avgInvoice)}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-500 uppercase">Period</p>
              <p className="text-sm font-medium text-gray-600">
                {summary.totals?.minDate ? formatDate(summary.totals.minDate) : '—'}
                {' → '}
                {summary.totals?.maxDate ? formatDate(summary.totals.maxDate) : '—'}
              </p>
            </div>
          </div>

          {summary.summary?.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {summary.summary.map((cat) => (
                <div key={cat._id} className="flex justify-between items-center bg-white rounded px-3 py-2 text-sm">
                  <span className="text-gray-600">{cat._id}</span>
                  <span className="font-medium">{formatCurrency(cat.totalAmount)} ({cat.count})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          <AlertCircle size={16} className="inline mr-2" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <RefreshCw size={24} className="animate-spin text-emerald-600 mr-2" />
          <span className="text-gray-500">Loading invoices...</span>
        </div>
      )}

      {/* Table */}
      {!loading && invoices.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <FileText size={48} className="mx-auto mb-3 opacity-50" />
          <p className="text-lg">No invoices found</p>
          <p className="text-sm mt-1">Create your first invoice to start tracking costs.</p>
        </div>
      )}

      {!loading && invoices.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Invoice ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Vendor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Machine</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv._id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      {inv.receivedViaEmail && (
                        <Mail size={12} className="text-blue-500" title="Received via email" />
                      )}
                      {inv.invoiceId || inv._id?.toString().slice(-8)}
                    </div>
                  </td>
                  <td className="px-4 py-3">{formatDate(inv.date)}</td>
                  <td className="px-4 py-3 font-medium">{inv.vendor}</td>
                  <td className="px-4 py-3 text-gray-600">{getMachineName(inv)}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">{inv.category}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatCurrency(inv.totalAmount, inv.currency)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors[inv.status] || 'bg-gray-100'}`}>
                      {statusIcons[inv.status]}
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => { setSelectedInvoice(inv); setShowDetailModal(true); }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                      {inv.status === 'Unassigned' && (
                        <button
                          onClick={() => { setAssignInvoice(inv); setAssignMachineId(''); setShowAssignModal(true); }}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition"
                          title="Assign to machine"
                        >
                          <Link2 size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => openInquiryModal(inv)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition"
                        title="Ask about this invoice via WhatsApp"
                      >
                        <MessageCircle size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(inv._id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 px-2">
          <p className="text-sm text-gray-500">
            Page {currentPage} of {totalPages} ({totalCount} items)
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => fetchInvoices(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 border rounded hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => fetchInvoices(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-2 border rounded hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─── Create Invoice Modal ─── */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">New Invoice</h3>
              <button onClick={() => { setShowCreateForm(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
                  <input
                    type="text"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    required
                    placeholder="e.g. PartsBarn NZ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  required
                  placeholder="e.g. Hydraulic oil change + filter kit"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Machine</label>
                  <select
                    value={formData.machineId}
                    onChange={(e) => {
                      const selected = maquinas.find((m) => m._id === e.target.value);
                      setFormData({
                        ...formData,
                        machineId: e.target.value,
                        machineCustomId: selected?.machineId || ''
                      });
                    }}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Unassigned</option>
                    {maquinas.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.machineId || m.model || m._id}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    required
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax (GST)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.tax}
                    onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowCreateForm(false); resetForm(); }}
                  className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Detail / Review Modal ─── */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">Invoice Details</h3>
                <p className="text-xs text-gray-400 font-mono">{selectedInvoice.invoiceId}</p>
              </div>
              <button
                onClick={() => { setShowDetailModal(false); setSelectedInvoice(null); setReviewAction(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Status badge */}
              <div className="flex justify-between items-center">
                <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${statusColors[selectedInvoice.status]}`}>
                  {statusIcons[selectedInvoice.status]}
                  {selectedInvoice.status}
                </span>
                <span className="text-xl font-bold text-gray-800">
                  {formatCurrency(selectedInvoice.totalAmount, selectedInvoice.currency)}
                </span>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Vendor</p>
                  <p className="font-medium">{selectedInvoice.vendor}</p>
                </div>
                <div>
                  <p className="text-gray-500">Date</p>
                  <p className="font-medium">{formatDate(selectedInvoice.date)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Category</p>
                  <p className="font-medium">{selectedInvoice.category}</p>
                </div>
                <div>
                  <p className="text-gray-500">Machine</p>
                  <p className="font-medium">{getMachineName(selectedInvoice)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Description</p>
                  <p className="font-medium">{selectedInvoice.description}</p>
                </div>
                {selectedInvoice.tax > 0 && (
                  <>
                    <div>
                      <p className="text-gray-500">Subtotal</p>
                      <p className="font-medium">{formatCurrency(selectedInvoice.subtotal, selectedInvoice.currency)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Tax (GST)</p>
                      <p className="font-medium">{formatCurrency(selectedInvoice.tax, selectedInvoice.currency)}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Items */}
              {selectedInvoice.items?.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Line Items</p>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left px-3 py-2">Item</th>
                          <th className="text-center px-3 py-2">Qty</th>
                          <th className="text-right px-3 py-2">Price</th>
                          <th className="text-right px-3 py-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.items.map((item, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-3 py-2">{item.nombre}</td>
                            <td className="text-center px-3 py-2">{item.cantidad}</td>
                            <td className="text-right px-3 py-2">{formatCurrency(item.precioUnitario, selectedInvoice.currency)}</td>
                            <td className="text-right px-3 py-2 font-medium">{formatCurrency(item.total, selectedInvoice.currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* OCR confidence */}
              {selectedInvoice.ocrConfidence != null && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm">
                  <span className="text-blue-600">🤖 AI-scanned</span> — Confidence: {selectedInvoice.ocrConfidence}%
                </div>
              )}

              {/* Received via email badge */}
              {selectedInvoice.receivedViaEmail && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                  <Mail size={14} className="text-indigo-600" />
                  <span className="text-indigo-700">Received automatically via email</span>
                  {selectedInvoice.emailSource?.from && (
                    <span className="text-indigo-500 ml-auto text-xs">from: {selectedInvoice.emailSource.from}</span>
                  )}
                </div>
              )}

              {/* Parsed machine IDs hint (for unassigned email invoices) */}
              {selectedInvoice.status === 'Unassigned' && selectedInvoice.parsedMachineIds?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm">
                  <span className="text-amber-700 font-medium">IDs found in email: </span>
                  <span className="font-mono text-amber-800">{selectedInvoice.parsedMachineIds.join(', ')}</span>
                  <span className="text-amber-600 ml-1">— no matching machine found</span>
                </div>
              )}

              {/* Rejection reason */}
              {selectedInvoice.status === 'Rejected' && selectedInvoice.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
                  <p className="text-red-600 font-medium">Rejection reason:</p>
                  <p className="text-red-700">{selectedInvoice.rejectionReason}</p>
                </div>
              )}

              {/* Assign Machine action (for Unassigned invoices) */}
              {selectedInvoice.status === 'Unassigned' && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-3">This invoice needs to be assigned to a machine:</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowDetailModal(false); setAssignInvoice(selectedInvoice); setAssignMachineId(''); setShowAssignModal(true); }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
                    >
                      <Link2 size={16} /> Assign Machine
                    </button>
                    <button
                      onClick={() => { setShowDetailModal(false); openInquiryModal(selectedInvoice); }}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition"
                    >
                      <MessageCircle size={16} /> Ask via WhatsApp
                    </button>
                  </div>
                </div>
              )}

              {/* Review Actions */}
              {selectedInvoice.status === 'Pending Review' && (
                <div className="border-t pt-4">
                  {!reviewAction ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setReviewAction('confirm')}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        <Check size={16} /> Confirm
                      </button>
                      <button
                        onClick={() => setReviewAction('reject')}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                      >
                        <X size={16} /> Reject
                      </button>
                    </div>
                  ) : reviewAction === 'confirm' ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Are you sure you want to confirm this invoice?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReview('confirm')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          Yes, Confirm
                        </button>
                        <button
                          onClick={() => setReviewAction(null)}
                          className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Reason for rejection</label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        rows={3}
                        placeholder="Explain why this invoice is being rejected..."
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReview('reject')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                        >
                          Reject Invoice
                        </button>
                        <button
                          onClick={() => { setReviewAction(null); setRejectionReason(''); }}
                          className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl">
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-400">
                  <span>Created: {formatDate(selectedInvoice.createdAt)}</span>
                  {selectedInvoice.confirmedAt && (
                    <span className="ml-3">Confirmed: {formatDate(selectedInvoice.confirmedAt)}</span>
                  )}
                </div>
                <button
                  onClick={() => { setShowDetailModal(false); openInquiryModal(selectedInvoice); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition"
                >
                  <MessageCircle size={14} />
                  Ask via WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── WhatsApp Inquiry Modal ─── */}
      {showInquiryModal && inquiryInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MessageCircle size={20} className="text-green-600" />
                Invoice Inquiry
              </h3>
              <button
                onClick={() => { setShowInquiryModal(false); setInquiryInvoice(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Invoice summary */}
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Invoice</span>
                  <span className="font-mono font-medium">{inquiryInvoice.invoiceId || inquiryInvoice._id?.toString().slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vendor</span>
                  <span className="font-medium">{inquiryInvoice.vendor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-medium">{formatCurrency(inquiryInvoice.totalAmount, inquiryInvoice.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Machine</span>
                  <span className="font-medium">{getMachineName(inquiryInvoice)}</span>
                </div>
              </div>

              {/* Hint */}
              <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <HelpCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>Can&apos;t find the machine for this invoice? Edit the message below and send it via WhatsApp to get help.</span>
              </div>

              {/* Editable message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm h-40 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={sendWhatsAppInquiry}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  <MessageCircle size={18} />
                  Open WhatsApp
                </button>
                <button
                  onClick={() => { setShowInquiryModal(false); setInquiryInvoice(null); }}
                  className="px-4 py-2.5 border rounded-lg hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Assign Machine Modal ─── */}
      {showAssignModal && assignInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Link2 size={20} className="text-amber-600" />
                Assign Machine
              </h3>
              <button
                onClick={() => { setShowAssignModal(false); setAssignInvoice(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Invoice info */}
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Invoice</span>
                  <span className="font-mono font-medium">{assignInvoice.invoiceId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vendor</span>
                  <span className="font-medium">{assignInvoice.vendor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-medium">{formatCurrency(assignInvoice.totalAmount, assignInvoice.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Description</span>
                  <span className="font-medium text-right max-w-[200px] truncate">{assignInvoice.description}</span>
                </div>
                {assignInvoice.parsedMachineIds?.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">IDs found in email</span>
                    <span className="font-mono text-amber-700 font-medium">{assignInvoice.parsedMachineIds.join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Machine selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Machine</label>
                <select
                  value={assignMachineId}
                  onChange={(e) => setAssignMachineId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm"
                >
                  <option value="">— Select a machine —</option>
                  {maquinas.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.machineId || m.customId || ''} — {m.model || m.brand || 'Unknown'} {m.year || ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Can't find? WhatsApp */}
              <div className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 border rounded-lg px-3 py-2">
                <HelpCircle size={16} className="mt-0.5 flex-shrink-0 text-gray-400" />
                <span>
                  Can&apos;t identify the machine?{' '}
                  <button
                    onClick={() => { setShowAssignModal(false); openInquiryModal(assignInvoice); }}
                    className="text-green-600 font-medium hover:underline"
                  >
                    Ask via WhatsApp
                  </button>
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleAssignMachine}
                  disabled={!assignMachineId || isAssigning}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium disabled:opacity-50"
                >
                  <Check size={18} />
                  {isAssigning ? 'Assigning...' : 'Assign Machine'}
                </button>
                <button
                  onClick={() => { setShowAssignModal(false); setAssignInvoice(null); }}
                  className="px-4 py-2.5 border rounded-lg hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabInvoices;
