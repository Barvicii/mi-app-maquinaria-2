import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';

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

const ServiceFormComponent = ({ machineId }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [machine, setMachine] = useState(null);
  const [machineUserId, setMachineUserId] = useState(null);

  // First, fetch the machine data
  useEffect(() => {
    const fetchMachine = async () => {
      try {
        console.log('Fetching machine with ID:', machineId); // Debug log
        const response = await fetch(`/api/machines/${machineId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error('Failed to fetch machine');
        }

        console.log('Machine data received:', data); // Debug log
        setMachine(data);
        
        // Update serviceData with machineId once we confirm the machine exists
        setServiceData(prev => ({
          ...prev,
          maquinaId: machineId
        }));

      } catch (error) {
        console.error('Error fetching machine:', error);
        setError('Error loading machine data');
      }
    };

    if (machineId) {
      fetchMachine();
    }
  }, [machineId]);

  useEffect(() => {
    const fetchMachineDetails = async () => {
      try {
        const response = await fetch(`/api/machines/${machineId}`);
        const machineData = await response.json();
        
        if (!response.ok) throw new Error('Failed to fetch machine');
        
        console.log('Machine data:', machineData);
        if (machineData.userId) {
          setMachineUserId(machineData.userId);
        }
      } catch (error) {
        console.error('Error fetching machine details:', error);
      }
    };

    if (machineId) {
      fetchMachineDetails();
    }
  }, [machineId]);

  const [serviceData, setServiceData] = useState({
    tipoService: '',
    horasActuales: '',
    horasProximoService: '',
    tecnico: '',
    trabajosRealizados: [],
    repuestos: '',
    observaciones: '',
    fecha: new Date().toISOString().split('T')[0],
    costo: '',
    maquinaId: machineId // Set the machineId here
  });

  // Then, fetch the technicians
  useEffect(() => {
    const fetchTechnicians = async () => {
      if (!session?.user?.id) {
        console.log('No user session found');
        return;
      }

      try {
        console.log('Fetching technicians for user:', session.user.id);
        const response = await fetch(`/api/technicians?userId=${session.user.id}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch technicians');
        }

        console.log('Technicians loaded:', data);
        setTechnicians(data);

      } catch (error) {
        console.error('Error fetching technicians:', error);
        setError('Error loading technicians');
        toast.error('Failed to load technicians');
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicians();
  }, [session]);

  useEffect(() => {
    const fetchTechnicians = async () => {
      if (!machineUserId) {
        console.log('No machine userId available');
        return;
      }

      try {
        const response = await fetch(`/api/technicians/by-user/${machineUserId}`);
        const data = await response.json();
        
        if (!response.ok) throw new Error('Failed to fetch technicians');
        
        console.log('Technicians loaded:', data);
        setTechnicians(data);
      } catch (error) {
        console.error('Error fetching technicians:', error);
      }
    };

    if (machineUserId) {
      fetchTechnicians();
    }
  }, [machineUserId]);

  // Add loading state display
  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Add error state display
  if (error) {
    return (
      <div className="text-center p-4">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setServiceData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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

  // Modify handleSubmit to ensure machineId is included
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!machineId) {
      setError('No machine ID provided');
      return;
    }

    setLoading(true);

    try {
      const dataToSubmit = {
        ...serviceData,
        maquinaId: machineId,
        customId: machine?.customId, // Include custom ID if available
        fecha: new Date().toISOString()
      };

      console.log('Submitting service data:', dataToSubmit); // Debug log

      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error saving service');
      }

      setShowSuccess(true);
      toast.success('Service saved successfully');
      
      setTimeout(() => {
        setShowSuccess(false);
        router.push('/dashboard');
      }, 2000);

    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add machine info display at the top of the form
  return (
    <div className="max-w-4xl mx-auto p-4">
      {machine && (
        <div className="space-y-6 text-center mb-6">
          <div className="flex justify-center">
            <img 
              src="/Imagen/logoo.png" 
              alt="Logo" 
              className="w-60 h-auto"
            />
          </div>
          <span className="brand-text">Orchard Service</span>
          <h2 className="text-2xl font-bold text-gray-800">
            {machine.customId || 'No ID'}
          </h2>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Service Type
            </label>
            <select
              name="tipoService"
              value={serviceData.tipoService}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            >
              <option value="">Select type...</option>
              <option value="preventivo">Preventive</option>
              <option value="correctivo">Corrective</option>
              <option value="revision">General Review</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Current Hours
            </label>
            <input
              type="number"
              name="horasActuales"
              value={serviceData.horasActuales}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Next Service Hours
            </label>
            <input
              type="number"
              name="horasProximoService"
              value={serviceData.horasProximoService}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              name="fecha"
              value={serviceData.fecha}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Technician
            </label>
            <select
              name="tecnico"
              value={serviceData.tecnico}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
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

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Work Performed
            </label>
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
            <label className="block text-sm font-medium text-gray-700">
              Parts Used
            </label>
            <textarea
              name="repuestos"
              value={serviceData.repuestos}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              rows={2}
              placeholder="List the parts used..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Observations
            </label>
            <textarea
              name="observaciones"
              value={serviceData.observaciones}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              rows={3}
              placeholder="Enter your observations here..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Cost
            </label>
            <input
              type="number"
              name="costo"
              value={serviceData.costo}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
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

      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            Service saved successfully!
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceFormComponent;