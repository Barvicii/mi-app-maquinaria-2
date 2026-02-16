import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Trash2, Eye, AlertTriangle, RefreshCw } from 'lucide-react';
import PropTypes from 'prop-types';
import '@/styles/tables.css';
import DetailsModal from './DetailsModal';
import Notification from './Notification';

const TabPreStart = ({ maquinas = [], suppressNotifications = false }) => {
  const [prestartRecords, setPrestartRecords] = useState([]);
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
  
  // Forzar re-render cuando las máquinas cambien
  useEffect(() => {
    console.log('🔄 TabPreStart: Maquinas array updated:', maquinas.length, 'items');
    maquinas.forEach(m => {
      console.log(`Equipment: ${m.machineId} (${m._id}) - Type: ${m.equipmentType}`);
    });
  }, [maquinas]);

  // Add state for refresh animation
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [records, setRecords] = useState({
    showing: '0-0 of 0',
    total: 0
  });

  // Añadir filtros en el componente TabPreStart
  const [filters, setFilters] = useState({
    machineId: '',
    workplace: '',
    dateFrom: '',
    dateTo: ''
  });

  const [showFilters, setShowFilters] = useState(false);
  const [filterCount, setFilterCount] = useState(0);

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

  const clearFilters = async () => {
    // Limpiar los filtros
    setFilters({
      machineId: '',
      workplace: '',
      dateFrom: '',
      dateTo: ''
    });
    
    // Hacer petición directa sin filtros para obtener todos los registros
    try {
      setLoading(true);
      setIsRefreshing(true);
      setError(null);
      
      const timestamp = Date.now();
      const url = `/api/prestart?_t=${timestamp}`;
      
      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-store'
        },
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching prestart checks: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ All prestart records loaded after clearing filters:', data.length);
      
      setPrestartRecords(data);
      
      setRecords({
        showing: `1-${Math.min(itemsPerPage, data.length)} of ${data.length}`,
        total: data.length
      });
      
      showNotificationIfAllowed("All prestart records loaded successfully");
    } catch (error) {
      console.error('Error fetching all prestart records:', error);
      setError('Failed to load prestart records');
      showNotificationIfAllowed("Failed to load prestart records", "error");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Actualizar el contador de filtros activos
  useEffect(() => {
    const count = Object.values(filters).filter(value => value.trim() !== '').length;
    setFilterCount(count);
  }, [filters]);

  // Helper function to show notifications if allowed
  const showNotificationIfAllowed = useCallback((message, type = 'success') => {
    if (suppressNotifications) return;
    
    setNotification({
      show: true,
      message,
      type
    });
  }, [suppressNotifications]);

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = prestartRecords.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(prestartRecords.length / itemsPerPage);

  const fetchPrestarts = useCallback(async (showNotification = false) => {
    try {
      setLoading(true);
      setIsRefreshing(true);
      setError(null);
      
      console.log('Fetching prestart checks...');
      
      // Construir URL con filtros
      const timestamp = Date.now();
      let url = `/api/prestart?_t=${timestamp}`;
      
      if (filters.machineId) {
        url += `&machineId=${encodeURIComponent(filters.machineId)}`;
      }
      
      if (filters.workplace) {
        url += `&workplace=${encodeURIComponent(filters.workplace)}`;
      }
      
      if (filters.dateFrom) {
        url += `&dateFrom=${encodeURIComponent(filters.dateFrom)}`;
      }
      
      if (filters.dateTo) {
        url += `&dateTo=${encodeURIComponent(filters.dateTo)}`;
      }
      
      console.log('Requesting prestart data from URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-store'
        },
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching prestart checks: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Loaded ${data.length} prestart checks`);
      console.log('Sample prestart data:', data.length > 0 ? data[0] : 'No data');
      
      // Actualizar el estado con los datos obtenidos
      setPrestartRecords(data);
      
      // Actualizar la información de paginación
      setRecords({
        showing: data.length > 0 ? `1-${Math.min(itemsPerPage, data.length)} of ${data.length}` : '0-0 of 0',
        total: data.length
      });
      
      if (showNotification) {
        showNotificationIfAllowed("Prestart checks loaded successfully");
      }
    } catch (error) {
      console.error('Error fetching prestart checks:', error);
      setError('Failed to load prestart checks. Please try again.');
      showNotificationIfAllowed("Failed to load prestart checks", "error");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [filters.machineId, filters.workplace, filters.dateFrom, filters.dateTo, itemsPerPage, showNotificationIfAllowed]);

  useEffect(() => {
    fetchPrestarts();
  }, [fetchPrestarts]);

  // Forzar re-render cuando las máquinas cambien
  useEffect(() => {
    // Solo forza un re-render, no necesita hacer nada específico
    // porque las funciones getCustomMachineId y getMachineWorkplace
    // ya usan las máquinas actualizadas
  }, [maquinas]);

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

  // Modificar la función renderStatusBadge para manejar mejor la estructura de checkValues
  const renderStatusBadge = (record) => {
    // Primero verificamos si tenemos checkValues directamente en el record
    if (record.checkValues) {
      // Si tenemos checkValues, comprobamos que todos los valores sean true
      const allChecksPassed = Object.values(record.checkValues).every(value => value === true);
      return (
        <span className={`status-badge ${allChecksPassed ? 'status-ok' : 'status-warning'}`}>
          {allChecksPassed ? 'OK' : 'Needs Review'}
        </span>
      );
    }
    
    // Soporte para la estructura anterior (por si hay registros antiguos)
    const checkItems = [
      'aceite', 'agua', 'neumaticos', 'nivelCombustible',
      'lucesYAlarmas', 'frenos', 'extintores', 'cinturonSeguridad'
    ];
    
    // Helper function to get value from different data structures
    const getValue = (record, field) => {
      if (record[field] !== undefined) return record[field];
      if (record.datos && record.datos[field] !== undefined) return record.datos[field];
      if (record.checkValues && record.checkValues[field] !== undefined) return record.checkValues[field];
      return false;
    };
    
    const allChecksPass = checkItems.every(item => getValue(record, item));
    
    return (
      <span className={`status-badge ${allChecksPass ? 'status-ok' : 'status-warning'}`}>
        {allChecksPass ? 'OK' : 'Needs Review'}
      </span>
    );
  };
  
  // Get equipment type for display
  const getEquipmentType = (record) => {
    // FIRST: Check if the record has equipment type info directly (this is the most reliable)
    if (record.equipmentType) {
      console.log('✅ Equipment type from record root:', record.equipmentType);
      return record.equipmentType === 'vehicle' ? 'Vehicle' : 'Machine';
    }

    if (record.datos && record.datos.equipmentType) {
      console.log('✅ Equipment type from record datos:', record.datos.equipmentType);
      return record.datos.equipmentType === 'vehicle' ? 'Vehicle' : 'Machine';
    }

    // SECOND: Try to find the equipment in the maquinas array
    let dbMachineId = null;
    if (record.maquinaId) dbMachineId = record.maquinaId;
    else if (record.machineId) dbMachineId = record.machineId;
    else if (record.datos && record.datos.machineId) dbMachineId = record.datos.machineId;
    else if (record.datos && record.datos.maquinaId) dbMachineId = record.datos.maquinaId;
    
    if (dbMachineId) {
      const equipment = maquinas.find(m => m._id === dbMachineId);
      if (equipment) {
        console.log('✅ Found equipment for prestart:', equipment.machineId, 'type:', equipment.equipmentType);
        return equipment.equipmentType === 'vehicle' ? 'Vehicle' : 'Machine';
      } else {
        console.log('❌ Equipment not found in maquinas array for ID:', dbMachineId);
      }
    }
    
    // Fallback
    console.log('⚠️ No equipment type found, defaulting to Machine for record:', record._id);
    return 'Machine';
  };

  // Get hours or kilometers based on equipment type
  const getHoursOrKm = (record) => {
    const equipmentType = getEquipmentType(record);
    
    if (equipmentType === 'Vehicle') {
      // For vehicles, show kilometers - check multiple possible fields
      return record.kilometerMileage || 
             (record.datos && record.datos.kilometerMileage) || 
             (record.datos && record.datos.currentKilometers) ||
             record.currentKilometers || '-';
    } else {
      // For machines, show hours
      return record.horasMaquina || 
             (record.datos && record.datos.horasMaquina) || '-';
    }
  };

  // Get custom machine ID for display
  const getCustomMachineId = (record) => {
    console.log('🔍 Full prestart record:', record);
    
    // First, get the database ID from the record
    let dbMachineId = null;
    if (record.maquinaId) dbMachineId = record.maquinaId;
    else if (record.machineId) dbMachineId = record.machineId;
    else if (record.maquinaId) dbMachineId = record.maquinaId;
    else if (record.datos && record.datos.machineId) dbMachineId = record.datos.machineId;
    else if (record.datos && record.datos.maquinaId) dbMachineId = record.datos.maquinaId;
    
    console.log('🔍 Looking for equipment with database ID:', dbMachineId);
    console.log('🔍 Available equipment in maquinas array:', maquinas.length, 'items');
    
    // Now try to find the matching machine to get its custom ID
    if (dbMachineId) {
      // First try exact _id match
      let machine = maquinas.find(m => m._id === dbMachineId);
      
      // If not found, try machineId match (custom ID)
      if (!machine) {
        console.log('❌ No exact _id match, trying machineId match...');
        machine = maquinas.find(m => m.machineId === dbMachineId);
      }
      
      if (machine) {
        console.log('✅ Found equipment:', machine.machineId, 'type:', machine.equipmentType, '_id:', machine._id);
        // Return the custom ID assigned by the user
        return machine.machineId || machine.maquinariaId || 'No custom ID';
      } else {
        console.log('❌ Equipment not found in maquinas array');
        console.log('Available equipment details:');
        maquinas.forEach(m => {
          console.log(`  - ${m.machineId} (_id: ${m._id}, type: ${m.equipmentType})`);
        });
      }
    }
    
    // If no machine found or no ID, try to get the custom ID directly from the prestart
    if (record.maquina) {
      console.log('📝 Using maquina field from record:', record.maquina);
      return record.maquina;
    }
    
    // Try other possible fields
    const possibleIds = [
      record.customMachineId,
      record.datos?.customMachineId,
      record.datos?.maquina,
      record.equipmentId
    ];
    
    for (const id of possibleIds) {
      if (id) {
        console.log('📝 Using fallback ID:', id);
        return id;
      }
    }
    
    // Fallback
    console.log('⚠️ No ID found, using fallback');
    return "ID not found";
  };

  // Get machine workplace for display
  const getMachineWorkplace = (record) => {
    // First, get the database ID from the record
    let dbMachineId = null;
    if (record.maquinaId) dbMachineId = record.maquinaId;
    else if (record.machineId) dbMachineId = record.machineId;
    else if (record.maquinaId) dbMachineId = record.maquinaId;
    else if (record.datos && record.datos.machineId) dbMachineId = record.datos.machineId;
    else if (record.datos && record.datos.maquinaId) dbMachineId = record.datos.maquinaId;
    
    // Now try to find the matching machine to get its workplace
    if (dbMachineId) {
      const machine = maquinas.find(m => m._id === dbMachineId);
      if (machine) {
        return machine.workplace || 'N/A';
      }
    }
    
    // Fallback
    return 'N/A';
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
            className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center ${showFilters ? 'bg-blue-600' : ''}`}
          >
            <span className="mr-2">Filters {filterCount > 0 && `(${filterCount})`}</span>
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
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Panel de filtros (solo se muestra si showFilters es true) */}
      {showFilters && (
        <div className="mb-4 p-4 bg-gray-100 rounded-lg transition-all duration-300 ease-in-out">
          <h3 className="font-semibold mb-2">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Equipment ID</label>
              <input
                type="text"
                name="machineId"
                value={filters.machineId}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded"
                placeholder="Machine/Vehicle ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Workplace</label>
              <input
                type="text"
                name="workplace"
                value={filters.workplace}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded"
                placeholder="Workplace"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">From</label>
              <input
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To</label>
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
              Apply Filters
            </button>
            <button 
              onClick={clearFilters}
              className="ml-2 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            >
              Clear Filters
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
                  <th className="table-cell text-left">Equipment ID</th>
                  <th className="table-cell text-left">Type</th>
                  <th className="table-cell text-left">Workplace</th>
                  <th className="table-cell text-left">Operator</th>
                  <th className="table-cell text-left">Hours/KM</th>
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
                      {getCustomMachineId(record)}
                    </td>
                    <td className="table-cell">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        getEquipmentType(record) === 'Vehicle' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {getEquipmentType(record)}
                      </span>
                    </td>
                    <td className="table-cell">
                      {getMachineWorkplace(record)}
                    </td>
                    <td className="table-cell">
                      {record.operador || (record.datos && record.datos.operador) || '-'}
                    </td>
                    <td className="table-cell">
                      {(() => {
                        const value = getHoursOrKm(record);
                        const type = getEquipmentType(record);
                        if (value === '-') return '-';
                        return type === 'Vehicle' ? `${value} km` : `${value} hrs`;
                      })()}
                    </td>
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
                          onClick={async () => {
                            // Fetch equipment data for the prestart based on type
                            let equipmentData = null;
                            if (record.maquinaId) {
                              try {
                                const equipmentType = getEquipmentType(record);
                                console.log('🔍 Fetching equipment data for type:', equipmentType);
                                
                                let response;
                                if (equipmentType === 'Vehicle') {
                                  // Try vehicles endpoint first
                                  response = await fetch(`/api/vehicles/${record.maquinaId}?public=true`);
                                  if (response.ok) {
                                    equipmentData = await response.json();
                                    console.log('✅ Fetched vehicle data for prestart modal:', equipmentData);
                                  } else {
                                    console.log('❌ Vehicle not found, trying machines endpoint');
                                    // Fallback to machines endpoint
                                    response = await fetch(`/api/machines/${record.maquinaId}?public=true`);
                                    if (response.ok) {
                                      equipmentData = await response.json();
                                      console.log('✅ Fetched machine data (fallback) for prestart modal:', equipmentData);
                                    }
                                  }
                                } else {
                                  // Try machines endpoint first
                                  response = await fetch(`/api/machines/${record.maquinaId}?public=true`);
                                  if (response.ok) {
                                    equipmentData = await response.json();
                                    console.log('✅ Fetched machine data for prestart modal:', equipmentData);
                                  } else {
                                    console.log('❌ Machine not found, trying vehicles endpoint');
                                    // Fallback to vehicles endpoint
                                    response = await fetch(`/api/vehicles/${record.maquinaId}?public=true`);
                                    if (response.ok) {
                                      equipmentData = await response.json();
                                      console.log('✅ Fetched vehicle data (fallback) for prestart modal:', equipmentData);
                                    }
                                  }
                                }
                              } catch (error) {
                                console.error('💥 Error fetching equipment data for modal:', error);
                              }
                            }
                            
                            setSelectedRecord({
                              ...record,
                              createdAt: record.createdAt || record.fecha,
                              machine: equipmentData // Add equipment data to the record
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
  suppressNotifications: PropTypes.bool,
  onRefresh: PropTypes.func,
};

export default TabPreStart;