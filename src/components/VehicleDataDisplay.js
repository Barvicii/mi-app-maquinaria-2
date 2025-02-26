import React, { useState, useEffect } from 'react';

// Componente reutilizable para cada sección de datos
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

// Componente principal
const VehicleDataDisplay = ({ vehiculoData }) => {
  const [isMobile, setIsMobile] = useState(false);

  // Detectar dispositivo
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize(); // Detectar al cargar
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      className={`flex flex-col items-center space-y-10 ${isMobile ? 'p-4' : 'p-12'}`}
      style={{
        width: isMobile ? '95%' : 'clamp(60%, 50vw, 1000px)', // Limitar el ancho dinámico
        margin: '0 auto',
        padding: 0,
      }}
    >
      {/* Información General */}
      <InfoCard title="Información General" isMobile={isMobile}>
        <DataRow label="Marca" value={vehiculoData.marca} isMobile={isMobile} />
        <DataRow label="Modelo" value={vehiculoData.modelo} isMobile={isMobile} />
        <DataRow label="Año" value={vehiculoData.anio} isMobile={isMobile} />
        <DataRow label="N° Serie" value={vehiculoData.serie} isMobile={isMobile} />
      </InfoCard>

      {/* Aceites */}
      <InfoCard title="Aceites" isMobile={isMobile}>
        {['Motor', 'Hidráulico', 'Transmisión'].map((tipo) => {
          const key = `aceite${tipo}`;
          const aceite = vehiculoData[key];
          return (
            <div key={key} className="border-b border-indigo-200 pb-2">
              <DataRow label="Tipo" value={aceite?.tipo || 'N/A'} isMobile={isMobile} />
              <DataRow label="Capacidad" value={aceite?.capacidad || 'N/A'} isMobile={isMobile} />
              <DataRow label="Marca" value={aceite?.marca || 'N/A'} isMobile={isMobile} />
            </div>
          );
        })}
      </InfoCard>

      {/* Filtros */}
      <InfoCard title="Filtros" isMobile={isMobile}>
        {Object.entries(vehiculoData.filtros || {}).map(([key, valor]) => (
          <div key={key} className="border-b border-indigo-200 pb-2">
            <DataRow label="Tipo" value={valor.tipo || 'N/A'} isMobile={isMobile} />
            <DataRow label="Marca" value={valor.marca || 'N/A'} isMobile={isMobile} />
            <DataRow label="Número" value={valor.numero || 'N/A'} isMobile={isMobile} />
          </div>
        ))}
      </InfoCard>

      {/* Neumáticos */}
      <InfoCard title="Neumáticos" isMobile={isMobile}>
        {['delanteros', 'traseros'].map((posicion) => {
          const neumatico = vehiculoData.neumaticos?.[posicion];
          return (
            <div key={posicion} className="border-b border-indigo-200 pb-2">
              <DataRow
                label={posicion.charAt(0).toUpperCase() + posicion.slice(1)}
                value=""
                isMobile={isMobile}
              />
              <DataRow label="Tamaño" value={neumatico?.tamano || 'N/A'} isMobile={isMobile} />
              <DataRow label="Presión" value={neumatico?.presion || 'N/A'} isMobile={isMobile} />
              <DataRow label="Marca" value={neumatico?.marca || 'N/A'} isMobile={isMobile} />
            </div>
          );
        })}
      </InfoCard>
    </div>
  );
};

// Componente reutilizable para mostrar cada fila de datos
const DataRow = ({ label, value, isMobile }) => (
  <div className={`flex flex-col w-full`}>
    <p className={`text-black ${isMobile ? 'text-lg' : 'text-xl'}`}>
      <strong>{label}:</strong> {value}
    </p>
  </div>
);

export default VehicleDataDisplay;
