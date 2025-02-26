import React, { useState } from 'react';
import { PlusCircle, Edit2, Trash2, QrCode } from 'lucide-react';
import MaquinaModal from './MaquinaModal';
import '../styles/layout.css';
import '../styles/machinary.css';


// StatusBadge Component
const StatusBadge = ({ maquina }) => {
    const calculateStatus = () => {
        if (!maquina.horasActuales || !maquina.proximoService) {
            return {
                label: 'No data',
                color: 'bg-gray-100 text-gray-800',
            };
        }

        const horasRestantes = maquina.proximoService - maquina.horasActuales;

        if (horasRestantes <= 0) {
            return {
                label: 'Urgent Service',
                color: 'bg-red-100 text-red-800',
            };
        }

        if (horasRestantes <= 50) {
            return {
                label: 'Next Service',
                color: 'bg-yellow-100 text-yellow-800',
            };
        }

        return {
            label: 'In Operation',
            color: 'bg-green-100 text-green-800',
        };
    };

    const status = calculateStatus();

    return (
        <span className={`status-badge ${status.color}`}>
            {status.label}
        </span>
    );
};


// NoData Component
const NoData = () => (
    <div className="no-data">
        <p className="no-data-title">No machines registered</p>
        <p className="no-data-subtitle">Click on "New Machine" to add one</p>
    </div>
);

