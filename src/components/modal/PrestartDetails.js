import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const PrestartDetails = ({ data }) => {
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch template when data changes
  useEffect(() => {
    const fetchTemplate = async () => {
      if (!data || !data.templateId) return;
      
      try {
        setLoading(true);
        console.log(`Fetching template with ID: ${data.templateId}`);
        
        const response = await fetch(`/api/prestart/templates/${data.templateId}`);
        
        if (!response.ok) {
          console.error(`Error fetching template: ${response.status}`);
          setError('Could not load template');
          return;
        }
        
        const templateData = await response.json();
        console.log('Template loaded:', templateData);
        setTemplate(templateData);
        
      } catch (error) {
        console.error('Error fetching template:', error);
        setError('Could not load template');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplate();
  }, [data]);

  // Utility functions
  const getValueFromRecord = (record, field) => {
    if (!record) return null;
    
    if (record[field] !== undefined) {
      return record[field];
    }
    
    if (record.datos && record.datos[field] !== undefined) {
      return record.datos[field];
    }
    
    if (record.check && record.check[field] !== undefined) {
      return record.check[field];
    }
    
    // Look in checkValues object (new structure)
    if (record.checkValues && record.checkValues[field] !== undefined) {
      return record.checkValues[field];
    }
    
    return null;
  };

  const getStatus = (data) => {
    if (!data) return 'Unknown';

    // If we have a template, use its items for status checking
    if (template && template.checkItems) {
      const requiredItems = template.checkItems
        .filter(item => item.required)
        .map(item => item.name);
        
      if (requiredItems.length === 0) return 'OK'; // No required items
      
      const allRequiredChecksPass = requiredItems.every(
        item => getValueFromRecord(data, item) === true
      );
      
      return allRequiredChecksPass ? 'OK' : 'Needs Review';
    }

    // Fall back to default check items if no template
    const defaultCheckItems = [
      'aceite', 'agua', 'neumaticos', 'nivelCombustible',
      'lucesYAlarmas', 'frenos', 'extintores', 'cinturonSeguridad'
    ];

    const allChecksPass = defaultCheckItems.every(
      item => getValueFromRecord(data, item) === true
    );
    
    return allChecksPass ? 'OK' : 'Needs Review';
  };

  // Default check items (used if no template is available)
  const defaultCheckItems = [
    { key: 'aceite', label: 'Oil' },
    { key: 'agua', label: 'Water' },
    { key: 'neumaticos', label: 'Tires' },
    { key: 'nivelCombustible', label: 'Fuel' },
    { key: 'lucesYAlarmas', label: 'Lights' },
    { key: 'frenos', label: 'Brakes' },
    { key: 'extintores', label: 'Extinguisher' },
    { key: 'cinturonSeguridad', label: 'Seat Belt' }
  ];

  const operador = getValueFromRecord(data, 'operador');
  const horasMaquina = getValueFromRecord(data, 'horasMaquina');
  const observaciones = getValueFromRecord(data, 'observaciones');
  const fecha = data.fecha || data.createdAt;
  const status = getStatus(data);

  // Determine which check items to display
  const checkItemsToDisplay = template?.checkItems 
    ? template.checkItems.map(item => ({ key: item.name, label: item.label }))
    : defaultCheckItems;

  return (
    <div className="space-y-3">
      {/* Header with key information */}
      <div className="bg-gray-50 p-2 rounded-lg border-l-4 border-indigo-500">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Pre-start Check</h3>
            <p className="text-xs text-gray-500">
              {fecha ? new Date(fecha).toLocaleDateString() : 'Date not specified'}
            </p>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              status === 'OK' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {status}
          </div>
        </div>
      </div>

      {/* Basic information */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white p-2 rounded-lg border border-gray-200">
          <div className="text-xs uppercase text-gray-500 font-medium">Operator:</div>
          <div className="text-sm font-semibold">{operador || 'N/A'}</div>
        </div>
        
        <div className="bg-white p-2 rounded-lg border border-gray-200">
          <div className="text-xs uppercase text-gray-500 font-medium">Hours:</div>
          <div className="text-sm font-semibold">{horasMaquina || 'N/A'}</div>
        </div>
      </div>
      
      {/* Template information if available */}
      {template && (
        <div className="bg-white p-2 rounded-lg border border-gray-200">
          <div className="text-xs uppercase text-gray-500 font-medium">Template:</div>
          <div className="text-sm font-semibold">{template.name}</div>
        </div>
      )}
      
      {/* Check Items in grid */}
      <div className="bg-white p-2 rounded-lg border border-gray-200">
        <h4 className="text-xs uppercase text-gray-500 font-medium mb-2">Check Items:</h4>
        
        {loading ? (
          <div className="flex justify-center items-center p-4">
            <Loader className="h-5 w-5 text-blue-500 animate-spin" />
            <span className="ml-2 text-sm">Loading template...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-500 p-2 rounded text-xs">
            {error}. Using default check items.
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {checkItemsToDisplay.map(({ key, label }) => {
              const isChecked = getValueFromRecord(data, key);
              return (
                <div key={key} className="flex items-center p-1 bg-gray-50 rounded text-xs">
                  {isChecked ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Observations */}
      {observaciones && (
        <div className="bg-white p-2 rounded-lg border border-gray-200">
          <h4 className="text-xs uppercase text-gray-500 font-medium mb-1">Observations:</h4>
          <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded">{observaciones}</p>
        </div>
      )}
    </div>
  );
};

export default PrestartDetails;