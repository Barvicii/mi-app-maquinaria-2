// components/TabPreStart.js
import React, { useState, useEffect } from 'react';
import { Trash2, Eye } from 'lucide-react';
import DetailsModal from './DetailsModal';

const TabPreStart = () => {
  const [prestartRecords, setPrestartRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPreStarts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/prestart');
      if (!response.ok) {
        throw new Error('Error al cargar los registros');
      }
      const data = await response.json();
      console.log('Datos cargados:', data);
      setPrestartRecords(data.data || []);
    } catch (error) {
      console.error('Error al cargar prestarts:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreStarts();
  }, []);

  const handleDeletePrestart = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este registro?')) {
      try {
        console.log('Intentando eliminar registro con ID:', id);
        
        const response = await fetch(`/api/prestart/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });
  
        const result = await response.json();
        console.log('Respuesta del servidor:', result);
  
        if (!response.ok) {
          throw new Error(result.error || 'Error al eliminar el registro');
        }
  
        // Actualizar el estado local removiendo el registro eliminado
        setPrestartRecords(prevRecords => 
          prevRecords.filter(record => record._id !== id)
        );
  
        // Opcional: Mostrar mensaje de éxito
        alert('Registro eliminado exitosamente');
  
      } catch (error) {
        console.error('Error al eliminar registro:', error);
        alert(error.message || 'Error al eliminar el registro');
      }
    }
  };
  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = prestartRecords.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(prestartRecords.length / itemsPerPage);

  if (loading) {
    return <div className="p-4 text-center">Cargando registros...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-600">Error: {error}</div>;
  }

  return (
    <div className="machinary-container">
      <div className="machinary-header">
        <h2 className="section-title">Pre-Start Records</h2>
        <div className="flex items-center gap-4">
          <div className="pagination-info">
            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, prestartRecords.length)} of{' '}
            {prestartRecords.length}
          </div>
        </div>
      </div>

      <div className="table-wrapper">
        {prestartRecords.length === 0 ? (
          <p className="text-center py-4">No hay registros disponibles</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr className="bg-gray-50">
                <th className="table-cell text-left">Fecha</th>
                <th className="table-cell text-left">Máquina</th>
                <th className="table-cell text-left">Operador</th>
                <th className="table-cell text-left">Horas</th>
                <th className="table-cell text-left">Estado</th>
                <th className="table-cell text-left">Observaciones</th>
                <th className="table-cell text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((record) => (
                <tr key={record._id} className="table-row">
                  <td className="table-cell">
                    {new Date(record.fecha).toLocaleDateString()}
                  </td>
                  <td className="table-cell">{record.datos.maquina}</td>
                  <td className="table-cell">{record.datos.operador}</td>
                  <td className="table-cell">{record.datos.horasMaquina}</td>
                  <td className="table-cell">
                    <span className={`status-badge ${
                      Object.values(record.datos).every(val => val === true || typeof val !== 'boolean')
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {Object.values(record.datos).every(val => val === true || typeof val !== 'boolean')
                        ? 'OK'
                        : 'Con observaciones'}
                    </span>
                  </td>
                  <td className="table-cell">{record.datos.observaciones || '-'}</td>
                  <td className="table-cell">
                    <div className="table-actions">
                      <button
                        onClick={() => {
                          setSelectedRecord(record);
                          setShowDetails(true);
                        }}
                        className="action-button text-green-600 hover:text-green-800 p-2"
                        title="Ver detalles"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeletePrestart(record._id)}
                        className="action-button text-red-600 hover:text-red-800 p-2"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {prestartRecords.length > itemsPerPage && (
        <div className="pagination-controls">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            Previous
          </button>
          <div className="page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
              <button
                key={number}
                onClick={() => setCurrentPage(number)}
                className={`page-number ${currentPage === number ? 'active' : ''}`}
              >
                {number}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            Next
          </button>
        </div>
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

export default TabPreStart;