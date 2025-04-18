import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit2, Trash2, Eye, AlertTriangle, RefreshCw, ClipboardCheck } from 'lucide-react';
import MachineModal from './MachineModal';
import DetailsModal from './DetailsModal';
import '../styles/tables.css';
import Notification from './Notification';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const TabMachinary = () => {
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
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
        model: ''
    });

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

    const fetchMachines = async (showNotification = false) => {
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
    };

    useEffect(() => {
        fetchMachines();
    }, []);

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
                setNotificationMessage('Machine deleted successfully');
                setShowNotification(true);
                
                // Refresh the list
                await fetchMachines();
            } catch (error) {
                console.error('Error deleting machine:', error);
                setNotificationMessage('Failed to delete machine: ' + error.message);
                setShowNotification(true);
            }
        }
    };

    const handleSubmit = async (formData) => {
        try {
            console.log("Handling submit in TabMachinary:", { modalType, selectedMachine });
            
            const isEditing = modalType === 'edit' && selectedMachine && selectedMachine._id;
            const method = isEditing ? 'PUT' : 'POST';
            const url = isEditing 
                ? `/api/machines/${selectedMachine._id}` 
                : '/api/machines';
            
            console.log(`Sending ${method} request to ${url} with data:`, formData);
            
            if (!isEditing && !formData.machineId) {
                formData.machineId = `MACHINE_${Date.now()}`;
            }
            
            const dataToSend = { ...formData };
            if (isEditing && dataToSend._id) {
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
            
            let responseData;
            const responseText = await response.text();
            
            try {
                responseData = JSON.parse(responseText);
            } catch (jsonError) {
                console.error("Failed to parse JSON response:", responseText);
                throw new Error("Invalid response from server. Please try again.");
            }
            
            if (!response.ok) {
                throw new Error(responseData.error || `Failed to ${isEditing ? 'update' : 'create'} machine`);
            }
            
            fetchMachines();
            
            setNotificationMessage(`Machine ${isEditing ? 'updated' : 'created'} successfully`);
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 3000);
            
            handleCloseModal();
            
        } catch (error) {
            console.error('Error handling machine submission:', error);
            setNotificationMessage(error.message);
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 3000);
        }
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

    if (loading && !isRefreshing) {
        return (
            <div className="loading-container">
                <div className="loading-text">Loading machines...</div>
            </div>
        );
    }

    return (
        <>
            <div className="machinary-container">
                <Notification 
                    message={notificationMessage}
                    show={showNotification}
                    onClose={() => setShowNotification(false)}
                />
                
                <div className="mb-4">
                    <h2 className="section-title">Machines</h2>
                </div>

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
                        <div className="text-sm text-gray-500">
                            Showing {machines.length > 0 ? indexOfFirstItem + 1 : 0}-{Math.min(indexOfLastItem, machines.length)} of {machines.length}
                        </div>
                        
                        {/* Add New Machine Button */}
                        <button
                            onClick={() => {
                                setSelectedMachine(null);
                                setModalType('add');
                                setShowModal(true);
                            }}
                            className="primary-button"
                        >
                            <PlusCircle className="button-icon" size={20} />
                            <span>New Machine</span>
                        </button>
                        
                        {/* Add PreStart Templates Manager Button */}
                        <button
                          onClick={() => {
                            window.location.href = '/admin/prestart-templates';
                          }}
                          className="primary-button ml-2"
                        >
                          <ClipboardCheck className="button-icon" size={20} />
                          <span>PreStart Templates</span>
                        </button>
                        
                        <button
                            onClick={() => fetchMachines(true)}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                            </svg>
                            Refrescar
                        </button>
                    </div>
                </div>

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
                                <label className="block text-sm font-medium mb-1">Marca</label>
                                <input
                                    type="text"
                                    name="brand"
                                    value={filters.brand}
                                    onChange={handleFilterChange}
                                    className="w-full p-2 border rounded"
                                    placeholder="Marca"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Modelo</label>
                                <input
                                    type="text"
                                    name="model"
                                    value={filters.model}
                                    onChange={handleFilterChange}
                                    className="w-full p-2 border rounded"
                                    placeholder="Modelo"
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
                                        brand: '',
                                        model: ''
                                    });
                                    fetchMachines(true);
                                }}
                                className="ml-2 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                            >
                                Limpiar Filtros
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
                                            <td className="table-cell">{machine.machineId || machine.maquinariaId}</td>
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