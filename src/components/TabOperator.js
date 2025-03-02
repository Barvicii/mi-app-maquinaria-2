'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Trash2, Eye, PlusCircle, PencilLine } from 'lucide-react';
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

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    try {
      const response = await fetch('/api/operators');
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
                    <td className="actions-cell">
                      <button
                        onClick={() => {
                          setSelectedOperator(operator);
                          setShowDetails(true);
                        }}
                        className="action-button"
                        title="Ver detalles"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setCurrentOperator(operator);
                          setShowModal(true);
                        }}
                        className="action-button"
                        title="Editar"
                      >
                        <PencilLine size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteOld(operator._id)}
                        className="action-button delete"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
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