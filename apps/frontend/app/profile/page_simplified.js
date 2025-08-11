'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, Mail, Building, Shield, Save, AlertTriangle } from 'lucide-react';
import { getOrganizationName } from '@/utils/userDataUtils';
import Layout from '@/components/Layout';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    organization: '',
    role: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Fetch user data when session is available
  useEffect(() => {
    const fetchUserData = async () => {
      if (status === 'loading') return;
      
      if (!session) {
        router.push('/login');
        return;
      }

      try {
        setLoading(true);
        
        // Get organization name using utility function
        const organizationName = getOrganizationName(session.user);
        
        // Use the session data directly instead of making an API call
        setUserData({
          name: session.user.name || '',
          email: session.user.email || '',
          organization: organizationName,
          role: session.user.role || 'user'
        });
        
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [session, status, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage('');

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
          organization: userData.organization,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      setSuccessMessage('Profile updated successfully!');

      // Update session data if needed
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage('');

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change password');
      }

      setSuccessMessage('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err.message || 'Failed to change password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && !userData.name) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Error Loading Profile</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
                <p className="text-gray-600 mt-1">Manage your account information</p>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-500 capitalize">{userData.role}</span>
              </div>
            </div>
          </div>

          {successMessage && (
            <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 text-sm">{successMessage}</p>
            </div>
          )}

          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertTriangle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleProfileUpdate} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="h-4 w-4 inline mr-1" />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={userData.name}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={userData.email}
                  className="w-full border border-gray-300 rounded-md p-2 bg-gray-50 cursor-not-allowed"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Building className="h-4 w-4 inline mr-1" />
                  Organization
                </label>
                <input
                  type="text"
                  name="organization"
                  value={userData.organization}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Your organization name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Shield className="h-4 w-4 inline mr-1" />
                  Account Status
                </label>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-green-100 text-green-800">
                    ✓ Active - Full Access
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  You have complete access to all features
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800">Change Password</h2>
            <p className="text-gray-600 mt-1">Update your account password</p>
          </div>
          
          <form onSubmit={handlePasswordUpdate} className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  minLength={6}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  minLength={6}
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Password
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

