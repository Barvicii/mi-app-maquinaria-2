import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Eye, AlertTriangle } from 'lucide-react';
import PropTypes from 'prop-types';
import '../styles/tables.css';
import DetailsModal from './DetailsModal';
import Notification from './Notification';

const TabPreStart = () => {
  const [prestartRecords, setPrestartRecords] = useState([]);
  const [machines, setMachines] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  // Add state for refresh animation
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [records, setRecords] = useState({
    showing: '0-0 of 0',
    total: 0
  });

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = prestartRecords.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(prestartRecords.length / itemsPerPage);

  // Fetch machines to get their custom IDs
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const response = await fetch('/api/machines');
        if (response.ok) {
          const data = await response.json();
          setMachines(data);
          console.log("Machines loaded:", data);
        }
      } catch (error) {
        console.error("Error loading machines:", error);
      }
    };
    
    fetchMachines();
  }, []);

  const fetchPrestarts = async (showNotification = false) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/prestart');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle both direct array response and data property in response
      const records = Array.isArray(data) ? data : (data.data || []);
      
      // Log para depuración
      console.log("PreStart records loaded:", records);
      
      setPrestartRecords(records);

      // Update records count
      const start = indexOfFirstItem + 1;
      const end = Math.min(indexOfLastItem, records.length);
      setRecords({
        showing: `${start}-${end} of ${records.length}`,
        total: records.length
      });

      if (showNotification) {
        setNotification({
          show: true,
          message: 'Records refreshed successfully',
          type: 'success'
        });
      }
    } catch (err) {
      console.error('Error fetching prestarts:', err);
      setError(err.message || 'Failed to fetch prestart checks');
    } finally {
      // Add delay for smoother loading transition
      setTimeout(() => {
        setLoading(false);
      }, 500);
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

  // Update the renderStatusBadge function
  const renderStatusBadge = (record) => {
    const checkItems = [
      'aceite',
      'agua',
      'neumaticos',
      'nivelCombustible',
      'lucesYAlarmas',
      'frenos',
      'extintores',
      'cinturonSeguridad'
    ];

    const allChecksPass = checkItems.every(item => record[item] === true);

    return (
      <span className={`status-badge ${
        allChecksPass ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {allChecksPass ? 'OK' : 'Needs Review'}
      </span>
    );
  };

  // Helper function to get the custom machine ID (the one assigned by the user)
  const getCustomMachineId = (record) => {
    // First extract the database machine ID
    let dbMachineId = '';
    if (record.machineId) dbMachineId = record.machineId;
    else if (record.maquinaId) dbMachineId = record.maquinaId;
    else if (record.datos && record.datos.machineId) dbMachineId = record.datos.machineId;
    else if (record.datos && record.datos.maquinaId) dbMachineId = record.datos.maquinaId;
    
    // Now try to find the matching machine to get its custom ID
    if (dbMachineId) {
      const machine = machines.find(m => m._id === dbMachineId);
      if (machine) {
        // Return the custom ID assigned by the user
        return machine.machineId || machine.maquinariaId || 'No custom ID';
      }
    }
    
    // If no machine found or no ID, try to get the custom ID directly from the prestart
    if (record.maquina) {
      return record.maquina;
    }
    
    // Fallback
    return "ID not found";
  };

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
            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, prestartRecords.length)} of{' '}
            {prestartRecords.length}
          </div>
          <button
            onClick={async () => {
              try {
                setIsRefreshing(true);
                await fetchPrestarts(true);
              } catch (error) {
                setNotification({
                  show: true,
                  message: 'Error refreshing records',
                  type: 'error'
                });
              } finally {
                setTimeout(() => {
                  setIsRefreshing(false);
                }, 500);
              }
            }}
            className="refresh-button flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            disabled={isRefreshing}
          >
            <svg
              className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading records...</div>
        </div>
      ) : prestartRecords.length === 0 ? (
        <div className="empty-message">No prestart records available.</div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="table-cell text-left">Date</th>
                  <th className="table-cell text-left">Machine ID</th>
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
                    <td className="table-cell">
                      {/* Mostrar el ID personalizado de la máquina */}
                      {getCustomMachineId(record)}
                    </td>
                    <td className="table-cell">{record.operador}</td>
                    <td className="table-cell">{record.horasMaquina}</td>
                    <td className="table-cell">
                      {renderStatusBadge(record)}
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