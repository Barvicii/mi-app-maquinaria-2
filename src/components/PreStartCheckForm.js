import React, { useState, useEffect } from 'react';



const PreStartCheckForm = ({ prestartData, handlePrestartChange, handleSubmit }) => {
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOperators = async () => {
      try {
        const response = await fetch('/api/operators');
        const result = await response.json();
        
        console.log('API Response:', result);
        
        if (!response.ok) {
          throw new Error(result.error || 'Error al cargar operadores');
        }

        const onlyOperators = result.data.filter(op => {
          console.log('Operator type:', op.tipo);
          return op.tipo === 'operator';
        });
        
        console.log('Filtered operators:', onlyOperators);
        
        setOperators(onlyOperators);
      } catch (error) {
        console.error('Error fetching operators:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchOperators();
  }, []);

  

 // Modificación importante: añadir una verificación de tipo
 const handleChange = (e) => {
  console.log('Tipo de handlePrestartChange:', typeof handlePrestartChange);
  
  // Verificación explícita del tipo de función
  if (typeof handlePrestartChange === 'function') {
    handlePrestartChange(e);
  } else {
    console.error('handlePrestartChange NO ES UNA FUNCIÓN VÁLIDA', handlePrestartChange);
    
    // Opcional: añadir un manejador de respaldo
    console.warn('Usando manejador de respaldo');
    const { name, value, type, checked } = e.target;
    console.log(`Cambio de respaldo - ${name}: ${type === 'checkbox' ? checked : value}`);
  }
};

  const checkItems = [
    { name: 'aceite', label: 'Nivel de Aceite' },
    { name: 'agua', label: 'Nivel de Agua' },
    { name: 'neumaticos', label: 'Estado de Neumáticos' },
    { name: 'nivelCombustible', label: 'Nivel de Combustible' },
    { name: 'lucesYAlarmas', label: 'Luces y Alarmas' },
    { name: 'frenos', label: 'Sistema de Frenos' },
    { name: 'extintores', label: 'Extintores' },
    { name: 'cinturonSeguridad', label: 'Cinturón de Seguridad' }
  ];

  if (loading) {
    return <div className="text-center">Cargando operadores...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600">Error: {error}</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Todos los inputs usan handleChange */}
      <input
        type="number"
        name="horasMaquina"
        value={prestartData?.horasMaquina || ''} 
        onChange={handleChange}
        // ... otros atributos
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block mb-1 text-gray-700">Horas de la Máquina</label>
            <input
              type="number"
              name="horasMaquina"
              value={prestartData?.horasMaquina || ''} 
              onChange={handleChange} // Usa el nuevo manejador
              className="w-full p-2 border rounded-md"
              required
              placeholder="Ingrese las horas actuales"
            />
          </div>

          <div className="space-y-3">
            {checkItems.map(item => (
              <div key={item.name} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={item.name}
                  name={item.name}
                  checked={prestartData?.[item.name] || false}
                  onChange={handleChange} // Usa el nuevo manejador
                  className="w-5 h-5"
                />
                <label htmlFor={item.name} className="text-gray-700">
                  {item.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block mb-1 text-gray-700">Operador</label>
            <select
              name="operador"
              value={prestartData?.operador || ''} 
              onChange={handleChange} // Usa el nuevo manejador
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="">Seleccionar operador...</option>
              {operators.map((op) => (
                <option key={op._id} value={`${op.nombre} ${op.apellido}`}>
                  {op.nombre} {op.apellido}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-gray-700">Observaciones</label>
            <textarea
              name="observaciones"
              value={prestartData?.observaciones || ''} 
              onChange={handleChange} // Usa el nuevo manejador
              className="w-full p-2 border rounded-md"
              rows={4}
              placeholder="Ingrese sus observaciones aquí..."
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <button
          type="submit"
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 shadow-md"
        >
          Guardar Pre-Start
        </button>
      </div>
    </form>
  );
};
const PreStartCheck = () => {
  const [prestartData, setPrestartData] = useState({
    horasMaquina: '',
    operador: '',
    observaciones: '',
    aceite: false,
    agua: false,
    neumaticos: false,
    nivelCombustible: false,
    lucesYAlarmas: false,
    frenos: false,
    extintores: false,
    cinturonSeguridad: false
  });

  const handlePrestartChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Log detallado para depuración
    console.log('Cambio en el formulario:', {
      name, 
      value, 
      type, 
      checked
    });

    // Actualiza el estado basado en el tipo de input
    setPrestartData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Datos de Pre-Start:', prestartData);
  };

  return (
    <PreStartCheckForm 
      prestartData={prestartData} 
      handlePrestartChange={handlePrestartChange}
      handleSubmit={handleSubmit}
    />
  );
};
export default PreStartCheckForm;