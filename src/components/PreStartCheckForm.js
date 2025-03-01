'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const PreStartCheckForm = () => {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [operators, setOperators] = useState([]);
  const [prestartData, setPrestartData] = useState({
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

  useEffect(() => {
    const loadOperators = async () => {
      try {
        const response = await fetch('/api/operators');
        if (!response.ok) throw new Error('Error loading operators');
        const data = await response.json();
        setOperators(data);
      } catch (error) {
        console.error('Error:', error);
      }
    };
    loadOperators();
  }, []);

  const handleInputChange = (e) => {
    const { name, type, checked, value } = e.target;
    setPrestartData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const allChecks = [
        'aceite', 'agua', 'neumaticos', 'nivelCombustible',
        'lucesYAlarmas', 'frenos', 'extintores', 'cinturonSeguridad'
      ];
      
      const hasFailedChecks = allChecks.some(check => !prestartData[check]);
      const estado = hasFailedChecks ? 'Requiere atención' : 'OK';

      const dataToSubmit = {
        ...prestartData,
        estado,
        fecha: new Date().toISOString()
      };

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
        setPrestartData({
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-1 text-black">Horas de la Máquina</label>
            <input
              type="number"
              name="horasMaquina"
              value={prestartData.horasMaquina}
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
              value={prestartData.horasProximoService}
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
            value={prestartData.operador}
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
                checked={prestartData[item.name]}
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
            value={prestartData.observaciones}
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
  );
};

export default PreStartCheckForm;