import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import '@/styles/machinemodal.css';

const VehicleModal = ({ show, type, vehicle, onClose, onSubmit }) => {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [prestartTemplates, setPrestartTemplates] = useState([]);
  const [workplaces, setWorkplaces] = useState([]);
  const [newWorkplace, setNewWorkplace] = useState('');
  const [showNewWorkplaceInput, setShowNewWorkplaceInput] = useState(false);
  const [formData, setFormData] = useState({
    model: '',
    brand: '',
    serialNumber: '',
    machineId: '',
    year: '',
    plateNumber: '',
    currentKilometers: '',
    vehicleType: '', // truck, ute, van, etc.
    lastService: '',
    nextService: '',
    workplace: '',
    // RUC (Road User Charges)
    ruc: {
      currentKm: '',
      nextDueKm: '',
      kmInterval: 5000, // Default 5000km interval
      isActive: false
    },
    // REGO (Vehicle Licensing)
    rego: {
      expiryDate: '',
      lastRenewalDate: '',
      cost: '',
      isActive: true
    },
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
      fuelBrand: '',
      air: '',
      airBrand: '',
      carbon: {
        isActive: false,
        partNumber: '',
        brand: '',
        expectedLifeHours: 100
      },
      carbonBrand: ''
    },
    carbonFilterLifeHours: 100,
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
    },
    prestartTemplateId: ''
  });

  // Initialize form with vehicle data when editing
  useEffect(() => {
    if (type === 'edit' && vehicle) {
      setFormData({
        model: vehicle.model || vehicle.modelo || '',
        brand: vehicle.brand || vehicle.marca || '',
        serialNumber: vehicle.serialNumber || vehicle.serie || '',
        machineId: vehicle.machineId || vehicle.maquinariaId || '',
        year: vehicle.year || vehicle.anio || '',
        plateNumber: vehicle.plateNumber || '',
        currentKilometers: vehicle.currentKilometers || '',
        vehicleType: vehicle.vehicleType || '',
        lastService: vehicle.lastService || vehicle.ultimoService || '',
        nextService: vehicle.nextService || vehicle.proximoService || '',
        workplace: vehicle.workplace || '',
        ruc: {
          currentKm: vehicle.ruc?.currentKm || '',
          nextDueKm: vehicle.ruc?.nextDueKm || '',
          kmInterval: vehicle.ruc?.kmInterval || 5000,
          isActive: vehicle.ruc?.isActive ?? false
        },
        rego: {
          expiryDate: vehicle.rego?.expiryDate || '',
          lastRenewalDate: vehicle.rego?.lastRenewalDate || '',
          cost: vehicle.rego?.cost || '',
          isActive: vehicle.rego?.isActive ?? true
        },
        engineOil: {
          type: vehicle.engineOil?.type || '',
          capacity: vehicle.engineOil?.capacity || '',
          brand: vehicle.engineOil?.brand || ''
        },
        hydraulicOil: {
          type: vehicle.hydraulicOil?.type || '',
          capacity: vehicle.hydraulicOil?.capacity || '',
          brand: vehicle.hydraulicOil?.brand || ''
        },
        transmissionOil: {
          type: vehicle.transmissionOil?.type || '',
          capacity: vehicle.transmissionOil?.capacity || '',
          brand: vehicle.transmissionOil?.brand || ''
        },
        filters: {
          engine: vehicle.filters?.engine || '',
          engineBrand: vehicle.filters?.engineBrand || '',
          transmission: vehicle.filters?.transmission || '',
          transmissionBrand: vehicle.filters?.transmissionBrand || '',
          fuel: vehicle.filters?.fuel || '',
          fuelBrand: vehicle.filters?.fuelBrand || '',
          air: vehicle.filters?.air || '',
          airBrand: vehicle.filters?.airBrand || '',
          carbon: vehicle.filters?.carbon || {
            isActive: false,
            partNumber: '',
            brand: '',
            expectedLifeHours: 100
          },
          carbonBrand: vehicle.filters?.carbonBrand || ''
        },
        carbonFilterLifeHours: vehicle.carbonFilterLifeHours || 100,
        tires: {
          front: {
            size: vehicle.tires?.front?.size || '',
            pressure: vehicle.tires?.front?.pressure || '',
            brand: vehicle.tires?.front?.brand || ''
          },
          rear: {
            size: vehicle.tires?.rear?.size || '',
            pressure: vehicle.tires?.rear?.pressure || '',
            brand: vehicle.tires?.rear?.brand || ''
          }
        },
        prestartTemplateId: vehicle.prestartTemplateId || ''
      });
    } else {
      // Reset form for new vehicle
      setFormData({
        model: '',
        brand: '',
        serialNumber: '',
        machineId: '',
        year: '',
        plateNumber: '',
        currentKilometers: '',
        vehicleType: '',
        lastService: '',
        nextService: '',
        workplace: '',
        ruc: {
          currentKm: '',
          nextDueKm: '',
          kmInterval: 5000,
          isActive: false
        },
        rego: {
          expiryDate: '',
          lastRenewalDate: '',
          cost: '',
          isActive: true
        },
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
          fuelBrand: '',
          air: '',
          airBrand: '',
          carbon: {
            isActive: false,
            partNumber: '',
            brand: '',
            expectedLifeHours: 100
          },
          carbonBrand: ''
        },
        carbonFilterLifeHours: 100,
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
        },
        prestartTemplateId: ''
      });
    }
  }, [type, vehicle]);

  // Auto-configurar workplace para usuarios regulares
  useEffect(() => {
    if (session?.user && type === 'add') {
      if (session.user.role === 'USER' && session.user.workplace) {
        setFormData(prev => ({
          ...prev,
          workplace: session.user.workplace
        }));
      }
    }
  }, [session, type]);

  // Load prestart templates and workplaces
  useEffect(() => {
    if (show) {
      fetchPrestartTemplates();
      
      // Solo cargar workplaces si el usuario es admin
      if (session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN') {
        fetchWorkplaces();
      }
    }
  }, [show, session]);

  const fetchPrestartTemplates = async () => {
    try {
      const response = await fetch('/api/prestart/templates');
      if (response.ok) {
        const data = await response.json();
        setPrestartTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching prestart templates:', error);
    }
  };

  const fetchWorkplaces = async () => {
    try {
      const response = await fetch('/api/workplaces');
      if (response.ok) {
        const data = await response.json();
        setWorkplaces(data);
      }
    } catch (error) {
      console.error('Error fetching workplaces:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNestedInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleTireChange = (position, field, value) => {
    setFormData(prev => ({
      ...prev,
      tires: {
        ...prev.tires,
        [position]: {
          ...prev.tires[position],
          [field]: value
        }
      }
    }));
  };

  const handleRUCChange = (field, value) => {
    setFormData(prev => {
      const newRucData = {
        ...prev.ruc,
        [field]: value
      };

      // Auto-calculate km interval when currentKm or nextDueKm changes
      if (field === 'currentKm' || field === 'nextDueKm') {
        const currentKm = field === 'currentKm' ? parseInt(value) : parseInt(prev.ruc.currentKm);
        const nextDueKm = field === 'nextDueKm' ? parseInt(value) : parseInt(prev.ruc.nextDueKm);
        
        if (currentKm && nextDueKm && nextDueKm > currentKm) {
          newRucData.kmInterval = nextDueKm - currentKm;
        }
      }

      return {
        ...prev,
        ruc: newRucData
      };
    });
  };

  const handleRegoChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      rego: {
        ...prev.rego,
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkplaceSelectChange = (e) => {
    const value = e.target.value;
    
    if (value === '__ADD_NEW__') {
      setShowNewWorkplaceInput(true);
    } else {
      setFormData(prev => ({
        ...prev,
        workplace: value
      }));
    }
  };

  const handleAddNewWorkplace = async () => {
    if (!newWorkplace.trim()) return;
    
    try {
      const response = await fetch('/api/workplaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newWorkplace.trim() })
      });
      
      if (response.ok) {
        await fetchWorkplaces(); // Refresh the list
        setFormData(prev => ({
          ...prev,
          workplace: newWorkplace.trim()
        }));
        setNewWorkplace('');
        setShowNewWorkplaceInput(false);
      } else {
        console.error('Failed to add workplace');
      }
    } catch (error) {
      console.error('Error adding workplace:', error);
    }
  };

  const addNewWorkplace = async () => {
    if (!newWorkplace.trim()) return;

    try {
      const response = await fetch('/api/workplaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newWorkplace.trim() }),
      });

      if (response.ok) {
        const result = await response.json();
        setWorkplaces(prev => [...prev, result]);
        setFormData(prev => ({ ...prev, workplace: result.name }));
        setNewWorkplace('');
        setShowNewWorkplaceInput(false);
      }
    } catch (error) {
      console.error('Error adding workplace:', error);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content relative">
        {/* Botón X en la esquina superior derecha */}
        <button 
          type="button"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold leading-none z-20 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:shadow-lg transition-all"
          onClick={onClose}
        >
          ×
        </button>
        
        {/* Close button positioned absolutely in top right corner */}
        <button 
          type="button"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold leading-none z-20 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
          onClick={onClose}
        >
          ×
        </button>

        <div className="modal-header">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">{type === 'edit' ? 'Edit Vehicle' : 'New Vehicle'}</h2>
          </div>
          
          <div className="flex space-x-1 mt-4 border-b">
            <button 
              type="button"
              className={`tab-button ${activeTab === 'basic' ? 'tab-button-active' : 'tab-button-inactive'}`}
              onClick={() => setActiveTab('basic')}
            >
              Basic Info
            </button>
            <button 
              type="button"
              className={`tab-button ${activeTab === 'ruc-rego' ? 'tab-button-active' : 'tab-button-inactive'}`}
              onClick={() => setActiveTab('ruc-rego')}
            >
              RUC & REGO
            </button>
            <button 
              type="button"
              className={`tab-button ${activeTab === 'oils' ? 'tab-button-active' : 'tab-button-inactive'}`}
              onClick={() => setActiveTab('oils')}
            >
              Oils
            </button>
            <button 
              type="button"
              className={`tab-button ${activeTab === 'filters' ? 'tab-button-active' : 'tab-button-inactive'}`}
              onClick={() => setActiveTab('filters')}
            >
              Filters
            </button>
            <button 
              type="button"
              className={`tab-button ${activeTab === 'tires' ? 'tab-button-active' : 'tab-button-inactive'}`}
              onClick={() => setActiveTab('tires')}
            >
              Tires
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">{/* Form content will continue here */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <h3 className="text-base font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="modal-grid">
                <div className="modal-field">
                  <label className="form-label">Vehicle ID *</label>
                  <input
                    type="text"
                    name="machineId"
                    value={formData.machineId}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., TRUCK_001"
                    className="form-input"
                  />
                </div>
                <div className="modal-field">
                  <label className="form-label">Plate Number *</label>
                  <input
                    type="text"
                    name="plateNumber"
                    value={formData.plateNumber}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., ABC123"
                    className="form-input"
                  />
                </div>
                <div className="modal-field">
                  <label className="form-label">Vehicle Type *</label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleInputChange}
                    required
                    className="form-select"
                  >
                    <option value="">Select Type</option>
                    <option value="truck">Truck</option>
                    <option value="ute">Ute</option>
                    <option value="van">Van</option>
                    <option value="trailer">Trailer</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="modal-field">
                  <label className="form-label">Brand *</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Ford, Toyota"
                    className="form-input"
                  />
                </div>
                <div className="modal-field">
                  <label className="form-label">Model *</label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Ranger, Hilux"
                    className="form-input"
                  />
                </div>
                <div className="modal-field">
                  <label className="form-label">Year</label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    placeholder="e.g., 2020"
                    className="form-input"
                  />
                </div>
                <div className="modal-field">
                  <label className="form-label">Serial Number</label>
                  <input
                    type="text"
                    name="serialNumber"
                    value={formData.serialNumber}
                    onChange={handleInputChange}
                    placeholder="Vehicle VIN or Serial"
                    className="form-input"
                  />
                </div>
                <div className="modal-field">
                  <label className="form-label">Current Kilometers *</label>
                  <input
                    type="number"
                    name="currentKilometers"
                    value={formData.currentKilometers}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., 150000"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="modal-field">
                <label className="form-label">Workplace</label>
                {session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN' ? (
                  <div className="space-y-2">
                    {/* Dropdown para administradores */}
                    <select
                      name="workplace"
                      value={formData.workplace}
                      onChange={handleWorkplaceSelectChange}
                      className="form-select"
                      required
                    >
                      <option value="">Select a workplace</option>
                      {workplaces.map((workplace, index) => (
                        <option key={index} value={workplace}>
                          {workplace}
                        </option>
                      ))}
                      <option value="__ADD_NEW__" className="font-semibold text-blue-600">
                        + Add New Workplace
                      </option>
                    </select>
                    
                    {/* Input para nuevo workplace */}
                    {showNewWorkplaceInput && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newWorkplace}
                          onChange={(e) => setNewWorkplace(e.target.value)}
                          placeholder="Enter new workplace name"
                          className="flex-1 p-2 border rounded-md text-black"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddNewWorkplace();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddNewWorkplace}
                          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewWorkplaceInput(false);
                            setNewWorkplace('');
                          }}
                          className="px-3 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  // Campo bloqueado para usuarios regulares
                  <input
                    type="text"
                    name="workplace"
                    value={formData.workplace || session?.user?.workplace || 'N/A'}
                    className="form-input bg-gray-100"
                    placeholder="Your assigned workplace"
                    disabled
                  />
                )}
                {session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Workplace is automatically assigned based on your user profile
                  </p>
                )}
              </div>

              {/* Service Information Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900 border-b pb-2">Service Information</h4>
                <div className="modal-grid">
                  <div className="modal-field">
                    <label className="form-label">Last Service Date</label>
                    <input
                      type="date"
                      name="lastService"
                      value={formData.lastService}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  <div className="modal-field">
                    <label className="form-label">Next Service (km)</label>
                    <input
                      type="text"
                      name="nextService"
                      value={formData.nextService}
                      onChange={handleInputChange}
                      placeholder="e.g., 20000 km"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-field">
                <label className="form-label">Prestart Template</label>
                <select
                  name="prestartTemplateId"
                  value={formData.prestartTemplateId}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">Select Template</option>
                  {prestartTemplates.map((template) => (
                    <option key={template._id} value={template._id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeTab === 'ruc-rego' && (
            <div className="space-y-6">
              <div className="oil-section">
                <h3 className="text-base font-medium text-gray-900 mb-4">RUC (Road User Charges)</h3>
                <div className="modal-grid">
                  <div className="modal-field">
                    <label className="form-label">Current Kilometers</label>
                    <input
                      type="number"
                      value={formData.ruc.currentKm}
                      onChange={(e) => handleRUCChange('currentKm', e.target.value)}
                      placeholder="Current km reading"
                      className="form-input"
                    />
                  </div>
                  <div className="modal-field">
                    <label className="form-label">Next Due KM</label>
                    <input
                      type="number"
                      value={formData.ruc.nextDueKm}
                      onChange={(e) => handleRUCChange('nextDueKm', e.target.value)}
                      placeholder="KM limit from RUC label"
                      className="form-input"
                    />
                  </div>
                  <div className="modal-field">
                    <label className="form-label">KM Interval (Auto-calculated)</label>
                    <input
                      type="number"
                      value={formData.ruc.nextDueKm && formData.ruc.currentKm ? 
                        (parseInt(formData.ruc.nextDueKm) - parseInt(formData.ruc.currentKm)) : ''}
                      className="form-input bg-gray-100"
                      placeholder="Auto-calculated"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="oil-section">
                <h3 className="text-base font-medium text-gray-900 mb-4">REGO (Vehicle Licensing)</h3>
                <div className="modal-grid">
                  <div className="modal-field">
                    <label className="form-label">Expiry Date</label>
                    <input
                      type="date"
                      value={formData.rego.expiryDate}
                      onChange={(e) => handleRegoChange('expiryDate', e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="modal-field">
                    <label className="form-label">Last Renewal Date</label>
                    <input
                      type="date"
                      value={formData.rego.lastRenewalDate}
                      onChange={(e) => handleRegoChange('lastRenewalDate', e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="modal-field">
                    <label className="form-label">Cost (NZD)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.rego.cost}
                      onChange={(e) => handleRegoChange('cost', e.target.value)}
                      placeholder="e.g., 450.00"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'oils' && (
            <div className="space-y-6">
              <div className="oil-section">
                <h3 className="text-base font-medium text-gray-900 mb-4">Engine Oil</h3>
                <div className="oil-grid">
                  <div className="modal-field">
                    <label className="form-label">Type</label>
                    <input
                      type="text"
                      value={formData.engineOil.type}
                      onChange={(e) => handleNestedInputChange('engineOil', 'type', e.target.value)}
                      placeholder="e.g., 15W-40"
                      className="form-input"
                    />
                  </div>
                  <div className="modal-field">
                    <label className="form-label">Capacity (L)</label>
                    <input
                      type="text"
                      value={formData.engineOil.capacity}
                      onChange={(e) => handleNestedInputChange('engineOil', 'capacity', e.target.value)}
                      placeholder="e.g., 7"
                      className="form-input"
                    />
                  </div>
                  <div className="modal-field">
                    <label className="form-label">Brand</label>
                    <input
                      type="text"
                      value={formData.engineOil.brand}
                      onChange={(e) => handleNestedInputChange('engineOil', 'brand', e.target.value)}
                      placeholder="e.g., Shell, Mobil"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="oil-section">
                <h3 className="text-base font-medium text-gray-900 mb-4">Hydraulic Oil</h3>
                <div className="oil-grid">
                  <div className="modal-field">
                    <label className="form-label">Type</label>
                    <input
                      type="text"
                      value={formData.hydraulicOil.type}
                      onChange={(e) => handleNestedInputChange('hydraulicOil', 'type', e.target.value)}
                      placeholder="e.g., AW46"
                      className="form-input"
                    />
                  </div>
                  <div className="modal-field">
                    <label className="form-label">Capacity (L)</label>
                    <input
                      type="text"
                      value={formData.hydraulicOil.capacity}
                      onChange={(e) => handleNestedInputChange('hydraulicOil', 'capacity', e.target.value)}
                      placeholder="e.g., 50"
                      className="form-input"
                    />
                  </div>
                  <div className="modal-field">
                    <label className="form-label">Brand</label>
                    <input
                      type="text"
                      value={formData.hydraulicOil.brand}
                      onChange={(e) => handleNestedInputChange('hydraulicOil', 'brand', e.target.value)}
                      placeholder="e.g., Shell, Mobil"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="oil-section">
                <h3 className="text-base font-medium text-gray-900 mb-4">Transmission Oil</h3>
                <div className="oil-grid">
                  <div className="modal-field">
                    <label className="form-label">Type</label>
                    <input
                      type="text"
                      value={formData.transmissionOil.type}
                      onChange={(e) => handleNestedInputChange('transmissionOil', 'type', e.target.value)}
                      placeholder="e.g., ATF"
                      className="form-input"
                    />
                  </div>
                  <div className="modal-field">
                    <label className="form-label">Capacity (L)</label>
                    <input
                      type="text"
                      value={formData.transmissionOil.capacity}
                      onChange={(e) => handleNestedInputChange('transmissionOil', 'capacity', e.target.value)}
                      placeholder="e.g., 12"
                      className="form-input"
                    />
                  </div>
                  <div className="modal-field">
                    <label className="form-label">Brand</label>
                    <input
                      type="text"
                      value={formData.transmissionOil.brand}
                      onChange={(e) => handleNestedInputChange('transmissionOil', 'brand', e.target.value)}
                      placeholder="e.g., Shell, Mobil"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'filters' && (
            <div className="space-y-6">
              {/* Engine Filters Section */}
              <div className="oil-section">
                <h3 className="text-base font-medium text-gray-900 mb-4">Engine Filters</h3>
                <div className="modal-grid">
                  <div className="modal-field">
                    <label className="form-label">Filter Number</label>
                    <input
                      type="text"
                      value={formData.filters.engine}
                      onChange={(e) => handleNestedInputChange('filters', 'engine', e.target.value)}
                      placeholder="84475542"
                      className="form-input"
                    />
                  </div>
                  <div className="modal-field">
                    <label className="form-label">Brand</label>
                    <input
                      type="text"
                      value={formData.filters.engineBrand}
                      onChange={(e) => handleNestedInputChange('filters', 'engineBrand', e.target.value)}
                      placeholder="CNH"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Transmission Filters Section */}
              <div className="oil-section">
                <h3 className="text-base font-medium text-gray-900 mb-4">Transmission Filters</h3>
                <div className="modal-grid">
                  <div className="modal-field">
                    <label className="form-label">Filter Number</label>
                    <input
                      type="text"
                      value={formData.filters.transmission}
                      onChange={(e) => handleNestedInputChange('filters', 'transmission', e.target.value)}
                      placeholder="84257511"
                      className="form-input"
                    />
                  </div>
                  <div className="modal-field">
                    <label className="form-label">Brand</label>
                    <input
                      type="text"
                      value={formData.filters.transmissionBrand}
                      onChange={(e) => handleNestedInputChange('filters', 'transmissionBrand', e.target.value)}
                      placeholder="CNH"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Fuel Filters Section */}
              <div className="oil-section">
                <h3 className="text-base font-medium text-gray-900 mb-4">Fuel Filters</h3>
                <div className="modal-grid">
                  <div className="modal-field">
                    <label className="form-label">Filter Number</label>
                    <input
                      type="text"
                      value={formData.filters.fuel}
                      onChange={(e) => handleNestedInputChange('filters', 'fuel', e.target.value)}
                      placeholder="Part number"
                      className="form-input"
                    />
                  </div>
                  <div className="modal-field">
                    <label className="form-label">Brand</label>
                    <input
                      type="text"
                      value={formData.filters.fuelBrand}
                      onChange={(e) => handleNestedInputChange('filters', 'fuelBrand', e.target.value)}
                      placeholder="Brand"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Air Filters Section */}
              <div className="oil-section">
                <h3 className="text-base font-medium text-gray-900 mb-4">Air Filters</h3>
                <div className="modal-grid">
                  <div className="modal-field">
                    <label className="form-label">Filter Number</label>
                    <input
                      type="text"
                      value={formData.filters.air}
                      onChange={(e) => handleNestedInputChange('filters', 'air', e.target.value)}
                      placeholder="Part number"
                      className="form-input"
                    />
                  </div>
                  <div className="modal-field">
                    <label className="form-label">Brand</label>
                    <input
                      type="text"
                      value={formData.filters.airBrand}
                      onChange={(e) => handleNestedInputChange('filters', 'airBrand', e.target.value)}
                      placeholder="Brand"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Carbon Filter Checkbox */}
              <div className="flex items-center space-x-2 mt-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={typeof formData.filters.carbon === 'object' && formData.filters.carbon.isActive}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setFormData(prev => {
                        let updatedData = { ...prev };
                        
                        if (isChecked) {
                          // Si se marca, convertir a estructura de objeto
                          const currentCarbon = typeof prev.filters.carbon === 'object' ? prev.filters.carbon.partNumber || '' : prev.filters.carbon || '';
                          const currentCarbonBrand = prev.filters.carbonBrand || '';
                          
                          updatedData.filters = {
                            ...updatedData.filters,
                            carbon: {
                              partNumber: currentCarbon,
                              brand: currentCarbonBrand,
                              expectedLifeHours: parseInt(prev.carbonFilterLifeHours) || 100,
                              installationKm: parseInt(prev.currentKilometers) || 0,
                              installationDate: new Date().toISOString(),
                              isActive: true
                            }
                          };
                          
                          // Eliminar campos sueltos que ya están en el objeto
                          delete updatedData.carbonFilterLifeHours;
                          if (typeof updatedData.filters.carbonBrand !== 'undefined') {
                            delete updatedData.filters.carbonBrand;
                          }
                        } else {
                          // Si se desmarca, convertir de vuelta a estructura simple
                          if (typeof prev.filters.carbon === 'object' && prev.filters.carbon) {
                            updatedData.filters = {
                              ...updatedData.filters,
                              carbon: prev.filters.carbon.partNumber || '',
                              carbonBrand: prev.filters.carbon.brand || ''
                            };
                            updatedData.carbonFilterLifeHours = prev.filters.carbon.expectedLifeHours || 100;
                          }
                        }
                        
                        return updatedData;
                      });
                    }}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-600">Vehicle uses carbon filters</span>
                </label>
              </div>

              {(typeof formData.filters.carbon === 'object' && formData.filters.carbon.isActive) && (
                <div className="space-y-4 bg-gray-50 p-4 rounded-md max-h-80 overflow-y-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="modal-field">
                      <label className="block text-sm font-medium text-black mb-1">Filter Number</label>
                      <input
                        type="text"
                        name="filters.carbon"
                        value={
                          typeof formData.filters.carbon === 'object' 
                            ? formData.filters.carbon.partNumber || ''
                            : formData.filters.carbon || ''
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData(prev => {
                            if (typeof prev.filters.carbon === 'object') {
                              return {
                                ...prev,
                                filters: {
                                  ...prev.filters,
                                  carbon: {
                                    ...prev.filters.carbon,
                                    partNumber: value
                                  }
                                }
                              };
                            }
                            return prev;
                          });
                        }}
                        placeholder="Part number"
                        className="form-input"
                      />
                    </div>
                    <div className="modal-field">
                      <label className="block text-sm font-medium text-black mb-1">Filter Brand</label>
                      <input
                        type="text"
                        value={
                          typeof formData.filters.carbon === 'object' 
                            ? formData.filters.carbon.brand || ''
                            : formData.filters.carbonBrand || ''
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData(prev => {
                            if (typeof prev.filters.carbon === 'object') {
                              return {
                                ...prev,
                                filters: {
                                  ...prev.filters,
                                  carbon: {
                                    ...prev.filters.carbon,
                                    brand: value
                                  }
                                }
                              };
                            }
                            return prev;
                          });
                        }}
                        placeholder="Brand"
                        className="form-input"
                      />
                    </div>
                    <div className="modal-field">
                      <label className="block text-sm font-medium text-black mb-1">Expected Life (Hours)</label>
                      <input
                        type="number"
                        value={
                          typeof formData.filters.carbon === 'object' 
                            ? formData.filters.carbon.expectedLifeHours || 100
                            : formData.carbonFilterLifeHours || 100
                        }
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 100;
                          setFormData(prev => {
                            if (typeof prev.filters.carbon === 'object') {
                              return {
                                ...prev,
                                filters: {
                                  ...prev.filters,
                                  carbon: {
                                    ...prev.filters.carbon,
                                    expectedLifeHours: value
                                  }
                                }
                              };
                            }
                            return prev;
                          });
                        }}
                        placeholder="100"
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tires' && (
            <div className="space-y-6">
              <div className="oil-section">
                <h3 className="text-base font-medium text-gray-900 mb-4">Front Tires</h3>
                <div className="oil-grid">
                  <div className="modal-field">
                    <label className="form-label">Size</label>
                    <input
                      type="text"
                      value={formData.tires.front.size}
                      onChange={(e) => handleTireChange('front', 'size', e.target.value)}
                      placeholder="e.g., 265/70R16"
                      className="form-input"
                    />
                  </div>
                  <div className="modal-field">
                    <label className="form-label">Pressure (PSI)</label>
                    <input
                      type="text"
                      value={formData.tires.front.pressure}
                      onChange={(e) => handleTireChange('front', 'pressure', e.target.value)}
                      placeholder="e.g., 32"
                      className="form-input"
                    />
                  </div>
                  <div className="modal-field">
                    <label className="form-label">Brand</label>
                    <input
                      type="text"
                      value={formData.tires.front.brand}
                      onChange={(e) => handleTireChange('front', 'brand', e.target.value)}
                      placeholder="e.g., Bridgestone"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="oil-section">
                <h3 className="text-base font-medium text-gray-900 mb-4">Rear Tires</h3>
                <div className="oil-grid">
                  <div className="modal-field">
                    <label className="form-label">Size</label>
                    <input
                      type="text"
                      value={formData.tires.rear.size}
                      onChange={(e) => handleTireChange('rear', 'size', e.target.value)}
                      placeholder="e.g., 265/70R16"
                      className="form-input"
                    />
                  </div>
                  <div className="modal-field">
                    <label className="form-label">Pressure (PSI)</label>
                    <input
                      type="text"
                      value={formData.tires.rear.pressure}
                      onChange={(e) => handleTireChange('rear', 'pressure', e.target.value)}
                      placeholder="e.g., 35"
                      className="form-input"
                    />
                  </div>
                  <div className="modal-field">
                    <label className="form-label">Brand</label>
                    <input
                      type="text"
                      value={formData.tires.rear.brand}
                      onChange={(e) => handleTireChange('rear', 'brand', e.target.value)}
                      placeholder="e.g., Bridgestone"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

        </form>

        <div className="modal-footer">
          <div className="modal-actions">
            <button 
              type="button" 
              onClick={onClose} 
              className="modal-button modal-button-cancel"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              form="vehicle-form"
              disabled={loading} 
              className="modal-button modal-button-submit"
              onClick={handleSubmit}
            >
              {loading ? 'Saving...' : (type === 'edit' ? 'Update Vehicle' : 'Add Vehicle')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleModal;
