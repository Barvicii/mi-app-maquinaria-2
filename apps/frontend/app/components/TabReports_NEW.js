'use client';

import React, { useState } from 'react';
import { FileText, Fuel, Wrench, AlertTriangle } from 'lucide-react';
import DieselHistory from './DieselHistory';

const TabReports = ({ suppressNotifications = false }) => {
  const [activeReportTab, setActiveReportTab] = useState('diesel');

  const reportTabs = [
    {
      id: 'diesel',
      label: 'Fuel Consumption',
      icon: Fuel,
      description: 'View and export diesel consumption records'
    },
    // Future reports can be added here
    // {
    //   id: 'maintenance',
    //   label: 'Maintenance Reports',
    //   icon: Wrench,
    //   description: 'Maintenance and service records'
    // },
    // {
    //   id: 'prestart',
    //   label: 'Pre-start Reports',
    //   icon: FileText,
    //   description: 'Pre-start inspection reports'
    // }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Reports Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center mb-4">
          <FileText className="w-6 h-6 text-blue-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        </div>
        <p className="text-gray-600">
          Generate and export reports for your fleet operations, fuel consumption, and maintenance activities.
        </p>
      </div>

      {/* Report Type Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Report Types">
            {reportTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveReportTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeReportTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Report Content */}
        <div className="p-6">
          {activeReportTab === 'diesel' && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Fuel Consumption Reports</h2>
                <p className="text-gray-600">
                  View, filter, and export detailed fuel consumption records for your fleet. 
                  You can filter by date range, machine, or export data to CSV for further analysis.
                </p>
              </div>
              <DieselHistory />
            </div>
          )}

          {/* Placeholder for future report types */}
          {activeReportTab === 'maintenance' && (
            <div className="text-center py-12">
              <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Maintenance Reports</h3>
              <p className="text-gray-500">Coming soon - Maintenance and service reports will be available here.</p>
            </div>
          )}

          {activeReportTab === 'prestart' && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Pre-start Reports</h3>
              <p className="text-gray-500">Coming soon - Pre-start inspection reports will be available here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TabReports;
