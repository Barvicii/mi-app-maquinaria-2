import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

// Reusable component for each section of data
const InfoCard = ({ title, children, isMobile }) => (
  <div
    className={`bg-indigo-50 p-${isMobile ? '4' : '8'} rounded-lg border border-indigo-200 shadow-md w-full mx-auto`}
    style={{ maxWidth: '100%' }}
  >
    <h4
      className={`text-black font-semibold mb-4 ${isMobile ? 'text-xl' : 'text-3xl'}`}
    >
      {title}
    </h4>
    <div className="space-y-2">{children}</div>
  </div>
);

// Main component
const VehicleDataDisplay = ({ vehiculoData, onRefresh, isRefreshing }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [showServiceHistory, setShowServiceHistory] = useState(true);
  const [serviceError, setServiceError] = useState(null);
  
  console.log("Vehicle data received:", vehiculoData);

  // Detect device
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize(); // Detect on load
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch service history for this machine
  useEffect(() => {
    const machineId = vehiculoData?._id || vehiculoData?.machineId;
    if (!machineId) return;

    const fetchServices = async () => {
      try {
        setLoadingServices(true);
        setServiceError(null);
        const res = await fetch(`/api/public/machines/${machineId}/services?limit=20`);
        if (res.ok) {
          const data = await res.json();
          setServiceHistory(data.services || []);
        }
      } catch (err) {
        setServiceError('Could not load service history');
        console.error('Error fetching service history:', err);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, [vehiculoData?._id, vehiculoData?.machineId]);

  // Handle data mapping from different formats
  const getData = () => {
    if (!vehiculoData) return null;
    
    return {
      general: {
        brand: vehiculoData.brand || vehiculoData.marca || '-',
        model: vehiculoData.model || vehiculoData.modelo || '-',
        year: vehiculoData.year || vehiculoData.anio || '-',
        serialNumber: vehiculoData.serialNumber || vehiculoData.serie || '-',
        plateNumber: vehiculoData.plateNumber || vehiculoData.patente || '-',
        equipmentType: vehiculoData.equipmentType || 'machinery',
      },
      service: {
        currentHours: vehiculoData.currentHours || vehiculoData.horasActuales || '-',
        currentKilometers: vehiculoData.currentKilometers || vehiculoData.kilometersActuales || '-',
        lastService: vehiculoData.lastService || vehiculoData.ultimoService || '-',
        nextService: vehiculoData.nextService || vehiculoData.proximoService || '-',
        nextServiceKm: vehiculoData.nextServiceKm || vehiculoData.proximoServiceKm || '-',
      },
      // Vehicle-specific compliance data
      ruc: vehiculoData.ruc || null,
      rego: vehiculoData.rego || null,
      oils: {
        engine: {
          type: vehiculoData.engineOil?.type || vehiculoData.aceiteMotor?.tipo || '-',
          capacity: vehiculoData.engineOil?.capacity || vehiculoData.aceiteMotor?.capacidad || '-',
          brand: vehiculoData.engineOil?.brand || vehiculoData.aceiteMotor?.marca || '-',
        },
        hydraulic: {
          type: vehiculoData.hydraulicOil?.type || vehiculoData.aceiteHidraulico?.tipo || '-',
          capacity: vehiculoData.hydraulicOil?.capacity || vehiculoData.aceiteHidraulico?.capacidad || '-',
          brand: vehiculoData.hydraulicOil?.brand || vehiculoData.aceiteHidraulico?.marca || '-',
        },
        transmission: {
          type: vehiculoData.transmissionOil?.type || vehiculoData.aceiteTransmision?.tipo || '-',
          capacity: vehiculoData.transmissionOil?.capacity || vehiculoData.aceiteTransmision?.capacidad || '-',
          brand: vehiculoData.transmissionOil?.brand || vehiculoData.aceiteTransmision?.marca || '-',
        },
      },
      filters: vehiculoData.filters || vehiculoData.filtros || {},
      tires: {
        front: vehiculoData.tires?.front || vehiculoData.neumaticos?.delanteros || {},
        rear: vehiculoData.tires?.rear || vehiculoData.neumaticos?.traseros || {},
      },
    };
  };

  const data = getData();
  
  if (!data) {
    return <div className="text-center text-gray-500 py-10">No machine data available</div>;
  }

  const isVehicle = data.general.equipmentType === 'vehicle';

  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString || dateString === '-') return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-NZ');
    } catch (error) {
      return dateString;
    }
  };

  // Helper function to calculate days until expiry
  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate || expiryDate === '-') return null;
    try {
      const expiry = new Date(expiryDate);
      const today = new Date();
      const diffTime = expiry - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      return null;
    }
  };

  // Helper function to get status color based on days until expiry
  const getStatusColor = (days) => {
    if (days === null) return 'text-gray-500';
    if (days <= 0) return 'text-red-600';
    if (days <= 30) return 'text-orange-500';
    if (days <= 90) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div
      className={`flex flex-col items-center space-y-10 ${isMobile ? 'p-4' : 'p-12'}`}
      style={{
        width: isMobile ? '95%' : 'clamp(60%, 50vw, 1000px)', // Limit dynamic width
        margin: '0 auto',
        padding: 0,
      }}
    >
      {/* General Information */}
      <InfoCard title="General Information" isMobile={isMobile}>
        <DataRow label="Brand" value={data.general.brand} isMobile={isMobile} />
        <DataRow label="Model" value={data.general.model} isMobile={isMobile} />
        <DataRow label="Year" value={data.general.year} isMobile={isMobile} />
        <DataRow label="Serial Number" value={data.general.serialNumber} isMobile={isMobile} />
        <DataRow label={isVehicle ? "Vehicle ID" : "Machine ID"} value={vehiculoData.machineId || vehiculoData.maquinariaId || '-'} isMobile={isMobile} />
        {isVehicle && (
          <DataRow label="Plate Number" value={data.general.plateNumber} isMobile={isMobile} />
        )}
      </InfoCard>

      {/* Vehicle Compliance Section - Only show for vehicles */}
      {isVehicle && (
        <>
          {/* RUC Section */}
          <InfoCard title="Road User Charges (RUC)" isMobile={isMobile}>
            {data.ruc ? (
              <>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">STATUS</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    data.ruc.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {data.ruc.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <DataRow label="Current KM" value={data.ruc.currentKm ? `${data.ruc.currentKm} km` : 'Not set'} isMobile={isMobile} />
                <DataRow label="Next Due KM" value={data.ruc.nextDueKm ? `${data.ruc.nextDueKm} km` : 'Not set'} isMobile={isMobile} />
                <DataRow label="KM Interval" value={data.ruc.kmInterval ? `${data.ruc.kmInterval} km` : 'Not set'} isMobile={isMobile} />
              </>
            ) : (
              <div className="text-gray-500 text-center py-4">
                RUC information not configured
              </div>
            )}
          </InfoCard>

          {/* REGO Section */}
          <InfoCard title="Vehicle Licensing (REGO)" isMobile={isMobile}>
            {data.rego ? (
              <>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">STATUS</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    (() => {
                      const days = getDaysUntilExpiry(data.rego.expiryDate);
                      if (days === null) return 'bg-gray-100 text-gray-600';
                      if (days <= 0) return 'bg-red-100 text-red-600';
                      if (days <= 30) return 'bg-orange-100 text-orange-600';
                      if (days <= 90) return 'bg-yellow-100 text-yellow-600';
                      return 'bg-green-100 text-green-600';
                    })()
                  }`}>
                    {(() => {
                      const days = getDaysUntilExpiry(data.rego.expiryDate);
                      if (days === null) return 'Not set';
                      if (days <= 0) return 'Expired';
                      if (days <= 30) return 'Due Soon';
                      if (days <= 90) return 'Due';
                      return 'Active';
                    })()}
                  </span>
                </div>
                <DataRow label="Expiry Date" value={formatDate(data.rego.expiryDate)} isMobile={isMobile} />
                <DataRow label="Last Renewal Date" value={formatDate(data.rego.lastRenewalDate)} isMobile={isMobile} />
                <DataRow label="Renewal Cost" value={data.rego.cost ? `$${data.rego.cost}` : 'Not set'} isMobile={isMobile} />
              </>
            ) : (
              <div className="text-gray-500 text-center py-4">
                REGO information not configured
              </div>
            )}
          </InfoCard>
        </>
      )}

      {/* Service Information */}
      <InfoCard title="Service Information" isMobile={isMobile}>
        {isVehicle ? (
          <>
            <DataRow label="Current Kilometers" 
                    value={data.service.currentKilometers !== '-' ? `${data.service.currentKilometers} km` : '-'} 
                    isMobile={isMobile} />
            <DataRow label="Next Service" 
                    value={(() => {
                      const nextService = data.service.nextService;
                      if (!nextService || nextService === '-') return '-';
                      
                      // Si ya incluye 'km', mostrarlo tal como está
                      if (nextService.toString().includes('km')) {
                        return nextService;
                      }
                      
                      // Si es un número, agregar 'km'
                      if (!isNaN(nextService)) {
                        return `${nextService} km`;
                      }
                      
                      // Para cualquier otro caso, mostrarlo tal como está
                      return nextService;
                    })()} 
                    isMobile={isMobile} />
          </>
        ) : (
          <>
            <DataRow label="Current Hours" 
                    value={data.service.currentHours ? `${data.service.currentHours} hrs` : '-'} 
                    isMobile={isMobile} />
            <DataRow label="Next Service" value={data.service.nextService} isMobile={isMobile} />
          </>
        )}
        <DataRow label="Last Service" value={data.service.lastService} isMobile={isMobile} />
      </InfoCard>

      {/* Oils */}
      <InfoCard title="Oils" isMobile={isMobile}>
        <div className="border-b border-indigo-200 pb-2">
          <div className="font-semibold mb-2">Engine Oil</div>
          <DataRow label="Type" value={data.oils.engine.type} isMobile={isMobile} />
          <DataRow label="Capacity" value={data.oils.engine.capacity} isMobile={isMobile} />
          <DataRow label="Brand" value={data.oils.engine.brand} isMobile={isMobile} />
        </div>
        <div className="border-b border-indigo-200 pb-2 pt-2">
          <div className="font-semibold mb-2">Hydraulic Oil</div>
          <DataRow label="Type" value={data.oils.hydraulic.type} isMobile={isMobile} />
          <DataRow label="Capacity" value={data.oils.hydraulic.capacity} isMobile={isMobile} />
          <DataRow label="Brand" value={data.oils.hydraulic.brand} isMobile={isMobile} />
        </div>
        <div className="pt-2">
          <div className="font-semibold mb-2">Transmission Oil</div>
          <DataRow label="Type" value={data.oils.transmission.type} isMobile={isMobile} />
          <DataRow label="Capacity" value={data.oils.transmission.capacity} isMobile={isMobile} />
          <DataRow label="Brand" value={data.oils.transmission.brand} isMobile={isMobile} />
        </div>
      </InfoCard>

      {/* Filters */}
      <InfoCard title="Filters" isMobile={isMobile}>
        <div className="border-b border-indigo-200 pb-2">
          <div className="font-semibold mb-2">Engine Filter</div>
          <DataRow label="Part Number" value={data.filters.engine || '-'} isMobile={isMobile} />
          <DataRow label="Brand" value={data.filters.engineBrand || '-'} isMobile={isMobile} />
        </div>
        <div className="border-b border-indigo-200 pb-2 pt-2">
          <div className="font-semibold mb-2">Transmission Filter</div>
          <DataRow label="Part Number" value={data.filters.transmission || '-'} isMobile={isMobile} />
          <DataRow label="Brand" value={data.filters.transmissionBrand || '-'} isMobile={isMobile} />
        </div>
        <div className="border-b border-indigo-200 pb-2 pt-2">
          <div className="font-semibold mb-2">Fuel Filter</div>
          <DataRow label="Part Number" value={data.filters.fuel || '-'} isMobile={isMobile} />
          <DataRow label="Brand" value={data.filters.fuelBrand || '-'} isMobile={isMobile} />
        </div>
        <div className="border-b border-indigo-200 pb-2 pt-2">
          <div className="font-semibold mb-2">Air Filter</div>
          <DataRow label="Part Number" value={vehiculoData.air || data.filters.air || '-'} isMobile={isMobile} />
          <DataRow label="Brand" value={vehiculoData.airBrand || data.filters.airBrand || '-'} isMobile={isMobile} />
        </div>
        {/* Carbon Filter - Show if configured */}
        {vehiculoData.filters?.carbon?.isActive && (
          <div className="pt-2">
            <div className="font-semibold mb-2">Carbon Filter (Chemical Equipment)</div>
            <DataRow label="Part Number" value={vehiculoData.filters?.carbon?.partNumber || '-'} isMobile={isMobile} />
            <DataRow label="Brand" value={vehiculoData.filters?.carbon?.brand || '-'} isMobile={isMobile} />
          </div>
        )}
      </InfoCard>

      {/* Tires */}
      <InfoCard title="Tires" isMobile={isMobile}>
        <div className="border-b border-indigo-200 pb-2">
          <div className="font-semibold mb-2">Front Tires</div>
          <DataRow label="Size" value={data.tires.front.size || '-'} isMobile={isMobile} />
          <DataRow label="Pressure" value={data.tires.front.pressure || '-'} isMobile={isMobile} />
          <DataRow label="Brand" value={data.tires.front.brand || '-'} isMobile={isMobile} />
        </div>
        <div className="pt-2">
          <div className="font-semibold mb-2">Rear Tires</div>
          <DataRow label="Size" value={data.tires.rear.size || '-'} isMobile={isMobile} />
          <DataRow label="Pressure" value={data.tires.rear.pressure || '-'} isMobile={isMobile} />
          <DataRow label="Brand" value={data.tires.rear.brand || '-'} isMobile={isMobile} />
        </div>
      </InfoCard>

      {/* Service History */}
      <div className="bg-indigo-50 p-4 md:p-8 rounded-lg border border-indigo-200 shadow-md w-full mx-auto" style={{ maxWidth: '100%' }}>
        <button
          onClick={() => setShowServiceHistory(!showServiceHistory)}
          className="w-full flex items-center justify-between"
        >
          <h4 className={`text-black font-semibold ${isMobile ? 'text-xl' : 'text-3xl'}`}>
            Service History
          </h4>
          {showServiceHistory ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
        </button>

        {showServiceHistory && (
          <div className="mt-4 space-y-3">
            {loadingServices && (
              <div className="text-center py-4 text-gray-500">Loading service records...</div>
            )}

            {serviceError && (
              <div className="text-center py-4 text-red-500">{serviceError}</div>
            )}

            {!loadingServices && !serviceError && serviceHistory.length === 0 && (
              <div className="text-center py-4 text-gray-400">No service records found for this machine.</div>
            )}

            {!loadingServices && serviceHistory.map((svc, i) => {
              const statusMap = {
                'Completado': { color: 'bg-green-100 text-green-700', Icon: CheckCircle },
                'En Progreso': { color: 'bg-yellow-100 text-yellow-700', Icon: Clock },
                'Pendiente': { color: 'bg-blue-100 text-blue-700', Icon: Clock },
                'Cancelado': { color: 'bg-red-100 text-red-700', Icon: XCircle },
              };
              const typeMap = {
                'Preventivo': 'bg-emerald-100 text-emerald-700',
                'preventivo': 'bg-emerald-100 text-emerald-700',
                'Correctivo': 'bg-orange-100 text-orange-700',
                'correctivo': 'bg-orange-100 text-orange-700',
                'Emergencia': 'bg-red-100 text-red-700',
                'emergencia': 'bg-red-100 text-red-700',
              };
              const s = statusMap[svc.status] || statusMap['Pendiente'];
              const StatusIcon = s.Icon;

              return (
                <div key={i} className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-800">
                      {svc.fechaInicio ? new Date(svc.fechaInicio).toLocaleDateString('en-NZ', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </span>
                    {svc.serviceType && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeMap[svc.serviceType] || 'bg-gray-100 text-gray-700'}`}>
                        {svc.serviceType}
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
                      <StatusIcon className="w-3 h-3" /> {svc.status}
                    </span>
                  </div>
                  {svc.description && (
                    <p className="text-sm text-gray-600">{svc.description}</p>
                  )}
                  {svc.tecnico && (
                    <p className="text-xs text-gray-500">Technician: {svc.tecnico}</p>
                  )}
                  {(svc.horasIniciales || svc.horasFinales) && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Hours: {svc.horasIniciales ?? '—'} → {svc.horasFinales ?? '—'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Reusable component for showing each row of data
const DataRow = ({ label, value, isMobile }) => (
  <div className={`flex flex-col w-full mb-1`}>
    <p className={`text-black ${isMobile ? 'text-md' : 'text-lg'}`}>
      <strong>{label}:</strong> {value}
    </p>
  </div>
);

export default VehicleDataDisplay;