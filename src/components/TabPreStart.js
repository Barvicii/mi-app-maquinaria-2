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

  // Añadir filtros en el componente TabPreStart
  const [filters, setFilters] = useState({
    machineId: '',
    dateFrom: '',
    dateTo: ''
  });

  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const applyFilters = () => {
    fetchPrestarts(true);
  };

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
      
      // Construir URL con filtros
      const timestamp = Date.now();
      let url = `/api/prestart?_t=${timestamp}`;
      
      if (filters.machineId) {
        url += `&machineId=${encodeURIComponent(filters.machineId)}`;
      }
      
      if (filters.dateFrom) {
        url += `&dateFrom=${encodeURIComponent(filters.dateFrom)}`;
      }
      
      if (filters.dateTo) {
        url += `&dateTo=${encodeURIComponent(filters.dateTo)}`;
      }
      
      console.log(`[TabPreStart] Consultando API con URL: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Verificar si data es un array
      if (!Array.isArray(data)) {
        console.warn('API response is not an array:', data);
        setPrestartRecords([]);
        setRecords({
          showing: '0-0 of 0',
          total: 0
        });
        return;
      }
      
      console.log(`Loaded ${data.length} prestart records`);
      
      // Mapear datos para normalizar formato si es necesario
      const formattedRecords = data.map(record => ({
        ...record,
        _id: record._id.toString(), // Asegurar que _id sea string
        fecha: record.fecha || record.createdAt // Usar fecha o createdAt
      }));
      
      setPrestartRecords(formattedRecords);

      // Update records count
      const recordsCount = formattedRecords.length;
      const start = recordsCount > 0 ? indexOfFirstItem + 1 : 0;
      const end = Math.min(indexOfLastItem, recordsCount);
      
      setRecords({
        showing: `${start}-${end} of ${recordsCount}`,
        total: recordsCount
      });
      
      if (showNotification) {
        setNotification({
          show: true,
          message: 'Records refreshed successfully',
          type: 'success'
        });
      }
    } catch (err) {
      console.error('[ERROR TabPreStart] Error cargando prestarts:', err);
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

  // Mejorar la función handleDeletePrestart
  const handleDeletePrestart = async (id) => {
    if (!window.confirm('¿Está seguro que desea eliminar este prestart check?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      console.log(`Eliminando prestart con ID: ${id}`);
      
      const response = await fetch(`/api/prestart/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error response:', data);
        throw new Error(data.error || 'Failed to delete prestart check');
      }
      
      // Mostrar notificación de éxito
      setNotification({
        show: true,
        message: 'Prestart check eliminado exitosamente',
        type: 'success'
      });
      
      // Actualizar la lista de prestarts
      fetchPrestarts();
    } catch (error) {
      console.error('Error deleting prestart:', error);
      setNotification({
        show: true,
        message: `Error: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
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
      'aceite', 'agua', 'neumaticos', 'nivelCombustible',
      'lucesYAlarmas', 'frenos', 'extintores', 'cinturonSeguridad'
    ];

    // Verificar si los checks están en la raíz o en el objeto datos
    const data = record.datos || record;
    
    const allChecksPass = checkItems.every(item => data[item] === true);

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
      
      <div className="mb-4">
        <h2 className="section-title">PreStart Checks</h2>
      </div>

      {/* Barra superior con botón de filtro a la izquierda y refresh a la derecha */}
      <div className="mb-4 flex justify-between items-center">
        <div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
          >
            <span className="mr-2">Filtros</span>
            {showFilters ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Contador de registros */}
          <div className="text-sm text-gray-500">
            Showing {records.showing}
          </div>
          
          {/* Botón de refresh, ahora ubicado a la derecha */}
          <button
            onClick={() => fetchPrestarts(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Refrescar
          </button>
        </div>
      </div>

      {/* Panel de filtros (solo se muestra si showFilters es true) */}
      {showFilters && (
        <div className="mb-4 p-4 bg-gray-100 rounded-lg transition-all duration-300 ease-in-out">
          <h3 className="font-semibold mb-2">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">ID Máquina</label>
              <input
                type="text"
                name="machineId"
                value={filters.machineId}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded"
                placeholder="ID de la máquina"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Desde</label>
              <input
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hasta</label>
              <input
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <div className="mt-2">
            <button 
              onClick={applyFilters}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Aplicar Filtros
            </button>
            <button 
              onClick={() => {
                setFilters({
                  machineId: '',
                  dateFrom: '',
                  dateTo: ''
                });
                fetchPrestarts(true);
              }}
              className="ml-2 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      )}

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
                    <td className="table-cell">{record.operador || (record.datos && record.datos.operador) || '-'}</td>
                    <td className="table-cell">{record.horasMaquina || (record.datos && record.datos.horasMaquina) || '-'}</td>
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