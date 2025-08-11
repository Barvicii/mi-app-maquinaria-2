import { useState, useCallback } from 'react';

export const useUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/users');
      
      if (!response.ok) {
        throw new Error(`Error fetching users: ${response.status}`);
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    users,
    setUsers,
    loading,
    error,
    fetchUsers,
    clearError
  };
};

export const useUserForm = (selectedUser, onSuccess) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'USER',
    password: '',
    confirmPassword: ''
  });

  const resetForm = useCallback((user = null) => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || 'USER',
      password: '',
      confirmPassword: ''
    });
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const validateForm = useCallback(() => {
    if (!formData.name || !formData.email || !formData.role) {
      return 'Please fill all required fields';
    }
    
    if (!selectedUser && formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    
    return null;
  }, [formData, selectedUser]);

  const submitForm = useCallback(async () => {
    const validationError = validateForm();
    if (validationError) {
      throw new Error(validationError);
    }

    const isEditing = !!selectedUser;
    const url = isEditing ? `/api/users/${selectedUser._id}` : '/api/users';
    const method = isEditing ? 'PUT' : 'POST';
    
    const dataToSend = {
      name: formData.name,
      email: formData.email,
      role: formData.role
    };
    
    if (formData.password && (!isEditing || formData.password.trim() !== '')) {
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
      let errorMessage = 'Failed to save user';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (jsonError) {
        errorMessage = `Server error: ${response.status} ${response.statusText || ''}`;
      }
      throw new Error(errorMessage);
    }

    if (onSuccess) {
      onSuccess();
    }
  }, [formData, selectedUser, validateForm, onSuccess]);

  return {
    formData,
    handleInputChange,
    resetForm,
    submitForm
  };
};

export const useSuspensionManagement = (onSuccess) => {
  const [suspendingUser, setSuspendingUser] = useState(null);
  const [suspensionLoading, setSuspensionLoading] = useState(false);
  const [suspensionFormData, setSuspensionFormData] = useState({
    reason: '',
    details: ''
  });

  const initiateSuspension = useCallback((user) => {
    const organization = user.company || user.organization;
    if (!organization) {
      throw new Error('User does not belong to any organization');
    }

    setSuspendingUser(user);
    setSuspensionFormData({
      reason: '',
      details: ''
    });
  }, []);

  const updateSuspensionForm = useCallback((field, value) => {
    setSuspensionFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const processSuspension = useCallback(async () => {
    if (!suspendingUser) return;

    const organization = suspendingUser.company || suspendingUser.organization;
    const action = suspendingUser.organizationSuspended ? 'unsuspend' : 'suspend';
    
    // Validation for suspension (not unsuspension)
    if (!suspendingUser.organizationSuspended && !suspensionFormData.reason.trim()) {
      throw new Error('Please provide a reason for the suspension');
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
      
      setSuspendingUser(null);
      if (onSuccess) {
        onSuccess();
      }
    } finally {
      setSuspensionLoading(false);
    }
  }, [suspendingUser, suspensionFormData, onSuccess]);

  const cancelSuspension = useCallback(() => {
    setSuspendingUser(null);
    setSuspensionFormData({ reason: '', details: '' });
  }, []);

  return {
    suspendingUser,
    suspensionLoading,
    suspensionFormData,
    initiateSuspension,
    updateSuspensionForm,
    processSuspension,
    cancelSuspension
  };
};
