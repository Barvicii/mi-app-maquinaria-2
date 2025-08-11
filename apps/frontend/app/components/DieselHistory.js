'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Fuel, User, Calendar, MessageCircle, Filter, Edit, Trash2, Save, X } from 'lucide-react';

const DieselHistory = ({ workplaceFilter, isAdmin = false }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [filter, setFilter] = useState({
    machineId: '',
    workplace: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false
  });

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filter.machineId) params.append('machineId', filter.machineId);
      if (filter.workplace) params.append('workplace', filter.workplace);
      if (filter.startDate) params.append('startDate', filter.startDate);
      if (filter.endDate) params.append('endDate', filter.endDate);
      params.append('page', filter.page.toString());
      params.append('limit', filter.limit.toString());
      
      const response = await fetch(`/api/diesel?${params.toString()}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch diesel records');
      }
      
      setRecords(result.data || []);
      setPagination(result.pagination || {});
      
    } catch (err) {
      console.error('Error fetching diesel records:', err);
      setError(err.message || 'Failed to load diesel records');
    } finally {
      setLoading(false);
    }
  }, [filter.machineId, filter.workplace, filter.startDate, filter.endDate, filter.page, filter.limit]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: value,
      page: 1 // Reset to first page when filter changes
    }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchRecords();
  };

  const handleClearFilters = () => {
    setFilter(prev => ({
      ...prev,
      machineId: '',
      workplace: '',
      startDate: '',
      endDate: '',
      page: 1
    }));
  };

  const handlePageChange = (newPage) => {
    setFilter(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateTotalFuel = () => {
    return records.reduce((total, record) => total + (record.litros || 0), 0).toFixed(1);
  };

  const handleEdit = (record) => {
    setEditingId(record._id);
    setEditingData({
      litros: record.litros,
      operador: record.operador,
      trabajo: record.trabajo || '',
      observaciones: record.observaciones || '',
      fecha: new Date(record.fecha).toISOString().split('T')[0]
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData({});
  };

  const handleSaveEdit = async (recordId) => {
    try {
      const response = await fetch(`/api/diesel/${recordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editingData,
          litros: parseFloat(editingData.litros),
          fecha: new Date(editingData.fecha)
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update record');
      }

      // Update the record in the local state
      setRecords(prev => prev.map(record => 
        record._id === recordId 
          ? { ...record, ...editingData, litros: parseFloat(editingData.litros) }
          : record
      ));

      setEditingId(null);
      setEditingData({});
    } catch (err) {
      console.error('Error updating record:', err);
      setError(err.message || 'Failed to update record');
    }
  };

  const handleDelete = async (recordId) => {
    if (!confirm('Are you sure you want to delete this fuel consumption record?')) {
      return;
    }

    try {
      const response = await fetch(`/api/diesel/${recordId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete record');
      }

      // Remove the record from local state
      setRecords(prev => prev.filter(record => record._id !== recordId));
      
      // Update pagination count
      setPagination(prev => ({
        ...prev,
        totalCount: prev.totalCount - 1
      }));

    } catch (err) {
      console.error('Error deleting record:', err);
      setError(err.message || 'Failed to delete record');
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow p-4">
        <form onSubmit={handleFilterSubmit} className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4" />
            <h3 className="text-sm font-semibold">Filter Records</h3>
          </div>
          
          {/* Single row with all filters */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div>
              <input
                type="text"
                name="machineId"
                value={filter.machineId}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Machine ID"
              />
            </div>
            
            <div>
              <input
                type="text"
                name="workplace"
                value={filter.workplace}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Workplace"
              />
            </div>
            
            <div>
              <input
                type="date"
                name="startDate"
                value={filter.startDate}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Start Date"
              />
            </div>
            
            <div>
              <input
                type="date"
                name="endDate"
                value={filter.endDate}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="End Date"
              />
            </div>
            
            <div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                Apply
              </button>
            </div>
            
            <div>
              <button
                type="button"
                onClick={handleClearFilters}
                className="w-full bg-gray-500 text-white py-2 px-3 rounded text-sm hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-500"
              >
                Clear
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Summary Section */}
      {records.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Fuel className="w-6 h-6 text-blue-600 mr-2" />
              <span className="text-lg font-semibold text-blue-800">
                Total Fuel Consumed: {calculateTotalFuel()} Liters
              </span>
            </div>
            <span className="text-sm text-blue-600">
              {pagination.totalCount} records found
            </span>
          </div>
        </div>
      )}

      {/* Records Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Diesel Consumption History</h3>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading records...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">
            <p>{error}</p>
            <button
              onClick={fetchRecords}
              className="mt-2 text-blue-600 hover:text-blue-800 underline"
            >
              Try again
            </button>
          </div>
        ) : records.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Fuel className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>No diesel records found</p>
            <p className="text-sm">Records will appear here after diesel consumption is logged</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Machine
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Workplace
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fuel (L)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Operator
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Work/Job
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map((record, index) => (
                    <tr key={record._id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingId === record._id ? (
                          <input
                            type="date"
                            name="fecha"
                            value={editingData.fecha}
                            onChange={handleEditInputChange}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        ) : (
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            {formatDate(record.fecha)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {record.tankName || record.tankId || 'N/A'}
                        </div>
                        {record.tankId && (
                          <div className="text-sm text-gray-500">
                            ID: {record.tankId}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {record.machineName || record.maquinaId}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {record.customMachineId || record.maquinaId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.workplace || record.machineWorkplace || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === record._id ? (
                          <input
                            type="number"
                            name="litros"
                            value={editingData.litros}
                            onChange={handleEditInputChange}
                            min="0.1"
                            step="0.1"
                            className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        ) : (
                          <div className="flex items-center text-sm font-medium text-blue-600">
                            <Fuel className="w-4 h-4 mr-1" />
                            {record.litros} L
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === record._id ? (
                          <input
                            type="text"
                            name="operador"
                            value={editingData.operador}
                            onChange={handleEditInputChange}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        ) : (
                          <div className="flex items-center text-sm text-gray-900">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            {record.operador}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === record._id ? (
                          <input
                            type="text"
                            name="trabajo"
                            value={editingData.trabajo}
                            onChange={handleEditInputChange}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            placeholder="Work/Job description"
                          />
                        ) : (
                          <div className="text-sm text-gray-900">
                            {record.trabajo || <span className="text-gray-300">No job specified</span>}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {editingId === record._id ? (
                          <textarea
                            name="observaciones"
                            value={editingData.observaciones}
                            onChange={handleEditInputChange}
                            rows="2"
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm resize-none"
                            placeholder="Additional notes"
                          />
                        ) : record.observaciones ? (
                          <div className="flex items-start">
                            <MessageCircle className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="break-words">{record.observaciones}</span>
                          </div>
                        ) : (
                          <span className="text-gray-300">No notes</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {editingId === record._id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEdit(record._id)}
                              className="text-green-600 hover:text-green-900 p-1 rounded"
                              title="Save changes"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-600 hover:text-gray-900 p-1 rounded"
                              title="Cancel editing"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(record)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded"
                              title="Edit record"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(record._id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded"
                              title="Delete record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {pagination.page} of {pagination.totalPages} 
                  ({pagination.totalCount} total records)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                    className="px-3 py-1 border border-gray-300 text-sm rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                    className="px-3 py-1 border border-gray-300 text-sm rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DieselHistory;
