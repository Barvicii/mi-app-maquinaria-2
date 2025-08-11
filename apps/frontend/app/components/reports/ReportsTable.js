import React from 'react';
import { Download, FileText } from 'lucide-react';
import { format } from 'date-fns';

const ReportsTable = ({ reports = [], onDownload, downloadingReportId }) => {
  // Ensure `reports` is always an array
  const safeReports = Array.isArray(reports) ? reports : [];

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch (e) {
      console.warn('Date formatting error:', e, dateString);
      return dateString;
    }
  };

  // Helper function to get report type display name
  const getReportTypeName = (type) => {
    switch(type) {
      case 'prestart': return 'Pre-Start';
      case 'service': return 'Services';
      case 'services': return 'Services'; // Handle both variants
      case 'machine': return 'Machinery';
      case 'diesel': return 'Fuel Consumption';
      default: return type?.charAt(0).toUpperCase() + type?.slice(1) || 'Unknown';
    }
  };

  return (    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Workplace
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date Range
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {safeReports.map((report) => (
            <tr key={report._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">
                    {getReportTypeName(report.type)}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {report.workplace || 'All Workplaces'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {(() => {
                  // Try different field name patterns for date range
                  const startDate = report.params?.startDate || report.dateFrom;
                  const endDate = report.params?.endDate || report.dateTo;
                  const dateRange = report.params?.dateRange;
                  
                  // If there's a named dateRange, show it
                  if (dateRange && dateRange !== 'custom' && dateRange !== null) {
                    return dateRange.charAt(0).toUpperCase() + dateRange.slice(1);
                  }
                  
                  // If both dates are null or undefined, show "All"
                  if (!startDate && !endDate) {
                    return 'All';
                  }
                  
                  // Format the date range
                  const fromDate = startDate ? formatDate(startDate).split(' ')[0] : 'All';
                  const toDate = endDate ? formatDate(endDate).split(' ')[0] : 'All';
                  
                  // If only one date is specified
                  if (!startDate && endDate) {
                    return `Up to ${toDate}`;
                  }
                  if (startDate && !endDate) {
                    return `From ${fromDate}`;
                  }
                  
                  // Both dates specified
                  return `${fromDate} - ${toDate}`;
                })()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(report.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className="flex space-x-2">
                  {/* Download CSV button */}
                  <button
                    onClick={() => onDownload(report._id)}
                    disabled={downloadingReportId === report._id}
                    className="text-blue-600 hover:text-blue-900 flex items-center disabled:opacity-50"
                  >
                    {downloadingReportId === report._id ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-1"></span>
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </>
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportsTable;