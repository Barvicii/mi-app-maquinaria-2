import React, { useState, useEffect } from 'react';

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
const VehicleDataDisplay = ({ vehiculoData }) => {
  const [isMobile, setIsMobile] = useState(false);
  
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

  // Handle data mapping from different formats
  const getData = () => {
    if (!vehiculoData) return null;
    
    return {
      general: {
        brand: vehiculoData.brand || vehiculoData.marca || '-',
        model: vehiculoData.model || vehiculoData.modelo || '-',
        year: vehiculoData.year || vehiculoData.anio || '-',
        serialNumber: vehiculoData.serialNumber || vehiculoData.serie || '-',
      },
      service: {
        currentHours: vehiculoData.currentHours || vehiculoData.horasActuales || '-',
        lastService: vehiculoData.lastService || vehiculoData.ultimoService || '-',
        nextService: vehiculoData.nextService || vehiculoData.proximoService || '-',
      },
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
        <DataRow label="Machine ID" value={vehiculoData.machineId || vehiculoData.maquinariaId || '-'} isMobile={isMobile} />
      </InfoCard>

      {/* Service Information */}
      <InfoCard title="Service Information" isMobile={isMobile}>
        <DataRow label="Current Hours" 
                value={data.service.currentHours ? `${data.service.currentHours} hrs` : '-'} 
                isMobile={isMobile} />
        <DataRow label="Last Service" value={data.service.lastService} isMobile={isMobile} />
        <DataRow label="Next Service" value={data.service.nextService} isMobile={isMobile} />
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
        <div className="pt-2">
          <div className="font-semibold mb-2">Fuel Filter</div>
          <DataRow label="Part Number" value={data.filters.fuel || '-'} isMobile={isMobile} />
          <DataRow label="Brand" value={data.filters.fuelBrand || '-'} isMobile={isMobile} />
        </div>
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