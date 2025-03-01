import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Eye, AlertTriangle } from 'lucide-react';
import PropTypes from 'prop-types';
import '../styles/tables.css';
import DetailsModal from './DetailsModal';
import Notification from './Notification';

const TabPreStart = () => {
  const [prestartRecords, setPrestartRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = prestartRecords.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(prestartRecords.length / itemsPerPage);

  const fetchPrestarts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/prestart');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Handle both direct array response and data property in response
      const records = Array.isArray(data) ? data : (data.data || []);
      setPrestartRecords(records);
    } catch (err) {
      console.error('Error fetching prestarts:', err);
      setError(err.message || 'Failed to fetch prestart checks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrestarts();
  }, []);

  const handleDeletePrestart = async (id) => {
    if (window.confirm('Are you sure you want to delete this prestart check?')) {
      try {
        const response = await fetch(`/api/prestart/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete prestart check');
        }
        
        // Show success notification
        setNotificationMessage('Prestart check deleted successfully');
        setShowNotification(true);
        
        // Refresh the data
        await fetchPrestarts();
      } catch (err) {
        console.error('Error deleting prestart:', err);
        setNotificationMessage('Failed to delete prestart check');
        setShowNotification(true);
      }
    }
  };

  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Render status badge with appropriate color
  const renderStatusBadge = (status) => {
    const isOk = status === 'OK' || status === 'completado';
    return (
      <span className={`status-badge ${
        isOk ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
      }`}>
        {status || 'Pending'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-text">Loading prestart checks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <AlertTriangle className="w-5 h-5 mr-2" />
        <div>Error: {error}</div>
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
        <h2 className="section-title">Pre-Start Check Records</h2>
        <div className="flex items-center gap-4">
          <div className="pagination-info">
            Showing {prestartRecords.length > 0 ? indexOfFirstItem + 1 : 0}-
            {Math.min(indexOfLastItem, prestartRecords.length)} of {prestartRecords.length}
          </div>
          <button
            onClick={fetchPrestarts}
            className="primary-button"
          >
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {prestartRecords.length === 0 ? (
        <div className="empty-message">No prestart records available.</div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="table-cell text-left">Date</th>
                  <th className="table-cell text-left">Machine</th>
                  <th className="table-cell text-left">Operator</th>
                  <th className="table-cell text-left">Hours</th>
                  <th className="table-cell text-left">Status</th>
                  <th className="table-cell text-left">Observations</th>
                  <th className="table-cell text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((record) => (
                  <tr key={record._id} className="table-row">
                    <td className="table-cell">
                      {new Date(record.createdAt || record.fecha).toLocaleDateString()}
                    </td>
                    <td className="table-cell">{record.maquinaId || '-'}</td>
                    <td className="table-cell">{record.operador}</td>
                    <td className="table-cell">{record.horasMaquina}</td>
                    <td className="table-cell">
                      {renderStatusBadge(record.estado)}
                    </td>
                    <td className="table-cell">
                      {record.observaciones ? 
                        (record.observaciones.length > 50 ? 
                          `${record.observaciones.substring(0, 50)}...` : 
                          record.observaciones) : 
                        '-'}
                    </td>
                    <td className="table-cell">
                      <div className="table-actions">
                        <button
                          onClick={() => {
                            setSelectedRecord({
                              ...record,
                              createdAt: record.createdAt || record.fecha,
                            });
                            setShowDetails(true);
                          }}
                          className="action-button view-button text-blue-600 hover:text-blue-800 p-2"
                          title="View details"
                        >
                          <Eye className="button-icon" size={20} />
                        </button>
                        <button
                          onClick={() => handleDeletePrestart(record._id)}
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
        type="prestart"
      />
    </div>
  );
};

TabPreStart.propTypes = {
  onRefresh: PropTypes.func,
};

export default TabPreStart;