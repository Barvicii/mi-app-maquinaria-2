import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import VehicleDataDisplay from './VehicleDataDisplay';
import PreStartCheckForm from './PreStartCheckForm';
import ServiceFormComponent from './ServiceFormComponent';
import Notification from './Notification';
import { useRouter } from 'next/navigation';
import '../styles/layout.css';
import '../styles/machinary.css';
import MachineDetails from './MachineDetails';

const ServiceForm = ({ machineId, machine }) => {
  // Add console log to check machine data
  console.log('Machine data in ServiceForm:', machine);

  const router = useRouter();
  const [formType, setFormType] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [activeTab, setActiveTab] = useState('prestart');
  
  // Use the provided machine instead of fetching it again
  const [maquina] = useState(machine);

  const [prestartData, setPrestartData] = useState({
    maquinaId: machineId, // Añadido maquinaId al estado inicial
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
    maquina: maquina?.model || maquina?.modelo || ''
  });

  const [serviceData, setServiceData] = useState({
    maquinaId: machineId, // Añadido maquinaId al estado inicial
    tipoService: '',
    horasActuales: '',
    horasProximoService: '',
    tecnico: '',
    trabajosRealizados: [],
    observaciones: '',
    repuestos: '',
    maquina: maquina?.model || maquina?.modelo || ''
  });

  const handleSubmit = async (formData) => {
    try {
      const submissionData = {
        maquinaId: machineId.toString(),
        fecha: new Date().toISOString(),
        tipo: formType,
        datos: formType === 'prestart' ? {
          ...prestartData,
          maquina: maquina?.model || maquina?.modelo || '',
        } : {
          ...serviceData,
          maquina: maquina?.model || maquina?.modelo || '',
        }
      };

      console.log('Submitting form data:', submissionData);

      const endpoint = formType === 'prestart' ? '/api/prestart' : '/api/services';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
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
          maquinaId: machineId, // Mantener el maquinaId al resetear
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
          maquina: maquina?.model || maquina?.modelo || ''
        });
      } else {
        setServiceData({
          maquinaId: machineId, // Mantener el maquinaId al resetear
          tipoService: '',
          horasActuales: '',
          horasProximoService: '',
          tecnico: '',
          trabajosRealizados: [],
          observaciones: '',
          repuestos: '',
          maquina: maquina?.model || maquina?.modelo || ''
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

  const InitialSelection = () => (
    <div className="space-y-6 text-center">
      {/* Logo section */}
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <img 
            src="/Imagen/logoo.png" 
            alt="Logo" 
            className="w-60 h-auto"
          />
        </div>
      </div>
  
      {/* Nombre de la empresa */}
      <span className="brand-text">Orchard Service</span>
  
      <h2 className="text-2xl font-bold text-black">
        {machine && (
          <pre className="text-sm text-gray-500">

          </pre>
        )}
        {machine ? `${machine.Machine_ID || machine.customId || machine.machineId || 'ID not found'}` : 'Select an option'}
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
                {machine ? `${machine.Machine_ID || machine.customId || machine.machineId || 'ID not found'}` : 'Select an option'}
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
                    onSubmit={handleSubmit}
                    serviceData={serviceData}
                    setServiceData={setServiceData}
                    maquinaId={machineId}
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