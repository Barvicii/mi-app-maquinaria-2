import React, { useState, useEffect } from 'react';
import '../styles/machinemodal.css';

const MachineModal = ({ show, type, machine, onClose, onSubmit }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    model: '',
    brand: '',
    serialNumber: '',
    machineId: '',
    year: '',
    currentHours: '',
    lastService: '',
    nextService: '',
    engineOil: {
      type: '',
      capacity: '',
      brand: ''
    },
    hydraulicOil: {
      type: '',
      capacity: '',
      brand: ''
    },
    transmissionOil: {
      type: '',
      capacity: '',
      brand: ''
    },
    filters: {
      engine: '',
      engineBrand: '',
      transmission: '',
      transmissionBrand: '',
      fuel: '',
      fuelBrand: ''
    },
    tires: {
      front: {
        size: '',
        pressure: '',
        brand: ''
      },
      rear: {
        size: '',
        pressure: '',
        brand: ''
      }
    }
  });

  // Initialize form with machine data when editing
  useEffect(() => {
    if (type === 'edit' && machine) {
      setFormData({
        model: machine.model || machine.modelo || '',
        brand: machine.brand || machine.marca || '',
        serialNumber: machine.serialNumber || machine.serie || '',
        machineId: machine.machineId || machine.maquinariaId || '',
        year: machine.year || machine.anio || '',
        currentHours: machine.currentHours || machine.horasActuales || '',
        lastService: machine.lastService || machine.ultimoService || '',
        nextService: machine.nextService || machine.proximoService || '',
        engineOil: {
          type: machine.engineOil?.type || (machine.aceiteMotor?.tipo || ''),
          capacity: machine.engineOil?.capacity || (machine.aceiteMotor?.capacidad || ''),
          brand: machine.engineOil?.brand || (machine.aceiteMotor?.marca || '')
        },
        hydraulicOil: {
          type: machine.hydraulicOil?.type || (machine.aceiteHidraulico?.tipo || ''),
          capacity: machine.hydraulicOil?.capacity || (machine.aceiteHidraulico?.capacidad || ''),
          brand: machine.hydraulicOil?.brand || (machine.aceiteHidraulico?.marca || '')
        },
        transmissionOil: {
          type: machine.transmissionOil?.type || (machine.aceiteTransmision?.tipo || ''),
          capacity: machine.transmissionOil?.capacity || (machine.aceiteTransmision?.capacidad || ''),
          brand: machine.transmissionOil?.brand || (machine.aceiteTransmision?.marca || '')
        },
        filters: {
          engine: machine.filters?.engine || (machine.filtros?.motor || ''),
          engineBrand: machine.filters?.engineBrand || (machine.filtros?.motorMarca || ''),
          transmission: machine.filters?.transmission || (machine.filtros?.transmision || ''),
          transmissionBrand: machine.filters?.transmissionBrand || (machine.filtros?.transmisionMarca || ''),
          fuel: machine.filters?.fuel || (machine.filtros?.combustible || ''),
          fuelBrand: machine.filters?.fuelBrand || (machine.filtros?.combustibleMarca || '')
        },
        tires: {
          front: {
            size: machine.tires?.front?.size || (machine.neumaticos?.delanteros?.tamano || ''),
            pressure: machine.tires?.front?.pressure || (machine.neumaticos?.delanteros?.presion || ''),
            brand: machine.tires?.front?.brand || (machine.neumaticos?.delanteros?.marca || '')
          },
          rear: {
            size: machine.tires?.rear?.size || (machine.neumaticos?.traseros?.tamano || ''),
            pressure: machine.tires?.rear?.pressure || (machine.neumaticos?.traseros?.presion || ''),
            brand: machine.tires?.rear?.brand || (machine.neumaticos?.traseros?.marca || '')
          }
        }
      });
    } else {
      // Reset form for new machine
      setFormData({
        model: '',
        brand: '',
        serialNumber: '',
        machineId: '',
        year: '',
        currentHours: '',
        lastService: '',
        nextService: '',
        engineOil: {
          type: '',
          capacity: '',
          brand: ''
        },
        hydraulicOil: {
          type: '',
          capacity: '',
          brand: ''
        },
        transmissionOil: {
          type: '',
          capacity: '',
          brand: ''
        },
        filters: {
          engine: '',
          engineBrand: '',
          transmission: '',
          transmissionBrand: '',
          fuel: '',
          fuelBrand: ''
        },
        tires: {
          front: {
            size: '',
            pressure: '',
            brand: ''
          },
          rear: {
            size: '',
            pressure: '',
            brand: ''
          }
        }
      });
    }
    // Reset to first tab when opening modal
    setActiveTab('basic');
    setError(null);
  }, [type, machine, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested properties
    if (name.includes('.')) {
      const [parent, child, subChild] = name.split('.');
      
      if (subChild) {
        setFormData({
          ...formData,
          [parent]: {
            ...formData[parent],
            [child]: {
              ...formData[parent][child],
              [subChild]: value
            }
          }
        });
      } else {
        setFormData({
          ...formData,
          [parent]: {
            ...formData[parent],
            [child]: value
          }
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!formData.model || !formData.brand) {
        throw new Error('Model and Brand are required fields');
      }

      // Log the form data before submission
      console.log('Submitting form data:', formData);
      
      const url = type === 'edit' && machine?._id 
        ? `/api/machines/${machine._id}` 
        : '/api/machines';
      
      const method = type === 'edit' ? 'PUT' : 'POST';
      
      // Ensure consistent data structure
      const dataToSubmit = {
        model: formData.model,
        brand: formData.brand,
        serialNumber: formData.serialNumber || '',
        machineId: formData.machineId || '',
        year: formData.year || '',
        currentHours: formData.currentHours || '0',
        lastService: formData.lastService || '',
        nextService: formData.nextService || '',
        engineOil: {
          type: formData.engineOil.type || '',
          capacity: formData.engineOil.capacity || '',
          brand: formData.engineOil.brand || ''
        },
        hydraulicOil: {
          type: formData.hydraulicOil.type || '',
          capacity: formData.hydraulicOil.capacity || '',
          brand: formData.hydraulicOil.brand || ''
        },
        transmissionOil: {
          type: formData.transmissionOil.type || '',
          capacity: formData.transmissionOil.capacity || '',
          brand: formData.transmissionOil.brand || ''
        },
        filters: {
          engine: formData.filters.engine || '',
          engineBrand: formData.filters.engineBrand || '',
          transmission: formData.filters.transmission || '',
          transmissionBrand: formData.filters.transmissionBrand || '',
          fuel: formData.filters.fuel || '',
          fuelBrand: formData.filters.fuelBrand || ''
        },
        tires: {
          front: {
            size: formData.tires.front.size || '',
            pressure: formData.tires.front.pressure || '',
            brand: formData.tires.front.brand || ''
          },
          rear: {
            size: formData.tires.rear.size || '',
            pressure: formData.tires.rear.pressure || '',
            brand: formData.tires.rear.brand || ''
          }
        }
      };
      
      // Log the formatted data
      console.log('Formatted data for submission:', dataToSubmit);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      });
      
      // Log the raw response
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error || `Failed to ${type === 'edit' ? 'update' : 'create'} machine`);
      }
      
      const savedMachine = await response.json();
      console.log('Saved machine:', savedMachine);
      
      // Pass the saved machine back to parent component
      if (onSubmit) {
        onSubmit(savedMachine);
      }
      
      onClose();
    } catch (err) {
      console.error('Error saving machine:', err);
      setError(err.message || 'Failed to save machine');
      
      // Optional: alert for user feedback
      alert(err.message || 'Failed to save machine. Please check your input and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ... rest of the component remains the same (including renderTabContent method)

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h3 className="text-2xl font-bold text-gray-900">
            {type === 'edit' ? 'Edit Machine' : 'New Machine'}
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Tabs Navigation */}
          <div className="flex space-x-4 border-b mb-6 overflow-x-auto">
            {['basic', 'oils', 'filters', 'tires'].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`py-3 px-6 font-medium text-base capitalize ${
                  activeTab === tab
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'basic' ? 'Basic Information' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="px-2 py-4">
            {renderTabContent()}
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
              disabled={loading}
            >
              {loading ? 'Saving...' : type === 'edit' ? 'Save Changes' : 'Add Machine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MachineModal;