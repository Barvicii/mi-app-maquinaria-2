import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import '@/styles/machinemodal.css';

const MachineModal = ({ show, type, machine, onClose, onSubmit }) => {
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
    currentHours: '',
    lastService: '',
    nextService: '',
    workplace: '',
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
      carbon: '',
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
        workplace: machine.workplace || '',
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
          fuelBrand: machine.filters?.fuelBrand || (machine.filtros?.combustibleMarca || ''),
          air: machine.filters?.air || (machine.filtros?.aire || ''),
          airBrand: machine.filters?.airBrand || (machine.filtros?.aireMarca || ''),
          carbon: typeof machine.filters?.carbon === 'object' ? machine.filters.carbon : (machine.filters?.carbon || (machine.filtros?.carbono || '')),
          carbonBrand: typeof machine.filters?.carbon === 'object' ? machine.filters.carbon.brand : (machine.filters?.carbonBrand || (machine.filtros?.carbonoMarca || ''))
        },
        carbonFilterLifeHours: typeof machine.filters?.carbon === 'object' ? machine.filters.carbon.expectedLifeHours : (machine.filters?.carbonlife?.expectedLifeHours || machine.carbonFilterLifeHours || 100),
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
        },
        prestartTemplateId: machine.prestartTemplateId || ''
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
        workplace: '',
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
          carbon: '',
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

  useEffect(() => {
    const fetchTemplates = async () => {
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
    
    fetchTemplates();
    
    // Solo cargar workplaces si el usuario es admin
    if (session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN') {
      fetchWorkplaces();
    }
  }, [session]);

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

  const handleAddNewWorkplace = async () => {
    if (!newWorkplace.trim()) return;
    
    try {
      const response = await fetch('/api/workplaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workplace: newWorkplace.trim() }),
      });
      
      if (response.ok) {
        // Agregar el nuevo workplace a la lista
        setWorkplaces(prev => [...prev, newWorkplace.trim()].sort());
        
        // Seleccionar el nuevo workplace
        setFormData(prev => ({
          ...prev,
          workplace: newWorkplace.trim()
        }));
        
        // Limpiar el input y ocultar
        setNewWorkplace('');
        setShowNewWorkplaceInput(false);
      } else {
        const data = await response.json();
        setError(data.error || 'Error adding workplace');
      }
    } catch (error) {
      console.error('Error adding workplace:', error);
      setError('Error adding workplace');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      console.log("Submitting machine data:", { type, machine: formData });
      
      // Asegura que machineId esté presente para nuevos registros
      const dataToSubmit = { ...formData };
      
      if (type !== 'edit' && !dataToSubmit.machineId) {
        dataToSubmit.machineId = `MACHINE_${Date.now()}`;
      }

      console.log("Data to submit:", dataToSubmit);
      
      // Si es onSubmit (desde TabMachinary)
      if (typeof onSubmit === 'function') {
        await onSubmit(dataToSubmit);
        onClose();
        return;
      }
      
      // Si no hay onSubmit, hacer la llamada API directamente
      // Esta parte no es necesaria si siempre usas onSubmit, pero la dejamos por robustez
      const url = type === 'edit' && machine?._id 
        ? `/api/machines/${machine._id}` 
        : '/api/machines';
        
      const method = type === 'edit' ? 'PUT' : 'POST';
      
      console.log(`Sending ${method} request to ${url}`);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save machine');
      }

      // Si llegamos aquí, fue exitoso
      onClose();

    } catch (err) {
      console.error('Error submitting machine:', err);
      setError(err.message || 'An error occurred while saving the machine');
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

              <div className="modal-field">
                <label className="block text-sm font-medium text-black mb-1">Workplace</label>
                {session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN' ? (
                  <div className="space-y-2">
                    {/* Dropdown para administradores */}
                    <select
                      name="workplace"
                      value={formData.workplace}
                      onChange={handleWorkplaceSelectChange}
                      className="w-full p-2 border rounded-md text-black"
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
                    className="w-full p-2 border rounded-md text-black bg-gray-100"
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

              <div className="form-group">
                <label htmlFor="prestartTemplateId" className="form-label">PreStart Template</label>
                <select
                  id="prestartTemplateId"
                  name="prestartTemplateId"
                  value={formData.prestartTemplateId || ''}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">Default Template</option>
                  {prestartTemplates.map(template => (
                    <option key={template._id} value={template._id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Select which prestart check template to use for this machine
                </p>
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

            {/* Air Filters */}
            <div className="oil-section">
              <h4 className="font-medium text-black mb-3 text-lg">Air Filters</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="modal-field">
                  <label className="block text-sm font-medium text-black mb-1">Filter Number</label>
                  <input
                    type="text"
                    name="filters.air"
                    value={formData.filters.air}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md text-black"
                  />
                </div>
                <div className="modal-field">
                  <label className="block text-sm font-medium text-black mb-1">Brand</label>
                  <input
                    type="text"
                    name="filters.airBrand"
                    value={formData.filters.airBrand}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md text-black"
                  />
                </div>
              </div>
            </div>

            {/* Carbon Filters for Chemical Machinery */}
            <div className="oil-section border-t pt-6">
              <div className="flex items-center gap-4 mb-4">
                <h4 className="font-medium text-black text-lg">Carbon Filters (Chemical Equipment)</h4>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="filters.carbon.isActive"
                    checked={typeof formData.filters.carbon === 'object' ? formData.filters.carbon.isActive : false}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData(prev => {
                        const updatedData = {
                          ...prev
                        };
                        
                        // Si se está marcando el checkbox, convertir la estructura simple en objeto completo
                        if (checked) {
                          const currentCarbon = typeof prev.filters.carbon === 'string' ? prev.filters.carbon : '';
                          const currentCarbonBrand = prev.filters.carbonBrand || '';
                          
                          updatedData.filters = {
                            ...updatedData.filters,
                            carbon: {
                              partNumber: currentCarbon,
                              brand: currentCarbonBrand,
                              expectedLifeHours: parseInt(prev.carbonFilterLifeHours) || 100,
                              installationHours: parseInt(prev.currentHours) || 0,
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
                  <span className="text-sm text-gray-600">Machine uses carbon filters</span>
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
                            } else {
                              return {
                                ...prev,
                                filters: {
                                  ...prev.filters,
                                  carbon: value
                                }
                              };
                            }
                          });
                        }}
                        className="w-full p-2 border rounded-md text-black"
                      />
                    </div>
                    <div className="modal-field">
                      <label className="block text-sm font-medium text-black mb-1">Brand</label>
                      <input
                        type="text"
                        name="filters.carbonBrand"
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
                            } else {
                              return {
                                ...prev,
                                filters: {
                                  ...prev.filters,
                                  carbonBrand: value
                                }
                              };
                            }
                          });
                        }}
                        className="w-full p-2 border rounded-md text-black"
                      />
                    </div>
                  </div>
                  
                  <div className="modal-field">
                    <label className="block text-sm font-medium text-black mb-1">Expected Life (Hours)</label>
                    <input
                      type="number"
                      name="carbonFilterLifeHours"
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
                          } else {
                            return {
                              ...prev,
                              carbonFilterLifeHours: value
                            };
                          }
                        });
                      }}
                      className="w-full p-2 border rounded-md text-black"
                      min="1"
                      placeholder="100"
                    />
                  </div>
                  
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                    <p><strong>Note:</strong> Carbon filter will be tracked automatically with the specified expected life hours. The system will calculate usage hours based on machine current hours.</p>
                  </div>
                </div>
              )}
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
        <button 
          type="button"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold leading-none z-20 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
          onClick={onClose}
        >
          ×
        </button>

        <div className="modal-header">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {type === 'edit' ? 'Edit Machine' : 'New Machine'}
            </h2>
          </div>
          
          <div className="flex space-x-1 mt-4 border-b">
            {['basic', 'oils', 'filters', 'tires'].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`tab-button ${activeTab === tab ? 'tab-button-active' : 'tab-button-inactive'}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'basic' ? 'Basic Information' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-body" id="machine-form">
          {renderTabContent()}
        </form>

        <div className="modal-footer">
          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="modal-button modal-button-cancel"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="machine-form"
              disabled={loading}
              className="modal-button modal-button-submit"
            >
              {loading ? 'Saving...' : type === 'edit' ? 'Save Changes' : 'Add Machine'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MachineModal;