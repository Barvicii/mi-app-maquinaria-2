'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

const PreStartCheckForm = ({ prestartData, setPrestartData, handleSubmit, machineId }) => {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [machine, setMachine] = useState(null);
  
  // Initialize localData with empty values if prestartData not provided
  const [localData, setLocalData] = useState({
    maquinaId: '',
    horasMaquina: '',
    horasProximoService: '',
    operador: '',
    observaciones: '',
    aceite: false,
    agua: false,
    neumaticos: false,
    nivelCombustible: false,
    lucesYAlarmas: false,
    frenos: false,
    extintores: false,
    cinturonSeguridad: false,
    fecha: new Date().toISOString(),
    estado: 'OK'
  });
  
  // Use prestartData if provided, otherwise use localData
  const formData = prestartData || localData;
  const setFormData = prestartData ? setPrestartData : setLocalData;
  
  useEffect(() => {
    const loadOperators = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/operators');
        if (!response.ok) throw new Error('Error loading operators');
        const data = await response.json();
        setOperators(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadOperators();
  }, []);

  // Add machine fetch
  useEffect(() => {
    const fetchMachine = async () => {
      try {
        const response = await fetch(`/api/machines/${machineId}`);
        const data = await response.json();
        if (response.ok) {
          setMachine(data);
        }
      } catch (error) {
        console.error('Error fetching machine:', error);
      }
    };

    if (machineId) {
      fetchMachine();
    }
  }, [machineId]);

  const handleInputChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const onSubmitForm = async (e) => {
    e.preventDefault();
    
    if (handleSubmit) {
      // If handleSubmit prop is provided, use that
      await handleSubmit(formData);
      return;
    }
    
    try {
      // Default submit behavior (cuando se usa el componente directamente)
      const allChecks = [
        'aceite', 'agua', 'neumaticos', 'nivelCombustible',
        'lucesYAlarmas', 'frenos', 'extintores', 'cinturonSeguridad'
      ];
      
      const hasFailedChecks = allChecks.some(check => !formData[check]);
      const estado = hasFailedChecks ? 'Requiere atención' : 'OK';

      const dataToSubmit = {
        ...formData,
        estado,
        fecha: new Date().toISOString()
      };

      // Verificar que maquinaId existe para incluirlo explícitamente en la solicitud
      if (formData.maquinaId) {
        console.log(`Guardando prestart para máquina ID: ${formData.maquinaId}`);
      } else {
        console.warn('No se ha proporcionado un ID de máquina para el prestart check');
      }

      const response = await fetch('/api/prestart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error saving prestart');
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        router.push('/dashboard');
        setFormData({
          maquinaId: formData.maquinaId, // Mantener el ID de la máquina
          horasMaquina: '',
          horasProximoService: '',
          operador: '',
          observaciones: '',
          aceite: false,
          agua: false,
          neumaticos: false,
          nivelCombustible: false,
          lucesYAlarmas: false,
          frenos: false,
          extintores: false,
          cinturonSeguridad: false,
          fecha: new Date().toISOString(),
          estado: 'OK'
        });
      }, 2000);

    } catch (error) {
      console.error('Submit error:', error);
      alert('Error saving prestart: ' + error.message);
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

  // Debug - Mostrar en consola si tenemos maquinaId
  useEffect(() => {
    if (formData.maquinaId) {
      console.log(`PreStartCheckForm - maquinaId presente: ${formData.maquinaId}`);
    }
  }, [formData.maquinaId]);

  return (
    <div className="relative">
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Operation Successful
            </h3>
            <p className="text-gray-600 mb-6">
              The pre-start check has been saved successfully.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto p-4">
        {/* Add machine info at the top */}
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

        <form onSubmit={onSubmitForm} className="space-y-4">
          {/* Campo oculto para el ID de máquina */}
          <input type="hidden" name="maquinaId" value={formData.maquinaId || ''} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-1 text-black">Horas de la Máquina</label>
              <input
                type="number"
                name="horasMaquina"
                value={formData.horasMaquina || ''}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md text-black"
                required
                placeholder="Ingrese las horas actuales"
              />
            </div>

            <div>
              <label className="block mb-1 text-black">Horas Próximo Service</label>
              <input
                type="number"
                name="horasProximoService"
                value={formData.horasProximoService || ''}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md text-black"
                required
                placeholder="Ingrese las horas para el próximo service"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-black">Operador</label>
            <select
              name="operador"
              value={formData.operador || ''}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md text-black"
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

          <div className="space-y-3">
            {checkItems.map(item => (
              <div key={item.name} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={item.name}
                  name={item.name}
                  checked={formData[item.name] || false}
                  onChange={handleInputChange}
                  className="w-5 h-5"
                />
                <label htmlFor={item.name} className="text-black">
                  {item.label}
                </label>
              </div>
            ))}
          </div>

          <div>
            <label className="block mb-1 text-black">Observaciones</label>
            <textarea
              name="observaciones"
              value={formData.observaciones || ''}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md text-black"
              rows={4}
              placeholder="Ingrese sus observaciones aquí..."
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 shadow-md"
          >
            Guardar Pre-Start
          </button>
        </form>
      </div>
    </div>
  );
};

export default PreStartCheckForm;