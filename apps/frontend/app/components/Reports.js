'use client';

import React, { useState, useEffect } from 'react';
import { CSVLink } from 'react-csv';
import { Calendar, FileText, Download, RefreshCw, Filter, AlertTriangle } from 'lucide-react';
import Notification from './Notification';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportType, setReportType] = useState('machines');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], // Last 30 days
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState([]);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvFilename, setCsvFilename] = useState('report.csv');

  const reportTypes = [
    { id: 'machines', name: 'Maquinaria', endpoint: '/api/reports/machines' },
    { id: 'services', name: 'Servicios', endpoint: '/api/reports/services' },
    { id: 'prestarts', name: 'PreStart Checks', endpoint: '/api/reports/prestarts' },
    { id: 'operators', name: 'Operadores', endpoint: '/api/reports/operators' }
  ];

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const fetchReportData = async (showNotification = false) => {
    try {
      setLoading(true);
      setIsRefreshing(true);
      setError(null);

      const currentReport = reportTypes.find(r => r.id === reportType);
      if (!currentReport) throw new Error('Invalid report type');

      // Build URL with params
      let url = `${currentReport.endpoint}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      setReportData(data);
      
      // Prepare CSV data
      prepareCSVData(data, currentReport.name);
      
      if (showNotification) {
        setNotification({
          show: true,
          message: 'Report refreshed successfully',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      setError(error.message);
      
      if (showNotification) {
        setNotification({
          show: true,
          message: `Error: ${error.message}`,
          type: 'error'
        });
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Prepare CSV data based on the report type
  const prepareCSVData = (data, reportName) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      setCsvData([]);
      setCsvHeaders([]);
      setCsvFilename('empty-report.csv');
      return;
    }

    // Get all possible headers from all records
    const allHeaders = new Set();
    data.forEach(item => {
      Object.keys(flattenObject(item)).forEach(key => allHeaders.add(key));
    });

    // Convert to CSV format
    const headers = Array.from(allHeaders).map(key => ({
      label: formatHeaderLabel(key),
      key: key
    }));

    // Flatten each item for CSV export
    const flattenedData = data.map(item => flattenObject(item));
    
    setCsvHeaders(headers);
    setCsvData(flattenedData);
    setCsvFilename(`${reportName.toLowerCase()}-report-${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Flatten nested objects for CSV export
  const flattenObject = (obj, prefix = '') => {
    return Object.keys(obj).reduce((acc, k) => {
      const pre = prefix.length ? `${prefix}.` : '';
      if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
        Object.assign(acc, flattenObject(obj[k], pre + k));
      } else if (Array.isArray(obj[k])) {
        // For arrays, convert to comma-separated string
        acc[pre + k] = obj[k].join(', ');
      } else {
        acc[pre + k] = obj[k];
      }
      return acc;
    }, {});
  };

  // Format header labels to be more readable
  const formatHeaderLabel = (header) => {
    return header
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  useEffect(() => {
    fetchReportData();
  }, [reportType]);

  return (
    <div className="container mx-auto p-4">
      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ ...notification, show: false })}
        />
      )}

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Reportes</h2>
        <p className="text-gray-600">Genere reportes de sus datos para análisis y exportación</p>
      </div>

      {/* Report Type Selector */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h3 className="text-lg font-medium mb-3">Tipo de Reporte</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {reportTypes.map(type => (
            <button
              key={type.id}
              onClick={() => setReportType(type.id)}
              className={`p-3 rounded-lg border ${
                reportType === type.id 
                  ? 'bg-blue-50 border-blue-500 text-blue-700' 
                  : 'border-gray-200 hover:bg-gray-50'
              } transition-colors flex flex-col items-center justify-center`}
            >
              <FileText className="w-6 h-6 mb-1" />
              <span>{type.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
          >
            <Filter className="mr-2" size={18} />
            <span>Filtros</span>
            {showFilters ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
        
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          {/* Download CSV button */}
          {reportData.length > 0 && (
            <CSVLink
              data={csvData}
              headers={csvHeaders}
              filename={csvFilename}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center"
            >
              <Download className="mr-2" size={18} />
              Exportar CSV
            </CSVLink>
          )}
          
          <button
            onClick={() => fetchReportData(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} size={18} />
            Refrescar
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg transition-all duration-300 ease-in-out">
          <h3 className="font-semibold mb-3">Rango de Fechas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Desde</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  name="startDate"
                  value={dateRange.startDate}
                  onChange={handleFilterChange}
                  className="w-full pl-10 p-2 border rounded"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hasta</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  name="endDate"
                  value={dateRange.endDate}
                  onChange={handleFilterChange}
                  className="w-full pl-10 p-2 border rounded"
                />
              </div>
            </div>
          </div>
          <div className="mt-3">
            <button 
              onClick={() => fetchReportData(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Report Data Display */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-lg font-medium">
            {reportTypes.find(r => r.id === reportType)?.name || 'Reporte'} - {reportData.length} registros
          </h3>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-gray-600">Loading report data...</p>
          </div>
        ) : reportData.length === 0 ? (
          <div className="p-6 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600">No hay datos disponibles para este reporte.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(reportData[0]).slice(0, 6).map((key) => (
                    <th 
                      key={key} 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {formatHeaderLabel(key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {Object.entries(item).slice(0, 6).map(([key, value]) => (
                      <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {value === null || value === undefined ? '—' : 
                         typeof value === 'object' ? JSON.stringify(value) : 
                         String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;