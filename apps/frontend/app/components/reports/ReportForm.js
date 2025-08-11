import React, { useState, useEffect } from 'react';
import { Calendar, FileText } from 'lucide-react';
import { useSession } from 'next-auth/react';

const ReportForm = ({ reportForm, setReportForm, onSubmit, onCancel, isGenerating }) => {
  const [machines, setMachines] = useState([]);
  const [workplaces, setWorkplaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMachines, setLoadingMachines] = useState(false);
  const { data: session } = useSession();
  
  // Determinar si el usuario es admin
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';
  
  // Configurar workplace automáticamente para usuarios no-admin
  useEffect(() => {
    if (session && !isAdmin) {
      // Usar fallback temporal hasta que la sesión tenga el workplace correcto
      const userWorkplace = session.user.workplace || session.user.workplaceName;
      if (userWorkplace && !reportForm.workplace) {
        setReportForm(prev => ({
          ...prev,
          workplace: userWorkplace
        }));
      }
    }
  }, [session, isAdmin, setReportForm]);

  // Reset report type when workplace changes between "All Workplaces" and specific workplace
  useEffect(() => {
    console.log('[DEBUG] ReportForm workplace effect:', {
      isAdmin,
      workplace: reportForm.workplace,
      type: reportForm.type,
      workplaceIsEmpty: reportForm.workplace === "",
      typeStartsWithOrg: reportForm.type.startsWith('org-')
    });
    
    if (isAdmin) {
      const isAllWorkplaces = reportForm.workplace === "";
      const isOrgType = reportForm.type.startsWith('org-');
      
      // If switching to "All Workplaces" but type is not organizational
      if (isAllWorkplaces && !isOrgType) {
        console.log('[DEBUG] Switching to All Workplaces - setting org-prestart');
        setReportForm(prev => ({ ...prev, type: 'org-prestart' }));
      }
      // If switching to specific workplace but type is organizational
      else if (!isAllWorkplaces && isOrgType) {
        console.log('[DEBUG] Switching to specific workplace - setting prestart');
        setReportForm(prev => ({ ...prev, type: 'prestart' }));
      }
    }
  }, [reportForm.workplace, isAdmin, setReportForm]);
  
  useEffect(() => {
    // Fetch initial machines for the dropdown (all admin machines)
    const fetchMachines = async () => {
      try {
        const response = await fetch('/api/machines');
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setMachines(data);
      } catch (error) {
        console.error('Error fetching machines:', error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch workplaces for the dropdown
    const fetchWorkplaces = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/reports/workplaces', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setWorkplaces(data);
        }
      } catch (error) {
        console.error('Error fetching workplaces:', error);
      }
    };
    
    fetchMachines();
    fetchWorkplaces();
  }, []);

  // Fetch machines when workplace changes
  useEffect(() => {
    const fetchMachinesByWorkplace = async () => {
      // Check if workplace is empty or undefined
      if (!reportForm.workplace || reportForm.workplace === '') {
        // If no workplace selected, fetch all admin machines
        setLoadingMachines(true);
        try {
          const response = await fetch('/api/machines');
          if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }
          const data = await response.json();
          setMachines(data);
        } catch (error) {
          console.error('Error fetching all machines:', error);
        } finally {
          setLoadingMachines(false);
        }
      } else {
        // If workplace selected, fetch machines for that workplace
        setLoadingMachines(true);
        try {
          const response = await fetch(`/api/machines/by-workplace?workplace=${encodeURIComponent(reportForm.workplace)}`);
          if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }
          const data = await response.json();
          setMachines(data);
          
          // Clear selected machine if it's not in the new list
          if (reportForm.machineId && !data.find(m => m._id === reportForm.machineId)) {
            setReportForm(prev => ({ ...prev, machineId: '' }));
          }
        } catch (error) {
          console.error('Error fetching machines by workplace:', error);
        } finally {
          setLoadingMachines(false);
        }
      }
    };

    fetchMachinesByWorkplace();
  }, [reportForm.workplace]); // Only run when workplace changes
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`[DEBUG] Input change: ${name} = "${value}"`);
    
    setReportForm(prev => {
      const newForm = { ...prev, [name]: value };
      
      // Special handling for dateRange changes
      if (name === 'dateRange') {
        if (value && value !== '') {
          // Clear custom dates when selecting a predefined range
          newForm.dateFrom = '';
          newForm.dateTo = '';
        }
      }
      
      // Special handling for workplace changes
      if (name === 'workplace' && isAdmin) {
        const isAllWorkplaces = value === "";
        console.log(`[DEBUG] Workplace changed to: "${value}", isAllWorkplaces: ${isAllWorkplaces}`);
        
        if (isAllWorkplaces) {
          // Switching to "All Workplaces" - force organizational type
          console.log('[DEBUG] Forcing org-prestart type for All Workplaces');
          newForm.type = 'org-prestart';
          newForm.machineId = ''; // Clear machine selection
        } else if (prev.type.startsWith('org-')) {
          // Switching from "All Workplaces" to specific workplace - force regular type
          console.log('[DEBUG] Switching from org type to regular prestart');
          newForm.type = 'prestart';
        }
      }
      
      return newForm;
    });
  };
  
  return (
    <form onSubmit={onSubmit} className="bg-white p-4 rounded-lg shadow mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Report Type</label>
          <select
            name="type"
            value={reportForm.type}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          >
            {(isAdmin && reportForm.workplace === "") ? (
              // Admin with "All Workplaces" selected - show organizational report options
              <>
                <option value="org-prestart">All Workplaces - Pre-Start</option>
                <option value="org-service">All Workplaces - Services</option>
                <option value="org-machine">All Workplaces - Machinery</option>
                <option value="org-diesel">All Workplaces - Fuel Consumption</option>
              </>
            ) : (
              // Regular reports for specific workplace or non-admin users
              <>
                <option value="prestart">Pre-Start</option>
                <option value="service">Services</option>
                <option value="machine">Machinery</option>
                <option value="diesel">Fuel Consumption</option>
              </>
            )}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Date Range</label>
          <select
            name="dateRange"
            value={reportForm.dateRange || ''}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          >
            <option value="">Custom (use dates below)</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">From</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              name="dateFrom"
              value={reportForm.dateFrom}
              onChange={handleInputChange}
              disabled={reportForm.dateRange && reportForm.dateRange !== ''}
              className={`w-full pl-10 p-2 border rounded ${(reportForm.dateRange && reportForm.dateRange !== '') ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">To</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              name="dateTo"
              value={reportForm.dateTo}
              onChange={handleInputChange}
              disabled={reportForm.dateRange && reportForm.dateRange !== ''}
              className={`w-full pl-10 p-2 border rounded ${(reportForm.dateRange && reportForm.dateRange !== '') ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Workplace {!isAdmin ? '' : '(Optional)'}
          </label>
          <select
            name="workplace"
            value={reportForm.workplace}
            onChange={handleInputChange}
            disabled={!isAdmin}
            className={`w-full p-2 border rounded ${!isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          >
            {isAdmin && <option value="">All Workplaces</option>}
            {isAdmin ? (
              workplaces.map((workplace, index) => (
                <option key={index} value={workplace}>
                  {workplace}
                </option>
              ))
            ) : (
              <option value={reportForm.workplace}>
                {reportForm.workplace || session?.user?.workplace || session?.user?.workplaceName || 'Loading workplace...'}
              </option>
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Machine (Optional)
            {loadingMachines && <span className="text-blue-500 text-xs ml-2">Loading...</span>}
          </label>
          <select
            name="machineId"
            value={reportForm.machineId}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            disabled={loadingMachines}
          >
            <option value="">
              {reportForm.workplace ? `All Machines in ${reportForm.workplace}` : 'All Machines'}
            </option>
            {machines.map(machine => (
              <option key={machine._id} value={machine._id}>
                {machine.name || machine.model || machine._id}
                {machine.workplaceName && ` (${machine.workplaceName})`}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Info about automatic report cleanup */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Auto-cleanup:</strong> The system maintains a maximum of 10 reports. When you generate a new report, the oldest ones are automatically removed to keep your reports organized.
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="mr-2 px-4 py-2 border rounded bg-gray-200 hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isGenerating}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
        >
          <FileText className="h-5 w-5 mr-2" />
          {isGenerating ? 'Generating...' : 'Generate Report'}
        </button>
      </div>
    </form>
  );
};

export default ReportForm;