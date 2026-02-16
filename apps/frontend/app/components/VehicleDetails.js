import React from 'react';
import '@/styles/machinemodal.css';

const VehicleDetails = ({ vehicle, activeTab, setActiveTab }) => {
  // Pestañas disponibles para el vehículo - Mismos nombres que VehicleModal
  const tabs = [
    { id: 'general', label: 'Basic Info' },
    { id: 'ruc-rego', label: 'RUC & REGO' },
    { id: 'oils', label: 'Oils' },
    { id: 'filters', label: 'Filters' },
    { id: 'tires', label: 'Tires' }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Contenido de pestañas con altura dinámica */}
      <div className="flex-1 overflow-y-auto">{/* Removed fixed height constraints */}
        {activeTab === 'general' && (
          <div className="p-4 space-y-4">
            {/* Encabezado con información clave - Mejorado */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">{vehicle?.model || 'Vehicle'}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {vehicle?.brand || 'Unknown'} • {vehicle?.year || 'N/A'} • {vehicle?.vehicleType || 'Vehicle'}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {vehicle?.plateNumber || 'No Plate'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {vehicle?.currentKilometers || 0} km
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    ID: {vehicle?.machineId || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Información Básica */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                  Basic Information
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Vehicle ID:</span>
                    <span className="text-sm font-semibold text-gray-900">{vehicle?.machineId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Model:</span>
                    <span className="text-sm font-semibold text-gray-900">{vehicle?.model || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Brand:</span>
                    <span className="text-sm font-semibold text-gray-900">{vehicle?.brand || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Year:</span>
                    <span className="text-sm font-semibold text-gray-900">{vehicle?.year || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-gray-600">Vehicle Type:</span>
                    <span className="text-sm font-semibold text-gray-900">{vehicle?.vehicleType || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Detalles del Vehículo */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Vehicle Details
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Plate Number:</span>
                    <span className="text-sm font-semibold text-gray-900">{vehicle?.plateNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Serial Number:</span>
                    <span className="text-sm font-semibold text-gray-900">{vehicle?.serialNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Current KM:</span>
                    <span className="text-sm font-semibold text-indigo-600">{vehicle?.currentKilometers || 0} km</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Workplace:</span>
                    <span className="text-sm font-semibold text-gray-900">{vehicle?.workplace || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-gray-600">System ID:</span>
                    <span className="text-xs font-mono text-gray-500">{vehicle?._id || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Información de Servicio */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm lg:col-span-2">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Service Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Last Service:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {vehicle?.lastService ? new Date(vehicle.lastService).toLocaleDateString() : 'Not recorded'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Next Service:</span>
                    <span className="text-sm font-semibold text-indigo-600">
                      {vehicle?.nextService ? 
                        (vehicle.nextService.toString().includes('km') ? 
                          vehicle.nextService : 
                          `${vehicle.nextService} km`) : 
                        'Not scheduled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ruc-rego' && (
          <div className="p-4 space-y-6">
            {/* RUC Section */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                Road User Charges (RUC)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Status</div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    vehicle?.ruc?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {vehicle?.ruc?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Current KM</div>
                  <div className="text-sm font-semibold text-gray-900">{vehicle?.ruc?.currentKm || 'Not set'}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Next Due KM</div>
                  <div className="text-sm font-semibold text-indigo-600">{vehicle?.ruc?.nextDueKm || 'Not set'}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">KM Interval</div>
                  <div className="text-sm font-semibold text-gray-900">{vehicle?.ruc?.kmInterval || 5000} km</div>
                </div>
                {vehicle?.ruc?.alertStatus && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Alert Status</div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      vehicle.ruc.alertStatus === 'urgent' ? 'bg-red-100 text-red-800' :
                      vehicle.ruc.alertStatus === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {vehicle.ruc.alertStatus}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* REGO Section */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                Vehicle Licensing (REGO)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Status</div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    vehicle?.rego?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {vehicle?.rego?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Expiry Date</div>
                  <div className="text-sm font-semibold text-red-600">
                    {vehicle?.rego?.expiryDate ? new Date(vehicle.rego.expiryDate).toLocaleDateString() : 'Not set'}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Last Renewal</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {vehicle?.rego?.lastRenewalDate ? new Date(vehicle.rego.lastRenewalDate).toLocaleDateString() : 'Not set'}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Cost</div>
                  <div className="text-sm font-semibold text-green-600">${vehicle?.rego?.cost || 'Not set'}</div>
                </div>
                {vehicle?.rego?.alertStatus && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Alert Status</div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      vehicle.rego.alertStatus === 'urgent' ? 'bg-red-100 text-red-800' :
                      vehicle.rego.alertStatus === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {vehicle.rego.alertStatus}
                    </span>
                  </div>
                )}
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
                  <div className="text-sm font-semibold text-gray-900">{vehicle?.engineOil?.type || 'Not specified'}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Capacity</div>
                  <div className="text-sm font-semibold text-gray-900">{vehicle?.engineOil?.capacity || 'Not specified'}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Brand</div>
                  <div className="text-sm font-semibold text-gray-900">{vehicle?.engineOil?.brand || 'Not specified'}</div>
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
                  <div className="text-sm font-semibold text-gray-900">{vehicle?.hydraulicOil?.type || 'Not specified'}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Capacity</div>
                  <div className="text-sm font-semibold text-gray-900">{vehicle?.hydraulicOil?.capacity || 'Not specified'}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Brand</div>
                  <div className="text-sm font-semibold text-gray-900">{vehicle?.hydraulicOil?.brand || 'Not specified'}</div>
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
                  <div className="text-sm font-semibold text-gray-900">{vehicle?.transmissionOil?.type || 'Not specified'}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Capacity</div>
                  <div className="text-sm font-semibold text-gray-900">{vehicle?.transmissionOil?.capacity || 'Not specified'}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Brand</div>
                  <div className="text-sm font-semibold text-gray-900">{vehicle?.transmissionOil?.brand || 'Not specified'}</div>
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
                  <div className="text-sm font-semibold text-gray-900">{vehicle?.filters?.engine || 'Not configured'}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Brand</div>
                  <div className="text-sm font-semibold text-gray-900">{vehicle?.filters?.engineBrand || 'Not specified'}</div>
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
                  <div className="text-sm font-semibold text-gray-900">{vehicle?.filters?.transmission || 'Not configured'}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Brand</div>
                  <div className="text-sm font-semibold text-gray-900">{vehicle?.filters?.transmissionBrand || 'Not specified'}</div>
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
                  <div className="text-sm font-semibold text-gray-900">{vehicle?.filters?.fuel || 'Not configured'}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Brand</div>
                  <div className="text-sm font-semibold text-gray-900">{vehicle?.filters?.fuelBrand || 'Not specified'}</div>
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
                  <div className="text-sm font-semibold text-gray-900">{vehicle?.filters?.air || 'Not configured'}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Brand</div>
                  <div className="text-sm font-semibold text-gray-900">{vehicle?.filters?.airBrand || 'Not specified'}</div>
                </div>
              </div>
            </div>

            {/* Carbon Filter */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                Carbon Filter
              </h4>
              {typeof vehicle?.filters?.carbon === 'object' && vehicle?.filters?.carbon?.isActive ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Part Number</div>
                    <div className="text-sm font-semibold text-gray-900">{vehicle.filters.carbon.partNumber || 'Not specified'}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Brand</div>
                    <div className="text-sm font-semibold text-gray-900">{vehicle.filters.carbon.brand || 'Not specified'}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Expected Life</div>
                    <div className="text-sm font-semibold text-indigo-600">{vehicle.filters.carbon.expectedLifeHours || 100} hours</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Installation KM</div>
                    <div className="text-sm font-semibold text-gray-900">{vehicle.filters.carbon.installationKm || 'Not set'}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Installation Date</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {vehicle.filters.carbon.installationDate ? 
                        new Date(vehicle.filters.carbon.installationDate).toLocaleDateString() : 
                        'Not set'
                      }
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Status</div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-700">
                    {vehicle?.filters?.carbon && typeof vehicle.filters.carbon === 'string' ? 
                      `Configured: ${vehicle.filters.carbon} (${vehicle?.filters?.carbonBrand || 'No brand specified'})` :
                      'Not configured'
                    }
                  </div>
                </div>
              )}
            </div>
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
                  <div className="text-sm font-semibold text-gray-900">{vehicle?.tires?.front?.size || 'Not specified'}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Pressure</div>
                  <div className="text-sm font-semibold text-indigo-600">{vehicle?.tires?.front?.pressure || 'Not specified'}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Brand</div>
                  <div className="text-sm font-semibold text-gray-900">{vehicle?.tires?.front?.brand || 'Not specified'}</div>
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
                  <div className="text-sm font-semibold text-gray-900">{vehicle?.tires?.rear?.size || 'Not specified'}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Pressure</div>
                  <div className="text-sm font-semibold text-indigo-600">{vehicle?.tires?.rear?.pressure || 'Not specified'}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Brand</div>
                  <div className="text-sm font-semibold text-gray-900">{vehicle?.tires?.rear?.brand || 'Not specified'}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleDetails;
