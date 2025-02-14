import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import VehicleDataDisplay from './VehicleDataDisplay';
import PreStartCheckForm from './PreStartCheckForm';
import ServiceFormComponent from './ServiceFormComponent';
import Notification from './Notification';
import { useRouter } from 'next/navigation';

const trabajosPredefinidos = [
  { id: 1, descripcion: 'Cambio de aceite y filtro de motor' },
  { id: 2, descripcion: 'Cambio de filtro de aire' },
  { id: 3, descripcion: 'Cambio de filtro de combustible' },
  { id: 4, descripcion: 'Revisión del sistema de frenos' },
  { id: 5, descripcion: 'Inspección de neumáticos' },
  { id: 6, descripcion: 'Cambio de aceite hidráulico' },
  { id: 7, descripcion: 'Cambio de aceite de transmisión' },
  { id: 8, descripcion: 'Inspección del sistema eléctrico' },
  { id: 9, descripcion: 'Calibración de válvulas' },
  { id: 10, descripcion: 'Limpieza general' }
];

const ServiceForm = ({ maquinaId }) => {
  const router = useRouter();
  const [formType, setFormType] = useState('');
  const [currentDate] = useState(new Date().toISOString().split('T')[0]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [maquina, setMaquina] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para los formularios
  const [prestartData, setPrestartData] = useState({
    horasMaquina: '',
    aceite: false,
    agua: false,
    neumaticos: false,
    nivelCombustible: false,
    lucesYAlarmas: false,
    frenos: false,
    extintores: false,
    cinturonSeguridad: false,
    observaciones: '',
    operador: ''
  });

  const [serviceData, setServiceData] = useState({
    tipoService: '',
    horasActuales: '',
    horasProximoService: '',
    tecnico: '',
    trabajosRealizados: [],
    observaciones: '',
    repuestos: ''
  });

  useEffect(() => {
    const fetchMaquina = async () => {
      try {
        const response = await fetch(`/api/maquinas/${maquinaId}`);
        if (!response.ok) {
          throw new Error('Máquina no encontrada');
        }
        const data = await response.json();
        setMaquina(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMaquina();
  }, [maquinaId]);

  const handlePrestartChange = (e) => {
    const { name, type, checked, value } = e.target;
    setPrestartData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setHasUnsavedChanges(true);
  };

  const handleServiceChange = (e) => {
    const { name, value } = e.target;
    setServiceData(prev => ({
      ...prev,
      [name]: value
    }));
    setHasUnsavedChanges(true);
  };

  const handleTrabajoChange = (trabajoId) => {
    setServiceData(prev => {
      const trabajosRealizados = prev.trabajosRealizados.includes(trabajoId)
        ? prev.trabajosRealizados.filter(id => id !== trabajoId)
        : [...prev.trabajosRealizados, trabajoId];
      
      return {
        ...prev,
        trabajosRealizados
      };
    });
    setHasUnsavedChanges(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Preparar los datos según el tipo de formulario
      const formData = {
        maquinaId,
        fecha: currentDate,
        tipo: formType,
        datos: formType === 'prestart' ? {
          ...prestartData,
          maquina: maquina.modelo,
        } : {
          ...serviceData,
          maquina: maquina.modelo,
        }
      };

      // Enviar los datos al endpoint correspondiente
      const endpoint = formType === 'prestart' ? '/api/prestart' : '/api/services';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Error al guardar el registro');
      }

      // Si es un service, actualizar las horas de la máquina
      if (formType === 'service') {
        const maquinaResponse = await fetch(`/api/maquinas/${maquinaId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            horasActuales: serviceData.horasActuales,
            proximoService: serviceData.horasProximoService,
          }),
        });

        if (!maquinaResponse.ok) {
          throw new Error('Error al actualizar las horas de la máquina');
        }
      }

      setNotificationMessage(`${formType === 'prestart' ? 'Pre-Start Check' : 'Service'} guardado exitosamente`);
      setShowNotification(true);
      setHasUnsavedChanges(false);

      // Resetear el formulario correspondiente
      if (formType === 'prestart') {
        setPrestartData({
          horasMaquina: '',
          aceite: false,
          agua: false,
          neumaticos: false,
          nivelCombustible: false,
          lucesYAlarmas: false,
          frenos: false,
          extintores: false,
          cinturonSeguridad: false,
          observaciones: '',
          operador: ''
        });
      } else {
        setServiceData({
          tipoService: '',
          horasActuales: '',
          horasProximoService: '',
          tecnico: '',
          trabajosRealizados: [],
          observaciones: '',
          repuestos: ''
        });
      }

      // Redirigir después de mostrar la notificación
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (error) {
      console.error('Error:', error);
      setNotificationMessage('Error al guardar los datos');
      setShowNotification(true);
    }
  };

  const BackButton = () => (
    <button
      onClick={() => setFormType('')}
      className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-4"
    >
      <ArrowLeft className="w-4 h-4" />
      Volver
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <p className="text-lg text-black">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-lg mx-auto mt-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
              <p className="text-black mb-6">{error}</p>
              <button
                onClick={() => window.history.back()}
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const InitialSelection = () => (
    <div className="space-y-6 text-center">
      <h2 className="text-2xl font-bold text-black">
        {maquina ? `${maquina.nombre || maquina.modelo} (${maquina.marca})` : 'Seleccione una opción'}
      </h2>
      <p className="text-black mb-8">Seleccione una opción:</p>
      <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
        <button 
          onClick={() => setFormType('prestart')}
          className="h-16 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md font-medium text-lg transition-colors"
        >
          Pre-Start Check
        </button>
        <button 
          onClick={() => setFormType('service')}
          className="h-16 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md font-medium text-lg transition-colors"
        >
          Service
        </button>
        <button 
          onClick={() => setFormType('datos')}
          className="h-16 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md font-medium text-lg transition-colors"
        >
          Datos del Vehículo
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <Notification 
        message={notificationMessage}
        show={showNotification}
        onClose={() => setShowNotification(false)}
      />

      {/* Logo */}
      <div className="w-full flex justify-center mb-6">
        <div className="h-40 w-60 flex items-center justify-center">
          <img src="/Imagen/logoo.png" alt="Logo" className="h-full w-auto object-contain" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200 relative">
          {!formType ? (
            <InitialSelection />
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-black">
                  {maquina ? `${maquina.nombre || maquina.modelo} (${maquina.marca})` : 'Máquina'}
                </h2>
              </div>

              {formType === 'datos' && (
                <div className="flex flex-col items-center">
                  <BackButton />
                  <VehicleDataDisplay vehiculoData={maquina} />
                </div>
              )}
              
              {formType === 'prestart' && (
                <div className="flex flex-col items-center">
                  <BackButton />
                  <h3 className="text-xl font-medium text-black mb-4">Pre-Start Check</h3>
                  <PreStartCheckForm
                    prestartData={prestartData}
                    handlePrestartChange={handlePrestartChange}
                    handleSubmit={handleSubmit}
                  />
                </div>
              )}

              {formType === 'service' && (
                <div className="flex flex-col items-center">
                  <BackButton />
                  <h3 className="text-xl font-medium text-black mb-4">Registro de Service</h3>
                  <ServiceFormComponent
                    serviceData={serviceData}
                    handleServiceChange={handleServiceChange}
                    handleTrabajoChange={handleTrabajoChange}
                    trabajosPredefinidos={trabajosPredefinidos}
                    handleSubmit={handleSubmit}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceForm;