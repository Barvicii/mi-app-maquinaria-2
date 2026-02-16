import React from 'react';
import '@/styles/machinemodal.css';

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
        <div className="h-full flex flex-col">
            {/* Contenido de pestañas con altura fija - tabs ahora están en el header */}
            <div className="flex-1 overflow-y-auto" style={{ minHeight: '500px', maxHeight: '500px' }}>
                {activeTab === 'general' && (
                    <div className="p-4 space-y-4">
                        {/* Encabezado con información clave - Mejorado */}
                        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl border border-green-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-1">{machine.modelo || machine.model || 'Machine'}</h3>
                                    <p className="text-sm text-gray-600 mb-2">
                                        {machine.marca || machine.brand || 'Unknown'} • {machine.anio || machine.year || 'N/A'}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            {machine.maquinariaId || machine.machineId || 'No ID'}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            {machine.horasActuales || machine.currentHours || 0} hours
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                        ID: {machine.maquinariaId || machine.machineId || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Información Básica */}
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Basic Information
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-600">Machine ID:</span>
                                        <span className="text-sm font-semibold text-gray-900">{machine.maquinariaId || machine.machineId || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-600">Model:</span>
                                        <span className="text-sm font-semibold text-gray-900">{machine.modelo || machine.model || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-600">Brand:</span>
                                        <span className="text-sm font-semibold text-gray-900">{machine.marca || machine.brand || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-600">Year:</span>
                                        <span className="text-sm font-semibold text-gray-900">{machine.anio || machine.year || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm font-medium text-gray-600">Serial Number:</span>
                                        <span className="text-sm font-semibold text-gray-900">{machine.serie || machine.serialNumber || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Información de Servicio */}
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    Service Information
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-600">Current Hours:</span>
                                        <span className="text-sm font-semibold text-indigo-600">{machine.horasActuales || machine.currentHours || 0} hrs</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-600">Workplace:</span>
                                        <span className="text-sm font-semibold text-gray-900">{machine.workplace || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-600">Last Service:</span>
                                        <span className="text-sm font-semibold text-gray-900">{machine.ultimoService || machine.lastService || 'Not registered'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm font-medium text-gray-600">Next Service:</span>
                                        <span className="text-sm font-semibold text-gray-900">{machine.proximoService || machine.nextService || 'Not scheduled'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm font-medium text-gray-600">System ID:</span>
                                        <span className="text-xs font-mono text-gray-500">{machine._id || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'oils' && (
                    <div className="p-4 space-y-6">
                        {/* Engine Oil Section */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                                Engine Oil
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Type</div>
                                    <div className="text-sm font-semibold text-gray-900">{machine.aceiteMotor?.tipo || machine.engineOil?.type || 'Not specified'}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Capacity</div>
                                    <div className="text-sm font-semibold text-gray-900">{machine.aceiteMotor?.capacidad || machine.engineOil?.capacity || 'Not specified'}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Brand</div>
                                    <div className="text-sm font-semibold text-gray-900">{machine.aceiteMotor?.marca || machine.engineOil?.brand || 'Not specified'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Hydraulic Oil Section */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                                Hydraulic Oil
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Type</div>
                                    <div className="text-sm font-semibold text-gray-900">{machine.aceiteHidraulico?.tipo || machine.hydraulicOil?.type || 'Not specified'}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Capacity</div>
                                    <div className="text-sm font-semibold text-gray-900">{machine.aceiteHidraulico?.capacidad || machine.hydraulicOil?.capacity || 'Not specified'}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Brand</div>
                                    <div className="text-sm font-semibold text-gray-900">{machine.aceiteHidraulico?.marca || machine.hydraulicOil?.brand || 'Not specified'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Transmission Oil Section */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                                Transmission Oil
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Type</div>
                                    <div className="text-sm font-semibold text-gray-900">{machine.aceiteTransmision?.tipo || machine.transmissionOil?.type || 'Not specified'}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Capacity</div>
                                    <div className="text-sm font-semibold text-gray-900">{machine.aceiteTransmision?.capacidad || machine.transmissionOil?.capacity || 'Not specified'}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Brand</div>
                                    <div className="text-sm font-semibold text-gray-900">{machine.aceiteTransmision?.marca || machine.transmissionOil?.brand || 'Not specified'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'filters' && (
                    <div className="p-4 space-y-6">
                        {/* Engine Filter */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                                Engine Filter
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Part Number</div>
                                    <div className="text-sm font-semibold text-gray-900">{machine.filtros?.motor || machine.filters?.engine || 'Not configured'}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Brand</div>
                                    <div className="text-sm font-semibold text-gray-900">{machine.filtros?.motorMarca || machine.filters?.engineBrand || 'Not specified'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Transmission Filter */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                                Transmission Filter
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Part Number</div>
                                    <div className="text-sm font-semibold text-gray-900">{machine.filtros?.transmision || machine.filters?.transmission || 'Not configured'}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Brand</div>
                                    <div className="text-sm font-semibold text-gray-900">{machine.filtros?.transmisionMarca || machine.filters?.transmissionBrand || 'Not specified'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Fuel Filter */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                                Fuel Filter
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Part Number</div>
                                    <div className="text-sm font-semibold text-gray-900">{machine.filtros?.combustible || machine.filters?.fuel || 'Not configured'}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Brand</div>
                                    <div className="text-sm font-semibold text-gray-900">{machine.filtros?.combustibleMarca || machine.filters?.fuelBrand || 'Not specified'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Air Filter */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                                Air Filter
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Part Number</div>
                                    <div className="text-sm font-semibold text-gray-900">{machine.air || machine.filtros?.aire || machine.filters?.air || 'Not configured'}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Brand</div>
                                    <div className="text-sm font-semibold text-gray-900">{machine.airBrand || machine.filtros?.aireMarca || machine.filters?.airBrand || 'Not specified'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Carbon Filter Section - Show if carbon filter is configured */}
                        {machine.filters?.carbon?.isActive && (
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                    <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                                    Carbon Filter (Chemical Equipment)
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Part Number</div>
                                        <div className="text-sm font-semibold text-gray-900">{machine.filters?.carbon?.partNumber || 'Not specified'}</div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Brand</div>
                                        <div className="text-sm font-semibold text-gray-900">{machine.filters?.carbon?.brand || 'Not specified'}</div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Expected Life</div>
                                        <div className="text-sm font-semibold text-indigo-600">{machine.filters?.carbon?.expectedLifeHours || 100} hours</div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Installation Date</div>
                                        <div className="text-sm font-semibold text-gray-900">
                                            {machine.filters?.carbon?.installationDate 
                                                ? new Date(machine.filters.carbon.installationDate).toLocaleDateString()
                                                : 'Not set'
                                            }
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Installation Hours</div>
                                        <div className="text-sm font-semibold text-gray-900">{machine.filters?.carbon?.installationHours || 'Not set'} hrs</div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Current Status</div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            (() => {
                                                if (!machine.filters?.carbon?.installationHours || !machine.horasActuales) return 'bg-gray-100 text-gray-800';
                                                const used = (machine.horasActuales || machine.currentHours || 0) - (machine.filters.carbon.installationHours || 0);
                                                const expected = machine.filters.carbon.expectedLifeHours || 100;
                                                const remaining = expected - used;
                                                
                                                if (remaining <= 0) return 'bg-red-100 text-red-800';
                                                if (remaining <= 40) return 'bg-yellow-100 text-yellow-800';
                                                return 'bg-green-100 text-green-800';
                                            })()
                                        }`}>
                                            {(() => {
                                                if (!machine.filters?.carbon?.installationHours || !machine.horasActuales) return 'Status unknown';
                                                const used = (machine.horasActuales || machine.currentHours || 0) - (machine.filters.carbon.installationHours || 0);
                                                const expected = machine.filters.carbon.expectedLifeHours || 100;
                                                const remaining = expected - used;
                                                
                                                if (remaining <= 0) return 'EXPIRED';
                                                if (remaining <= 40) return `WARNING - ${remaining}h`;
                                                return `OK - ${remaining}h`;
                                            })()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'tires' && (
                    <div className="p-4 space-y-6">
                        {/* Front Tires */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                                Front Tires
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Size</div>
                                    <div className="text-sm font-semibold text-gray-900">{machine.neumaticos?.delanteros?.tamano || machine.tires?.front?.size || 'Not specified'}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Pressure</div>
                                    <div className="text-sm font-semibold text-indigo-600">{machine.neumaticos?.delanteros?.presion || machine.tires?.front?.pressure || 'Not specified'}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Brand</div>
                                    <div className="text-sm font-semibold text-gray-900">{machine.neumaticos?.delanteros?.marca || machine.tires?.front?.brand || 'Not specified'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Rear Tires */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                                Rear Tires
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Size</div>
                                    <div className="text-sm font-semibold text-gray-900">{machine.neumaticos?.traseros?.tamano || machine.tires?.rear?.size || 'Not specified'}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Pressure</div>
                                    <div className="text-sm font-semibold text-indigo-600">{machine.neumaticos?.traseros?.presion || machine.tires?.rear?.pressure || 'Not specified'}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Brand</div>
                                    <div className="text-sm font-semibold text-gray-900">{machine.neumaticos?.traseros?.marca || machine.tires?.rear?.brand || 'Not specified'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MachineDetails;