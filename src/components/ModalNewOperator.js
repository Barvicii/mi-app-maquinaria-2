// components/ModalNewOperator.js
import React, { useState, useEffect } from 'react';

const ModalNewOperator = ({ show, onClose, onSubmit, currentOperator, initialData }) => {
  const [formData, setFormData] = useState(initialData);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
        <h3 className="text-xl font-bold text-black mb-4">
          {currentOperator ? 'Edit Operator/Technician' : 'New Operator/Technician'}
        </h3>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                First Name
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="w-full p-2 border rounded-md text-black"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Last Name
              </label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                className="w-full p-2 border rounded-md text-black"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Type
              </label>
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                className="w-full p-2 border rounded-md text-black"
                required
              >
                <option value="">Select type...</option>
                <option value="operator">Operator</option>
                <option value="technician">Technician</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="w-full p-2 border rounded-md text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-2 border rounded-md text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="fechaIngreso"
                value={formData.fechaIngreso}
                onChange={handleChange}
                className="w-full p-2 border rounded-md text-black"
                required
              />
            </div>

            {formData.tipo === 'operator' && (
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  License Number
                </label>
                <input
                  type="text"
                  name="licencia"
                  value={formData.licencia}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md text-black"
                />
              </div>
            )}

            {formData.tipo === 'technician' && (
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Specialty
                </label>
                <input
                  type="text"
                  name="especialidad"
                  value={formData.especialidad}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md text-black"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              {currentOperator ? 'Save Changes' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalNewOperator;