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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState(null);
  const [orgToSuspend, setOrgToSuspend] = useState(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    maxUsers: 10,
    adminName: '',
    adminEmail: '',
    isMultiUser: true // Nueva opción para determinar si será multi-usuario
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
          adminEmail: '',
          isMultiUser: true
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

  const handleDeleteOrganization = async () => {
    if (!orgToDelete) return;

    try {
      const response = await fetch(`/api/organizations-native/${orgToDelete._id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setShowDeleteModal(false);
        setOrgToDelete(null);
        fetchOrganizations();
      } else {
        setError(data.error || 'Error deleting organization');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  const openDeleteModal = (org) => {
    setOrgToDelete(org);
    setShowDeleteModal(true);
  };

  const canDeleteOrganization = (org) => {
    return org.currentUserCount === 0;
  };

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (org.adminId?.name && org.adminId.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (org.adminId?.email && org.adminId.email.toLowerCase().includes(searchTerm.toLowerCase()))
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
            placeholder="Search by organization name, admin name or email..."
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
                    className="text-blue-600 hover:text-blue-800 p-1 rounded"
                    title="Edit organization"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openDeleteModal(org)}
                    disabled={!canDeleteOrganization(org)}
                    className={`p-1 rounded ${
                      canDeleteOrganization(org)
                        ? 'text-red-600 hover:text-red-800'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                    title={
                      canDeleteOrganization(org)
                        ? 'Delete organization'
                        : `Cannot delete: has ${org.currentUserCount} users assigned`
                    }
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {(org.isMultiUser !== false && org.maxUsers !== 1) ? 'Administrator:' : 'User:'}
                    </span>
                    <span className="text-sm font-medium">{org.adminId?.name || 'N/A'}</span>
                  </div>
                  {org.adminId?.email && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 pl-4">Email:</span>
                      <span className="text-sm text-gray-600">{org.adminId.email}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Type:</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    (org.isMultiUser !== false && org.maxUsers !== 1) 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {(org.isMultiUser !== false && org.maxUsers !== 1) ? 'Multi-user' : 'Single user'}
                  </span>
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
                      {org.active ? 'Active' : 'Inactive'}
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
                  Description
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>

              {/* Nueva sección para seleccionar tipo de organización */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Type
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="orgType"
                      checked={createForm.isMultiUser}
                      onChange={() => setCreateForm({...createForm, isMultiUser: true, maxUsers: 10})}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      <strong>Multi-user:</strong> Organization will have an administrator and regular users
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="orgType"
                      checked={!createForm.isMultiUser}
                      onChange={() => setCreateForm({...createForm, isMultiUser: false, maxUsers: 1})}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      <strong>Single user:</strong> Only one person will use this organization
                    </span>
                  </label>
                </div>
              </div>

              {createForm.isMultiUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Users
                  </label>
                  <input
                    type="number"
                    min="2"
                    value={createForm.maxUsers}
                    onChange={(e) => setCreateForm({...createForm, maxUsers: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 2 users for multi-user organizations (1 admin + 1 regular user)
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {createForm.isMultiUser ? 'Administrator Name *' : 'User Name *'}
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
                  {createForm.isMultiUser ? 'Administrator Email *' : 'User Email *'}
                </label>
                <input
                  type="email"
                  required
                  value={createForm.adminEmail}
                  onChange={(e) => setCreateForm({...createForm, adminEmail: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {!createForm.isMultiUser && (
                  <p className="text-xs text-gray-500 mt-1">
                    This user will be created as USER (regular user) since it&apos;s a single-user organization
                  </p>
                )}
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

      {/* Delete Organization Confirmation Modal */}
      {showDeleteModal && orgToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mr-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Confirm Deletion</h2>
                <p className="text-gray-600 text-sm">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete this organization?
              </p>
              <div className="bg-gray-50 rounded-lg p-3 border">
                <p className="font-semibold text-gray-900">{orgToDelete.name}</p>
                <p className="text-sm text-gray-600">
                  {(orgToDelete.isMultiUser !== false && orgToDelete.maxUsers !== 1) ? 'Administrator' : 'User'}: {orgToDelete.adminId?.name || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  Type: {(orgToDelete.isMultiUser !== false && orgToDelete.maxUsers !== 1) ? 'Multi-user' : 'Single user'}
                </p>
                <p className="text-sm text-gray-600">
                  {orgToDelete.currentUserCount} users • {orgToDelete.machinesCount || 0} machines
                </p>
              </div>
              
              {/* Mostrar advertencia si tiene usuarios */}
              {orgToDelete.currentUserCount > 0 ? (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                    <p className="text-red-700 text-sm font-medium">
                      Cannot delete this organization
                    </p>
                  </div>
                  <p className="text-red-600 text-sm">
                    The organization has <strong>{orgToDelete.currentUserCount} user(s)</strong> assigned. 
                    You must remove all users before you can delete it.
                  </p>
                  <div className="mt-2">
                    <p className="text-sm text-red-600">
                      • Go to the Users section
                    </p>
                    <p className="text-sm text-red-600">
                      • Reassign or remove users from this organization
                    </p>
                    <p className="text-sm text-red-600">
                      • Then you can delete the organization
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                    <p className="text-red-700 text-sm font-medium">
                      Warning: All associated data will be deleted
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                {orgToDelete.currentUserCount > 0 ? 'Understood' : 'Cancel'}
              </button>
              {orgToDelete.currentUserCount === 0 && (
                <button
                  type="button"
                  onClick={handleDeleteOrganization}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationManagement;
