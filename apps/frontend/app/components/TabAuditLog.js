'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, RefreshCw, Filter, ChevronDown, ChevronUp,
  Shield, User, Settings, Key, AlertTriangle, Clock,
  ChevronLeft, ChevronRight, FileText
} from 'lucide-react';

const ACTION_ICONS = {
  USER_REGISTRATION: User,
  password_reset_requested: Key,
  temporary_password_generated: Key,
  user_role_update: Shield,
  login: User,
  logout: User,
  default: FileText,
};

const ACTION_COLORS = {
  USER_REGISTRATION: 'bg-green-100 text-green-700',
  password_reset_requested: 'bg-amber-100 text-amber-700',
  temporary_password_generated: 'bg-amber-100 text-amber-700',
  user_role_update: 'bg-purple-100 text-purple-700',
  login: 'bg-blue-100 text-blue-700',
  logout: 'bg-gray-100 text-gray-700',
  default: 'bg-indigo-100 text-indigo-700',
};

const formatAction = (action) => {
  if (!action) return 'Unknown';
  return action
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

export default function TabAuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [filters, setFilters] = useState({
    action: '',
    userId: '',
    dateFrom: '',
    dateTo: '',
  });

  const fetchLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ page: page.toString(), limit: '50' });
      if (filters.action) params.append('action', filters.action);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);

      const res = await fetch(`/api/audit?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load audit logs');

      const data = await res.json();
      setLogs(data.logs || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = () => fetchLogs(1);

  const resetFilters = () => {
    setFilters({ action: '', userId: '', dateFrom: '', dateTo: '' });
    setTimeout(() => fetchLogs(1), 0);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Audit Log</h2>
          <p className="text-sm text-gray-500">{pagination.total} total events recorded</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter size={16} className="mr-1.5" />
            Filters
            {showFilters ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
          </button>
          <button
            onClick={() => fetchLogs(pagination.page)}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <input
                type="text"
                name="action"
                value={filters.action}
                onChange={handleFilterChange}
                placeholder="e.g. registration, password"
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
              <input
                type="text"
                name="userId"
                value={filters.userId}
                onChange={handleFilterChange}
                placeholder="Name or email"
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <input
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <input
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={resetFilters} className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Clear
            </button>
            <button onClick={applyFilters} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3" />
              <p className="text-gray-500">Loading audit logs...</p>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">No audit log entries found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log, idx) => {
                    const ActionIcon = ACTION_ICONS[log.action] || ACTION_ICONS.default;
                    const colorClass = ACTION_COLORS[log.action] || ACTION_COLORS.default;
                    const isExpanded = expandedRow === idx;
                    const detailEntries = log.details ? Object.entries(log.details).filter(([k]) => !['message', '_id'].includes(k)) : [];

                    return (
                      <React.Fragment key={log._id || idx}>
                        <tr
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => setExpandedRow(isExpanded ? null : idx)}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <Clock size={14} className="mr-1.5 text-gray-400" />
                              {new Date(log.timestamp).toLocaleDateString('en-NZ', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                            <div className="text-xs text-gray-500 ml-5">
                              {new Date(log.timestamp).toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                              <ActionIcon size={12} />
                              {formatAction(log.action)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{log.userName || '—'}</div>
                            <div className="text-xs text-gray-500">{log.userEmail || log.userId || '—'}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs text-gray-500 capitalize">{log.source}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-600 truncate max-w-[200px]">
                              {log.details?.message || log.details?.email || JSON.stringify(log.details).substring(0, 60)}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={5} className="px-4 py-3 bg-gray-50">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                {log.ipAddress && (
                                  <div><span className="font-medium text-gray-700">IP:</span> <span className="text-gray-600">{log.ipAddress}</span></div>
                                )}
                                {log.target && (
                                  <div><span className="font-medium text-gray-700">Target:</span> <span className="text-gray-600">{log.target.type} — {log.target.name || log.target.id}</span></div>
                                )}
                                {detailEntries.map(([key, val]) => (
                                  <div key={key}>
                                    <span className="font-medium text-gray-700">{key}:</span>{' '}
                                    <span className="text-gray-600">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-700">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchLogs(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft size={16} className="mr-1" /> Previous
                  </button>
                  <button
                    onClick={() => fetchLogs(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next <ChevronRight size={16} className="ml-1" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
