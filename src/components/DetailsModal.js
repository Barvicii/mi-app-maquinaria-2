import React from 'react';

const getStatus = (data) => {
  if (!data) return 'Unknown';

  const checkItems = [
    'aceite',
    'agua',
    'neumaticos',
    'nivelCombustible',
    'lucesYAlarmas',
    'frenos',
    'extintores',
    'cinturonSeguridad'
  ];

  const allChecksPass = checkItems.every(item => data[item] === true);
  return allChecksPass ? 'OK' : 'Needs Review';
};

const DetailsModal = ({ show, onClose, data, type }) => {
    if (!show) return null;

    // Check if data is available
    if (!data) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-4xl w-full p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Information not available</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ×
                        </button>
                    </div>
                    <div className="p-4 text-center">
                        <p>No data available to display.</p>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const renderMachineDetails = (machine) => (
        <div className="grid grid-cols-2 gap-4">
            {/* Basic Information */}
            <div className="col-span-2">
                <h3 className="font-bold text-lg mb-3">Basic Information</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <h4 className="font-semibold">Name</h4>
                        <p>{machine.nombre || machine.model || '-'}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold">Model</h4>
                        <p>{machine.modelo || machine.model || '-'}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold">Brand</h4>
                        <p>{machine.marca || machine.brand || '-'}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold">Serial Number</h4>
                        <p>{machine.serie || machine.serialNumber || '-'}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold">Machine ID</h4>
                        <p>{machine.maquinariaId || machine.machineId || '-'}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold">Year</h4>
                        <p>{machine.anio || machine.year || '-'}</p>
                    </div>
                </div>
            </div>

            {/* Service Information */}
            <div className="col-span-2">
                <h3 className="font-bold text-lg mt-4 mb-3">Service Information</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <h4 className="font-semibold">Current Hours</h4>
                        <p>{machine.horasActuales || machine.currentHours ? `${machine.horasActuales || machine.currentHours} hrs` : '-'}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold">Last Service</h4>
                        <p>{machine.ultimoService || machine.lastService || 'Not registered'}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold">Next Service</h4>
                        <p>{machine.proximoService || machine.nextService || 'Not scheduled'}</p>
                    </div>
                </div>
            </div>

            {/* Oil Information */}
            <div className="col-span-2">
                <h3 className="font-bold text-lg mt-4 mb-3">Oil Information</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <h4 className="font-semibold">Engine Oil</h4>
                        <p>Type: {machine.aceiteMotor?.tipo || machine.engineOil?.type || '-'}</p>
                        <p>Capacity: {machine.aceiteMotor?.capacidad || machine.engineOil?.capacity || '-'}</p>
                        <p>Brand: {machine.aceiteMotor?.marca || machine.engineOil?.brand || '-'}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold">Hydraulic Oil</h4>
                        <p>Type: {machine.aceiteHidraulico?.tipo || machine.hydraulicOil?.type || '-'}</p>
                        <p>Capacity: {machine.aceiteHidraulico?.capacidad || machine.hydraulicOil?.capacity || '-'}</p>
                        <p>Brand: {machine.aceiteHidraulico?.marca || machine.hydraulicOil?.brand || '-'}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold">Transmission Oil</h4>
                        <p>Type: {machine.aceiteTransmision?.tipo || machine.transmissionOil?.type || '-'}</p>
                        <p>Capacity: {machine.aceiteTransmision?.capacidad || machine.transmissionOil?.capacity || '-'}</p>
                        <p>Brand: {machine.aceiteTransmision?.marca || machine.transmissionOil?.brand || '-'}</p>
                    </div>
                </div>
            </div>

            {/* Filters Information */}
            <div className="col-span-2">
                <h3 className="font-bold text-lg mt-4 mb-3">Filters</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <h4 className="font-semibold">Engine Filter</h4>
                        <p>Part Number: {machine.filtros?.motor || machine.filters?.engine || '-'}</p>
                        <p>Brand: {machine.filtros?.motorMarca || machine.filters?.engineBrand || '-'}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold">Transmission Filter</h4>
                        <p>Part Number: {machine.filtros?.transmision || machine.filters?.transmission || '-'}</p>
                        <p>Brand: {machine.filtros?.transmisionMarca || machine.filters?.transmissionBrand || '-'}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold">Fuel Filter</h4>
                        <p>Part Number: {machine.filtros?.combustible || machine.filters?.fuel || '-'}</p>
                        <p>Brand: {machine.filtros?.combustibleMarca || machine.filters?.fuelBrand || '-'}</p>
                    </div>
                </div>
            </div>

            {/* Tires Information */}
            <div className="col-span-2">
                <h3 className="font-bold text-lg mt-4 mb-3">Tires</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h4 className="font-semibold">Front Tires</h4>
                        <p>Size: {machine.neumaticos?.delanteros?.tamano || machine.tires?.front?.size || '-'}</p>
                        <p>Pressure: {machine.neumaticos?.delanteros?.presion || machine.tires?.front?.pressure || '-'}</p>
                        <p>Brand: {machine.neumaticos?.delanteros?.marca || machine.tires?.front?.brand || '-'}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold">Rear Tires</h4>
                        <p>Size: {machine.neumaticos?.traseros?.tamano || machine.tires?.rear?.size || '-'}</p>
                        <p>Pressure: {machine.neumaticos?.traseros?.presion || machine.tires?.rear?.pressure || '-'}</p>
                        <p>Brand: {machine.neumaticos?.traseros?.marca || machine.tires?.rear?.brand || '-'}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderServiceDetails = () => {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h4 className="font-semibold mb-2">Service Information</h4>
                        <div className="space-y-2">
                            <p><span className="font-medium">Technician:</span> {data.tecnico}</p>
                            <p><span className="font-medium">Date:</span> {new Date(data.fecha).toLocaleDateString()}</p>
                            <p><span className="font-medium">Machine Hours:</span> {data.horasMaquina}</p>
                            <p><span className="font-medium">Service Type:</span> {data.tipoServicio}</p>
                            <p><span className="font-medium">Next Service:</span> {data.proximoService} hrs</p>
                            <p><span className="font-medium">Cost:</span> ${data.costo || 0}</p>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Work Details</h4>
                        <div className="space-y-2">
                            {data.trabajosRealizados && data.trabajosRealizados.length > 0 && (
                                <div>
                                    <span className="font-medium">Tasks Performed:</span>
                                    <ul className="list-disc pl-5 mt-1">
                                        {data.trabajosRealizados.map((task, index) => (
                                            <li key={index}>{task}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {data.repuestos && (
                                <p><span className="font-medium">Parts Used:</span> {data.repuestos}</p>
                            )}
                            {data.observaciones && (
                                <p><span className="font-medium">Observations:</span> {data.observaciones}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderPrestartDetails = () => {
        const checkItems = [
            { key: 'aceite', label: 'Aceite' },
            { key: 'agua', label: 'Agua' },
            { key: 'neumaticos', label: 'Neumáticos' },
            { key: 'nivelCombustible', label: 'Nivel de Combustible' },
            { key: 'lucesYAlarmas', label: 'Luces y Alarmas' },
            { key: 'frenos', label: 'Frenos' },
            { key: 'extintores', label: 'Extintores' },
            { key: 'cinturonSeguridad', label: 'Cinturón de Seguridad' }
        ];

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h4 className="font-semibold mb-2">Información Básica</h4>
                        <div className="space-y-2">
                            <p><span className="font-medium">Operador:</span> {data.operador}</p>
                            <p><span className="font-medium">Horas:</span> {data.horasMaquina}</p>
                            <p><span className="font-medium">Fecha:</span> {data.fecha ? new Date(data.fecha).toLocaleDateString() : new Date(data.createdAt).toLocaleDateString()}</p>
                            <p><span className="font-medium">Estado:</span> <span className={`ml-2 px-2 py-1 rounded-full text-sm ${
                                    data.estado === 'OK' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {data.estado}
                                </span>
                                
                            </p>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Verificaciones</h4>
                        <div className="grid grid-cols-1 gap-2">
                            {checkItems.map(({ key, label }) => (
                                <div key={key} className="flex items-center space-x-2">
                                    <span className={`h-3 w-3 rounded-full ${
                                        data[key] ? 'bg-green-400' : 'bg-red-400'
                                    }`}></span>
                                    <span>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <span className="font-semibold">Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-sm ${
                            getStatus(data) === 'OK' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                            {getStatus(data)}
                        </span>
                    </div>
                </div>
                {data.observaciones && (
                    <div>
                        <h4 className="font-semibold mb-2">Observaciones</h4>
                        <p className="text-gray-600 bg-gray-50 p-3 rounded">
                            {data.observaciones}
                        </p>
                    </div>
                )}
            </div>
        );
    };

    const renderOperatorDetails = (operator) => (
        <div className="grid grid-cols-2 gap-4">
            <div>
                <h4 className="font-semibold">Name</h4>
                <p>{`${operator.nombre} ${operator.apellido}`}</p>
            </div>
            <div>
                <h4 className="font-semibold">Type</h4>
                <p>{operator.tipo === 'operator' ? 'Operator' : 'Technician'}</p>
            </div>
            <div>
                <h4 className="font-semibold">Phone</h4>
                <p>{operator.telefono || '-'}</p>
            </div>
            <div>
                <h4 className="font-semibold">Email</h4>
                <p>{operator.email || '-'}</p>
            </div>
            <div>
                <h4 className="font-semibold">Start Date</h4>
                <p>{operator.fechaIngreso ? new Date(operator.fechaIngreso).toLocaleDateString() : '-'}</p>
            </div>
            <div>
                <h4 className="font-semibold">License</h4>
                <p>{operator.licencia || '-'}</p>
            </div>
            <div>
                <h4 className="font-semibold">Specialty</h4>
                <p>{operator.especialidad || '-'}</p>
            </div>
            <div>
                <h4 className="font-semibold">Status</h4>
                <p>{operator.activo ? 'Active' : 'Inactive'}</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">
                        {type === 'machine' ? 'Machine Details' : 
                         type === 'service' ? 'Service Record Details' :
                         type === 'operator' ? 'Operator Details' : 
                         'Pre-Start Check Details'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ×
                    </button>
                </div>
                <div className="max-h-[70vh] overflow-y-auto px-2">
                    {type === 'service' ? renderServiceDetails() : 
                     type === 'operator' ? renderOperatorDetails(data) : 
                     type === 'machine' ? renderMachineDetails(data) : 
                     renderPrestartDetails()}
                </div>
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DetailsModal;