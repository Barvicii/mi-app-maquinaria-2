'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Notification from './Notification';

// Define trabajosPredefinidos array
const trabajosPredefinidos = [
  { id: 1, descripcion: 'Oil Change' },
  { id: 2, descripcion: 'Filter Replacement' },
  { id: 3, descripcion: 'Brake Check' },
  { id: 4, descripcion: 'Tire Rotation' },
  { id: 5, descripcion: 'Fluid Check' },
  { id: 6, descripcion: 'Belt Inspection' },
  { id: 7, descripcion: 'Battery Test' },
  { id: 8, descripcion: 'Air Filter Change' },
  { id: 9, descripcion: 'Spark Plug Check' },
  { id: 10, descripcion: 'General Inspection' }
];

const ServiceFormComponent = ({ 
  machineId, 
  machine, 
  serviceData: initialServiceData, 
  setServiceData: externalSetServiceData,
  onSubmit: externalSubmit,
  onSubmitSuccess,
  resetOnSubmit
}) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  
  // Estado inicial con fecha por defecto
  const todayDate = new Date().toISOString().split('T')[0];
  
  // Estado interno con valores por defecto para prevenir errores de controlado/no controlado
  const [internalServiceData, setInternalServiceData] = useState({
    maquinaId: machineId || '',
    tipoService: '',
    horasActuales: '',
    horasProximoService: '',
    tecnico: '',
    trabajosRealizados: [],
    repuestos: '',
    observaciones: '',
    fecha: todayDate, // Asignamos fecha predeterminada
    costo: ''
  });

  // Usar los datos externos si se proporcionan, o los internos si no
  const serviceData = initialServiceData || internalServiceData;
  const setServiceData = externalSetServiceData || setInternalServiceData;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Log para depuración
    console.log(`Changing ${name} to ${type === 'checkbox' ? checked : value}`);
    
    // Actualizar el estado usando la función setServiceData que se eligió antes
    setServiceData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      console.log('New service data:', newData);
      return newData;
    });
  };

  const handleTrabajoChange = (trabajoId) => {
    setServiceData(prev => {
      // Asegurar que prev.trabajosRealizados sea un array
      const trabajos = Array.isArray(prev.trabajosRealizados) ? prev.trabajosRealizados : [];
      
      return {
        ...prev,
        trabajosRealizados: trabajos.includes(trabajoId)
          ? trabajos.filter(id => id !== trabajoId)
          : [...trabajos, trabajoId]
      };
    });
  };

  // Resto del componente igual, pero con verificación para machine
  useEffect(() => {
    // If machine is already provided, use it
    if (machine) {
      console.log('Using provided machine:', machine);
      
      // Update the serviceData with the machine's custom ID
      setServiceData(prev => ({
        ...prev,
        machineId: machineId, // Keep the MongoDB ID for database reference
        customMachineId: machine.machineId || machine.customId, // Save the custom ID
        horasActuales: machine.currentHours || machine.horasActuales || "",
        horasProximoService: machine.nextService || 
          (machine.currentHours ? parseInt(machine.currentHours) + 100 : "") ||
          (machine.horasActuales ? parseInt(machine.horasActuales) + 100 : "")
      }));
      setLoading(false);
      return;
    }
    
    // If no machine is provided, fetch it
    const fetchMachine = async () => {
      if (!machineId) return;
      
      try {
        console.log('Fetching machine data with ID:', machineId);
        setLoading(true);
        
        const response = await fetch(`/api/machines/${machineId}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching machine: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Machine data received:', data);
        
        // Update serviceData with both IDs
        setServiceData(prev => ({
          ...prev,
          machineId: machineId, // MongoDB ID
          customMachineId: data.machineId || data.customId, // Custom ID
          horasActuales: data.currentHours || data.horasActuales || "",
          horasProximoService: data.nextService || 
            (data.currentHours ? parseInt(data.currentHours) + 100 : "") ||
            (data.horasActuales ? parseInt(data.horasActuales) + 100 : "")
        }));
        
      } catch (error) {
        console.error('Error fetching machine:', error);
        setError('Error loading machine data: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (!machine && machineId) {
      fetchMachine();
    } else {
      setLoading(false);
    }
  }, [machineId, machine, setServiceData]);

  // Function to show notifications
  const showNotification = (message, type = 'success') => {
    setNotification({
      show: true,
      message,
      type
    });
    
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  // Modify the handleSubmit function to include better error handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!machineId) {
      setError('No machine ID provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[ServiceFormComponent] Starting submission with machineId:', machineId);
      
      // Convert work IDs to descriptions
      const trabajosArray = Array.isArray(serviceData.trabajosRealizados) 
        ? serviceData.trabajosRealizados 
        : [];
        
      const trabajosRealizadosTexto = trabajosArray.map(
        id => trabajosPredefinidos.find(t => t.id === id)?.descripcion || ''
      ).filter(desc => desc !== '');
      
      // Ensure numeric values are properly parsed
      let horasActuales = serviceData.horasActuales;
      if (horasActuales !== null && horasActuales !== undefined && horasActuales !== '') {
        horasActuales = parseInt(horasActuales, 10);
      } else {
        horasActuales = 0;
      }
      
      let horasProximoService = serviceData.horasProximoService;
      if (horasProximoService !== null && horasProximoService !== undefined && horasProximoService !== '') {
        horasProximoService = parseInt(horasProximoService, 10);
      } else {
        horasProximoService = 0;
      }
      
      let costo = serviceData.costo;
      if (costo !== null && costo !== undefined && costo !== '') {
        costo = parseFloat(costo);
      } else {
        costo = 0;
      }

      // Determine if we're in public mode with multiple checks
      const determineIfPublic = () => {
        // Check 1: URL parameter check
        if (window.location.search.includes('public=true')) {
          console.log('[ServiceFormComponent] Public mode detected via URL parameter');
          return true;
        }
        
        // Check 2: URL path check (if accessed via /service/ route)
        if (window.location.pathname.includes('/service/')) {
          console.log('[ServiceFormComponent] Public mode detected via service path');
          return true;
        }
        
        // Check 3: No authenticated session check
        if (!session || !session.user) {
          console.log('[ServiceFormComponent] Public mode detected via missing session');
          return true;
        }
        
        console.log('[ServiceFormComponent] Using authenticated mode');
        return false;
      };

      const isPublic = determineIfPublic();

      // Build the submission data object
      const dataToSubmit = {
        machineId: machineId, // Keep the MongoDB ID for lookups
        customMachineId: serviceData.customMachineId || machine?.machineId || '', // Include custom ID
        fecha: serviceData.fecha ? new Date(serviceData.fecha).toISOString() : new Date().toISOString(),
        tipo: 'service',
        datos: {
          machineId: machineId,
          customMachineId: serviceData.customMachineId || machine?.machineId || '', // Also in datos
          tipoService: serviceData.tipoService || '',
          horasActuales: horasActuales,
          horasProximoService: horasProximoService,
          tecnico: serviceData.tecnico || '',
          trabajosRealizados: trabajosRealizadosTexto,
          repuestos: serviceData.repuestos || '',
          observaciones: serviceData.observaciones || '',
          costo: costo,
          maquina: machine?.model || machine?.marca || machine?.brand || ''
        },
        source: isPublic ? 'public' : 'system',
        status: 'Pendiente' // Add a default status
      };

      console.log('[ServiceFormComponent] Mode:', isPublic ? 'PUBLIC' : 'AUTHENTICATED');
      console.log('[ServiceFormComponent] Submitting service data:', JSON.stringify(dataToSubmit, null, 2));

      // Always include public=true if in public mode
      const apiUrl = isPublic 
        ? `/api/services?public=true&_t=${Date.now()}` 
        : `/api/services?_t=${Date.now()}`;

      console.log(`[ServiceFormComponent] Using API URL: ${apiUrl}`);
      
      // Make the API request
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      });

      console.log(`[ServiceFormComponent] Response status: ${response.status}`);
      
      // Get the response text first for debugging
      const responseText = await response.text();
      console.log(`[ServiceFormComponent] Response text: ${responseText}`);
      
      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // Not JSON, use text as is
        }
        
        throw new Error(errorMessage);
      }
      
      // Parse response as JSON if possible
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { success: true };
      }
      
      console.log('[ServiceFormComponent] Service saved successfully:', responseData);
      
      // Get custom machine ID for display
      const customMachineId = serviceData.customMachineId || machine?.machineId || machine?.customId || machineId;
      
      // Redirect immediately to success page with custom machine ID
      router.push(`/thanks?type=service&message=${encodeURIComponent('Service record saved successfully!')}&machineId=${encodeURIComponent(customMachineId)}`);
      
      // Reset form if needed
      if (resetOnSubmit) {
        setServiceData({
          tipoService: '',
          horasActuales: '',
          horasProximoService: '',
          tecnico: '',
          trabajosRealizados: [],
          repuestos: '',
          observaciones: '',
          costo: '',
          fecha: todayDate
        });
      }
    } catch (err) {
      console.error('[ServiceFormComponent] Error submitting service:', err);
      setError(err.message || 'Error saving service record');
      showNotification(err.message || 'Error saving service record', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loader mientras se cargan los datos
  if (loading && !machine) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Notification Component */}
      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          show={notification.show}
          onClose={() => setNotification(prev => ({ ...prev, show: false }))}
        />
      )}
      
      <div className="max-w-4xl mx-auto p-4">
      {/* Se eliminó el encabezado con el logo y la información de la máquina */}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-1 text-black">
              Service Type
            </label>
            <select
              name="tipoService"
              value={serviceData.tipoService || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded-md text-black"
              required
            >
              <option value="">Select type...</option>
              <option value="preventivo">Preventive</option>
              <option value="correctivo">Corrective</option>
              <option value="revision">General Review</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 text-black">
              Current Hours
            </label>
            <input
              type="number"
              name="horasActuales"
              value={serviceData.horasActuales || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded-md text-black"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-black">
              Next Service Hours
            </label>
            <input
              type="number"
              name="horasProximoService"
              value={serviceData.horasProximoService || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded-md text-black"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-black">
              Date
            </label>
            <input
              type="date"
              name="fecha"
              value={serviceData.fecha || todayDate}
              onChange={handleChange}
              className="w-full p-2 border rounded-md text-black"
            />
          </div>

          <div>
            <label className="block mb-1 text-black">
              Technician
            </label>
            <input
              type="text"
              name="tecnico"
              value={serviceData.tecnico || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded-md text-black"
              placeholder="Enter technician name..."
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-black">
              Work Performed
            </label>
            <div className="border rounded-md p-2 h-48 overflow-y-auto">
              {trabajosPredefinidos.map(trabajo => (
                <div key={trabajo.id} className="flex items-center space-x-2 py-1">
                  <input
                    type="checkbox"
                    id={`trabajo-${trabajo.id}`}
                    checked={Array.isArray(serviceData.trabajosRealizados) && 
                      serviceData.trabajosRealizados.includes(trabajo.id)}
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
            <label className="block mb-1 text-black">
              Parts Used
            </label>
            <textarea
              name="repuestos"
              value={serviceData.repuestos || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded-md text-black"
              rows={2}
              placeholder="List the parts used..."
            />
          </div>

          <div>
            <label className="block mb-1 text-black">
              Observations
            </label>
            <textarea
              name="observaciones"
              value={serviceData.observaciones || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded-md text-black"
              rows={3}
              placeholder="Enter your observations here..."
            />
          </div>

          <div>
            <label className="block mb-1 text-black">
              Cost
            </label>
            <input
              type="number"
              name="costo"
              value={serviceData.costo || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded-md text-black"
              placeholder="Enter cost (optional)"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md ${
              loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
          >
            {loading ? 'Saving...' : 'Save Service'}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default ServiceFormComponent;