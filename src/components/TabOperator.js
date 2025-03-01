import React, { useState, useEffect } from 'react';
import { Trash2, Eye, PlusCircle, PencilLine } from 'lucide-react';
import ModalNewOperator from './ModalNewOperator';
import DetailsModal from './DetailsModal';
import Notification from './Notification';
import '../styles/tables.css';

const TabOperator = () => {
  // Add notification state
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentOperator, setCurrentOperator] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState(null);

  // Fetch operators
  const fetchOperators = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/operators');
      if (!response.ok) throw new Error('Error fetching operators');
      const data = await response.json();
      setOperators(data);
    } catch (error) {
      console.error('Error loading operators:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperators();
  }, []);

  // Clear form when closing modal
  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentOperator(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este operador?')) {
      try {
        const response = await fetch(`/api/operators/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Error eliminando operador');
        }
        
        // Show success notification
        setNotification({
          show: true,
          message: 'Operador eliminado exitosamente',
          type: 'success'
        });
        
        // Refresh the list
        await fetchOperators();
      } catch (error) {
        console.error('Error al eliminar operador:', error);
        // Show error notification
        setNotification({
          show: true,
          message: `Error al eliminar operador: ${error.message}`,
          type: 'error'
        });
      }
    }
  };

  // Handle submit with notifications
  const handleSubmit = async (formData) => {
    try {
      const url = currentOperator 
        ? `/api/operators/${currentOperator._id}`
        : '/api/operators';
      
      const method = currentOperator ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          fechaIngreso: formData.fechaIngreso || new Date().toISOString().split('T')[0]
        }),
      });

      if (!response.ok) throw new Error('Error saving operator');
      
      // Show success notification
      setNotification({
        show: true,
        message: `Operador ${currentOperator ? 'actualizado' : 'creado'} exitosamente`,
        type: 'success'
      });

      await fetchOperators();
      handleCloseModal();
    } catch (error) {
      console.error('Submit error:', error);
      // Show error notification
      setNotification({
        show: true,
        message: 'Error al guardar operador',
        type: 'error'
      });
    }
  };

  // Calculate pagination
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-text">Loading operators...</div>
      </div>
    );
  }

  return (
    <div className="machinary-container">
      {/* Add Notification component */}
      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ ...notification, show: false })}
        />
      )}

      <div className="machinary-header">
        <h2 className="section-title">Operator & Technician Management</h2>
        <div className="flex items-center gap-4">
          <div className="pagination-info">
            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, operators.length)} of {operators.length}
          </div>
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

      {operators.length === 0 ? (
        <div className="empty-message">No operators available.</div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="table-cell text-left">Name</th>
                  <th className="table-cell text-left">Type</th>
                  <th className="table-cell text-left">Phone</th>
                  <th className="table-cell text-left">Email</th>
                  <th className="table-cell text-left">Start Date</th>
                  <th className="table-cell text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((operator) => (
                  <tr key={operator._id} className="table-row">
                    <td className="table-cell">
                      {`${operator.nombre} ${operator.apellido}`}
                    </td>
                    <td className="table-cell">
                      <span className={`status-badge ${
                        operator.tipo === 'operator'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {operator.tipo === 'operator' ? 'Operator' : 'Technician'}
                      </span>
                    </td>
                    <td className="table-cell">{operator.telefono || '-'}</td>
                    <td className="table-cell">{operator.email || '-'}</td>
                    <td className="table-cell">
                      {operator.fechaIngreso ? new Date(operator.fechaIngreso).toLocaleDateString() : '-'}
                    </td>
                    <td className="table-cell">
                      <div className="table-actions">
                        <button
                          onClick={() => {
                            setSelectedOperator(operator);
                            setShowDetails(true);
                          }}
                          className="action-button view-button text-blue-600 hover:text-blue-800 p-2"
                          title="View details"
                        >
                          <Eye className="button-icon" size={20} />
                        </button>
                        <button
                          onClick={() => {
                            setCurrentOperator({
                              ...operator,
                              fechaIngreso: operator.fechaIngreso?.split('T')[0]
                            });
                            setShowModal(true);
                          }}
                          className="action-button edit-button text-green-600 hover:text-green-800 p-2"
                          title="Edit"
                        >
                          <PencilLine className="button-icon" size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(operator._id)}
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
        onSubmit={handleSubmit}
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
};

export default TabOperator;