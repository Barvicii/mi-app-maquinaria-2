// src/components/TabPrestartTemplates.js
'use client';

import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit2, Trash2, FileText, AlertTriangle } from 'lucide-react';
import PreStartTemplateModal from './PreStartTemplateModal';

const TabPrestartTemplates = ({ suppressNotifications = false }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  
  useEffect(() => {
    fetchTemplates();
  }, []);
  
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/prestart/templates');
      
      if (!response.ok) {
        throw new Error('Error loading templates');
      }
      
      const data = await response.json();
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setError('Could not load templates. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateTemplate = () => {
    setCurrentTemplate(null);
    setShowModal(true);
  };
  
  const handleEditTemplate = (template) => {
    setCurrentTemplate(template);
    setShowModal(true);
  };
  
  const handleDeleteTemplate = async (id) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      const response = await fetch(`/api/prestart/templates/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Error deleting template');
      }
      
      // Update the list
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      if (!suppressNotifications) {
        alert('Could not delete the template. Please try again.');
      }
    }
  };

  const handleSaveTemplate = async (templateData) => {
    try {
      const isEditing = !!currentTemplate;
      const url = isEditing ? 
        `/api/prestart/templates/${currentTemplate._id}` : 
        '/api/prestart/templates';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templateData)
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: Could not save template`);
      }
      
      // Close the modal and refresh templates
      setShowModal(false);
      fetchTemplates();
      
    } catch (error) {
      console.error('Error saving template:', error);
      if (!suppressNotifications) {
        alert(`Error: ${error.message}`);
      }
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-gray-600">Loading templates...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Pre-Start Templates</h2>
        <button 
          onClick={handleCreateTemplate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <PlusCircle className="mr-2" size={16} />
          Create New Template
        </button>
      </div>
      
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {templates.length === 0 ? (
        <div className="text-center py-10">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No templates</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start by creating a new template for your pre-start checks.
          </p>
          <div className="mt-6">
            <button
              onClick={handleCreateTemplate}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
              Create New Template
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required Items</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {templates.map((template) => (
                <tr key={template._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{template.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{template.checkItems?.length || 0} items</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {template.checkItems?.filter(item => item.required).length || 0} required
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => handleEditTemplate(template)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteTemplate(template._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Template Modal */}
      {showModal && (
        <PreStartTemplateModal
          template={currentTemplate}
          onClose={() => setShowModal(false)}
          onSave={handleSaveTemplate}
        />
      )}
    </div>
  );
};

export default TabPrestartTemplates;