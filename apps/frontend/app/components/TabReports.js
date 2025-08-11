'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Download, RefreshCw, FileText, PlusCircle, AlertTriangle, Eye, Trash2, Check, Shield, Users, Building2 } from 'lucide-react';
import '@/styles/tables.css';
import Notification from './Notification';
import ReportForm from './reports/ReportForm';
import ReportsTable from './reports/ReportsTable';
import EmptyState from './reports/EmptyState';

const TabReports = ({ suppressNotifications = false }) => {
  const { data: session } = useSession();
  const [success, setSuccess] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showNewReportForm, setShowNewReportForm] = useState(false);
  const [downloadingReportId, setDownloadingReportId] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Estados para la vista previa de registros
  const [previewRecords, setPreviewRecords] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [excludedRecords, setExcludedRecords] = useState(new Set());

  const [reportForm, setReportForm] = useState({
    type: 'prestart',
    dateFrom: '',
    dateTo: '',
    dateRange: '',
    machineId: '',
    workplace: '',
    format: 'csv'
  });

  // Función para mostrar notificaciones
  const showNotificationIfAllowed = useCallback((message, type = 'success') => {
    if (suppressNotifications) return;
    setNotification({
      show: true,
      message,
      type
    });
  }, [suppressNotifications]);

  // Función para cargar reportes
  const fetchReports = useCallback(async (showNotification = false) => {
    try {
      setLoading(true);
      setIsRefreshing(true);
      setError(null);

      console.log('Fetching reports...');

      // Add timestamp to prevent caching
      const timestamp = Date.now();
      let url = `/api/reports?_t=${timestamp}`;

      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-store'
        },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`Error fetching reports: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Loaded ${data.length} reports`, data);

      setReports(data);

      if (showNotification && showNotificationIfAllowed) {
        showNotificationIfAllowed("Reports loaded successfully");
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Failed to load reports. Please try again.');
      if (showNotificationIfAllowed) {
        showNotificationIfAllowed("Failed to load reports", "error");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [showNotificationIfAllowed]);

  // Cargar reportes al iniciar
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Función para eliminar un reporte
  const handleDeleteReport = async (reportId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este reporte?')) {
      return;
    }

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        showNotificationIfAllowed("Report deleted successfully");
        await fetchReports(); // Refresh the reports list
      } else {
        throw new Error(result.error || 'Failed to delete report');
      }

    } catch (error) {
      console.error('Error deleting report:', error);
      showNotificationIfAllowed(`Failed to delete report: ${error.message}`, "error");
    }
  };

  // Función para generar un nuevo reporte
  const handleGenerateReport = async (e) => {
    e.preventDefault();

    try {
      setIsGenerating(true);
      setError(null);

      // Verificar si el usuario es admin
      const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';
      
      // Detectar si es un tipo organizacional
      const isOrgType = reportForm.type.startsWith('org-');
      const isAllWorkplaces = reportForm.workplace === '' || reportForm.workplace === 'all';
      
      console.log('Generate Report Debug:', {
        type: reportForm.type,
        workplace: reportForm.workplace,
        isAdmin,
        isOrgType,
        isAllWorkplaces,
        typeStartsWithOrg: reportForm.type.startsWith('org-'),
        workplaceEmpty: reportForm.workplace === '',
        workplaceAll: reportForm.workplace === 'all'
      });
      
      let requestData;
      
      if (isAdmin && (isOrgType || isAllWorkplaces)) {
        console.log('Generando reporte organizacional...');
        
        if (isOrgType) {
          // Para tipos específicos (org-prestart, org-service, etc.)
          requestData = {
            type: reportForm.type, // Mantener el tipo completo
            fromDate: reportForm.dateFrom,
            toDate: reportForm.dateTo,
            dateRange: reportForm.dateRange || undefined,
            format: reportForm.format,
            workplace: 'all',
            isOrganizational: true
          };
        } else {
          // Para reportes organizacionales genéricos
          requestData = {
            type: 'organizational',
            fromDate: reportForm.dateFrom,
            toDate: reportForm.dateTo,
            dateRange: reportForm.dateRange || undefined,
            format: reportForm.format,
            workplace: 'all',
            category: reportForm.type
          };
        }
      } else {
        // Reporte normal para usuarios no-admin o admin con workplace específico
        requestData = {
          type: reportForm.type,
          fromDate: reportForm.dateFrom,
          toDate: reportForm.dateTo,
          dateRange: reportForm.dateRange || undefined,
          machineId: reportForm.machineId || undefined,
          format: reportForm.format,
          workplace: reportForm.workplace || undefined
        };
      }

      console.log('Request data being sent:', requestData);

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const result = await response.json();
      console.log('Report generation result:', result);

      if (result.success) {
        if (isAdmin && (isOrgType || isAllWorkplaces)) {
          showNotificationIfAllowed(`Reporte organizacional generado exitosamente. Incluye datos de toda la organización.`);
        } else {
          showNotificationIfAllowed(`Report generated successfully with ${result.dataLength || 0} records.`);
        }
        
        // Refresh reports list
        await fetchReports();
        
        // Reset form and hide it
        setReportForm({
          type: 'prestart',
          dateFrom: '',
          dateTo: '',
          machineId: '',
          workplace: '',
          format: 'csv'
        });
        setShowNewReportForm(false);
      } else {
        throw new Error(result.error || 'Failed to generate report');
      }

    } catch (error) {
      console.error('Error generating report:', error);
      setError(error.message);
      showNotificationIfAllowed(`Failed to generate report: ${error.message}`, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (reportId) => {
    try {
      setDownloadingReportId(reportId);

      const reportUrl = `/api/reports/${reportId}?format=csv`;
      const response = await fetch(reportUrl);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Check content type to determine how to handle the response
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('text/csv')) {
        // Direct CSV response - handle as file download
        const csvContent = await response.text();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Extract filename from Content-Disposition header or use descriptive default
        let filename = `report-${reportId}.csv`;
        const contentDisposition = response.headers.get('content-disposition');
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        
        showNotificationIfAllowed("Report downloaded successfully");
        return;
      }

      // JSON response - handle as before
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to prepare report for download');
      }

      // Handle CSV downloads for reports that support CSV export
      if (result.reportMeta && result.csvContent && (
        result.reportMeta.type === 'diesel' || 
        result.reportMeta.type === 'prestart' || 
        result.reportMeta.type === 'service' ||
        result.reportMeta.type === 'services' ||
        result.reportMeta.type === 'machine'
      )) {
        const csvContent = result.csvContent || '';
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename || `${result.reportMeta.type}-report-${reportId}.csv`;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      } else {
        // Handle other report types as JSON
        const jsonString = JSON.stringify(result.data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename || `report-${reportId}.json`;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      }

      showNotificationIfAllowed("Report downloaded successfully");
    } catch (error) {
      console.error('Error downloading report:', error);
      showNotificationIfAllowed(`Error downloading report: ${error.message}`, "error");
    } finally {
      setDownloadingReportId(null);
    }
  };

  return (
    <div className="p-6">
      {/* Header Normal */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="w-6 h-6 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <div className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {reports.length}/10 reports
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchReports(true)}
              disabled={isRefreshing}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowNewReportForm(!showNewReportForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Generate Report
            </button>
          </div>
        </div>
        <p className="text-gray-600 mt-2">
          Generate and manage reports for your fleet operations, including pre-start inspections, services, machinery status, and fuel consumption.
          {session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN' ? (
            <>
              <br />
              <span className="inline-flex items-center mt-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
                <Shield className="w-3 h-3 mr-1" />
                <strong>Admin:</strong> Selecciona &ldquo;All Workplaces&rdquo; para generar reportes organizacionales completos con datos de toda tu organización.
              </span>
            </>
          ) : null}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* New Report Form */}
      {showNewReportForm && (
        <ReportForm
          reportForm={reportForm}
          setReportForm={setReportForm}
          onSubmit={handleGenerateReport}
          onCancel={() => setShowNewReportForm(false)}
          isGenerating={isGenerating}
        />
      )}

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading reports...</span>
          </div>
        ) : reports.length === 0 ? (
          <EmptyState onCreateReport={() => setShowNewReportForm(true)} />
        ) : (
          <ReportsTable 
            reports={reports}
            onDownload={handleDownload}
            downloadingReportId={downloadingReportId}
          />
        )}
      </div>

      {/* Notification */}
      {notification.show && !suppressNotifications && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ show: false, message: '', type: 'success' })}
        />
      )}
    </div>
  );
};

export default TabReports;
