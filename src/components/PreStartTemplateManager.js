'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Filter, AlertTriangle, RefreshCw } from 'lucide-react';
import Notification from './Notification';
import '../styles/tables.css';

const PreStartTemplateManager = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    checkItems: [
      { id: Date.now().toString(), name: 'item1', label: 'Check Item 1', required: true }
    ]
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    name: ''
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  // Fetch templates
  const fetchTemplates = async (showNotification = false) => {
    try {
      setLoading(true);
      setIsRefreshing(true);
      
      // Build URL with filters
      let url = '/api/prestart/templates';
      const queryParams = [];
      
      if (filters.name) queryParams.push(`name=${encodeURIComponent(filters.name)}`);
      
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      const data = await response.json();
      setTemplates(data);
      
      if (showNotification) {
        setNotification({
          show: true,
          message: 'Templates refreshed successfully',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      setError(error.message);
      
      if (showNotification) {
        setNotification({
          show: true,
          message: `Error: ${error.message}`,
          type: 'error'
        });
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const applyFilters = () => {
    fetchTemplates(true);
  };

  // Add new check item to form
  const addCheckItem = () => {
    setFormData(prev => ({
      ...prev,
      checkItems: [
        ...prev.checkItems,
        { 
          id: Date.now().toString(), 
          name: `item${prev.checkItems.length + 1}`,
          label: `Check Item ${prev.checkItems.length + 1}`,
          required: false
        }
      ]
    }));
  };

  // Remove check item from form
  const removeCheckItem = (itemId) => {
    setFormData(prev => ({
      ...prev,
      checkItems: prev.checkItems.filter(item => item.id !== itemId)
    }));
  };

  // Handle form input changes
  const handleChange = (e, itemId = null) => {
    const { name, value, type, checked } = e.target;
    
    if (itemId !== null) {
      // Update a specific check item
      setFormData(prev => ({
        ...prev,
        checkItems: prev.checkItems.map(item => 
          item.id === itemId 
            ? { ...item, [name]: type === 'checkbox' ? checked : value }
            : item
        )
      }));
    } else {
      // Update template name
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Edit template
  const editTemplate = (template) => {
    setEditingTemplate(template._id);
    setFormData({
      name: template.name,
      checkItems: template.checkItems.map(item => ({
        ...item,
        id: item.id || Date.now().toString() + Math.random() // Ensure unique IDs for form
      }))
    });
    setShowForm(true);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const dataToSubmit = {
        name: formData.name,
        checkItems: formData.checkItems.map(({ id, ...rest }) => ({
          id: id, // Keep the id for proper rendering
          ...rest
        }))
      };
      
      const url = editingTemplate 
        ? `/api/prestart/templates/${editingTemplate}`
        : '/api/prestart/templates';
        
      const method = editingTemplate ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSubmit)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}`);
      }
      
      // Refresh templates list
      await fetchTemplates();
      
      // Reset form
      setShowForm(false);
      setEditingTemplate(null);
      setFormData({
        name: '',
        checkItems: [
          { id: Date.now().toString(), name: 'item1', label: 'Check Item 1', required: true }
        ]
      });
      
      // Show success notification
      setNotification({
        show: true,
        message: `Template ${editingTemplate ? 'updated' : 'created'} successfully`,
        type: 'success'
      });
      
    } catch (error) {
      console.error('Error saving template:', error);
      setNotification({
        show: true,
        message: `Error: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete template
  const deleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/prestart/templates/${templateId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}`);
      }
      
      // Update templates list
      setTemplates(prev => prev.filter(t => t._id !== templateId));
      
      // Show success notification
      setNotification({
        show: true,
        message: 'Template deleted successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      setNotification({
        show: true,
        message: `Error: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ ...notification, show: false })}
        />
      )}

      {/* Header with filters and actions */}
      <div className="machinary-header">
        <div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
          >
            <Filter className="mr-2" size={18} />
            <span>Filtros</span>
            {showFilters ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Showing {templates.length} templates
          </div>
          
          {/* Add New Template Button */}
          <button
            onClick={() => {
              setEditingTemplate(null);
              setFormData({
                name: '',
                checkItems: [
                  { id: Date.now().toString(), name: 'item1', label: 'Check Item 1', required: true }
                ]
              });
              setShowForm(true);
            }}
            className="primary-button"
          >
            <Plus className="button-icon" size={20} />
            <span>New Template</span>
          </button>
          
          
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="mb-4 p-4 bg-gray-100 rounded-lg transition-all duration-300 ease-in-out">
          <h3 className="font-semibold mb-2">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Template Name</label>
              <input
                type="text"
                name="name"
                value={filters.name}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded"
                placeholder="Filter by name"
              />
            </div>
          </div>
          <div className="mt-2">
            <button 
              onClick={applyFilters}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Aplicar Filtros
            </button>
            <button 
              onClick={() => {
                setFilters({ name: '' });
                fetchTemplates(true);
              }}
              className="ml-2 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message mb-4">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span>Error: {error}</span>
        </div>
      )}
      
      {loading && !showForm ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading templates...</div>
        </div>
      ) : templates.length === 0 ? (
        <div className="empty-message">No templates available. Create your first template!</div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th className="table-cell text-left">Name</th>
                <th className="table-cell text-left">Items</th>
                <th className="table-cell text-left">Required Items</th>
                <th className="table-cell text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map(template => (
                <tr key={template._id} className="table-row">
                  <td className="table-cell font-medium">{template.name}</td>
                  <td className="table-cell">{template.checkItems.length}</td>
                  <td className="table-cell">
                    {template.checkItems.filter(item => item.required).length}
                  </td>
                  <td className="table-cell">
                    <div className="table-actions">
                      <button 
                        onClick={() => editTemplate(template)}
                        className="action-button edit-button text-green-600 hover:text-green-800 p-2"
                        title="Edit template"
                      >
                        <Edit className="button-icon" size={20} />
                      </button>
                      <button 
                        onClick={() => deleteTemplate(template._id)}
                        className="action-button delete-button text-red-600 hover:text-red-800 p-2"
                        title="Delete template"
                      >
                        <Trash2 className="button-icon" size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Template Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </h2>
              <button 
                onClick={() => setShowForm(false)}
                className="modal-close-button"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="form-label">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input w-full"
                    required
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="form-label">
                      Check Items
                    </label>
                    <button
                      type="button"
                      onClick={addCheckItem}
                      className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Item
                    </button>
                  </div>
                  
                  <div className="space-y-3 border rounded-md p-3 bg-gray-50">
                    {formData.checkItems.map((item, index) => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 items-start pb-3 border-b">
                        <div className="col-span-3">
                          <label className="block text-xs text-gray-500 mb-1">Item ID</label>
                          <input
                            type="text"
                            name="name"
                            value={item.name}
                            onChange={(e) => handleChange(e, item.id)}
                            className="w-full p-2 border rounded-md text-sm"
                            required
                          />
                        </div>
                        <div className="col-span-7">
                          <label className="block text-xs text-gray-500 mb-1">Label</label>
                          <input
                            type="text"
                            name="label"
                            value={item.label}
                            onChange={(e) => handleChange(e, item.id)}
                            className="w-full p-2 border rounded-md text-sm"
                            required
                          />
                        </div>
                        <div className="col-span-1 flex items-center mt-6">
                          <input
                            type="checkbox"
                            name="required"
                            checked={item.required}
                            onChange={(e) => handleChange(e, item.id)}
                            className="w-4 h-4"
                          />
                          <span className="text-xs ml-1">Req</span>
                        </div>
                        <div className="col-span-1 mt-6">
                          <button
                            type="button"
                            onClick={() => removeCheckItem(item.id)}
                            disabled={formData.checkItems.length < 2}
                            className={`text-red-500 hover:text-red-700 ${
                              formData.checkItems.length < 2 ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>
            
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="modal-button modal-button-cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="modal-button modal-button-submit"
              >
                {loading ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreStartTemplateManager;