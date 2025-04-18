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

  // Modify the handleSubmit function to include better error handling
  const handleSubmit = async (formData) => {
    try {
      console.log('ServiceForm - Starting form submission with data:', formData);
      
      // Ensure we're using the correct endpoint
      const isPublic = window.location.search.includes('public=true');
      const endpoint = formType === 'prestart' 
        ? (isPublic ? '/api/prestart?public=true' : '/api/prestart')
        : (isPublic ? '/api/services?public=true' : '/api/services');
      
      console.log(`ServiceForm - Using endpoint: ${endpoint}`);

      // Ensure machineId is included correctly
      const submissionData = {
        machineId: machineId.toString(),
        fecha: new Date().toISOString(),
        tipo: formType,
        datos: formType === 'prestart' ? {
          ...prestartData,
          maquinaId: machineId.toString(), // Ensure maquinaId is also set
          maquina: maquina?.model || maquina?.marca || '',
        } : {
          ...serviceData,
          machineId: machineId.toString(), // Ensure machineId is also set in the datos
          maquina: maquina?.model || maquina?.marca || '',
        }
      };

      console.log('ServiceForm - Submitting data:', JSON.stringify(submissionData, null, 2));

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      // Get full response details for better debugging
      const responseStatus = response.status;
      const responseStatusText = response.statusText;
      console.log(`ServiceForm - Response status: ${responseStatus} ${responseStatusText}`);

      // Try to get the response text first (in case it's not JSON)
      const responseText = await response.text();
      console.log(`ServiceForm - Response text: ${responseText}`);

      if (!response.ok) {
        let errorMessage = `Server error: ${responseStatus} ${responseStatusText}`;
        
        try {
          // Try to parse as JSON if possible
          const errorData = JSON.parse(responseText);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If not JSON, use the text as is
          console.warn('ServiceForm - Response is not valid JSON');
        }
        
        throw new Error(errorMessage);
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.warn('ServiceForm - Response is not valid JSON, but request succeeded');
        result = { success: true };
      }

      console.log('ServiceForm - Successfully saved record:', result);
      
      // Show success notification
      setShowNotification(true);
      setNotificationMessage(formType === 'prestart' ? 'Pre-start check saved successfully' : 'Service record saved successfully');
      
      // Return the result
      return result;
    } catch (error) {
      console.error('ServiceForm - Error saving record:', error);
      
      // Show error notification
      setShowNotification(true);
      setNotificationMessage(`Error: ${error.message}`);
      
      throw error;
    }
  };

  // Agregar console.log para depuración
  useEffect(() => {
    console.log('ServiceForm formType changed to:', formType);
    console.log('Machine data available:', machine);
    console.log('MachineId:', machineId);
  }, [formType, machine, machineId]);

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
          onClick={() => {
            console.log('Service button clicked, setting formType to service');
            setFormType('service');
          }}
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
                    equipment={maquina}
                    machineId={machineId}
                    publicMode={true}
                    userId={maquina?.userId}
                    onSubmitSuccess={() => {
                      // NO intentar cargar la máquina aquí, solo mostrar notificación
                      setShowNotification(true);
                      setNotificationMessage('Pre-start check guardado exitosamente');
                      setTimeout(() => {
                        // Opcional: volver a la vista principal después de guardar
                        setFormType('main');
                      }, 2000);
                    }}
                  />
                </div>
              )}

              {formType === 'service' && (
                <div className="flex flex-col items-center">
                  <BackButton />
                  <h3 className="text-xl font-medium text-black mb-4">Service Record</h3>
                  {console.log('Rendering ServiceFormComponent with:', { machineId, machine: maquina })}
                  <ServiceFormComponent 
                    machineId={machineId} // Asegurar que se pasa correctamente
                    machine={maquina} // Pasar la máquina explícitamente
                    serviceData={serviceData} // Pasar el estado del servicio
                    setServiceData={setServiceData} // Pasar la función para actualizar el estado
                    onSubmit={handleSubmit} // Pasar la función de envío
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