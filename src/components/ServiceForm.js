import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import VehicleDataDisplay from './VehicleDataDisplay';
import PreStartCheckForm from './PreStartCheckForm';
import ServiceFormComponent from './ServiceFormComponent';
import Notification from './Notification';
import { useRouter } from 'next/navigation';
import '../styles/layout.css';
import '../styles/machinary.css';


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

  // Fetch machine data when component mounts
  useEffect(() => {
    const fetchMaquina = async () => {
      try {
        setLoading(true);
        console.log('Fetching machine with ID:', maquinaId);
        const response = await fetch(`/api/maquinas/${maquinaId}`);
        
        if (!response.ok) {
          throw new Error(response.status === 404 ? 'Machine not found' : 'Error loading machine');
        }

        const data = await response.json();
        console.log('Machine data received:', data);
        setMaquina(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching machine:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (maquinaId) {
      fetchMaquina();
    }
  }, [maquinaId]);

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
    operador: '',
    maquina: maquina?.modelo || ''
  });

  const [serviceData, setServiceData] = useState({
    tipoService: '',
    horasActuales: '',
    horasProximoService: '',
    tecnico: '',
    trabajosRealizados: [],
    observaciones: '',
    repuestos: '',
    maquina: maquina?.modelo || ''
  });

  // Update form data when machine data is loaded
  useEffect(() => {
    if (maquina) {
      setPrestartData(prev => ({ ...prev, maquina: maquina.modelo }));
      setServiceData(prev => ({ ...prev, maquina: maquina.modelo }));
    }
  }, [maquina]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formData = {
        maquinaId: maquinaId.toString(),
        fecha: new Date().toISOString(),
        tipo: formType,
        datos: formType === 'prestart' ? {
          ...prestartData,
          maquina: maquina?.modelo || '',
        } : {
          ...serviceData,
          maquina: maquina?.modelo || '',
        }
      };

      console.log('Submitting form data:', formData);

      const endpoint = formType === 'prestart' ? '/api/prestart' : '/api/services';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Error saving record');
      }

      const result = await response.json();
      console.log('Response from server:', result);

      setNotificationMessage(`${formType === 'prestart' ? 'Pre-Start Check' : 'Service'} saved successfully`);
      setShowNotification(true);
      setHasUnsavedChanges(false);

      // Reset form data
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
          operador: '',
          maquina: maquina?.modelo || ''
        });
      } else {
        setServiceData({
          tipoService: '',
          horasActuales: '',
          horasProximoService: '',
          tecnico: '',
          trabajosRealizados: [],
          observaciones: '',
          repuestos: '',
          maquina: maquina?.modelo || ''
        });
      }

      // Redirect after showing notification
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (error) {
      console.error('Error saving record:', error);
      setNotificationMessage(error.message || 'Error saving data');
      setShowNotification(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <p className="text-lg text-black">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-black mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const InitialSelection = () => (
    <div className="space-y-6 text-center">
      {/* Logo centrado */}
      <div className="space-y-6 text-center">
  <div className="flex justify-center">
    <img 
      src="/Imagen/logoo.png" 
      alt="Logo" 
      className="w-60 h-auto" // Cambia el ancho, el alto se ajustará automáticamente
    />
  </div>
</div>
  
      {/* Nombre de la empresa */}
      <span className="brand-text">Orchard Service</span>
  
      <h2 className="text-2xl font-bold text-black">
        {maquina ? `${maquina.nombre || maquina.modelo} (${maquina.marca})` : 'Select an option'}
      </h2>
      <p className="text-black mb-8">Choose what you want to do:</p>
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
          Machine Data
        </button>
      </div>
    </div>
  );

  const BackButton = () => (
    <button
      onClick={() => setFormType('')}
      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <Notification 
        message={notificationMessage}
        show={showNotification}
        onClose={() => setShowNotification(false)}
      />

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
                  {maquina ? `${maquina.nombre || maquina.modelo} (${maquina.marca})` : 'Machine'}
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
                    setPrestartData={setPrestartData}
                    handleSubmit={handleSubmit}
                  />
                </div>
              )}

              {formType === 'service' && (
                <div className="flex flex-col items-center">
                  <BackButton />
                  <h3 className="text-xl font-medium text-black mb-4">Service Record</h3>
                  <ServiceFormComponent
                    serviceData={serviceData}
                    setServiceData={setServiceData}
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