import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit2, Trash2, Eye, AlertTriangle, RefreshCw } from 'lucide-react';
import MachineModal from './MachineModal';
import DetailsModal from './DetailsModal';
import '../styles/tables.css';
import Notification from './Notification';

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

    const fetchMachines = async () => {
        try {
            setLoading(true);
            setIsRefreshing(true);
            setError(null);
            
            console.log('Fetching machines...');
            
            const response = await fetch('/api/machines', {
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

    const handleSubmit = async (machineData) => {
        try {
            console.log('Submitting machine data:', machineData);
            
            // Create a copy of the data without _id for new machines
            const dataToSubmit = { ...machineData };
            if (modalType === 'new' && dataToSubmit._id) {
                delete dataToSubmit._id;
            }
            
            const url = modalType === 'edit' ? `/api/machines/${selectedMachine._id}` : '/api/machines';
            const method = modalType === 'edit' ? 'PUT' : 'POST';
    
            console.log(`Making ${method} request to ${url}`);
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSubmit),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Error ${modalType === 'edit' ? 'updating' : 'creating'} machine`);
            }

            const result = await response.json();
            console.log('API response:', result);
            
            // Show notification
            setNotificationMessage(`Machine ${modalType === 'edit' ? 'updated' : 'created'} successfully`);
            setShowNotification(true);
            
            // Close modal and refresh data
            setShowModal(false);
            setSelectedMachine(null);
            await fetchMachines();
            
            // Also update localStorage as backup
            try {
                const storedMachines = JSON.parse(localStorage.getItem('maquinas') || '[]');
                let updatedMachines;
                
                if (modalType === 'edit') {
                    updatedMachines = storedMachines.map(machine => 
                        machine.id === selectedMachine.id ? { ...machine, ...machineData } : machine
                    );
                } else {
                    // Generate a local ID if needed
                    const newMachine = { 
                        ...machineData, 
                        id: result._id || Date.now().toString()
                    };
                    updatedMachines = [...storedMachines, newMachine];
                }
                
                localStorage.setItem('maquinas', JSON.stringify(updatedMachines));
            } catch (localError) {
                console.error('Failed to update localStorage:', localError);
            }
            
        } catch (error) {
            console.error('Error saving machine:', error);
            setNotificationMessage('Error: ' + error.message);
            setShowNotification(true);
        }
    };

    // Calculate pagination
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
        <div className="machinary-container">
            <Notification 
                message={notificationMessage}
                show={showNotification}
                onClose={() => setShowNotification(false)}
            />
            
            <div className="machinary-header">
                <h2 className="section-title">Machine Registry</h2>
                <div className="flex items-center gap-4">
                    <div className="pagination-info">
                        Showing {machines.length > 0 ? indexOfFirstItem + 1 : 0}-{Math.min(indexOfLastItem, machines.length)} of {machines.length}
                    </div>
                    <button
                        onClick={() => {
                            setModalType('new');
                            setShowModal(true);
                        }}
                        className="primary-button"
                    >
                        <PlusCircle className="button-icon" size={20} />
                        <span>New Machine</span>
                    </button>
                    <button 
                        onClick={fetchMachines}
                        className="primary-button"
                        disabled={isRefreshing}
                    >
                        {isRefreshing ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Refreshing...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh
                            </>
                        )}
                    </button>
                </div>
            </div>

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
    );
};

export default TabMachinary;