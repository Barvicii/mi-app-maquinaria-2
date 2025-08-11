'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Settings, 
  Bell, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  PlayCircle,
  Save,
  Plus,
  Trash2,
  Info
} from 'lucide-react';
import Notification from '@/components/Notification';

const AlertSettings = () => {
  const { data: session } = useSession();
  const [schedulerStatus, setSchedulerStatus] = useState(null);
  const [emailSettings, setEmailSettings] = useState({
    emails: [''],
    enablePrestartAlerts: true,
    enableServiceAlerts: true
  });
  const [savedEmails, setSavedEmails] = useState([]); // Emails guardados en el servidor
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState({});
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  // Load initial data
  useEffect(() => {
    fetchSchedulerStatus();
    fetchEmailSettings();
  }, []);

  // Debug: Log email settings changes
  useEffect(() => {
    console.log('emailSettings state changed:', emailSettings);
    console.log('savedEmails state changed:', savedEmails);
  }, [emailSettings, savedEmails]);

  // Fetch scheduler status
  const fetchSchedulerStatus = async () => {
    try {
      const response = await fetch('/api/alerts/scheduler-status');
      if (response.ok) {
        const data = await response.json();
        setSchedulerStatus(data);
      }
    } catch (error) {
      console.error('Error fetching scheduler status:', error);
    }
  };

  // Fetch email settings
  const fetchEmailSettings = async () => {
    try {
      console.log('Fetching email settings...');
      const response = await fetch('/api/alerts/email-settings');
      if (response.ok) {
        const data = await response.json();
        console.log('Email settings fetched from server:', data);
        
        // Separar emails guardados de campos de entrada
        const serverEmails = (data.emails || []).filter(email => email && email.trim() !== '');
        setSavedEmails(serverEmails);
        
        const settingsToUpdate = {
          emails: [''], // Siempre empezar con un campo vacío para nuevos emails
          enablePrestartAlerts: data.enablePrestartAlerts ?? true,
          enableServiceAlerts: data.enableServiceAlerts ?? true
        };
        
        console.log('Setting email settings to:', settingsToUpdate);
        setEmailSettings(settingsToUpdate);
      } else {
        console.error('Failed to fetch email settings:', response.status);
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching email settings:', error);
      // Set default values if fetch fails
      setSavedEmails([]);
      setEmailSettings({
        emails: [''],
        enablePrestartAlerts: true,
        enableServiceAlerts: true
      });
    }
  };

  // Save email settings
  const saveEmailSettings = async () => {
    try {
      setLoading(prev => ({ ...prev, saveSettings: true }));
      
      // Combinar emails guardados existentes con los nuevos emails válidos del formulario
      const newEmails = emailSettings.emails.filter(email => email && email.trim() !== '');
      const allEmails = [...savedEmails, ...newEmails];
      const uniqueEmails = [...new Set(allEmails)]; // Eliminar duplicados
      
      const dataToSend = {
        ...emailSettings,
        emails: uniqueEmails
      };
      
      console.log('Saving email settings:', dataToSend);
      
      const response = await fetch('/api/alerts/email-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Settings saved successfully:', data);
      
      // Actualizar emails guardados y limpiar campos de entrada
      setSavedEmails(uniqueEmails);
      setEmailSettings(prev => ({
        ...prev,
        emails: [''] // Limpiar campos después de guardar
      }));
      
      const message = uniqueEmails.length > 0 
        ? 'Email settings saved successfully' 
        : 'Settings saved - email notifications disabled';
      showNotification(message, 'success');
      
    } catch (error) {
      console.error('Error saving email settings:', error);
      showNotification(`Failed to save email settings: ${error.message}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, saveSettings: false }));
    }
  };

  // Run test
  const runTest = async (testType, testName) => {
    try {
      setLoading(prev => ({ ...prev, [testType]: true }));
      
      const response = await fetch('/api/alerts/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testType }),
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      const data = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        [testType]: data
      }));
      
      showNotification(`${testName} completed successfully`, 'success');
      
    } catch (error) {
      console.error(`Error running ${testName}:`, error);
      showNotification(`Failed to run ${testName}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, [testType]: false }));
    }
  };

  // Control scheduler (removed - admin only functionality)
  // const controlScheduler = async (action) => {
  //   This functionality is now admin-only and handled in admin panel
  // };

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({
      show: true,
      message,
      type
    });
    
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  // Add email field
  const addEmailField = () => {
    setEmailSettings(prev => ({
      ...prev,
      emails: [...prev.emails, '']
    }));
  };

  // Remove email field
  const removeEmailField = (index) => {
    setEmailSettings(prev => ({
      ...prev,
      emails: prev.emails.filter((_, i) => i !== index)
    }));
  };

  // Update email field
  const updateEmailField = (index, value) => {
    setEmailSettings(prev => ({
      ...prev,
      emails: prev.emails.map((email, i) => i === index ? value : email)
    }));
  };

  // Remove email from saved list
  const removeEmailFromSaved = async (emailToRemove) => {
    try {
      setLoading(prev => ({ ...prev, removeEmail: true }));
      
      const updatedSavedEmails = savedEmails.filter(email => email !== emailToRemove);
      
      const dataToSend = {
        ...emailSettings,
        emails: updatedSavedEmails
      };
      
      console.log('Removing email:', emailToRemove);
      console.log('Updated emails array:', updatedSavedEmails);
      
      const response = await fetch('/api/alerts/email-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(errorData.error || `Error ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Email removed successfully:', data);
      
      // Actualizar la lista de emails guardados
      setSavedEmails(updatedSavedEmails);
      
      const message = updatedSavedEmails.length > 0 
        ? 'Email removed successfully' 
        : 'Email removed - no notification emails configured';
      showNotification(message, 'success');
      
    } catch (error) {
      console.error('Error removing email:', error);
      showNotification(`Failed to remove email: ${error.message}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, removeEmail: false }));
    }
  };

  const tests = [
    {
      id: 'prestartAlert',
      name: 'Test Prestart Alert',
      description: 'Test alert creation for failed prestart checks',
      icon: <AlertTriangle className="h-5 w-5" />,
      color: 'bg-red-500'
    },
    {
      id: 'serviceReminders',
      name: 'Test Service Reminders',
      description: 'Check for machines needing service soon',
      icon: <Clock className="h-5 w-5" />,
      color: 'bg-yellow-500'
    },
    {
      id: 'existingAlerts',
      name: 'View My Alerts',
      description: 'Show current alerts in database',
      icon: <Bell className="h-5 w-5" />,
      color: 'bg-blue-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          show={notification.show}
          onClose={() => setNotification(prev => ({ ...prev, show: false }))}
        />
      )}

      {/* Email Configuration */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Settings className="h-6 w-6 text-gray-400 mr-3" />
            <h3 className="text-lg font-medium text-gray-900">Email Configuration</h3>
          </div>
          <button
            onClick={fetchEmailSettings}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
        
        <div className="space-y-4">            {/* Email Addresses */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Addresses for Alerts
              </label>
              
              {/* Mostrar emails guardados o mensaje si no hay */}
              {(() => {
                if (savedEmails.length > 0) {
                  return (
                    <div className="mb-4 p-3 bg-green-50 rounded-md">
                      <h4 className="text-sm font-medium text-green-800 mb-2">Saved Notification Emails:</h4>
                      <ul className="space-y-1">
                        {savedEmails.map((email, index) => (
                          <li key={index} className="flex items-center justify-between text-sm text-green-700 bg-white px-3 py-2 rounded border">
                            <span>{email}</span>
                            <button
                              onClick={() => removeEmailFromSaved(email)}
                              disabled={loading.removeEmail}
                              className="text-red-600 hover:text-red-800 ml-2 disabled:opacity-50"
                              title="Remove this email"
                            >
                              {loading.removeEmail ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-600"></div>
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                } else {
                  return (
                    <div className="mb-4 p-3 bg-yellow-50 rounded-md">
                      <h4 className="text-sm font-medium text-yellow-800 mb-1">No Email Notifications Configured</h4>
                      <p className="text-xs text-yellow-700">Add email addresses below to receive alert notifications.</p>
                    </div>
                  );
                }
              })()}
              
              {/* Campos para agregar nuevos emails */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Add New Email Address:</h4>
                {emailSettings.emails.map((email, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => updateEmailField(index, e.target.value)}
                      placeholder="Enter new email address"
                      className="flex-1 block w-full px-4 py-3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base sm:text-sm"
                    />
                    {emailSettings.emails.length > 1 && (
                      <button
                        onClick={() => removeEmailField(index)}
                        className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                
                <button
                  onClick={addEmailField}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Another Email Field
                </button>
              </div>
            </div>

          {/* Alert Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alert Types
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={emailSettings.enablePrestartAlerts}
                  onChange={(e) => setEmailSettings(prev => ({
                    ...prev,
                    enablePrestartAlerts: e.target.checked
                  }))}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Pre-start check alerts (when checks fail)
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={emailSettings.enableServiceAlerts}
                  onChange={(e) => setEmailSettings(prev => ({
                    ...prev,
                    enableServiceAlerts: e.target.checked
                  }))}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Service reminder alerts (10 hours before service)
                </span>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <button
              onClick={saveEmailSettings}
              disabled={loading.saveSettings}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading.saveSettings ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {loading.saveSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>

      {/* Alert System Status */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Clock className="h-6 w-6 text-gray-400 mr-3" />
            <h3 className="text-lg font-medium text-gray-900">Alert System Status</h3>
          </div>
          <button
            onClick={fetchSchedulerStatus}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
        
        {schedulerStatus && (
          <div className="space-y-3">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 w-32">Status:</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                schedulerStatus.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {schedulerStatus.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            {schedulerStatus.lastCheck && (
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700 w-32">Last Check:</span>
                <span className="text-sm text-gray-900">
                  {new Date(schedulerStatus.lastCheck).toLocaleString()}
                </span>
              </div>
            )}
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <div className="flex">
                <Info className="h-5 w-5 text-blue-400" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">
                    Alert Monitoring
                  </h4>
                  <p className="mt-1 text-sm text-blue-700">
                    The alert system is managed globally. Your alert preferences and email settings 
                    will be used when alerts are triggered for your machines.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Test Section - Solo visible para SUPER_ADMIN */}
      {session?.user?.role === 'SUPER_ADMIN' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <CheckCircle className="h-6 w-6 text-gray-400 mr-3" />
            <h3 className="text-lg font-medium text-gray-900">Test Alert System</h3>
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Admin Only
            </span>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {tests.map((test) => (
              <div key={test.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div className={`flex-shrink-0 ${test.color} rounded-md p-2 text-white`}>
                    {test.icon}
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">{test.name}</h4>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 mb-3">{test.description}</p>
                
                <button
                  onClick={() => runTest(test.id, test.name)}
                  disabled={loading[test.id]}
                  className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading[test.id] ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white mr-2"></div>
                  ) : (
                    <PlayCircle className="h-3 w-3 mr-2" />
                  )}
                  {loading[test.id] ? 'Running...' : 'Run Test'}
                </button>
                
                {/* Test Results */}
                {testResults[test.id] && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                    <div className="flex items-center mb-1">
                      {testResults[test.id].success ? (
                        <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-red-500 mr-1" />
                      )}
                      <span className={`font-medium ${
                        testResults[test.id].success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {testResults[test.id].success ? 'Success' : 'Failed'}
                      </span>
                    </div>
                    <p className="text-gray-600">{testResults[test.id].message}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex">
              <Info className="h-4 w-4 text-blue-400 mt-0.5" />
              <div className="ml-2">
                <p className="text-xs text-blue-700">
                  <strong>Admin Testing Tools:</strong> These testing features are only available to system administrators. 
                  They help verify that the alert system is working correctly and can send emails properly.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertSettings;

