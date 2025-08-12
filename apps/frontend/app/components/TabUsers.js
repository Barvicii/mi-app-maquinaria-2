'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  Edit2,
  Trash2,
  UserPlus,
  Search,
  Filter,
  Shield,
  X,
  Check,
  Save,
  Ban,
  CheckCircle,
  User,
  XCircle,
  Mail
} from 'lucide-react';
import { useUserLimit } from '../hooks/useUserLimit';
import UserLimitModal from './UserLimitModal';

const TabUsers = () => {
  const { data: session } = useSession();
  const [users, setUsers] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users' o 'requests'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showSuspensionModal, setShowSuspensionModal] = useState(false);
  const [showUserLimitModal, setShowUserLimitModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [suspendingUser, setSuspendingUser] = useState(null);
  const [suspensionLoading, setSuspensionLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'USER', password: '', confirmPassword: '', workplaceName: '' });
  const [suspensionFormData, setSuspensionFormData] = useState({ reason: '', details: '' });
  const [sendInvitation, setSendInvitation] = useState(false);

  // User limit hook - only for non-super admins
  const { 
    limitInfo, 
    canAddUsers, 
    isAtLimit, 
    checkUserLimit,
    loading: limitLoading 
  } = useUserLimit();

  // Define roles simplificados
  const roles = useMemo(() => {
    const baseRoles = ['USER'];
    if (session?.user?.role === 'SUPER_ADMIN') {
      baseRoles.push('SUPER_ADMIN');
    }
    return baseRoles;
  }, [session?.user?.role]);

  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  // Fetch users from the server
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error(`Error fetching users: ${res.status}`);
      setUsers(await res.json());
      
      // Update user limit info for non-super admins
      if (!isSuperAdmin && (session?.user?.organizationId || session?.user?.organization)) {
        await checkUserLimit();
      }
    } catch (e) {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, session?.user?.organizationId, session?.user?.organization, checkUserLimit]);

  useEffect(() => {
    fetchUsers();
    // Also check user limits when component mounts
    if (!isSuperAdmin) {
      checkUserLimit();
    }
  }, [fetchUsers, isSuperAdmin, checkUserLimit]);

  // Auto-refresh user limits when user count changes
  useEffect(() => {
    if (!isSuperAdmin && users.length > 0) {
      checkUserLimit();
    }
  }, [users.length, isSuperAdmin, checkUserLimit]);

  // Efecto para cambiar entre pestañas
  useEffect(() => {
    // Si no es SUPER_ADMIN y está en requests, redirigir a users
    if (activeTab === 'requests' && !isSuperAdmin) {
      setActiveTab('users');
      return;
    }
    
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'requests') {
      fetchAccessRequests();
    }
  }, [activeTab, isSuperAdmin, fetchUsers]);

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
      // Reload users since a new user was created
      fetchUsers();
      
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

  // Filter users based on search term and user permissions
  const filteredUsers = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    
    let filteredByPermission = users;
    
    // Si el usuario es ADMIN (no SUPER_ADMIN), solo mostrar usuarios de su organización
    // y excluir a los SUPER_ADMIN
    if (session?.user?.role === 'ADMIN') {
      const currentUserOrg = session?.user?.company || session?.user?.organization;
      filteredByPermission = users.filter(user => {
        // Excluir SUPER_ADMIN
        if (user.role === 'SUPER_ADMIN') return false;
        
        // Incluir solo usuarios de la misma organización
        const userOrg = user.company || user.organization;
        return userOrg === currentUserOrg;
      });
    }
    
    // Aplicar filtro de búsqueda
    return filteredByPermission.filter(user => 
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.role?.toLowerCase().includes(searchLower) ||
      user.company?.toLowerCase().includes(searchLower)
    );
  }, [users, searchTerm, session?.user?.role, session?.user?.company, session?.user?.organization]);

  // Event handlers
  const handleSearch = e => setSearchTerm(e.target.value);

  const handleAddNewUser = async () => {
    // For super admins, skip user limit check
    if (session?.user?.role === 'SUPER_ADMIN') {
      setSelectedUser(null);
      setFormData({ name: '', email: '', role: 'USER', password: '', confirmPassword: '', workplaceName: '' });
      setSendInvitation(false);
      setError(null);
      setSuccess(null);
      setShowModal(true);
      return;
    }

    // For regular admins, check user limit
    try {
      const currentLimit = await checkUserLimit();
      
      if (currentLimit && !currentLimit.canAddUsers) {
        // Show limit reached modal
        setShowUserLimitModal(true);
        return;
      }

      // Proceed with adding user
      setSelectedUser(null);
      setFormData({ name: '', email: '', role: 'USER', password: '', confirmPassword: '', workplaceName: '' });
      setSendInvitation(false);
      setError(null);
      setSuccess(null);
      setShowModal(true);
      
    } catch (error) {
      console.error('Error checking user limit:', error);
      setError('Failed to verify user limit. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSendInvitation(false);
    setError(null);
  };

  const handleEditUser = user => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'USER',
      password: '',
      confirmPassword: '',
      workplaceName: user.workplace || ''
    });
    setError(null);
    setSuccess(null);
    setShowModal(true);
    setShowModal(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.role || !formData.workplaceName) {
      setError('Please fill all required fields');
      return;
    }
    
    // Password validation for new users (only if not sending invitation)
    if (!selectedUser && !sendInvitation && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      const isEditing = !!selectedUser;
      
      // For new users with invitation, use the invitation endpoint
      if (!isEditing && sendInvitation) {
        const response = await fetch('/api/admin/users/create-with-invitation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            role: formData.role,
            workplaceName: formData.workplaceName
          })
        });

        if (!response.ok) {
          let errorMessage = 'Failed to create user and send invitation';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (jsonError) {
            errorMessage = `Server error: ${response.status} ${response.statusText || ''}`;
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        
        handleCloseModal();
        setSuccess(`User ${formData.name} created successfully. Invitation email sent to ${formData.email}.`);
        
        // Clear success message after 7 seconds (longer for invitation)
        setTimeout(() => setSuccess(null), 7000);
        
        fetchUsers(); // Refresh user list
        if (!isSuperAdmin) {
          checkUserLimit(); // Update user limit counter
        }
        return;
      }
      
      // For editing users, handle password change separately
      if (isEditing && formData.password && formData.password.trim() !== '') {
        // First update the password using the admin endpoint
        const passwordResponse = await fetch(`/api/admin/users/${selectedUser._id}/change-password`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            newPassword: formData.password
          })
        });

        if (!passwordResponse.ok) {
          let errorMessage = 'Failed to update password';
          try {
            const errorData = await passwordResponse.json();
            errorMessage = errorData.error || errorMessage;
          } catch (jsonError) {
            errorMessage = `Server error: ${passwordResponse.status} ${passwordResponse.statusText || ''}`;
          }
          throw new Error(errorMessage);
        }

        console.log('✅ Password updated successfully');
      }
      
      // Now update other user data (excluding password)
      const url = isEditing ? `/api/users/${selectedUser._id}` : '/api/users';
      const method = isEditing ? 'PUT' : 'POST';
      
      const dataToSend = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        workplaceName: formData.workplaceName
      };
      
      // For new users (not invitation), include password in the main request
      if (!isEditing && formData.password) {
        dataToSend.password = formData.password;
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });
      
      if (!response.ok) {
        // Intentar obtener un mensaje de error del JSON
        let errorMessage = 'Failed to save user';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          // Si hay un error al analizar JSON, usar el código de estado HTTP
          errorMessage = `Server error: ${response.status} ${response.statusText || ''}`;
        }
        throw new Error(errorMessage);
      }
      
      // Success!
      const hadPasswordChange = isEditing && formData.password && formData.password.trim() !== '';
      
      handleCloseModal();
      
      if (hadPasswordChange) {
        setSuccess(`User ${formData.name || selectedUser?.name} updated successfully. Password has been changed.`);
      } else if (isEditing) {
        setSuccess(`User ${formData.name || selectedUser?.name} updated successfully.`);
      } else {
        setSuccess(`User ${formData.name} created successfully.`);
      }
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
      
      fetchUsers(); // Refresh user list
      if (!isSuperAdmin) {
        checkUserLimit(); // Update user limit counter
      }
    } catch (error) {
      console.error('Error saving user:', error);
      setError(error.message || 'Failed to save user');
      setSuccess(null);
    }
  };

  const handleDeleteUser = async userId => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
      
      fetchUsers(); // Refresh user list
      // No need to call checkUserLimit manually since it will be triggered by the useEffect when users.length changes
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error.message || 'Failed to delete user');
    }
  };

  const handleSuspendOrganization = user => {
    const organization = user.company || user.organization;
    if (!organization) {
      setError('User does not belong to any organization');
      return;
    }

    setSuspendingUser(user);
    setSuspensionFormData({
      reason: '',
      details: ''
    });
    setShowSuspensionModal(true);
  };

  const processSuspension = async () => {
    if (!suspendingUser) return;

    const organization = suspendingUser.company || suspendingUser.organization;
    const action = suspendingUser.organizationSuspended ? 'unsuspend' : 'suspend';
    
    // Validation for suspension (not unsuspension)
    if (!suspendingUser.organizationSuspended && !suspensionFormData.reason.trim()) {
      setError('Please provide a reason for the suspension');
      return;
    }

    try {
      setSuspensionLoading(true);
      
      const response = await fetch('/api/organizations/suspend', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization,
          suspend: !suspendingUser.organizationSuspended,
          reason: suspensionFormData.reason,
          details: suspensionFormData.details
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} organization`);
      }
      
      setShowSuspensionModal(false);
      setSuspendingUser(null);
      fetchUsers(); // Refresh user list
      checkUserLimit(); // Update user limit counter
    } catch (error) {
      console.error(`Error ${action}ing organization:`, error);
      setError(error.message || `Failed to ${action} organization`);
    } finally {
      setSuspensionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">User Management</h2>
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
            Users
          </button>
          {isSuperAdmin && (
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
          )}
        </nav>
      </div>

      {/* Action buttons for active tab */}
      <div className="flex justify-end space-x-2 mb-6">
        {activeTab === 'users' && (
          <div className="flex items-center space-x-3">
            {/* User limit info for non-super admins */}
            {!isSuperAdmin && limitInfo && (
              <div className="text-sm text-gray-600">
                <span className={`font-medium ${isAtLimit ? 'text-red-600' : 'text-green-600'}`}>
                  {limitInfo.currentUserCount}/{limitInfo.maxUsers} users
                </span>
                {isAtLimit && (
                  <span className="text-red-600 ml-2">• Limit reached</span>
                )}
              </div>
            )}
            {!isSuperAdmin && !limitInfo && (
              <div className="text-sm text-gray-400">
                Loading user limits...
              </div>
            )}
            
            <button 
              onClick={handleAddNewUser}
              disabled={!isSuperAdmin && isAtLimit}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                !isSuperAdmin && isAtLimit
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              title={!isSuperAdmin && isAtLimit ? 'User limit reached. Contact super admin to increase limit.' : ''}
            >
              <UserPlus className="mr-2" size={16} />
              {!isSuperAdmin && isAtLimit ? 'Limit Reached' : 'Add New User'}
            </button>
          </div>
        )}
        
        {activeTab === 'requests' && (
          <button
            onClick={fetchAccessRequests}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <CheckCircle size={16} className="mr-2" />
            Refresh
          </button>
        )}
      </div>
      
      {/* Users tab content */}
      {activeTab === 'users' && (
        <>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <X className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button onClick={() => setError(null)} className="text-red-500 hover:text-red-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Check className="h-5 w-5 text-green-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search users..."
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workplace</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead><tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map(user => (
              <tr key={user._id} className={`hover:bg-gray-50 ${user.organizationSuspended ? 'bg-red-50 border-l-4 border-red-400' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{user.name || 'N/A'}</div>
                </td><td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td><td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {user.role || 'USER'}
                  </span>
                </td><td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.workplace || 'N/A'}</div>
                </td><td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.company || user.organization || 'N/A'}</div>
                </td><td className="px-6 py-4 whitespace-nowrap">
                  {user.organizationSuspended ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      <Ban className="w-3 h-3 mr-1" />
                      Org. Suspended
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </span>
                  )}
                </td><td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                  </div>
                </td><td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => handleEditUser(user)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                    disabled={user.organizationSuspended}
                  >
                    <Edit2 size={16} className={user.organizationSuspended ? "opacity-30" : ""} />
                  </button>
                    {isSuperAdmin && (user.company || user.organization) && (
                    <button 
                      onClick={() => handleSuspendOrganization(user)}
                      className={`mr-3 ${user.organizationSuspended ? 'text-green-600 hover:text-green-900' : 'text-orange-600 hover:text-orange-900'}`}
                      title={user.organizationSuspended ? 'Unsuspend Organization' : 'Suspend Organization'}
                      disabled={suspensionLoading}
                    >
                      {suspensionLoading && suspendingUser?._id === user._id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-orange-500"></div>
                      ) : user.organizationSuspended ? (
                        <CheckCircle size={16} />
                      ) : (
                        <Ban size={16} />
                      )}
                    </button>
                  )}
                  
                  <button 
                    onClick={() => handleDeleteUser(user._id)}
                    className="text-red-600 hover:text-red-900"
                    disabled={user._id === session?.user?.id}
                  >
                    <Trash2 size={16} className={user._id === session?.user?.id ? "opacity-30" : ""} />
                  </button>
                </td>
              </tr>
            ))}
              {filteredUsers.length === 0 && (
              <tr><td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                  No users found
                </td></tr>
            )}
          </tbody></table>
      </div>
        </>
      )}

      {/* Requests tab content */}
      {activeTab === 'requests' && (
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="border-b border-gray-200 px-4 py-5 sm:px-6 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">
              Access Requests
            </h3>
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

      {/* User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedUser ? 'Edit User' : 'Add New User'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                    readOnly={!!selectedUser}
                  />
                  {selectedUser && (
                    <p className="mt-1 text-xs text-gray-500">Email cannot be changed once created.</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="workplaceName" className="block text-sm font-medium text-gray-700">
                    Workplace Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="workplaceName"
                    name="workplaceName"
                    value={formData.workplaceName}
                    onChange={e => setFormData({ ...formData, workplaceName: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                    placeholder="Enter workplace name"
                  />
                </div>
                
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    {roles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                
                {/* Invitation checkbox (only for new users) */}
                {!selectedUser && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="sendInvitation"
                          name="sendInvitation"
                          type="checkbox"
                          checked={sendInvitation}
                          onChange={e => setSendInvitation(e.target.checked)}
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="sendInvitation" className="font-medium text-blue-900">
                          Send invitation email
                        </label>
                        <p className="text-blue-700">
                          Automatically generate a secure password and send an invitation email to the user.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Password fields (hidden when sending invitation) */}
                {(!sendInvitation || selectedUser) && (
                  <>
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password {!selectedUser && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required={!selectedUser && !sendInvitation}
                        minLength={6}
                      />
                      {selectedUser && (
                        <p className="mt-1 text-xs text-blue-600">
                          <strong>Super Admin:</strong> Enter new password to change it, or leave blank to keep current password.
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                        Confirm Password {!selectedUser && !sendInvitation && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required={!selectedUser && !sendInvitation}
                        minLength={6}
                      />
                    </div>
                  </>
                )}
              </div>
              
              <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {selectedUser ? (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Update User
                    </>
                  ) : sendInvitation ? (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Create & Send Invitation
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create User
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>          </div>
        </div>
      )}

      {/* Suspension Modal */}
      {showSuspensionModal && suspendingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                {suspendingUser.organizationSuspended ? 'Unsuspend Organization' : 'Suspend Organization'}
              </h3>
              <button 
                onClick={() => setShowSuspensionModal(false)} 
                className="text-gray-400 hover:text-gray-500"
                disabled={suspensionLoading}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="px-6 py-4">
              <div className="mb-4">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Shield className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        {suspendingUser.organizationSuspended ? (
                          <>You are about to <strong>unsuspend</strong> the organization &ldquo;<strong>{suspendingUser.company || suspendingUser.organization}</strong>&rdquo;. All users in this organization will regain access to the system.</>
                        ) : (
                          <>You are about to <strong>suspend</strong> the organization &ldquo;<strong>{suspendingUser.company || suspendingUser.organization}</strong>&rdquo;. All users in this organization will be immediately logged out and unable to access the system.</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {!suspendingUser.organizationSuspended && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                      Reason for Suspension <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="reason"
                      value={suspensionFormData.reason}
                      onChange={e => setSuspensionFormData(prev => ({ ...prev, reason: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                      required
                      disabled={suspensionLoading}
                    >
                      <option value="">Select a reason...</option>
                      <option value="Payment Issues">Payment Issues</option>
                      <option value="Terms of Service Violation">Terms of Service Violation</option>
                      <option value="Security Concerns">Security Concerns</option>
                      <option value="Fraudulent Activity">Fraudulent Activity</option>
                      <option value="Administrative Review">Administrative Review</option>
                      <option value="Contract Violation">Contract Violation</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="details" className="block text-sm font-medium text-gray-700">
                      Additional Details
                    </label>
                    <textarea
                      id="details"
                      rows={3}
                      value={suspensionFormData.details}
                      onChange={e => setSuspensionFormData(prev => ({ ...prev, details: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                      placeholder="Provide additional context or details about the suspension..."
                      disabled={suspensionLoading}
                    />
                  </div>
                </div>
              )}

              {suspendingUser.organizationSuspended && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <p className="text-sm text-green-700">
                    Unsuspending this organization will restore access for all users and remove any suspension restrictions.
                  </p>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowSuspensionModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={suspensionLoading}
              >
                Cancel
              </button>
              <button
                onClick={processSuspension}
                disabled={suspensionLoading || (!suspendingUser.organizationSuspended && !suspensionFormData.reason.trim())}
                className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  suspendingUser.organizationSuspended 
                    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                    : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                }`}
              >
                {suspensionLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : suspendingUser.organizationSuspended ? (
                  'Unsuspend Organization'
                ) : (
                  'Suspend Organization'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Limit Modal */}
      <UserLimitModal
        isOpen={showUserLimitModal}
        onClose={() => setShowUserLimitModal(false)}
        limitInfo={limitInfo}
        organizationName={limitInfo?.name || 'your organization'}
      />
    </div>
  );
};

export default TabUsers;