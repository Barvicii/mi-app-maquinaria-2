'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  PlusCircle, Edit2, Trash2, Eye, AlertTriangle, RefreshCw, ClipboardCheck, 
  CheckSquare, Filter
} from 'lucide-react';
import MachineModal from './MachineModal';
import DetailsModal from './DetailsModal';
import '@/styles/tables.css';
import Notification from './Notification';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const TabMachinary = ({ maquinas, setMaquinas, suppressNotifications = false, onTabChange }) => {
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [selectedMachine, setSelectedMachine] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        machineId: '',
        brand: '',
        model: '',
        workplace: ''
    });
    const [filterCount, setFilterCount] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    const router = useRouter();

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters({
            ...filters,
            [name]: value
        });
    };

    const applyFilters = () => {
        fetchMachines(true);
    };

    const clearFilters = async () => {
        // Limpiar los filtros
        setFilters({
            machineId: '',
            brand: '',
            model: '',
            workplace: ''
        });
        
        // Hacer petición directa sin filtros para obtener todas las máquinas
        try {
            setLoading(true);
            setIsRefreshing(true);
            setError(null);
            
            const timestamp = Date.now();
            const url = `/api/machines?_t=${timestamp}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-store'
                }
            });
            
            const data = await response.json();
            
            if (data.machines) {
                setMachines(data.machines);
                console.log('✅ All machines loaded after clearing filters:', data.machines.length);
            }
        } catch (error) {
            console.error('Error fetching all machines:', error);
            setError('Error loading machines');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const fetchMachines = useCallback(async (showNotification = false) => {
        try {
            setLoading(true);
            setIsRefreshing(true);
            setError(null);
            
            console.log('Fetching machines...');
            
            const timestamp = Date.now();
            let url = `/api/machines?_t=${timestamp}`;
            
            if (filters.machineId) {
                url += `&machineId=${encodeURIComponent(filters.machineId)}`;
            }
            
            if (filters.brand) {
                url += `&brand=${encodeURIComponent(filters.brand)}`;
            }
            
            if (filters.model) {
                url += `&model=${encodeURIComponent(filters.model)}`;
            }
            
            if (filters.workplace) {
                url += `&workplace=${encodeURIComponent(filters.workplace)}`;
            }
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-store'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Error loading machines: ${response.status} ${errorData.message || ''}`);
            }
            
            const data = await response.json();
            console.log('Machines loaded:', data);
            setMachines(data);
        } catch (error) {
            console.error('Error fetching machines:', error);
            setError(error.message || 'Failed to load machines');
            
            // Try to load from localStorage as a fallback
            try {
                const storedMachines = JSON.parse(localStorage.getItem('maquinas') || '[]');
                if (storedMachines.length > 0) {
                    console.log('Using machines from localStorage as fallback:', storedMachines);
                    setMachines(storedMachines);
                }
            } catch (localError) {
                console.error('Failed to load from localStorage:', localError);
            }
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [filters.machineId, filters.brand, filters.model, filters.workplace]);

    useEffect(() => {
        fetchMachines();
    }, [fetchMachines]);

    // Actualizar el contador de filtros activos
    useEffect(() => {
        const count = Object.values(filters).filter(value => value.trim() !== '').length;
        setFilterCount(count);
    }, [filters]);

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedMachine(null);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this machine?')) {
            try {
                const response = await fetch(`/api/machines/${id}`, {
                    method: 'DELETE',
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Error deleting machine');
                }
                
                // Show notification
                showNotificationMessage('Machine deleted successfully');
                
                // Refresh the list
                await fetchMachines();
            } catch (error) {
                console.error('Error deleting machine:', error);
                showNotificationMessage('Failed to delete machine: ' + error.message);
            }
        }
    };

    const handleSubmit = async (formData) => {
        try {
            setSubmitting(true);
            
            // Determinar URL y método
            let url;
            let method;
            
            const isEditing = modalType === 'edit' && selectedMachine && selectedMachine._id;
            
            if (isEditing) {
                // Asegurarse de usar el ID correcto para la edición
                const machineId = selectedMachine._id;
                url = `/api/machines?id=${machineId}`;
                method = 'PUT';
                console.log(`Editing machine with ID: ${machineId}`);
            } else {
                url = '/api/machines';
                method = 'POST';
                
                // Generar un machineId si no existe
                if (!formData.machineId) {
                    formData.machineId = `MACHINE_${Date.now()}`;
                }
            }
            
            console.log(`Sending ${method} request to ${url} with data:`, formData);
            
            const dataToSend = { ...formData };
            
            // No enviar el _id en el body para evitar conflictos
            if (isEditing && dataToSend._id) {
                console.log(`Machine _id for reference: ${dataToSend._id}`);
                delete dataToSend._id;
            }
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataToSend),
                cache: 'no-store'
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Error response:', errorData);
                throw new Error(errorData.error || `Error ${method === 'POST' ? 'creating' : 'updating'} machine`);
            }
            
            const result = await response.json();
            console.log(`Machine ${isEditing ? 'updated' : 'created'} successfully:`, result);
            
            // Cerrar modal primero
            handleCloseModal();
            
            // Retrasar la recarga de datos para asegurar que la DB se actualice
            setTimeout(() => {
                fetchMachines(true);
            }, 500);
            
            showNotificationMessage(`Machine ${isEditing ? 'updated' : 'created'} successfully`);
            
        } catch (error) {
            console.error('Error handling machine submission:', error);
            showNotificationMessage(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const showNotificationMessage = (message, type = 'success') => {
        // Si se debe suprimir las notificaciones, no mostrar nada
        if (suppressNotifications) return;
        
        setNotificationMessage(message);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = machines.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(machines.length / itemsPerPage);

    const handlePrevious = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNext = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleGoToPreStartTemplates = () => {
        if (onTabChange) {
            onTabChange('prestart-templates');
        }
    };

    const handleNewMachineClick = () => {
        setSelectedMachine(null);
        setModalType('add');
        setShowModal(true);
    };

    if (loading && !isRefreshing) {
        return (
            <div className="loading-container">
                <div className="loading-text">Loading machines...</div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900">Machinery Registry</h2>
                </div>

                <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-3 py-2 rounded-md flex items-center ${showFilters ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                        <Filter className="mr-1" size={16} />
                        Filters {filterCount > 0 && `(${filterCount})`}
                    </button>
                    
                    <div className="flex flex-wrap space-x-2">
                        <button 
                            onClick={handleNewMachineClick}
                            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                        >
                            <PlusCircle className="mr-1" size={16} />
                            Add Machine
                        </button>
                        
                        <button 
                            onClick={handleGoToPreStartTemplates}
                            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                        >
                            <CheckSquare className="mr-1" size={16} />
                            Pre-Start Templates
                        </button>
                        
                        <button 
                            onClick={() => fetchMachines(true)}
                            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                        >
                            <RefreshCw className="mr-1" size={16} />
                            Refresh
                        </button>
                    </div>
                </div>

                {showFilters && (
                    <div className="bg-gray-50 p-4 rounded-md mb-6 border border-gray-200">
                        <h3 className="font-semibold mb-2">Filters</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                <label className="block text-sm font-medium mb-1">Brand</label>
                                <input
                                    type="text"
                                    name="brand"
                                    value={filters.brand}
                                    onChange={handleFilterChange}
                                    className="w-full p-2 border rounded"
                                    placeholder="Brand"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Model</label>
                                <input
                                    type="text"
                                    name="model"
                                    value={filters.model}
                                    onChange={handleFilterChange}
                                    className="w-full p-2 border rounded"
                                    placeholder="Model"
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
                    <div className="error-message mb-4">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        <span>{error}</span>
                    </div>
                )}

                {machines.length === 0 ? (
                    <div className="empty-message">No machines registered.</div>
                ) : (
                    <>
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th className="table-cell text-left">Model</th>
                                        <th className="table-cell text-left">Brand</th>
                                        <th className="table-cell text-left">Serial</th>
                                        <th className="table-cell text-left">Machine ID</th>
                                        <th className="table-cell text-left">Workplace</th>
                                        <th className="table-cell text-left">Last Service</th>
                                        <th className="table-cell text-left">Next Service</th>
                                        <th className="table-cell text-left">Current Hours</th>
                                        <th className="table-cell text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((machine) => (
                                        <tr key={machine._id || machine.id} className="table-row">
                                            <td className="table-cell">{machine.model || machine.modelo}</td>
                                            <td className="table-cell">{machine.brand || machine.marca}</td>
                                            <td className="table-cell">{machine.serialNumber || machine.serie}</td>
                                            <td className="table-cell">{machine.customId || machine.machineId || machine.maquinariaId || machine.id || 'N/A'}</td>
                                            <td className="table-cell">{machine.workplace || 'N/A'}</td>
                                            <td className="table-cell">{machine.lastService || machine.ultimoService || 'Not recorded'}</td>
                                            <td className="table-cell">{machine.nextService || machine.proximoService || 'Not scheduled'}</td>
                                            <td className="table-cell">{machine.currentHours || machine.horasActuales || '0'} hrs</td>
                                            <td className="table-cell">
                                                <div className="table-actions">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedMachine(machine);
                                                            setShowDetails(true);
                                                        }}
                                                        className="action-button view-button text-blue-600 hover:text-blue-800 p-2"
                                                        title="View details"
                                                    >
                                                        <Eye className="button-icon" size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedMachine(machine);
                                                            setModalType('edit');
                                                            setShowModal(true);
                                                        }}
                                                        className="action-button edit-button text-green-600 hover:text-green-800 p-2"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="button-icon" size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(machine._id || machine.id)}
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

                <MachineModal
                    show={showModal}
                    type={modalType}
                    machine={selectedMachine}
                    onClose={handleCloseModal}
                    onSubmit={handleSubmit}
                />

                <DetailsModal
                    show={showDetails}
                    data={selectedMachine}
                    onClose={() => {
                        setShowDetails(false);
                        setSelectedMachine(null);
                    }}
                    type="machine"
                />
            </div>

            {showNotification && (
                <Notification
                    message="Machine saved successfully"
                    type="success"
                    onClose={() => setShowNotification(false)}
                    duration={3000}
                />
            )}
        </>
    );
};

export default TabMachinary;