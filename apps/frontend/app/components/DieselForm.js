'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Fuel, User, Calendar, MessageCircle, Save, AlertTriangle, Wrench } from 'lucide-react';

const DieselForm = ({ tankId, publicMode = false }) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    tankId: tankId || '',
    tankName: '',
    maquinaId: '',
    machineName: '',
    customMachineId: '',
    litros: '',
    operador: '',
    trabajo: '',
    observaciones: '',
    fecha: new Date().toISOString().split('T')[0]
  });
  
  const [machines, setMachines] = useState([]);
  const [tank, setTank] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Fetch tank data and machines when component loads
  useEffect(() => {
    if (tankId) {
      fetchTankData();
    }
  }, [tankId, fetchTankData]);

  // Fetch machines when tankId is available in formData
  useEffect(() => {
    if (formData.tankId) {
      fetchMachines();
    }
  }, [formData.tankId, fetchMachines]);

  // Debug log for machines
  useEffect(() => {
    console.log('DieselForm - Machines state updated:', machines);
    console.log('DieselForm - Number of machines:', machines.length);
  }, [machines]);

  const fetchTankData = useCallback(async () => {
    try {
      // In public mode, we need to get tank info from a public endpoint
      const response = await fetch(`/api/diesel-tanks/${tankId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        const tankData = result.tank;
        setTank(tankData);
        setFormData(prev => ({
          ...prev,
          tankId: tankData.tankId,
          tankName: tankData.name
        }));
      } else {
        console.error('Failed to fetch tank data');
        setError('Tank not found');
      }
    } catch (err) {
      console.error('Error fetching tank data:', err);
      setError('Failed to load tank information');
    }
  }, [tankId]);

  const fetchMachines = useCallback(async () => {
    try {
      // If we have a tankId, get machines for that specific tank's credentialId
      if (formData.tankId) {
        console.log('Fetching machines for tank:', formData.tankId);
        const url = publicMode ? 
          `/api/machines-by-tank?tankId=${formData.tankId}&public=true` : 
          `/api/machines-by-tank?tankId=${formData.tankId}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Tank and machines data:', data);
          
          if (data.machines && Array.isArray(data.machines)) {
            setMachines(data.machines);
            console.log(`Loaded ${data.machines.length} machines for tank ${formData.tankId} (credential: ${data.tank?.credentialId})`);
          } else {
            setMachines([]);
            console.log('No machines found for this tank');
          }
        } else {
          console.error('Failed to fetch machines for tank', response.status);
          setError('Failed to load machines for this tank');
        }
      } else {
        // Fallback to general machines endpoint if no tankId
        const url = publicMode ? '/api/machines?public=true' : '/api/machines';
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const machines = await response.json();
          console.log('Machines loaded in DieselForm:', machines);
          setMachines(Array.isArray(machines) ? machines : []);
        } else {
          console.error('Failed to fetch machines', response.status);
          setError('Failed to load machines');
        }
      }
    } catch (err) {
      console.error('Error fetching machines:', err);
      setError('Failed to load machines');
    }
  }, [formData.tankId, publicMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleMachineSelect = (e) => {
    const machineId = e.target.value;
    const selectedMachine = machines.find(m => m._id === machineId || m.machineId === machineId);
    
    setFormData(prev => ({
      ...prev,
      maquinaId: machineId,
      machineName: selectedMachine?.name || '',
      customMachineId: selectedMachine?.machineId || selectedMachine?.customId || ''
    }));
    
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.tankId.trim()) {
      setError('Tank ID is required');
      return false;
    }
    
    if (!formData.maquinaId.trim()) {
      setError('Please select a machine');
      return false;
    }
    
    if (!formData.litros || parseFloat(formData.litros) <= 0) {
      setError('Please enter a valid fuel amount');
      return false;
    }
    
    if (!formData.operador.trim()) {
      setError('Operator name is required');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Prepare submission data
      const submitData = {
        ...formData,
        litros: parseFloat(formData.litros),
        fecha: formData.fecha ? new Date(formData.fecha) : new Date()
      };
      
      console.log('Submitting diesel record:', submitData);
      
      // Submit to API
      const apiUrl = publicMode ? '/api/diesel?public=true' : '/api/diesel';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to save diesel record');
      }
      
      console.log('Diesel record saved successfully:', result);
      
      setSuccess(true);
      
      // Reset form
      setFormData({
        tankId: tankId || '',
        tankName: tank?.name || '',
        maquinaId: '',
        machineName: '',
        customMachineId: '',
        litros: '',
        operador: '',
        trabajo: '',
        observaciones: '',
        fecha: new Date().toISOString().split('T')[0]
      });
      
      // Show success message for a few seconds
      setTimeout(() => {
        setSuccess(false);
        if (publicMode) {
          router.push('/'); // Or back to wherever appropriate
        }
      }, 3000);
      
    } catch (err) {
      console.error('Error submitting diesel record:', err);
      setError(err.message || 'Failed to save diesel record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Save className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-green-800 mb-2">Success!</h3>
          <p className="text-green-700 mb-4">
            Fuel record saved successfully
          </p>
          <div className="text-sm text-green-600 space-y-1">
            <p><strong>Tank:</strong> {formData.tankName}</p>
            <p><strong>Machine:</strong> {formData.machineName}</p>
            <p><strong>Amount:</strong> {formData.litros}L</p>
            <p><strong>Operator:</strong> {formData.operador}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Fuel className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Fuel Loading</h2>
          {tank && (
            <div className="mt-2 text-sm text-gray-600">
              <p className="font-medium">{tank.name}</p>
              <p>{tank.capacity}L - {tank.location}</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Machine Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Wrench className="w-4 h-4 inline mr-1" />
              Select Machine *
            </label>
            <select
              name="maquinaId"
              value={formData.maquinaId}
              onChange={handleMachineSelect}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Choose a machine...</option>
              {machines.length === 0 ? (
                <option value="" disabled>No machines available</option>
              ) : (
                machines.map((machine) => (
                  <option key={machine._id} value={machine._id}>
                    {machine.name || machine.model || machine.machineId || 'Unnamed Machine'} ({machine.machineId || machine.customId || machine._id})
                  </option>
                ))
              )}
            </select>
            {machines.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                No machines available. {publicMode ? 'Contact your administrator.' : 'Create machines first in the Machine Registry.'}
              </p>
            )}
          </div>

          {/* Fuel Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Fuel className="w-4 h-4 inline mr-1" />
              Fuel Amount (Liters) *
            </label>
            <input
              type="number"
              name="litros"
              value={formData.litros}
              onChange={handleInputChange}
              min="0.1"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter liters"
              required
            />
          </div>

          {/* Operator */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Operator Name *
            </label>
            <input
              type="text"
              name="operador"
              value={formData.operador}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter operator name"
              required
            />
          </div>

          {/* Work/Job Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageCircle className="w-4 h-4 inline mr-1" />
              Work/Job Description
            </label>
            <input
              type="text"
              name="trabajo"
              value={formData.trabajo}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Harvesting, Transport, etc."
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date
            </label>
            <input
              type="date"
              name="fecha"
              value={formData.fecha}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Observations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageCircle className="w-4 h-4 inline mr-1" />
              Observations
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Additional notes..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Fuel Record
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DieselForm;
