// components/TabOperator.js
import React, { useState, useEffect } from 'react';
import { Trash2, Eye, PlusCircle, PencilLine } from 'lucide-react';
import ModalNewOperator from './ModalNewOperator';
import '../styles/newoperator.css';


const TabOperator = () => {
  const [operators, setOperators] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentOperator, setCurrentOperator] = useState(null);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initial state for new operator
  const initialOperatorState = {
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    tipo: '',
    licencia: '',
    especialidad: '',
    fechaIngreso: new Date().toISOString().split('T')[0]
  };

  const fetchOperators = async () => {
    try {
      const response = await fetch('/api/operators');
      if (!response.ok) {
        throw new Error('Error fetching operators');
      }
      const data = await response.json();
      setOperators(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperators();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this operator?')) {
      try {
        const response = await fetch(`/api/operators/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Error deleting operator');
        }
        await fetchOperators(); // Refresh list after deletion
      } catch (err) {
        console.error('Delete error:', err);
        alert('Error deleting operator');
      }
    }
  };

  const handleView = (operator) => {
    setSelectedOperator(operator);
    setShowDetails(true);
  };

  const handleEdit = (operator) => {
    setCurrentOperator(operator);
    setShowModal(true);
  };

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
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Error saving operator');
      }

      // Reset state and refresh list
      setShowModal(false);
      setCurrentOperator(null);
      await fetchOperators();

    } catch (err) {
      console.error('Submit error:', err);
      alert('Error saving operator');
    }
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-center text-red-600 p-4">Error: {error}</div>;

  return (
    <div className="machinary-container">
      <div className="machinary-header">
        <h2 className="section-title">Operator and Technician Management</h2>
        <button
          onClick={() => {
            setCurrentOperator(null);
            setShowModal(true);
          }}
          className="primary-button flex items-center gap-2"
        >
          <PlusCircle className="w-5 h-5" />
          <span>New Operator/Technician</span>
        </button>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Start Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {operators.map((operator) => (
              <tr key={operator._id}>
                <td>{`${operator.nombre} ${operator.apellido}`}</td>
                <td>
                  <span className={`badge ${operator.tipo === 'operator' ? 'badge-blue' : 'badge-green'}`}>
                    {operator.tipo === 'operator' ? 'Operator' : 'Technician'}
                  </span>
                </td>
                <td>{operator.telefono || '-'}</td>
                <td>{operator.email || '-'}</td>
                <td>{new Date(operator.fechaIngreso).toLocaleDateString()}</td>
                <td>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleView(operator)}
                      className="action-button text-blue-600 hover:text-blue-800"
                      title="View details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(operator)}
                      className="action-button text-green-600 hover:text-green-800"
                      title="Edit"
                    >
                      <PencilLine className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(operator._id)}
                      className="action-button text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ModalNewOperator
        show={showModal}
        onClose={() => {
          setShowModal(false);
          setCurrentOperator(null);
        }}
        onSubmit={handleSubmit}
        currentOperator={currentOperator}
        initialData={currentOperator || initialOperatorState}
      />

      {showDetails && selectedOperator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full">
            <h3 className="text-xl font-bold mb-4">
              {selectedOperator.tipo === 'operator' ? 'Operator' : 'Technician'} Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Full Name:</p>
                <p>{`${selectedOperator.nombre} ${selectedOperator.apellido}`}</p>
              </div>
              <div>
                <p className="font-medium">Type:</p>
                <p>{selectedOperator.tipo === 'operator' ? 'Operator' : 'Technician'}</p>
              </div>
              <div>
                <p className="font-medium">Phone:</p>
                <p>{selectedOperator.telefono || '-'}</p>
              </div>
              <div>
                <p className="font-medium">Email:</p>
                <p>{selectedOperator.email || '-'}</p>
              </div>
              <div>
                <p className="font-medium">Start Date:</p>
                <p>{new Date(selectedOperator.fechaIngreso).toLocaleDateString()}</p>
              </div>
              {selectedOperator.tipo === 'operator' ? (
                <div>
                  <p className="font-medium">License Number:</p>
                  <p>{selectedOperator.licencia || '-'}</p>
                </div>
              ) : (
                <div>
                  <p className="font-medium">Specialty:</p>
                  <p>{selectedOperator.especialidad || '-'}</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabOperator;