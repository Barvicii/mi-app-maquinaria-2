'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Calendar, 
  Filter, 
  Download, 
  Ban, 
  CheckCircle, 
  Users, 
  Activity,
  Search,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Clock,
  AlertTriangle
} from 'lucide-react';

const SuspensionDashboard = () => {
  const { data: session } = useSession();
  const [logs, setLogs] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    organization: '',
    action: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 20
  });

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`/api/admin/suspension-logs?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching logs: ${response.status}`);
      }
      
      const data = await response.json();
      setLogs(data.logs);
      setStatistics(data.statistics);
      setError(null);
    } catch (err) {
      console.error('Error fetching suspension logs:', err);
      setError('Failed to load suspension logs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Check if user is SUPER_ADMIN
  if (session?.user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only Super Administrators can access the suspension dashboard.</p>
        </div>
      </div>
    );
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const exportToCSV = () => {
    if (!logs.length) return;

    const headers = [
      'Date',
      'Organization',
      'Action',
      'Performed By',
      'Users Affected',
      'Reason',
      'Details'
    ];

    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        new Date(log.createdAt).toISOString(),
        `"${log.organization}"`,
        log.action,
        `"${log.performedByName}"`,
        log.usersAffected,
        `"${log.reason || ''}"`,
        `"${log.details || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suspension-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading && !logs.length) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3">Loading suspension logs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Ban className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Suspensions</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {statistics.totalSuspensions}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Unsuspensions</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {statistics.totalUnsuspensions}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Users Affected</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {statistics.totalUsersAffected}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Organizations</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {statistics.uniqueOrganizations}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Suspension Activity Log</h2>
            <button
              onClick={exportToCSV}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              disabled={!logs.length}
            >
              <Download className="mr-2" size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search organization..."
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={filters.organization}
                  onChange={(e) => handleFilterChange('organization', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action
              </label>
              <select
                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
              >
                <option value="">All Actions</option>
                <option value="SUSPEND">Suspend</option>
                <option value="UNSUSPEND">Unsuspend</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date From
              </label>
              <input
                type="date"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date To
              </label>
              <input
                type="date"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="px-6 py-4 bg-red-50 border-l-4 border-red-500">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performed By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users Affected
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {log.organization}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.action === 'SUSPEND' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <Ban className="w-3 h-3 mr-1" />
                        Suspended
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Unsuspended
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{log.performedByName}</div>
                      <div className="text-gray-500">{log.performedByEmail}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Users className="w-3 h-3 mr-1" />
                      {log.usersAffected}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs">
                      <div className="font-medium">{log.reason || 'No reason provided'}</div>
                      {log.details && (
                        <div className="text-gray-500 text-xs mt-1 truncate">
                          {log.details}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No suspension logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {logs.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {filters.page} of {Math.ceil(logs.length / filters.limit)}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page <= 1}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={logs.length < filters.limit}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuspensionDashboard;
