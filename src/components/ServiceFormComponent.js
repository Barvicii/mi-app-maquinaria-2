import React, { useState, useEffect } from 'react';

const ServiceFormComponent = () => {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [serviceData, setServiceData] = useState({
    tipoService: '',
    horasActuales: '',
    horasProximoService: '',
    tecnico: '',
    trabajosRealizados: [],
    repuestos: '',
    observaciones: '',
    fecha: new Date().toISOString().split('T')[0],
    costo: 0
  });

  const trabajosPredefinidos = [
    { id: 1, descripcion: 'Engine oil and filter change' },
    { id: 2, descripcion: 'Air filter change' },
    { id: 3, descripcion: 'Fuel filter change' },
    { id: 4, descripcion: 'Brake system check' },
    { id: 5, descripcion: 'Tire inspection' },
    { id: 6, descripcion: 'Hydraulic oil change' },
    { id: 7, descripcion: 'Transmission oil change' },
    { id: 8, descripcion: 'Electrical system inspection' },
    { id: 9, descripcion: 'Valve calibration' },
    { id: 10, descripcion: 'General cleaning' }
  ];

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/operators');
      if (!response.ok) throw new Error('Failed to fetch technicians');
      
      const data = await response.json();
      const techniciansList = Array.isArray(data) 
        ? data.filter(op => op.tipo === 'technician')
        : [];
        
      setTechnicians(techniciansList);
    } catch (err) {
      console.error('Error fetching technicians:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setServiceData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTrabajoChange = (trabajoId) => {
    setServiceData(prev => ({
      ...prev,
      trabajosRealizados: prev.trabajosRealizados.includes(trabajoId)
        ? prev.trabajosRealizados.filter(id => id !== trabajoId)
        : [...prev.trabajosRealizados, trabajoId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedTasks = serviceData.trabajosRealizados
        .map(id => trabajosPredefinidos.find(t => t.id === id)?.descripcion)
        .filter(Boolean);

      const dataToSubmit = {
        tecnico: serviceData.tecnico,
        fecha: serviceData.fecha,
        horasMaquina: Number(serviceData.horasActuales),
        tipoServicio: serviceData.tipoService,
        proximoService: Number(serviceData.horasProximoService),
        trabajosRealizados: selectedTasks,
        repuestos: serviceData.repuestos || '',
        observaciones: serviceData.observaciones || '',
        costo: Number(serviceData.costo) || 0
      };

      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error saving service');
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        window.close();
      }, 2000);

    } catch (error) {
      console.error('Submit error:', error);
      alert(error.message);
    }
  };

  return (
    <div className="container mx-auto p-4">
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Operation Successful
            </h3>
            <p className="text-gray-600">
              The service record has been saved successfully.
            </p>
          </div>
        </div>
      )}

      {loading && <div>Loading technicians...</div>}
      {error && <div className="text-red-500">Error: {error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-black">Service Type</label>
              <select 
                name="tipoService"
                value={serviceData.tipoService}
                onChange={handleChange}
                className="w-full p-2 border rounded-md text-black"
                required
              >
                <option value="">Select...</option>
                <option value="preventivo">Preventive Maintenance</option>
                <option value="correctivo">Corrective Maintenance</option>
                <option value="revision">General Review</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-black">Current Hours</label>
              <input
                type="number"
                name="horasActuales"
                value={serviceData.horasActuales}
                onChange={handleChange}
                className="w-full p-2 border rounded-md text-black"
                required
                placeholder="Enter current hours"
              />
            </div>

            <div>
              <label className="block mb-1 text-black">Next Service Hours</label>
              <input
                type="number"
                name="horasProximoService"
                value={serviceData.horasProximoService}
                onChange={handleChange}
                className="w-full p-2 border rounded-md text-black"
                required
                placeholder="Enter next service hours"
              />
            </div>

            <div>
              <label className="block mb-1 text-black">Date</label>
              <input
                type="date"
                name="fecha"
                value={serviceData.fecha}
                onChange={handleChange}
                className="w-full p-2 border rounded-md text-black"
              />
            </div>

            <div>
              <label className="block mb-1 text-black">Technician</label>
              <select
                name="tecnico"
                value={serviceData.tecnico}
                onChange={handleChange}
                className="w-full p-2 border rounded-md text-black"
                required
              >
                <option value="">Select technician...</option>
                {technicians.map((tech) => (
                  <option key={tech._id} value={`${tech.nombre} ${tech.apellido}`}>
                    {tech.nombre} {tech.apellido} - {tech.especialidad}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-black">Work Performed</label>
              <div className="border rounded-md p-2 h-48 overflow-y-auto">
                {trabajosPredefinidos.map(trabajo => (
                  <div key={trabajo.id} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      id={`trabajo-${trabajo.id}`}
                      checked={serviceData.trabajosRealizados.includes(trabajo.id)}
                      onChange={() => handleTrabajoChange(trabajo.id)}
                      className="w-4 h-4"
                    />
                    <label htmlFor={`trabajo-${trabajo.id}`} className="text-black">
                      {trabajo.descripcion}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block mb-1 text-black">Parts Used</label>
              <textarea
                name="repuestos"
                value={serviceData.repuestos}
                onChange={handleChange}
                className="w-full p-2 border rounded-md text-black"
                rows={2}
                placeholder="List the parts used..."
              />
            </div>

            <div>
              <label className="block mb-1 text-black">Observations</label>
              <textarea
                name="observaciones"
                value={serviceData.observaciones}
                onChange={handleChange}
                className="w-full p-2 border rounded-md text-black"
                rows={3}
                placeholder="Enter your observations here..."
              />
            </div>

            <div>
              <label className="block mb-1 text-black">Cost</label>
              <input
                type="number"
                name="costo"
                value={serviceData.costo}
                onChange={handleChange}
                className="w-full p-2 border rounded-md text-black"
                placeholder="Enter cost (optional)"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            type="submit"
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 shadow-md"
          >
            Save Service
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServiceFormComponent;