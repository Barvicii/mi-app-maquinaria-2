import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Building2, 
  Users, 
  Settings, 
  Plus, 
  Edit3, 
  Trash2, 
  Search,
  Filter,
  Eye,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const OrganizationManagement = () => {
  const { data: session } = useSession();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    maxUsers: 10,
    adminName: '',
    adminEmail: ''
  });

  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    maxUsers: 10
  });

  useEffect(() => {
    if (session?.user?.role === 'SUPER_ADMIN') {
      fetchOrganizations();
    }
  }, [session]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      
      console.log('🔄 Fetching organizations...');
      const response = await fetch('/api/organizations-native');
      
      console.log('📊 Response status:', response.status);
      console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Check if response has content
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Expected JSON response but got ${contentType || 'unknown content type'}`);
      }

      // Check if response body is empty
      const text = await response.text();
      if (!text || text.trim() === '') {
        throw new Error('Empty response from server');
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('📊 Raw response text:', text);
        throw new Error(`Invalid JSON response: ${parseError.message}`);
      }
      
      console.log('📊 Response data:', data);

      if (response.ok && data.success) {
        setOrganizations(data.organizations || []);
        console.log('✅ Organizations loaded successfully');
      } else {
        const errorMsg = data.error || `Error ${response.status}: ${response.statusText}`;
        console.error('❌ API Error:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('❌ Connection Error:', err);
      setError(`Error de conexión: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/organizations-native', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateModal(false);
        setCreateForm({
          name: '',
          description: '',
          maxUsers: 10,
          adminName: '',
          adminEmail: ''
        });
        fetchOrganizations();
      } else {
        setError(data.error || 'Error creating organization');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  const handleUpdateOrganization = async (e) => {
    e.preventDefault();
    if (!selectedOrg) return;

    try {
      const response = await fetch(`/api/organizations-native/${selectedOrg._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();

      if (data.success) {
        setShowEditModal(false);
        setSelectedOrg(null);
        fetchOrganizations();
      } else {
        setError(data.error || 'Error updating organization');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  const openEditModal = (org) => {
    setSelectedOrg(org);
    setEditForm({
      name: org.name,
      description: org.description || '',
      maxUsers: org.maxUsers
    });
    setShowEditModal(true);
  };

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.adminId?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (session?.user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Denegado</h2>
        <p className="text-gray-600">Solo los Super Administradores pueden acceder a esta sección.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Building2 className="w-6 h-6 mr-3 text-blue-600" />
            Organization Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage all system organizations
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Organization
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Organizations Grid */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading organizations...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrganizations.map((org) => (
            <div key={org._id} className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{org.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{org.description || 'Sin descripción'}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(org)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Administrator:</span>
                  <span className="text-sm font-medium">{org.adminId?.name}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Users:</span>
                  <span className={`text-sm font-medium ${
                    org.currentUserCount >= org.maxUsers ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {org.currentUserCount} / {org.maxUsers}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Machines:</span>
                  <span className="text-sm font-medium">{org.machinesCount || 0}</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      (org.currentUserCount / org.maxUsers) >= 0.8 ? 'bg-red-500' :
                      (org.currentUserCount / org.maxUsers) >= 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((org.currentUserCount / org.maxUsers) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Status */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {org.active ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                    )}
                    <span className={`text-sm ${org.active ? 'text-green-600' : 'text-red-600'}`}>
                      {org.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Organization Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">New Organization</h2>
            <form onSubmit={handleCreateOrganization} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Users
                </label>
                <input
                  type="number"
                  min="1"
                  value={createForm.maxUsers}
                  onChange={(e) => setCreateForm({...createForm, maxUsers: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Administrator Name *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.adminName}
                  onChange={(e) => setCreateForm({...createForm, adminName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email del Administrador *
                </label>
                <input
                  type="email"
                  required
                  value={createForm.adminEmail}
                  onChange={(e) => setCreateForm({...createForm, adminEmail: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Organization Modal */}
      {showEditModal && selectedOrg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Organization</h2>
            <form onSubmit={handleUpdateOrganization} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Users
                </label>
                <input
                  type="number"
                  min={selectedOrg.currentUserCount}
                  value={editForm.maxUsers}
                  onChange={(e) => setEditForm({...editForm, maxUsers: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum: {selectedOrg.currentUserCount} (current users)
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationManagement;
