'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Trash2, Eye, PlusCircle, PencilLine, Filter } from 'lucide-react';
import ModalNewOperator from './ModalNewOperator';
import DetailsModal from './DetailsModal';
import Notification from './Notification';
import '../styles/tables.css';

export default function TabOperator() {
  const { data: session } = useSession();
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentOperator, setCurrentOperator] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState(null);
  
  // Estados para filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    name: '',
    type: '',
    active: ''
  });

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    try {
      setLoading(true);
      
      // Construir URL con filtros si están activos
      let url = '/api/operators';
      const queryParams = [];
      
      if (filters.name) queryParams.push(`name=${encodeURIComponent(filters.name)}`);
      if (filters.type) queryParams.push(`type=${encodeURIComponent(filters.type)}`);
      if (filters.active) queryParams.push(`active=${filters.active}`);
      
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch operators');
      const data = await response.json();
      setOperators(data);
    } catch (error) {
      console.error('Error loading operators:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOperator = async (operatorData) => {
    try {
      const response = await fetch('/api/operators', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(operatorData),
      });

      if (!response.ok) throw new Error('Failed to add operator');
      
      const newOperator = await response.json();
      setOperators([...operators, newOperator]);
    } catch (error) {
      console.error('Error adding operator:', error);
      throw error;
    }
  };

  const handleDeleteOld = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este operador?')) {
      try {
        const response = await fetch(`/api/operators/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Error eliminando operador');
        }
        
        setNotification({
          show: true,
          message: 'Operador eliminado exitosamente',
          type: 'success'
        });
        
        await fetchOperators();
      } catch (error) {
        console.error('Error al eliminar operador:', error);
        setNotification({
          show: true,
          message: `Error al eliminar operador: ${error.message}`,
          type: 'error'
        });
      }
    }
  };

  const handleSubmitOld = async (formData) => {
    try {
      const url = currentOperator 
        ? `/api/operators/${currentOperator._id}`
        : '/api/operators';
      
      const method = currentOperator ? 'PUT' : 'POST';
      
      // Remove _id from formData when updating
      const { _id, ...dataToSend } = formData;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error saving operator');
      }
      
      setNotification({
        show: true,
        message: `Operador ${currentOperator ? 'actualizado' : 'creado'} exitosamente`,
        type: 'success'
      });

      await fetchOperators();
      handleCloseModal();
    } catch (error) {
      console.error('Submit error:', error);
      setNotification({
        show: true,
        message: `Error al guardar operador: ${error.message}`,
        type: 'error'
      });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentOperator(null);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const applyFilters = () => {
    setCurrentPage(1); // Resetear a la primera página
    fetchOperators();
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = operators.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(operators.length / itemsPerPage);

  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="machinary-container">
      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ ...notification, show: false })}
        />
      )}

      {/* Título principal */}
      <div className="mb-4">
        <h2 className="section-title">Operator & Technician Management</h2>
      </div>

      {/* Fila con botón de filtros a la izquierda y botón nuevo operador a la derecha */}
      <div className="flex justify-between items-center mb-4">
        {/* Lado izquierdo - Botón de filtros */}
        <div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
          >
            <Filter className="mr-2" size={18} />
            <span>Filtros</span>
            {showFilters ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 111.414 1.414l-4 4a1 1 01-1.414 0l-4-4a1 1 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 011.414-1.414l4 4a1 1 010 1.414l-4 4a1 1 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Lado derecho - Contador y botón nuevo operador */}
        <div className="flex items-center gap-4">
          {/* Contador de registros */}
          <div className="pagination-info text-sm text-gray-500">
            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, operators.length)} of {operators.length}
          </div>
          
          {/* Botón nuevo operador (ahora en el lado derecho) */}
          <button
            onClick={() => {
              setCurrentOperator(null);
              setShowModal(true);
            }}
            className="primary-button"
          >
            <PlusCircle className="button-icon" size={20} />
            <span>New Operator/Technician</span>
          </button>
        </div>
      </div>

      {/* Panel de filtros (visible solo cuando showFilters es true) */}
      {showFilters && (
        <div className="mb-4 p-4 bg-gray-100 rounded-lg transition-all duration-300 ease-in-out">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <input
                type="text"
                name="name"
                value={filters.name}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded"
                placeholder="Buscar por nombre"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded"
              >
                <option value="">Todos</option>
                <option value="Operador">Operador</option>
                <option value="Técnico">Técnico</option>
                <option value="Supervisor">Supervisor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <select
                name="active"
                value={filters.active}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded"
              >
                <option value="">Todos</option>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
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
                  name: '',
                  type: '',
                  active: ''
                });
                fetchOperators();
              }}
              className="ml-2 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      )}

      {operators.length === 0 ? (
        <div className="empty-message">No operators available.</div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Tipo</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Fecha Ingreso</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((operator) => (
                  <tr key={operator._id}>
                    <td>{operator.nombre}</td>
                    <td>{operator.apellido}</td>
                    <td>{operator.tipo}</td>
                    <td>{operator.telefono}</td>
                    <td>{operator.email}</td>
                    <td>{new Date(operator.fechaIngreso).toLocaleDateString()}</td>
                    <td className="table-cell">
                      <div className="table-actions">
                        <button
                          onClick={() => {
                            setSelectedOperator(operator);
                            setShowDetails(true);
                          }}
                          className="action-button view-button text-blue-600 hover:text-blue-800 p-2"
                          title="Ver detalles"
                        >
                          <Eye className="button-icon" size={20} />
                        </button>
                        <button
                          onClick={() => {
                            setCurrentOperator(operator);
                            setShowModal(true);
                          }}
                          className="action-button edit-button text-amber-600 hover:text-amber-800 p-2"
                          title="Editar"
                        >
                          <PencilLine className="button-icon" size={20} />
                        </button>
                        <button
                          onClick={() => handleDeleteOld(operator._id)}
                          className="action-button delete-button text-red-600 hover:text-red-800 p-2"
                          title="Eliminar"
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
        </>
      )}

      <ModalNewOperator
        show={showModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmitOld}
        currentOperator={currentOperator}
        initialData={currentOperator || {
          nombre: '',
          apellido: '',
          tipo: '',
          telefono: '',
          email: '',
          fechaIngreso: new Date().toISOString().split('T')[0],
          licencia: '',
          especialidad: '',
          activo: true
        }}
      />

      {showDetails && (
        <DetailsModal
          show={showDetails}
          onClose={() => {
            setShowDetails(false);
            setSelectedOperator(null);
          }}
          data={selectedOperator}
          type="operator"
        />
      )}
    </div>
  );
}