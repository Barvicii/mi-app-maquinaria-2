'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, UserPlus, Search, Filter, RefreshCw, 
  ChevronDown, ChevronUp, Edit2, Trash2, Mail, Key,
  AlertTriangle, CheckCircle, XCircle, Shield
} from 'lucide-react';

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users' o 'requests'
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    role: '',
    status: ''
  });

  // Debug logs
  console.log('🔥 UsersPage component rendering:', {
    status,
    userRole: session?.user?.role,
    activeTab,
    usersCount: users.length,
    requestsCount: accessRequests.length
  });

  // Verificar autenticación y permisos
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      if (session.user.role !== 'SUPER_ADMIN') {
        router.push('/dashboard');
        return;
      }
      
      fetchUsers();
      fetchAccessRequests(); // También cargar solicitudes al inicio
    }
  }, [status, session, router]);

  // Efecto para cambiar entre pestañas
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'SUPER_ADMIN') {
      if (activeTab === 'users') {
        fetchUsers();
      } else if (activeTab === 'requests') {
        fetchAccessRequests();
      }
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construir URL con parámetros de filtro
      const params = new URLSearchParams();
      if (filters.name) params.append('name', filters.name);
      if (filters.email) params.append('email', filters.email);
      if (filters.role) params.append('role', filters.role);
      if (filters.status) params.append('status', filters.status);
      
      const url = `/api/users?${params.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Error loading users');
      }
      
      const data = await response.json();
      // The API returns an array of users directly
      setUsers(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again.');
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const applyFilters = () => {
    fetchUsers();
  };

  const resetFilters = () => {
    setFilters({
      name: '',
      email: '',
      role: '',
      status: ''
    });
    // Retrasar la ejecución para asegurar que se actualice el estado
    setTimeout(() => {
      fetchUsers();
    }, 0);
  };

  // Funciones para manejar solicitudes de acceso
  const fetchAccessRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/access-requests');
      
      if (!response.ok) {
        throw new Error('Error loading requests');
      }
      
      const data = await response.json();
      setAccessRequests(data.requests || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching access requests:', error);
      setError('Failed to load requests. Please try again.');
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      const response = await fetch('/api/access-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve',
          requestId
        }),
      });

      if (!response.ok) {
        throw new Error('Error approving request');
      }

      // Reload requests
      fetchAccessRequests();
      
      alert('Request approved successfully. The user received an email with their temporary password.');
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error approving request. Please try again.');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const response = await fetch('/api/access-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject',
          requestId
        }),
      });

      if (!response.ok) {
        throw new Error('Error rejecting request');
      }

      // Reload requests
      fetchAccessRequests();
      
      alert('Request rejected successfully.');
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Error rejecting request. Please try again.');
    }
  };

  // Mostrar pantalla de carga mientras verifica la sesión
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-gray-600">Verifying session...</p>
      </div>
    );
  }

  // Si ya verificó y no está autenticado o no tiene permiso, no mostrar nada (será redirigido)
  if (status === 'unauthenticated' || (status === 'authenticated' && session.user.role !== 'SUPER_ADMIN')) {
    return null;
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              User Management
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage existing users and access requests
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User size={16} className="inline mr-2" />
              Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserPlus size={16} className="inline mr-2" />
              Requests ({accessRequests.filter(req => req.status === 'pending').length})
            </button>
          </nav>
        </div>

        {/* Action buttons for active tab */}
        <div className="flex justify-end space-x-2 mb-6">
          {activeTab === 'users' && (
            <>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Filter size={16} className="mr-2" />
                Filters
                {showFilters ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
              </button>
              
              <button
                onClick={fetchUsers}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <RefreshCw size={16} className="mr-2" />
                Refresh
              </button>
            </>
          )}
          
          {activeTab === 'requests' && (
            <button
              onClick={fetchAccessRequests}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </button>
          )}
        </div>
        
        {/* Filters - Users only */}
        {activeTab === 'users' && showFilters && (
          <div className="mb-6 bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={filters.name}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Search by name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="text"
                  name="email"
                  value={filters.email}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Search by email"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  name="role"
                  value={filters.role}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All roles</option>
                  <option value="USER">User</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={resetFilters}
                className="mr-2 px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Clear
              </button>
              
              <button
                onClick={applyFilters}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
        
        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Users tab content */}
        {activeTab === 'users' && (
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="border-b border-gray-200 px-4 py-5 sm:px-6 bg-gray-50">
              <h2 className="text-lg font-medium text-gray-900">
                Organization Users
              </h2>
            </div>
          
          {loading ? (
            <div className="p-6 flex justify-center">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
                <p className="text-gray-500">Loading users...</p>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="p-6 text-center">
              <User className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">
                No users to display
              </p>
              <div className="mt-4">
                <Link
                  href="/admin/invitations/create"
                  className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <UserPlus size={16} className="mr-2" />
                  Invite User
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Access
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead><tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name || 'No name'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td><td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Shield size={16} className="mr-1 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {user.role === 'ADMIN' ? 'Administrator' :
                             user.role === 'MANAGER' ? 'Manager' :
                             user.role === 'USER' ? 'User' :
                             user.role === 'TECHNICIAN' ? 'Technician' :
                             user.role === 'OPERATOR' ? 'Operator' :
                             user.role}
                          </span>
                        </div>
                      </td><td className="px-6 py-4 whitespace-nowrap">
                        {user.active ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                      </td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                      </td><td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => router.push(`/users/${user.id}/edit`)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit user"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => router.push(`/users/${user.id}/reset-password`)}
                            className="text-amber-600 hover:text-amber-900"
                            title="Reset password"
                          >
                            <Key size={16} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to ${user.active ? 'deactivate' : 'activate'} this user?`)) {
                                // Implement in a later version
                                alert(`${user.active ? 'Deactivate' : 'Activate'} ${user.name}`);
                              }
                            }}
                            className={user.active ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                            title={user.active ? "Deactivate user" : "Activate user"}
                          >
                            {user.active ? <XCircle size={16} /> : <CheckCircle size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody></table>
            </div>
          )}
          </div>
        )}

        {/* Requests tab content */}
        {activeTab === 'requests' && (
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="border-b border-gray-200 px-4 py-5 sm:px-6 bg-gray-50">
              <h2 className="text-lg font-medium text-gray-900">
                Access Requests
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Review and manage system access requests
              </p>
            </div>
            
            {loading ? (
              <div className="p-6 flex justify-center">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
                  <p className="text-gray-500">Loading requests...</p>
                </div>
              </div>
            ) : accessRequests.length === 0 ? (
              <div className="p-6 text-center">
                <UserPlus className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">
                  No pending requests
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applicant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Request Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead><tbody className="bg-white divide-y divide-gray-200">
                    {accessRequests.map((request) => (
                      <tr key={request.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-8 w-8 text-gray-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {request.contactName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.email}
                              </div>
                              {request.phone && (
                                <div className="text-sm text-gray-500">
                                  {request.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </td><td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {request.organizationName}
                          </div>
                        </td><td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(request.createdAt).toLocaleDateString('en-US')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(request.createdAt).toLocaleTimeString('en-US')}
                          </div>
                        </td><td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            request.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800'
                              : request.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {request.status === 'pending' && 'Pending'}
                            {request.status === 'approved' && 'Approved'}
                            {request.status === 'rejected' && 'Rejected'}
                          </span>
                        </td><td className="px-6 py-4 whitespace-nowrap">
                          {request.status === 'pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleApproveRequest(request.id)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle size={14} className="mr-1" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectRequest(request.id)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                              >
                                <XCircle size={14} className="mr-1" />
                                Reject
                              </button>
                            </div>
                          )}
                          {request.status !== 'pending' && (
                            <div className="text-sm text-gray-500">
                              {request.status === 'approved' && `Approved on ${new Date(request.approvedAt).toLocaleDateString('en-US')}`}
                              {request.status === 'rejected' && `Rejected on ${new Date(request.rejectedAt).toLocaleDateString('en-US')}`}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody></table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
