'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Eye, Trash2, AlertTriangle, RefreshCw, FileText } from 'lucide-react';
import '@/styles/tables.css';
import Notification from './Notification';
import DetailsModal from './DetailsModal';

const TabServices = ({ machineId, maquinas = [], suppressNotifications = false }) => {
  const [services, setServices] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    machineId: '',
    workplace: '',
    dateFrom: '',
    dateTo: '',
    status: ''
  });
  const [filterCount, setFilterCount] = useState(0);

  // Trabajos predefinidos para DetailsModal
  const trabajosPredefinidos = [
    { id: 1, descripcion: 'Cambio de Aceite' },
    { id: 2, descripcion: 'Reemplazo de Filtros' },
    { id: 3, descripcion: 'Revisión de Frenos' },
    { id: 4, descripcion: 'Rotación de Neumáticos' },
    { id: 5, descripcion: 'Control de Fluidos' },
    { id: 6, descripcion: 'Inspección de Correas' },
    { id: 7, descripcion: 'Prueba de Batería' },
    { id: 8, descripcion: 'Cambio Filtro de Aire' },
    { id: 9, descripcion: 'Revisión de Bujías' },
    { id: 10, descripcion: 'Inspección General' }
  ];

  // Modificar la función que muestra notificaciones
  const showNotificationMessage = useCallback((message, type = 'success') => {
    if (suppressNotifications) return;

    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
  }, [suppressNotifications]);

  // Función para manejar cambios en los filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  // Función para aplicar filtros
  const applyFilters = () => {
    fetchServices(true);
  };
  
  // Función para limpiar filtros
  const clearFilters = async () => {
    // Limpiar los filtros
    setFilters({
      machineId: '',
      workplace: '',
      dateFrom: '',
      dateTo: '',
      status: ''
    });
    
    // Hacer petición directa sin filtros para obtener todos los registros
    try {
      setLoading(true);
      setIsRefreshing(true);
      setError(null);
      
      const timestamp = Date.now();
      const url = `/api/services?_t=${timestamp}`;
      
      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-store'
        },
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching services: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ All services loaded after clearing filters:', data.length);
      
      setServices(data);
      showNotificationMessage("All services loaded successfully");
    } catch (error) {
      console.error('Error fetching all services:', error);
      setError('Failed to load services');
      showNotificationMessage("Failed to load services", "error");
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

  // Actualiza la función fetchServices para manejar correctamente el filtrado
  const fetchServices = useCallback(async (showNotification = false) => {
    try {
      setLoading(true);
      setIsRefreshing(true);
      setError(null);
      
      console.log('Fetching services...');
      
      // Añadir timestamp para prevenir caching
      const timestamp = Date.now();
      let url = `/api/services?_t=${timestamp}`;
      
      // Añadir filtros si existen
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
      
      if (filters.type) {
        url += `&type=${encodeURIComponent(filters.type)}`;
      }
      
      if (filters.status) {
        url += `&status=${encodeURIComponent(filters.status)}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-store'
        },
        credentials: 'same-origin' // Importante: incluir credenciales para autenticación
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching services: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Loaded ${data.length} services`);
      
      setServices(data);
      
      if (showNotification) {
        showNotificationMessage("Services loaded successfully");
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Failed to load services. Please try again.');
      showNotificationMessage("Failed to load services", "error");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [filters.machineId, filters.workplace, filters.dateFrom, filters.dateTo, filters.type, filters.status, showNotificationMessage]);

  // Cargar servicios cuando el componente se monta
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Función para obtener el workplace de un servicio
  const getServiceWorkplace = (service) => {
    // Intentar obtener el ID de la máquina del servicio
    let machineId = service.machineId || service.maquinaId;
    
    // Si no hay ID directo, buscar en otras propiedades
    if (!machineId && service.datos) {
      machineId = service.datos.machineId || service.datos.maquinaId;
    }
    
    // Buscar la máquina correspondiente
    if (machineId && maquinas.length > 0) {
      const machine = maquinas.find(m => m._id === machineId);
      if (machine) {
        return machine.workplace || 'N/A';
      }
    }
    
    // Fallback
    return 'N/A';
  };

  // Función para obtener el custom ID de la máquina para un servicio
  const getServiceCustomMachineId = (service) => {
    // Intentar obtener el ID de la máquina del servicio
    let machineId = service.machineId || service.maquinaId;
    
    // Si no hay ID directo, buscar en otras propiedades
    if (!machineId && service.datos) {
      machineId = service.datos.machineId || service.datos.maquinaId;
    }
    
    // Buscar la máquina correspondiente para obtener su custom ID actual
    if (machineId && maquinas.length > 0) {
      const machine = maquinas.find(m => m._id === machineId);
      if (machine) {
        return machine.machineId || machine.maquinariaId || machine.customId || 'No custom ID';
      }
    }
    
    // Fallback: usar los datos del servicio si no encontramos la máquina
    return service.customMachineId || 
           getServiceProperty(service, 'customMachineId') || 
           getServiceProperty(service, 'machineId') || 
           service.machineId || '—';
  };

  // Forzar re-render cuando las máquinas cambien
  useEffect(() => {
    // Solo forza un re-render, no necesita hacer nada específico
    // porque las funciones getServiceCustomMachineId y getServiceWorkplace
    // ya usan las máquinas actualizadas
  }, [maquinas]);

  // Función para eliminar un servicio
  const handleDelete = async (serviceId) => {
    try {
      if (!confirm('¿Está seguro de eliminar este registro?')) {
        return;
      }

      console.log(`Deleting service with ID: ${serviceId}`);

      setLoading(true);
      const timestamp = Date.now();
      const response = await fetch(`/api/services/${serviceId}?_t=${timestamp}`, {
        method: 'DELETE'
      });

      // Mejor manejo de errores
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Error response (${response.status}):`, errorData);

        let errorMsg = 'Error al eliminar el registro';
        try {
          const errorJson = JSON.parse(errorData);
          if (errorJson.error) {
            errorMsg = `Error: ${errorJson.error}`;
          }
        } catch (e) {
          // No es JSON válido, usar el texto como está
        }

        throw new Error(errorMsg);
      }

      showNotificationMessage('Registro eliminado exitosamente');

      // Actualizar la lista de servicios
      fetchServices();
    } catch (error) {
      console.error('Error al eliminar servicio:', error);
      showNotificationMessage(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Calcular elementos para la página actual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = services.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(services.length / itemsPerPage);

  // Funciones de paginación
  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Función auxiliar para obtener de forma segura datos anidados
  const getServiceProperty = (service, property) => {
    if (service[property] !== undefined) return service[property];
    if (service.datos && service.datos[property] !== undefined) return service.datos[property];
    return null;
  };

  // Mostrar loader durante la carga inicial
  if (loading && !isRefreshing) {
    return (
      <div className="main-content">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="machinary-container">
        <Notification 
          message={notificationMessage}
          type={notificationType}
          show={showNotification}
          onClose={() => setShowNotification(false)}
        />

        <div className="mb-4">
          <h2 className="section-title">Services</h2>
        </div>

        <div className="mb-4 flex justify-between items-center">
          <div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
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
            <div className="text-sm text-gray-500">
              Showing {services.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, services.length)} of ${services.length}` : 'No services found'}
            </div>

            <button
              onClick={() => fetchServices(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mb-4 p-4 bg-gray-100 rounded-lg transition-all duration-300 ease-in-out">
            <h3 className="font-semibold mb-2">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Machine ID</label>
                <input
                  type="text"
                  name="machineId"
                  value={filters.machineId}
                  onChange={handleFilterChange}
                  className="w-full p-2 border rounded"
                  placeholder="Machine ID"
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
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="">All</option>
                  <option value="Pendiente">Pending</option>
                  <option value="Completado">Completed</option>
                  <option value="En progreso">In Progress</option>
                </select>
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

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {services.length === 0 && !loading ? (
          <div className="empty-message p-8 text-center text-gray-500 bg-gray-50 rounded-md">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium">No service records</h3>
            <p className="mt-2">No service records are available for your machines.</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr className="table-header">
                    <th className="table-header-cell">Date</th>
                    <th className="table-header-cell">Machine ID</th>
                    <th className="table-header-cell">Workplace</th>
                    <th className="table-header-cell">Technician</th>
                    <th className="table-header-cell">Type</th>
                    <th className="table-header-cell">Current Hours</th>
                    <th className="table-header-cell">Next Service Hours</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="text-center py-4">Loading...</td>
                    </tr>
                  ) : services.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-4">No service records found.</td>
                    </tr>
                  ) : (
                    currentItems.map((service) => (
                      <tr key={service._id} className="table-row">
                        <td className="table-cell">
                          {service.fecha ? new Date(service.fecha).toLocaleDateString() : 
                           service.createdAt ? new Date(service.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="table-cell">
                          {getServiceCustomMachineId(service)}
                        </td>
                        <td className="table-cell">
                          {getServiceWorkplace(service)}
                        </td>
                        <td className="table-cell">
                          {getServiceProperty(service, 'tecnico') || '—'}
                        </td>
                        <td className="table-cell">
                          {getServiceProperty(service, 'tipoService') || '—'}
                        </td>
                        <td className="table-cell">
                          {getServiceProperty(service, 'horasActuales') || '—'}
                        </td>
                        <td className="table-cell">
                          {getServiceProperty(service, 'horasProximoService') || '—'}
                        </td>
                        <td className="table-cell">
                          <div className="table-actions">
                            <button
                              onClick={() => {
                                // Aplanar datos para mejor visualización
                                const flattenedService = {
                                  ...service,
                                  machineId: service.machineId,
                                  customMachineId: service.customMachineId || getServiceProperty(service, 'customMachineId'),
                                  tecnico: getServiceProperty(service, 'tecnico'),
                                  tipoService: getServiceProperty(service, 'tipoService'),
                                  horasActuales: getServiceProperty(service, 'horasActuales'),
                                  horasProximoService: getServiceProperty(service, 'horasProximoService'),
                                  trabajosRealizados: getServiceProperty(service, 'trabajosRealizados') || [],
                                  repuestos: getServiceProperty(service, 'repuestos'),
                                  observaciones: getServiceProperty(service, 'observaciones'),
                                  costo: getServiceProperty(service, 'costo'),
                                  maquina: getServiceProperty(service, 'maquina')
                                };
                                setSelectedRecord(flattenedService);
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
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
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
      </div>

      {/* Modal de detalles */}
      {showDetails && selectedRecord && (
        <DetailsModal
          show={showDetails}
          onClose={() => {
            setShowDetails(false);
            setSelectedRecord(null);
          }}
          data={selectedRecord}
          type="service"
          trabajosPredefinidos={trabajosPredefinidos}
        />
      )}
    </div>
  );
};

export default TabServices;