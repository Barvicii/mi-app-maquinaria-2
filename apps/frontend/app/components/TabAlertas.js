'use client';

import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Clock, RefreshCw, Check, Info, Settings } from 'lucide-react';
import AlertSettings from './AlertSettings';
import '@/styles/tables.css';

const TabAlertas = ({ suppressNotifications = false }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('alerts'); // 'alerts' or 'settings'

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setIsRefreshing(true);
      setError(null);

      const response = await fetch('/api/alerts');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      setAlerts(data);
    } catch (err) {
      console.error('Error loading alerts:', err);
      setError('Failed to load alerts. Please try again.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const markAsRead = async (alertId) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ read: true })
      });
      
      if (response.ok) {
        // Actualizar estado local
        setAlerts(prevAlerts => 
          prevAlerts.map(alert => 
            alert._id === alertId ? { ...alert, read: true } : alert
          )
        );
      }
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const getAlertIcon = (alertType) => {
    switch (alertType) {
      case 'maintenance':
        return <Settings className="h-5 w-5 text-blue-500" />;
      case 'prestart_issues':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'system':
        return <Info className="h-5 w-5 text-indigo-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'alerts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Bell className="h-5 w-5 inline-block mr-2" />
            My Alerts
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="h-5 w-5 inline-block mr-2" />
            Alert Settings
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'alerts' ? (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
              <Bell className="h-6 w-6 mr-2 text-blue-600" />
              My Alerts & Notifications
            </h2>
            
            <button
              onClick={fetchAlerts}
              disabled={isRefreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <p className="ml-3 text-red-700">{error}</p>
          </div>
        </div>
      )}

      {loading && !isRefreshing ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No alerts</h3>
          <p className="mt-2 text-gray-500">You don&apos;t have any alerts or notifications at the moment.</p>
        </div>
      ) : (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Alert</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {alerts.map((alert) => (
                <tr key={alert._id} className={alert.read ? '' : 'bg-blue-50'}>
                  <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                    <div className="flex items-center">
                      <div className="mr-3">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{alert.title}</div>
                        <div className="text-gray-500">{alert.message}</div>
                        {alert.machineId && (
                          <div className="text-xs text-gray-400">
                            Machine: {alert.machineName || alert.machineId}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getSeverityClass(alert.severity)}`}>
                      {alert.severity === 'high' ? 'High' : 
                       alert.severity === 'medium' ? 'Medium' : 'Low'}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-gray-400" />
                      {formatDate(alert.createdAt)}
                    </div>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    {alert.read ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Read
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        New
                      </span>
                    )}
                  </td>
                  <td className="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    {!alert.read && (
                      <button
                        onClick={() => markAsRead(alert._id)}
                        className="text-blue-600 hover:text-blue-900 flex items-center justify-end w-full"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Mark as read
                      </button>
                    )}
                    {alert.actionUrl && (
                      <a
                        href={alert.actionUrl}
                        className="text-blue-600 hover:text-blue-900 ml-4"
                      >
                        View
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
        </div>
      ) : (
        <AlertSettings />
      )}
    </div>
  );
};

export default TabAlertas;