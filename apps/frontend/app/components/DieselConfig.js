'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Fuel, QrCode, History, Settings, Plus, Wrench, Edit2, Trash2, Gauge } from 'lucide-react';
import DieselHistory from '@/components/DieselHistory';
import QRTankGenerator from '@/components/QRTankGenerator';
import DieselRefillManager from '@/components/DieselRefillManager';

const DieselConfig = ({ suppressNotifications = false }) => {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('setup');
  const [tanks, setTanks] = useState([]);
  const [filteredTanks, setFilteredTanks] = useState([]);
  const [workplaceFilter, setWorkplaceFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTankForm, setShowTankForm] = useState(false);
  const [editingTank, setEditingTank] = useState(null);
  const [newTank, setNewTank] = useState({
    name: '',
    capacity: '',
    location: '',
    description: '',
    tankId: '',
    workplace: ''
  });

  // Check if user is admin
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';
  const userWorkplace = session?.user?.workplace || '';

  console.log('DieselConfig rendered, session:', session);

  // Fetch user's diesel tanks
  useEffect(() => {
    console.log('DieselConfig useEffect triggered, session:', session);
    const fetchTanks = async () => {
      try {
        console.log('Fetching diesel tanks...');
        setLoading(true);
        const response = await fetch('/api/diesel-tanks');
        const result = await response.json();
        
        console.log('Diesel tanks API response:', result);
        
        if (response.ok) {
          setTanks(result.tanks || []);
          console.log('Tanks set:', result.tanks || []);
        } else {
          setError(result.error || 'Failed to load diesel tanks');
        }
      } catch (err) {
        console.error('Error fetching diesel tanks:', err);
        setError('Failed to load diesel tanks');
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchTanks();
    }
  }, [session]);

  // Filter tanks by workplace
  useEffect(() => {
    if (!isAdmin) {
      // For regular users, auto-filter by their workplace
      const filtered = tanks.filter(tank => 
        tank.workplace === userWorkplace
      );
      setFilteredTanks(filtered);
    } else if (!workplaceFilter) {
      // For admins without filter, show all tanks
      setFilteredTanks(tanks);
    } else {
      // For admins with filter, filter by workplace
      const filtered = tanks.filter(tank => 
        tank.workplace && tank.workplace.toLowerCase().includes(workplaceFilter.toLowerCase())
      );
      setFilteredTanks(filtered);
    }
  }, [tanks, workplaceFilter, isAdmin, userWorkplace]);

  // Auto-fill workplace for regular users in the form
  useEffect(() => {
    if (!isAdmin && userWorkplace && !editingTank) {
      setNewTank(prev => ({ ...prev, workplace: userWorkplace }));
    }
  }, [isAdmin, userWorkplace, editingTank]);

  const handleCreateTank = async (e) => {
    e.preventDefault();
    
    // For regular users, auto-assign their workplace
    const tankData = { ...newTank };
    if (!isAdmin) {
      tankData.workplace = userWorkplace;
    }
    
    // Validate form
    if (!tankData.name || !tankData.capacity || !tankData.location || !tankData.tankId || !tankData.workplace) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('/api/diesel-tanks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tankData),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Add new tank to list
        setTanks([...tanks, result.data]);
        // Reset form
        setNewTank({
          name: '',
          capacity: '',
          location: '',
          description: '',
          tankId: '',
          workplace: isAdmin ? '' : userWorkplace
        });
        setShowTankForm(false);
        setError('');
        
        if (!suppressNotifications) {
          alert('Tank created successfully!');
        }
      } else {
        setError(result.error || 'Failed to create tank');
      }
    } catch (err) {
      console.error('Error creating tank:', err);
      setError('Failed to create tank');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTank = (tank) => {
    setEditingTank(tank);
    setNewTank({
      name: tank.name,
      capacity: tank.capacity.toString(),
      location: tank.location,
      description: tank.description || '',
      tankId: tank.tankId,
      workplace: tank.workplace || ''
    });
    setShowTankForm(true);
  };

  const cancelEdit = () => {
    setEditingTank(null);
    setNewTank({
      name: '',
      capacity: '',
      location: '',
      description: '',
      tankId: '',
      workplace: isAdmin ? '' : userWorkplace
    });
    setShowTankForm(false);
    setError('');
  };

  const handleUpdateTank = async (e) => {
    e.preventDefault();
    
    // For regular users, auto-assign their workplace
    const tankData = { ...newTank };
    if (!isAdmin) {
      tankData.workplace = userWorkplace;
    }
    
    if (!tankData.name || !tankData.capacity || !tankData.location || !tankData.tankId || !tankData.workplace) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/diesel-tanks/${editingTank._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tankData),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Update tank in list
        setTanks(tanks.map(tank => 
          tank._id === editingTank._id ? { ...tank, ...newTank, capacity: Number(newTank.capacity) } : tank
        ));
        // Reset form
        setNewTank({
          name: '',
          capacity: '',
          location: '',
          description: '',
          tankId: '',
          workplace: isAdmin ? '' : userWorkplace
        });
        setShowTankForm(false);
        setEditingTank(null);
        setError('');
        
        if (!suppressNotifications) {
          alert('Tank updated successfully!');
        }
      } else {
        setError(result.error || 'Failed to update tank');
      }
    } catch (err) {
      console.error('Error updating tank:', err);
      setError('Failed to update tank');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTank = async (tank) => {
    if (!confirm(`Are you sure you want to delete "${tank.name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/diesel-tanks/${tank._id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Remove tank from list
        setTanks(tanks.filter(t => t._id !== tank._id));
        setError('');
        
        if (!suppressNotifications) {
          alert('Tank deleted successfully!');
        }
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to delete tank');
      }
    } catch (err) {
      console.error('Error deleting tank:', err);
      setError('Failed to delete tank');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Diesel Management</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage diesel consumption tracking for your machinery fleet
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('setup')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'setup'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings size={16} className="inline mr-2" />
            Tank Setup ({filteredTanks.length})
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'qr'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <QrCode size={16} className="inline mr-2" />
            QR Codes
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <History size={16} className="inline mr-2" />
            Fuel History
          </button>
          <button
            onClick={() => setActiveTab('refills')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'refills'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Gauge size={16} className="inline mr-2" />
            Tank Refills
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {activeTab === 'setup' && (
          <div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* New/Edit Tank Form */}
            {showTankForm && (
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-3">
                  {editingTank ? 'Edit Tank' : 'Create New Tank'}
                </h4>
                <form onSubmit={editingTank ? handleUpdateTank : handleCreateTank} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tank Name *
                    </label>
                    <input
                      type="text"
                      value={newTank.name}
                      onChange={(e) => setNewTank({ ...newTank, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Main Diesel Tank"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tank ID *
                    </label>
                    <input
                      type="text"
                      value={newTank.tankId}
                      onChange={(e) => setNewTank({ ...newTank, tankId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., TANK_001"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Capacity (L) *
                      </label>
                      <input
                        type="number"
                        value={newTank.capacity}
                        onChange={(e) => setNewTank({ ...newTank, capacity: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="2000"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location *
                      </label>
                      <input
                        type="text"
                        value={newTank.location}
                        onChange={(e) => setNewTank({ ...newTank, location: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Yard A"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Workplace *
                    </label>
                    {!isAdmin ? (
                      <div>
                        <input
                          type="text"
                          value={userWorkplace}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                          placeholder="Auto-assigned workplace"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Workplace is automatically assigned from your profile
                        </p>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={newTank.workplace}
                        onChange={(e) => setNewTank({ ...newTank, workplace: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Main Facility, Workshop A"
                        required
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newTank.description}
                      onChange={(e) => setNewTank({ ...newTank, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Additional details..."
                      rows="2"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      {loading ? (editingTank ? 'Updating...' : 'Creating...') : (editingTank ? 'Update Tank' : 'Create Tank')}
                    </button>
                    <button
                      type="button"
                      onClick={editingTank ? cancelEdit : () => setShowTankForm(false)}
                      className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tank List */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Diesel Tanks</h3>
              <button
                onClick={() => setShowTankForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Tank
              </button>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading tanks...</span>
              </div>
            ) : filteredTanks.length === 0 ? (
              <div className="text-center py-8">
                <Fuel className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No diesel tanks found</p>
                <p className="text-sm text-gray-400">
                  Create your first diesel tank to get started
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tank Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tank ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workplace</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTanks.map((tank) => (
                    <tr key={tank._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{tank.name}</div>
                        {tank.description && (
                          <div className="text-sm text-gray-500">{tank.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tank.tankId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tank.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tank.workplace || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tank.capacity}L
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditTank(tank)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit tank"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTank(tank)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete tank"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'qr' && (
          <div className="p-6">
            <QRTankGenerator tanks={filteredTanks} />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-6">
            <DieselHistory 
              workplaceFilter={isAdmin ? workplaceFilter : userWorkplace} 
              isAdmin={isAdmin}
            />
          </div>
        )}

        {activeTab === 'refills' && (
          <DieselRefillManager 
            workplaceFilter={workplaceFilter}
            isAdmin={isAdmin}
          />
        )}
      </div>
    </div>
  );
};

export default DieselConfig;

