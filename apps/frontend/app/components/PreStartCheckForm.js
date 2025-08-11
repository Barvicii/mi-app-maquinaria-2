'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Notification from './Notification';

const PreStartCheckForm = ({ prestartData, setPrestartData, handleSubmit, machineId, equipment, publicMode }) => {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [machine, setMachine] = useState(null);
  const [template, setTemplate] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  
  // Initialize localData with empty values if prestartData not provided
  const [localData, setLocalData] = useState({
    maquinaId: '',
    horasMaquina: '',
    horasProximoService: '',
    operador: '',
    observaciones: '',
    fecha: new Date().toISOString(),
    estado: 'OK',
    checkValues: {} // Dynamic check values will be stored here
  });
  
  // Use prestartData if provided, otherwise use localData
  const formData = prestartData || localData;
  const setFormData = prestartData ? setPrestartData : setLocalData;

  // Set maquinaId when component mounts
  useEffect(() => {
    if ((machineId || (equipment && equipment._id)) && !formData.maquinaId) {
      const id = machineId || (equipment ? equipment._id : null);
      console.log(`Setting initial maquinaId: ${id}`);
      setFormData(prev => ({
        ...prev,
        maquinaId: id
      }));
    }
  }, [machineId, equipment, formData.maquinaId, setFormData]);

  // Load machine and its template
  useEffect(() => {
    const fetchMachine = async () => {
      try {
        if (!machineId) return;
        
        // Determine if we should use public mode
        const isUrlPublic = window.location.search.includes('public=true');
        const shouldUsePublicMode = publicMode === true || isUrlPublic;
        
        // Add public=true parameter to avoid login redirect
        const timestamp = Date.now();
        const url = `${shouldUsePublicMode ? 
          `/api/machines/${machineId}?public=true&_t=${timestamp}` : 
          `/api/machines/${machineId}?_t=${timestamp}`}`;
        
        console.log('Fetching machine data from:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: Could not load machine`);
        }
        
        const data = await response.json();
        console.log('Machine data loaded successfully:', data);
        setMachine(data);
        
        // If this machine has a prestart template, fetch it
        if (data.prestartTemplateId) {
          fetchTemplate(data.prestartTemplateId, shouldUsePublicMode);
        } else {
          // Otherwise, fetch the default template
          fetchDefaultTemplate(shouldUsePublicMode);
        }
      } catch (error) {
        console.error('Error fetching machine:', error);
        setError(error.message);
      }
    };
    
    const fetchTemplate = async (templateId, isPublic) => {
      try {
        const timestamp = Date.now();
        let url = `/api/prestart/templates/${templateId}?_t=${timestamp}`;
        
        if (isPublic) {
          url += `&public=true`;
          // Si estamos en modo público y tenemos machineId, incluirlo para validación
          if (machineId) {
            url += `&machineId=${machineId}`;
          }
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          let errorMessage = `Error ${response.status}: Could not load template`;
          try {
            const errorData = await response.json();
            if (errorData.error) {
              errorMessage = `Error ${response.status}: ${errorData.error}`;
            }
          } catch (e) {
            // Ignore JSON parsing errors
          }
          
          console.error(`[DEBUG] Template fetch failed: ${errorMessage}`);
          throw new Error(errorMessage);
        }
        
        const templateData = await response.json();
        console.log('Template loaded:', templateData);
        setTemplate(templateData);
        
        // Initialize check values with false
        const initialCheckValues = {};
        templateData.checkItems.forEach(item => {
          initialCheckValues[item.name] = false;
        });
        
        setFormData(prev => ({
          ...prev,
          checkValues: initialCheckValues
        }));
      } catch (error) {
        console.error('Error fetching template:', error);
        // If we can't fetch the specific template, try the default
        fetchDefaultTemplate(isPublic);
      }
    };
    
    const fetchDefaultTemplate = async (isPublic) => {
      try {
        const timestamp = Date.now();
        const url = `/api/prestart/templates/default${isPublic ? `?public=true&_t=${timestamp}` : `?_t=${timestamp}`}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: Could not load default template`);
        }
        
        const templateData = await response.json();
        console.log('Default template loaded:', templateData);
        setTemplate(templateData);
        
        // Initialize check values with false
        const initialCheckValues = {};
        templateData.checkItems.forEach(item => {
          initialCheckValues[item.name] = false;
        });
        
        setFormData(prev => ({
          ...prev,
          checkValues: initialCheckValues
        }));
      } catch (error) {
        console.error('Error fetching default template:', error);
        // If we can't load any template, use a basic fallback
        setTemplate({
          name: 'Basic Template',
          checkItems: [
            { id: '1', name: 'aceite', label: 'Oil Level', required: true },
            { id: '2', name: 'agua', label: 'Water Level', required: true },
            { id: '3', name: 'neumaticos', label: 'Tire Condition', required: true },
            { id: '4', name: 'nivelCombustible', label: 'Fuel Level', required: true },
            { id: '5', name: 'lucesYAlarmas', label: 'Lights and Alarms', required: false },
            { id: '6', name: 'frenos', label: 'Brake System', required: true },
            { id: '7', name: 'extintores', label: 'Fire Extinguishers', required: false },
            { id: '8', name: 'cinturonSeguridad', label: 'Safety Belt', required: false }
          ]
        });
        
        // Initialize check values with false for the fallback template
        const initialCheckValues = {
          aceite: false,
          agua: false,
          neumaticos: false,
          nivelCombustible: false,
          lucesYAlarmas: false,
          frenos: false,
          extintores: false,
          cinturonSeguridad: false
        };
        
        setFormData(prev => ({
          ...prev,
          checkValues: initialCheckValues
        }));
      }
    };
    
    fetchMachine();
  }, [machineId]);

  // Add this console log to debug
  const fetchOperators = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Checking if operators should be fetched...');
      
      // Skip if no machine is loaded yet
      if (!machine) {
        console.log('Machine not loaded, skipping operator fetch');
        setOperators([]);
        return;
      }
      
      // Determine if public mode is enabled
      const isUrlPublic = window.location.search.includes('public=true');
      const shouldUsePublicMode = publicMode === true || isUrlPublic;
      
      // En modo público, no cargar operadores para evitar errores
      if (shouldUsePublicMode) {
        console.log('Public mode detected, skipping operators fetch - manual entry enabled');
        setOperators([]);
        return;
      }
      
      // Build URL with parameters para modo autenticado
      const params = new URLSearchParams();
      if (machine.credentialId) params.append('credentialId', machine.credentialId);
      params.append('_t', Date.now()); // Cache busting
      
      const url = `/api/operators?${params.toString()}`;
      
      console.log('Fetching operators from:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Error fetching operators: ${response.status}`);
        throw new Error(`Error ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Operators loaded:', data.length);
      setOperators(data);
    } catch (error) {
      console.error('Error fetching operators:', error);
      // Use empty array as fallback
      setOperators([]);
    } finally {
      setLoading(false);
    }
  }, [machine, publicMode]);

  useEffect(() => {
    fetchOperators();
  }, [machine, fetchOperators]); // Depend on machine and fetchOperators

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('check_')) {
      // This is a check item - update the checkValues object
      const checkName = name.replace('check_', '');
      setFormData(prev => ({
        ...prev,
        checkValues: {
          ...prev.checkValues,
          [checkName]: checked
        }
      }));
    } else {
      // This is a regular form field
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

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

  // Form submission handler
  const onSubmitForm = async (e) => {
    e.preventDefault();
    
    if (submitting) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const currentMachineId = formData.maquinaId || machineId || 
        (equipment && equipment._id ? equipment._id : null);
      
      if (!currentMachineId) {
        throw new Error('No machine ID specified');
      }
      
      // Check if any required fields are missing
      const requiredFields = ['horasMaquina', 'horasProximoService', 'operador'];
      for (const field of requiredFields) {
        if (!formData[field]) {
          throw new Error(`${field} is required`);
        }
      }
      
      // Check if any required check items are not checked
      if (template) {
        const requiredChecks = template.checkItems.filter(item => item.required);
        for (const check of requiredChecks) {
          if (!formData.checkValues[check.name]) {
            throw new Error(`${check.label} is required`);
          }
        }
      }
      
      // Prepare operator info if available
      let operadorInfo = null;
      if (formData.operador && operators.length > 0) {
        const selectedOperator = operators.find(op => 
          `${op.nombre} ${op.apellido || ''}`.trim() === formData.operador.trim()
        );
        
        if (selectedOperator) {
          operadorInfo = {
            id: selectedOperator._id,
            nombre: selectedOperator.nombre,
            apellido: selectedOperator.apellido || ''
          };
        }
      }
      
      // Build data to send to the API
      const dataToSend = {
        maquinaId: currentMachineId,
        horasMaquina: formData.horasMaquina,
        horasProximoService: formData.horasProximoService,
        operador: formData.operador,
        operadorInfo: operadorInfo,
        observaciones: formData.observaciones || '',
        checkValues: formData.checkValues,
        templateId: template?._id || null,
        fecha: new Date().toISOString()
      };
      
      const timestamp = Date.now();
      const url = `/api/prestart?public=true&_t=${timestamp}`;
      
      console.log('[DEBUG] Sending prestart to URL:', url);
      console.log('[DEBUG] Data to send:', dataToSend);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });
      
      // Handle response
      const contentType = response.headers.get('content-type');
      
      if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Error ${response.status}: Could not save prestart`);
        } else {
          const errorText = await response.text();
          throw new Error(`Error ${response.status}: ${errorText}`);
        }
      }
      
      const responseData = await response.json();
      console.log('[DEBUG] Server response:', responseData);
      
      // Show success notification temporarily
      setSuccess(true);
      showNotification('Pre-start check saved successfully', 'success');
      
      // Get custom machine ID for display
      const customMachineId = machine?.customId || machine?.machineId || currentMachineId;
      
      // Redirect to thanks page immediately with custom machine ID
      setTimeout(() => {
        router.push(`/thanks?type=prestart&message=${encodeURIComponent('Pre-start check completed successfully!')}&machineId=${encodeURIComponent(customMachineId)}`);
      }, 1000);
      
      // Reset form if needed
      if (!prestartData) {
        resetForm();
      }
    } catch (error) {
      console.error('[ERROR] Error submitting prestart:', error);
      setError(error.message || 'Unknown error');
      showNotification(error.message || 'Unknown error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form function
  const resetForm = () => {
    // Keep machine ID and template-specific check values
    const checkValues = {};
    if (template) {
      template.checkItems.forEach(item => {
        checkValues[item.name] = false;
      });
    }
    
    setFormData({
      maquinaId: formData.maquinaId,
      horasMaquina: '',
      horasProximoService: '',
      operador: formData.operador,
      observaciones: '',
      fecha: new Date().toISOString(),
      estado: 'OK',
      checkValues: checkValues
    });
  };

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
        {/* Machine info at the top */}
        {machine && (
          <div className="space-y-6 text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {machine.customId || ''}
            </h2>
            {template && (
              <div className="text-gray-500 space-y-2">
                <p>Using template: {template.name}</p>
                {template.createdBy && (
                  <p className="text-sm">
                    Created by: {template.createdBy.name} ({template.createdBy.role})
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <form onSubmit={onSubmitForm} className="space-y-4">
          {/* Hidden field for machine ID */}
          <input type="hidden" name="maquinaId" value={formData.maquinaId || ''} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-1 text-black">Machine Hours</label>
              <input
                type="number"
                name="horasMaquina"
                value={formData.horasMaquina || ''}
                onChange={handleInputChange}
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
                value={formData.horasProximoService || ''}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md text-black"
                required
                placeholder="Enter hours for next service"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-black">Operator</label>
            {loading ? (
              <div className="w-full p-2 border rounded-md bg-gray-100 text-gray-600">
                Loading operators...
              </div>
            ) : operators.length > 0 ? (
              <select
                name="operador"
                value={formData.operador || ''}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md text-black"
                required
              >
                <option value="">Select operator...</option>
                {operators.map((op) => (
                  <option key={op._id} value={`${op.nombre} ${op.apellido || ''}`}>
                    {op.nombre} {op.apellido || ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  name="operador"
                  value={formData.operador || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md text-black"
                  placeholder="Enter operator name"
                  required
                />
                <p className="text-sm text-amber-600">
                  Could not load operators. Please enter the name manually.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-black">Check Items</h3>
            
            {template ? (
              // Dynamic check items based on the template
              template.checkItems.map((item, index) => (
                <div key={item.id || `check-item-${index}`} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`check_${item.name}`}
                    name={`check_${item.name}`}
                    checked={formData.checkValues[item.name] || false}
                    onChange={handleInputChange}
                    className="w-5 h-5"
                  />
                  <label htmlFor={`check_${item.name}`} className="text-black">
                    {item.label}
                    {item.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                </div>
              ))
            ) : (
              <div className="text-amber-600">
                Loading check items...
              </div>
            )}
          </div>

          <div>
            <label className="block mb-1 text-black">Observations</label>
            <textarea
              name="observaciones"
              value={formData.observaciones || ''}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md text-black"
              rows={4}
              placeholder="Enter your observations here..."
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 shadow-md ${
              submitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {submitting ? 'Saving...' : 'Save Pre-Start'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PreStartCheckForm;