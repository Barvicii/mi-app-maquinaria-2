import React, { useState, useEffect, useCallback } from 'react';
import { Fuel, Plus, Calendar, MapPin } from 'lucide-react';

const DieselRefillManager = ({ workplaceFilter, isAdmin = false }) => {
  const [refills, setRefills] = useState([]);
  const [tanks, setTanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    tankId: '',
    liters: '',
    refillDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const loadTanks = useCallback(async () => {
    try {
      const response = await fetch('/api/diesel-tanks');
      const data = await response.json();
      if (data.success) {
        let filteredTanks = data.tanks;
        if (workplaceFilter) {
          filteredTanks = data.tanks.filter(tank => 
            tank.workplace?.toLowerCase().includes(workplaceFilter.toLowerCase())
          );
        }
        setTanks(filteredTanks);
      }
    } catch (error) {
      console.error('Error loading tanks:', error);
    }
  }, [workplaceFilter]);

  const loadRefills = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/diesel/refills/all');
      const data = await response.json();
      
      if (data.success) {
        let filteredRefills = data.refills;
        if (workplaceFilter) {
          filteredRefills = data.refills.filter(refill => 
            refill.workplace?.toLowerCase().includes(workplaceFilter.toLowerCase())
          );
        }
        setRefills(filteredRefills);
      } else {
        setError(data.error || 'Error loading refills');
      }
    } catch (error) {
      console.error('Error loading refills:', error);
      setError('Error loading refills');
    } finally {
      setLoading(false);
    }
  }, [workplaceFilter]);

  useEffect(() => {
    loadTanks();
    loadRefills();
  }, [loadTanks, loadRefills]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const selectedTank = tanks.find(tank => tank._id === formData.tankId);
    
    try {
      const response = await fetch('/api/diesel/refills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tankId: formData.tankId,
          liters: parseFloat(formData.liters),
          refillDate: formData.refillDate,
          notes: formData.notes,
          workplace: selectedTank?.workplace || ''
        })
      });

      const data = await response.json();

      if (data.success) {
        setFormData({
          tankId: '',
          liters: '',
          refillDate: new Date().toISOString().split('T')[0],
          notes: ''
        });
        setShowForm(false);
        await loadRefills();
        setError('');
      } else {
        setError(data.error || 'Error registering refill');
      }
    } catch (error) {
      console.error('Error registering refill:', error);
      setError('Error registering refill');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center">
            <Fuel className="w-5 h-5 mr-2" />
            Tank Refills
          </h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Refill
          </button>
        </div>
      </div>

      {/* Add Refill Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium text-gray-900 mb-4">Register New Refill</h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tank *
                </label>
                <select
                  value={formData.tankId}
                  onChange={(e) => setFormData({...formData, tankId: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a tank</option>
                  {tanks.map(tank => (
                    <option key={tank._id} value={tank._id}>
                      {tank.name} ({tank.tankId}) - {tank.workplace || 'N/A'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Liters *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.liters}
                  onChange={(e) => setFormData({...formData, liters: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Liters added"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.refillDate}
                  onChange={(e) => setFormData({...formData, refillDate: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Optional notes"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Register Refill'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Refills Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading refills...</span>
          </div>
        ) : refills.length === 0 ? (
          <div className="text-center py-8">
            <Fuel className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No refills found</p>
            <p className="text-sm text-gray-400">Register your first refill to get started</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workplace</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liters</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added By</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {refills.map((refill) => (
                <tr key={refill._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {refill.tankName || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {refill.tankIdCode || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900">
                        {refill.workplace || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-blue-600">
                      {refill.liters}L
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900">
                        {formatDate(refill.refillDate)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {refill.notes || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {refill.createdBy || 'Unknown'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DieselRefillManager;
