import React, { useState, useEffect } from 'react';
import DetailsModal from './DetailsModal';
import { Eye, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import '../styles/tables.css';
import Notification from './Notification';

const TabServices = () => {
  const [services, setServices] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = services.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(services.length / itemsPerPage);

  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsRefreshing(true);
      
      console.log('Fetching services...');
      
      const response = await fetch('/api/services', {
        cache: 'no-store', // Prevent caching
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(`Failed to fetch services: ${response.status} ${response.statusText} ${errorData.message || ''}`);
      }
      
      const data = await response.json();
      console.log('Services data received:', data ? data.length : 'none');
      
      // Handle both direct array response and data property
      setServices(Array.isArray(data) ? data : (data.data || []));
    } catch (error) {
      console.error('Error fetching services:', error);
      setError(error.message || 'An error occurred while loading services');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        const response = await fetch(`/api/services/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Error deleting record: ${errorData.message || response.statusText}`);
        }

        // Show notification
        setNotificationMessage('Service record deleted successfully');
        setShowNotification(true);
        
        // Update the list after deleting
        setServices(prevServices => prevServices.filter(service => service._id !== id));
      } catch (error) {
        console.error('Error deleting service:', error);
        setNotificationMessage('Error deleting record: ' + error.message);
        setShowNotification(true);
      }
    }
  };

  if (loading && !isRefreshing) {
    return (
      <div className="loading-container">
        <div className="loading-text">Loading records...</div>
      </div>
    );
  }

  return (
    <div className="machinary-container">
      <Notification 
        message={notificationMessage}
        show={showNotification}
        onClose={() => setShowNotification(false)}
      />
      
      <div className="machinary-header">
        <h2 className="section-title">Service Records</h2>
        <div className="flex items-center gap-4">
          <div className="pagination-info">
            Showing {services.length > 0 ? indexOfFirstItem + 1 : 0}-
            {Math.min(indexOfLastItem, services.length)} of {services.length}
          </div>
          <button 
            onClick={fetchServices}
            className="primary-button"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message mb-4">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <div>Error: {error}</div>
        </div>
      )}

      {services.length === 0 && !loading ? (
        <div className="empty-message">No service records available.</div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="table-cell text-left">Date</th>
                  <th className="table-cell text-left">Technician</th>
                  <th className="table-cell text-left">Service Type</th>
                  <th className="table-cell text-left">Hours</th>
                  <th className="table-cell text-left">Next Service</th>
                  <th className="table-cell text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((service) => (
                  <tr key={service._id} className="table-row">
                    <td className="table-cell">{new Date(service.fecha).toLocaleDateString()}</td>
                    <td className="table-cell">{service.tecnico}</td>
                    <td className="table-cell">{service.tipoServicio}</td>
                    <td className="table-cell">{service.horasMaquina}</td>
                    <td className="table-cell">{service.proximoService}</td>
                    <td className="table-cell">
                      <div className="table-actions">
                        <button
                          onClick={() => {
                            setSelectedRecord(service);
                            setShowDetails(true);
                          }}
                          className="action-button view-button text-blue-600 hover:text-blue-800 p-2"
                          title="View details"
                        >
                          <Eye className="button-icon" size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(service._id)}
                          className="action-button delete-button text-red-600 hover:text-red-800 p-2"
                          title="Delete"
                        >
                          <Trash2 className="button-icon" size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination-controls">
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="pagination-button"
              >
                Previous
              </button>
              <div className="page-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`page-number ${currentPage === number ? 'active' : ''}`}
                  >
                    {number}
                  </button>
                ))}
              </div>
              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="pagination-button"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      <DetailsModal
        show={showDetails}
        onClose={() => {
          setShowDetails(false);
          setSelectedRecord(null);
        }}
        data={selectedRecord}
        type="service"
      />
    </div>
  );
};

export default TabServices;