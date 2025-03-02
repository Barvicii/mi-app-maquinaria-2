'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import '../styles/machinemodal.css';

const MachineModal = ({ show, type, machine, onClose, onSubmit }) => {
  const { data: session } = useSession();
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

  // Clear localStorage on component mount
  useEffect(() => {
    localStorage.removeItem('machineDraft');
    return () => {
      localStorage.removeItem('machineDraft');
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested properties
    if (name.includes('.')) {
      const parts = name.split('.');
      
      if (parts.length === 2) {
        const [parent, child] = parts;
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }));
      } else if (parts.length === 3) {
        const [parent, child, subChild] = parts;
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [subChild]: value
            }
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/machines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId: session?.user?.id, // Add user ID to machine data
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Only show error if it's not a successful creation
        if (response.status !== 201) {
          throw new Error(data.error || 'Failed to create machine');
        }
      }

      // If we got here, it was successful
      onSubmit?.(data.machine);
      onClose();

    } catch (err) {
      console.error('Error:', err);
      // Only set error if it's not about existing machine
      if (!err.message.includes('already exists')) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="modal-field">
                <label className="block text-sm font-medium text-black mb-1">
                  Model <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md text-black ${
                    error && !formData.model ? 'border-red-500' : ''
                  }`}
                  required
                />
              </div>

              <div className="modal-field">
                <label className="block text-sm font-medium text-black mb-1">
                  Brand <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md text-black ${
                    error && !formData.brand ? 'border-red-500' : ''
                  }`}
                  required
                />
              </div>

              <div className="modal-field">
                <label className="block text-sm font-medium text-black mb-1">Serial Number</label>
                <input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md text-black"
                />
              </div>

              <div className="modal-field">
                <label className="block text-sm font-medium text-black mb-1">Machine ID</label>
                <input
                  type="text"
                  name="machineId"
                  value={formData.machineId}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md text-black"
                />
              </div>

              <div className="modal-field">
                <label className="block text-sm font-medium text-black mb-1">Year</label>
                <input
                  type="text"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md text-black"
                />
              </div>

              <div className="modal-field">
                <label className="block text-sm font-medium text-black mb-1">Current Hours</label>
                <input
                  type="text"
                  name="currentHours"
                  value={formData.currentHours}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md text-black"
                />
              </div>

              <div className="modal-field">
                <label className="block text-sm font-medium text-black mb-1">Last Service</label>
                <input
                  type="text"
                  name="lastService"
                  value={formData.lastService}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md text-black"
                />
              </div>

              <div className="modal-field">
                <label className="block text-sm font-medium text-black mb-1">Next Service</label>
                <input
                  type="text"
                  name="nextService"
                  value={formData.nextService}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md text-black"
                />
              </div>
            </div>
          </div>
        );
      case 'oils':
        return (
          <div className="space-y-6 w-full">
            <div className="oil-section">
              <h4 className="font-medium text-black mb-3 text-lg">Engine Oil</h4>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="modal-field">
                  <label className="block text-sm font-medium text-black mb-1">Type</label>
                  <input
                    type="text"
                    name="engineOil.type"
                    value={formData.engineOil.type}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md text-black"
                  />
                </div>
                <div className="modal-field">
                  <label className="block text-sm font-medium text-black mb-1">Capacity</label>
                  <input
                    type="text"
                    name="engineOil.capacity"
                    value={formData.engineOil.capacity}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md text-black"
                  />
                </div>
                <div className="modal-field">
                  <label className="block text-sm font-medium text-black mb-1">Brand</label>
                  <input
                    type="text"
                    name="engineOil.brand"
                    value={formData.engineOil.brand}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md text-black"
                  />
                </div>
              </div>
            </div>
      
            <div className="oil-section">
              <h4 className="font-medium text-black mb-3 text-lg">Hydraulic Oil</h4>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="modal-field">
                  <label className="block text-sm font-medium text-black mb-1">Type</label>
                  <input
                    type="text"
                    name="hydraulicOil.type"
                    value={formData.hydraulicOil.type}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md text-black"
                  />
                </div>
                <div className="modal-field">
                  <label className="block text-sm font-medium text-black mb-1">Capacity</label>
                  <input
                    type="text"
                    name="hydraulicOil.capacity"
                    value={formData.hydraulicOil.capacity}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md text-black"
                  />
                </div>
                <div className="modal-field">
                  <label className="block text-sm font-medium text-black mb-1">Brand</label>
                  <input
                    type="text"
                    name="hydraulicOil.brand"
                    value={formData.hydraulicOil.brand}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md text-black"
                  />
                </div>
              </div>
            </div>
      
            <div className="oil-section">
              <h4 className="font-medium text-black mb-3 text-lg">Transmission Oil</h4>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="modal-field">
                  <label className="block text-sm font-medium text-black mb-1">Type</label>
                  <input
                    type="text"
                    name="transmissionOil.type"
                    value={formData.transmissionOil.type}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md text-black"
                  />
                </div>
                <div className="modal-field">
                  <label className="block text-sm font-medium text-black mb-1">Capacity</label>
                  <input
                    type="text"
                    name="transmissionOil.capacity"
                    value={formData.transmissionOil.capacity}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md text-black"
                  />
                </div>
                <div className="modal-field">
                  <label className="block text-sm font-medium text-black mb-1">Brand</label>
                  <input
                    type="text"
                    name="transmissionOil.brand"
                    value={formData.transmissionOil.brand}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md text-black"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 'filters':
        return (
          <div className="space-y-6 w-full">
            {/* Engine Filters */}
            <div className="oil-section">
              <h4 className="font-medium text-black mb-3 text-lg">Engine Filters</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="modal-field">
                  <label className="block text-sm font-medium text-black mb-1">Filter Number</label>
                  <input
                    type="text"
                    name="filters.engine"
                    value={formData.filters.engine}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md text-black"
                  />
                </div>
                <div className="modal-field">
                  <label className="block text-sm font-medium text-black mb-1">Brand</label>
                  <input
                    type="text"
                    name="filters.engineBrand"
                    value={formData.filters.engineBrand}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md text-black"
                  />
                </div>
              </div>
            </div>
      
            {/* Transmission Filters */}
            <div className="oil-section">
              <h4 className="font-medium text-black mb-3 text-lg">Transmission Filters</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="modal-field">
                  <label className="block text-sm font-medium text-black mb-1">Filter Number</label>
                  <input
                    type="text"
                    name="filters.transmission"
                    value={formData.filters.transmission}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md text-black"
                  />
                </div>
                <div className="modal-field">
                  <label className="block text-sm font-medium text-black mb-1">Brand</label>
                  <input
                    type="text"
                    name="filters.transmissionBrand"
                    value={formData.filters.transmissionBrand}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md text-black"
                  />
                </div>
              </div>
            </div>
      
            {/* Fuel Filters */}
            <div className="oil-section">
              <h4 className="font-medium text-black mb-3 text-lg">Fuel Filters</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="modal-field">
                  <label className="block text-sm font-medium text-black mb-1">Filter Number</label>
                  <input
                    type="text"
                    name="filters.fuel"
                    value={formData.filters.fuel}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md text-black"
                  />
                </div>
                <div className="modal-field">
                  <label className="block text-sm font-medium text-black mb-1">Brand</label>
                  <input
                    type="text"
                    name="filters.fuelBrand"
                    value={formData.filters.fuelBrand}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md text-black"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 'tires':
        return (
          <div className="space-y-6">
            {/* Front Tires */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-black mb-3 text-lg">Front Tires</h4>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="modal-field">
                  <label className="block text-sm font-medium text-black mb-1">Size</label>
                  <input
                    type="text"
                    name="tires.front.size"
                    value={formData.tires.front.size}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md text-black"
                  />
                </div>

                <div className="modal-field">
                  <label className="block text-sm font-medium text-black mb-1">Pressure</label>
                  <input
                    type="text"
                    name="tires.front.pressure"
                    value={formData.tires.front.pressure}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md text-black"
                  />
                </div>

                <div className="modal-field">
                  <label className="block text-sm font-medium text-black mb-1">Brand</label>
                  <input
                    type="text"
                    name="tires.front.brand"
                    value={formData.tires.front.brand}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md text-black"
                  />
                </div>
              </div>
            </div>

            {/* Rear Tires */}
            <div>
              <h4 className="font-medium text-black mb-3 text-lg">Rear Tires</h4>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="modal-field">
                  <label className="block text-sm font-medium text-black mb-1">Size</label>
                  <input
                    type="text"
                    name="tires.rear.size"
                    value={formData.tires.rear.size}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md text-black"
                  />
                </div>

                <div className="modal-field">
                  <label className="block text-sm font-medium text-black mb-1">Pressure</label>
                  <input
                    type="text"
                    name="tires.rear.pressure"
                    value={formData.tires.rear.pressure}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md text-black"
                  />
                </div>

                <div className="modal-field">
                  <label className="block text-sm font-medium text-black mb-1">Brand</label>
                  <input
                    type="text"
                    name="tires.rear.brand"
                    value={formData.tires.rear.brand}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md text-black"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

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