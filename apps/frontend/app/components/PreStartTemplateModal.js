// src/components/PreStartTemplateModal.js
'use client';
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash } from 'lucide-react';

const PreStartTemplateModal = ({ template, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isDefault: false,
    checkItems: [
      { id: Date.now().toString(), name: 'item1', label: 'Check Item 1', required: true }
    ]
  });
  
  const [newItem, setNewItem] = useState({
    name: '',
    label: '',
    required: false
  });

  // Initialize form with template data if editing
  useEffect(() => {
    if (template) {
      setFormData({
        ...template,
        checkItems: template.checkItems.map(item => ({
          ...item,
          id: item.id || Date.now().toString() + Math.random()
        }))
      });
    }
  }, [template]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const addCheckItem = () => {
    if (!newItem.name || !newItem.label) return;
    
    setFormData({
      ...formData,
      checkItems: [
        ...formData.checkItems,
        { ...newItem, id: Date.now().toString() }
      ]
    });
    
    setNewItem({
      name: '',
      label: '',
      required: false
    });
  };
  
  const removeCheckItem = (itemId) => {
    setFormData({
      ...formData,
      checkItems: formData.checkItems.filter(item => item.id !== itemId)
    });
  };
  
  const handleItemChange = (e, id) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      checkItems: formData.checkItems.map(item => 
        item.id === id ? { ...item, [name]: type === 'checkbox' ? checked : value } : item
      )
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Prepare data for saving - remove unnecessary IDs for API
    const dataToSubmit = {
      ...formData,
      checkItems: formData.checkItems.map(({ id, ...rest }) => rest)
    };
    
    onSave(dataToSubmit);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {template ? 'Edit Template' : 'Create Template'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              rows={2}
            />
          </div>
          
          <div className="form-group">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="isDefault"
                checked={formData.isDefault || false}
                onChange={handleChange}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">Set as default template</span>
            </label>
          </div>
          
          <div className="form-group">
            <h3 className="text-lg font-medium mb-2">Check Items</h3>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-md">
              <div className="grid grid-cols-12 gap-2 mb-2">
                <div className="col-span-4"><label className="text-sm font-medium">Field Name</label></div>
                <div className="col-span-6"><label className="text-sm font-medium">Display Label</label></div>
                <div className="col-span-1"><label className="text-sm font-medium">Req.</label></div>
                <div className="col-span-1"></div>
              </div>
              
              <div className="grid grid-cols-12 gap-2 mb-3 items-center">
                <div className="col-span-4">
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    placeholder="e.g. brakes"
                  />
                </div>
                <div className="col-span-6">
                  <input
                    type="text"
                    value={newItem.label}
                    onChange={(e) => setNewItem({...newItem, label: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    placeholder="e.g. Brake System"
                  />
                </div>
                <div className="col-span-1 text-center">
                  <input
                    type="checkbox"
                    checked={newItem.required}
                    onChange={(e) => setNewItem({...newItem, required: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600"
                  />
                </div>
                <div className="col-span-1">
                  <button
                    type="button"
                    onClick={addCheckItem}
                    className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
              
              {formData.checkItems.length === 0 ? (
                <div className="text-center text-gray-500 my-4">
                  No check items added yet. Add your first item above.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {formData.checkItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded">
                      <div className="col-span-4">
                        <input
                          type="text"
                          name="name"
                          value={item.name}
                          onChange={(e) => handleItemChange(e, item.id)}
                          className="w-full p-2 border rounded-md"
                        />
                      </div>
                      <div className="col-span-6">
                        <input
                          type="text"
                          name="label"
                          value={item.label}
                          onChange={(e) => handleItemChange(e, item.id)}
                          className="w-full p-2 border rounded-md"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <input
                          type="checkbox"
                          name="required"
                          checked={item.required}
                          onChange={(e) => handleItemChange(e, item.id)}
                          className="rounded border-gray-300 text-blue-600"
                        />
                      </div>
                      <div className="col-span-1">
                        <button
                          type="button"
                          onClick={() => removeCheckItem(item.id)}
                          className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                          disabled={formData.checkItems.length < 2}
                        >
                          <Trash size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {template ? 'Update Template' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PreStartTemplateModal;