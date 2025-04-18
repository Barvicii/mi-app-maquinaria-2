import React from 'react';

// Update props to match what's being passed from DetailsModal
const MachineDetails = ({ machine, activeTab, setActiveTab }) => {
    // Pestañas disponibles para la máquina
    const tabs = [
        { id: 'general', label: 'General' },
        { id: 'oils', label: 'Oils' },
        { id: 'filters', label: 'Filters' },
        { id: 'tires', label: 'Tires' }
    ];

    return (
        <div className="modal-section">
            {/* Navegación de pestañas */}
            <div className="modal-tabs">
                {tabs.map(tab => (
                    <button 
                        key={tab.id}
                        className={`modal-tab ${activeTab === tab.id ? 'modal-tab-active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Contenido de pestañas */}
            <div className="modal-tab-content">
                {activeTab === 'general' && (
                    <div className="space-y-3">
                        {/* Encabezado con información clave */}
                        <div className="modal-header-info">
                            <div className="flex justify-between items-center">
                                <div className="modal-header-main">
                                    <h3 className="modal-header-title">{machine.modelo || machine.model || 'Machine'}</h3>
                                    <p className="modal-header-subtitle">
                                        {machine.marca || machine.brand || 'Unknown'} • Year: {machine.anio || machine.year || 'N/A'}
                                    </p>
                                </div>
                                <div className="modal-status modal-status-active">
                                    ID: {machine.maquinariaId || machine.machineId || 'N/A'}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-3">
                            {/* Basic Information - Reduced Size */}
                            <div className="modal-card md:w-1/2">
                                <h4 className="modal-section-title">Basic Information</h4>
                                <div className="modal-grid modal-grid-2">
                                    <div className="modal-field">
                                        <span className="modal-card-label">Model/ID:</span>
                                        <span className="modal-card-value">{machine.modelo || machine.model || '-'} / {machine.maquinariaId || machine.machineId || '-'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="modal-card-label">Brand/Year:</span>
                                        <span className="modal-card-value">{machine.marca || machine.brand || '-'} / {machine.anio || machine.year || '-'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="modal-card-label">Serial Number:</span>
                                        <span className="modal-card-value">{machine.serie || machine.serialNumber || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Service Information */}
                            <div className="modal-card md:w-1/2">
                                <h4 className="modal-section-title">Service Information</h4>
                                <div className="modal-grid modal-grid-1">
                                    <div className="modal-field">
                                        <span className="modal-card-label">Current Hours:</span>
                                        <span className="modal-card-value">{machine.horasActuales || machine.currentHours ? `${machine.horasActuales || machine.currentHours} hrs` : '-'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="modal-card-label">Last Service:</span>
                                        <span className="modal-card-value">{machine.ultimoService || machine.lastService || 'Not registered'}</span>
                                    </div>
                                    <div className="modal-field">
                                        <span className="modal-card-label">Next Service:</span>
                                        <span className="modal-card-value">{machine.proximoService || machine.nextService || 'Not scheduled'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional content could go here if needed */}
                    </div>
                )}

                {/* Rest of the tabs remain unchanged */}
                {activeTab === 'oils' && (
                    <div className="space-y-3">
                        {/* Engine Oil */}
                        <div className="modal-card">
                            <h4 className="modal-section-title">Engine Oil</h4>
                            <div className="modal-grid modal-grid-3">
                                <div className="modal-field">
                                    <span className="modal-card-label">Type:</span>
                                    <span className="modal-card-value">{machine.aceiteMotor?.tipo || machine.engineOil?.type || '-'}</span>
                                </div>
                                <div className="modal-field">
                                    <span className="modal-card-label">Capacity:</span>
                                    <span className="modal-card-value">{machine.aceiteMotor?.capacidad || machine.engineOil?.capacity || '-'}</span>
                                </div>
                                <div className="modal-field">
                                    <span className="modal-card-label">Brand:</span>
                                    <span className="modal-card-value">{machine.aceiteMotor?.marca || machine.engineOil?.brand || '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Rest of oils section unchanged */}
                        <h3 className="modal-section-title">Hydraulic Oil</h3>
                        <div className="modal-grid">
                            <div className="modal-field">
                                <span className="modal-label">Type:</span>
                                <span className="modal-value">{machine.aceiteHidraulico?.tipo || machine.hydraulicOil?.type || '-'}</span>
                            </div>
                            <div className="modal-field">
                                <span className="modal-label">Capacity:</span>
                                <span className="modal-value">{machine.aceiteHidraulico?.capacidad || machine.hydraulicOil?.capacity || '-'}</span>
                            </div>
                            <div className="modal-field">
                                <span className="modal-label">Brand:</span>
                                <span className="modal-value">{machine.aceiteHidraulico?.marca || machine.hydraulicOil?.brand || '-'}</span>
                            </div>
                        </div>

                        <h3 className="modal-section-title">Transmission Oil</h3>
                        <div className="modal-grid">
                            <div className="modal-field">
                                <span className="modal-label">Type:</span>
                                <span className="modal-value">{machine.aceiteTransmision?.tipo || machine.transmissionOil?.type || '-'}</span>
                            </div>
                            <div className="modal-field">
                                <span className="modal-label">Capacity:</span>
                                <span className="modal-value">{machine.aceiteTransmision?.capacidad || machine.transmissionOil?.capacity || '-'}</span>
                            </div>
                            <div className="modal-field">
                                <span className="modal-label">Brand:</span>
                                <span className="modal-value">{machine.aceiteTransmision?.marca || machine.transmissionOil?.brand || '-'}</span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'filters' && (
                    <div className="modal-section">
                        <h3 className="modal-section-title">Engine Filter</h3>
                        <div className="modal-grid">
                            <div className="modal-field">
                                <span className="modal-label">Part Number:</span>
                                <span className="modal-value">{machine.filtros?.motor || machine.filters?.engine || '-'}</span>
                            </div>
                            <div className="modal-field">
                                <span className="modal-label">Brand:</span>
                                <span className="modal-value">{machine.filtros?.motorMarca || machine.filters?.engineBrand || '-'}</span>
                            </div>
                        </div>

                        <h3 className="modal-section-title">Transmission Filter</h3>
                        <div className="modal-grid">
                            <div className="modal-field">
                                <span className="modal-label">Part Number:</span>
                                <span className="modal-value">{machine.filtros?.transmision || machine.filters?.transmission || '-'}</span>
                            </div>
                            <div className="modal-field">
                                <span className="modal-label">Brand:</span>
                                <span className="modal-value">{machine.filtros?.transmisionMarca || machine.filters?.transmissionBrand || '-'}</span>
                            </div>
                        </div>

                        <h3 className="modal-section-title">Fuel Filter</h3>
                        <div className="modal-grid">
                            <div className="modal-field">
                                <span className="modal-label">Part Number:</span>
                                <span className="modal-value">{machine.filtros?.combustible || machine.filters?.fuel || '-'}</span>
                            </div>
                            <div className="modal-field">
                                <span className="modal-label">Brand:</span>
                                <span className="modal-value">{machine.filtros?.combustibleMarca || machine.filters?.fuelBrand || '-'}</span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'tires' && (
                    <div className="modal-section">
                        <h3 className="modal-section-title">Front Tires</h3>
                        <div className="modal-grid">
                            <div className="modal-field">
                                <span className="modal-label">Size:</span>
                                <span className="modal-value">{machine.neumaticos?.delanteros?.tamano || machine.tires?.front?.size || '-'}</span>
                            </div>
                            <div className="modal-field">
                                <span className="modal-label">Pressure:</span>
                                <span className="modal-value">{machine.neumaticos?.delanteros?.presion || machine.tires?.front?.pressure || '-'}</span>
                            </div>
                            <div className="modal-field">
                                <span className="modal-label">Brand:</span>
                                <span className="modal-value">{machine.neumaticos?.delanteros?.marca || machine.tires?.front?.brand || '-'}</span>
                            </div>
                        </div>

                        <h3 className="modal-section-title">Rear Tires</h3>
                        <div className="modal-grid">
                            <div className="modal-field">
                                <span className="modal-label">Size:</span>
                                <span className="modal-value">{machine.neumaticos?.traseros?.tamano || machine.tires?.rear?.size || '-'}</span>
                            </div>
                            <div className="modal-field">
                                <span className="modal-label">Pressure:</span>
                                <span className="modal-value">{machine.neumaticos?.traseros?.presion || machine.tires?.rear?.pressure || '-'}</span>
                            </div>
                            <div className="modal-field">
                                <span className="modal-label">Brand:</span>
                                <span className="modal-value">{machine.neumaticos?.traseros?.marca || machine.tires?.rear?.brand || '-'}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MachineDetails;