// Main Component TabMachinary
const TabMachinary = ({ maquinas, setMaquinas }) => {
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [maquinaSeleccionada, setMaquinaSeleccionada] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Initial state for new machine
    const initialMaquinaState = {
        nombre: '',
        modelo: '',
        marca: '',
        serie: '',
        maquinariaId: '',
        anio: '',
        horasActuales: '',
        ultimoService: '',
        proximoService: '',
        aceiteMotor: { tipo: '', capacidad: '', marca: '' },
        aceiteHidraulico: { tipo: '', capacidad: '', marca: '' },
        aceiteTransmision: { tipo: '', capacidad: '', marca: '' },
        filtros: {
            motor: '',
            motorMarca: '',
            transmision: '',
            transmisionMarca: '',
            combustible: '',
            combustibleMarca: '',
        },
        neumaticos: {
            delanteros: { tamano: '', presion: '', marca: '' },
            traseros: { tamano: '', presion: '', marca: '' },
        },
    };
    const [nuevaMaquina, setNuevaMaquina] = useState(initialMaquinaState);

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = maquinas.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(maquinas.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handlePrevious = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    // Modal handlers
    const handleNuevaMaquina = () => {
        setModalType('nueva-maquina');
        setMaquinaSeleccionada(null);
        setNuevaMaquina(initialMaquinaState); // Reset form
        setShowModal(true);
    };

    const handleEditarMaquina = (maquina) => {
        console.log('Editando máquina:', maquina);
        setMaquinaSeleccionada(maquina);
        setModalType('editar');
        setShowModal(true);
      };

      const handleEliminarMaquina = async (maquina) => {
        if (!window.confirm('¿Está seguro de que desea eliminar esta máquina?')) {
          return;
        }
      
        try {
          // Get the ID to use for deletion (prefer _id if available)
          const idToDelete = maquina._id || maquina.id;
          
          if (!idToDelete) {
            throw new Error('No se encontró un ID válido para la máquina');
          }
      
          console.log('Attempting to delete machine:', maquina);
          console.log('Using ID:', idToDelete);
      
          // Update local state optimistically
          const maquinasActualizadas = maquinas.filter(m => 
            (m._id !== idToDelete) && (m.id !== idToDelete)
          );
          setMaquinas(maquinasActualizadas);
          localStorage.setItem('maquinas', JSON.stringify(maquinasActualizadas));
      
          // Make the API call
          const response = await fetch(`/api/maquinas/${idToDelete}`, {
            method: 'DELETE',
          });
      
          const result = await response.json();
      
          if (!response.ok) {
            // Revert changes if the API call fails
            setMaquinas(maquinas);
            localStorage.setItem('maquinas', JSON.stringify(maquinas));
            throw new Error(result.error || 'Error al eliminar la máquina');
          }
      
          // If successful, refresh the list from the server
          const refreshResponse = await fetch('/api/maquinas');
          if (refreshResponse.ok) {
            const refreshedData = await refreshResponse.json();
            setMaquinas(refreshedData);
            localStorage.setItem('maquinas', JSON.stringify(refreshedData));
          }
      
          alert('Máquina eliminada correctamente');
      
        } catch (error) {
          console.error('Error al eliminar máquina:', error);
          alert(`Error al eliminar la máquina: ${error.message}`);
        }
      };

    const handleGenerarQR = (maquina) => {
        console.log('Generate QR for:', maquina);
    };

    // Function to add new machine
    const agregarMaquina = async () => {
        try {
            // Crear la máquina con ID temporal
            const maquinaConId = {
                ...nuevaMaquina,
                id: Date.now().toString() // ID temporal
            };
    
            // Primero guardar en MongoDB
            const response = await fetch('/api/maquinas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(maquinaConId),
            });
    
            if (!response.ok) {
                throw new Error('Error al guardar en la base de datos');
            }
    
            // Obtener la respuesta con el ID de MongoDB
            const maquinaGuardada = await response.json();
    
            // Actualizar con el ID correcto
            const maquinaFinal = {
                ...maquinaConId,
                id: maquinaGuardada._id || maquinaGuardada.id // Usar el ID devuelto por MongoDB
            };
    
            // Actualizar estado local y localStorage
            const maquinasActualizadas = [...maquinas, maquinaFinal];
            setMaquinas(maquinasActualizadas);
            localStorage.setItem('maquinas', JSON.stringify(maquinasActualizadas));
            
            setNuevaMaquina(initialMaquinaState);
            setShowModal(false);
        } catch (error) {
            console.error('Error al agregar máquina:', error);
            alert('Error al guardar la máquina. Por favor, intente nuevamente.');
        }
    };

    // Function to update existing machine
    const actualizarMaquina = async (maquinaActualizada) => {
        try {
          const response = await fetch(`/api/maquinas/${maquinaActualizada._id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(maquinaActualizada),
          });
      
          const result = await response.json();
      
          if (!response.ok) {
            throw new Error(result.error || 'Error al actualizar en la base de datos');
          }
      
          // Update the machines list with the response from the server
          const maquinasActualizadas = maquinas.map((m) =>
            m._id === result.data._id ? result.data : m
          );
      
          setMaquinas(maquinasActualizadas);
          localStorage.setItem('maquinas', JSON.stringify(maquinasActualizadas));
      
          // Show success message and close modal
          alert('Máquina actualizada correctamente');
          setShowModal(false);
      
          // Optional: Refresh the list from the server
          const fetchResponse = await fetch('/api/maquinas');
          const fetchResult = await fetchResponse.json();
          if (fetchResponse.ok) {
            setMaquinas(fetchResult);
            localStorage.setItem('maquinas', JSON.stringify(fetchResult));
          }
      
        } catch (error) {
          console.error('Error al actualizar máquina:', error);
          alert('Error al actualizar la máquina. Por favor, intente nuevamente.');
        }
      };

    return (
        <div className="machinary-container">
            <div className="machinary-header">
                <h2 className="section-title">Machine Registry</h2>
                <div className="flex items-center gap-4">
                    <div className="pagination-info">
                        Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, maquinas.length)} of{' '}
                        {maquinas.length}
                    </div>
                    <button onClick={handleNuevaMaquina} className="primary-button">
                        <PlusCircle className="button-icon" size={20} />
                        <span>New Machine</span>
                    </button>
                </div>
            </div>

            {maquinas.length === 0 ? (
                <NoData />
            ) : (
                <>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th className="table-cell text-left">Model</th>
                                    <th className="table-cell text-left">Brand</th>
                                    <th className="table-cell text-left">Machine ID</th>
                                    <th className="table-cell text-left">Last Service</th>
                                    <th className="table-cell text-left">Next Service</th>
                                    <th className="table-cell text-left">Current Hours</th>
                                    <th className="table-cell text-left">Status</th>
                                    <th className="table-cell text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((maquina) => (
                                    <tr key={maquina.id} className="table-row">
                                        <td className="table-cell">{maquina.modelo}</td>
                                        <td className="table-cell">{maquina.marca}</td>
                                        <td className="table-cell">{maquina.maquinariaId}</td>
                                        <td className="table-cell">{maquina.ultimoService || 'Not registered'}</td>
                                        <td className="table-cell">{maquina.proximoService || 'Not scheduled'}</td>
                                        <td className="table-cell">{maquina.horasActuales || '0'} hrs</td>
                                        <td className="table-cell">
                                            <StatusBadge maquina={maquina} />
                                        </td>
                                        <td className="table-cell">
                                            <div className="table-actions">
                                            <button
                                                onClick={() => handleEditarMaquina(maquina)}
                                                className="action-button edit-button text-green-600 hover:text-green-800 p-2"
                                                title="Editar"
                                                >
                                                <Edit2 className="button-icon" size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleGenerarQR(maquina)}
                                                    className="action-button qr-button"
                                                    title="QR Code"
                                                >
                                                    <QrCode className="button-icon" size={20} />
                                                </button>
                                                <button
                                                onClick={() => handleEliminarMaquina(maquina)}
                                                className="action-button text-red-600 hover:text-red-800 p-2"
                                                title="Delete"
                                                disabled={!maquina._id && !maquina.id}
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

            {/* Machine Modal */}
            <MaquinaModal
                showModal={showModal}
                modalType={modalType}
                maquinaSeleccionada={maquinaSeleccionada}
                nuevaMaquina={nuevaMaquina}
                setShowModal={setShowModal}
                setMaquinaSeleccionada={setMaquinaSeleccionada}
                setNuevaMaquina={setNuevaMaquina}
                agregarMaquina={agregarMaquina}
                actualizarMaquina={actualizarMaquina}
            />
        </div>
    );
};

export default TabMachinary;