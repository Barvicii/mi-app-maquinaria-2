// src/components/TabPreStartTemplates.js
'use client';
import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import PreStartTemplateModal from './PreStartTemplateModal';

const TabPreStartTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // Fetch templates
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/prestart/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error:', error);
      setNotification({
        show: true, 
        message: error.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async (template) => {
    try {
      const isEditing = !!template._id;
      const url = isEditing 
        ? `/api/prestart/templates/${template._id}` 
        : '/api/prestart/templates';
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });

      if (!response.ok) throw new Error('Failed to save template');
      
      setNotification({
        show: true,
        message: `Template ${isEditing ? 'updated' : 'created'} successfully`,
        type: 'success'
      });
      
      fetchTemplates();
      setShowModal(false);
    } catch (error) {
      console.error('Error:', error);
      setNotification({
        show: true, 
        message: error.message,
        type: 'error'
      });
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      const response = await fetch(`/api/prestart/templates/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete template');
      
      setNotification({
        show: true,
        message: 'Template deleted successfully',
        type: 'success'
      });
      
      fetchTemplates();
    } catch (error) {
      console.error('Error:', error);
      setNotification({
        show: true, 
        message: error.message,
        type: 'error'
      });
    }
  };

  return (
    <div className="main-content">
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
          <button onClick={() => setNotification({...notification, show: false})}>×</button>
        </div>
      )}
      
      <div className="mb-4 flex justify-between items-center">
        <h2 className="section-title">PreStart Templates</h2>
        <button 
          onClick={() => {
            setSelectedTemplate(null);
            setShowModal(true);
          }}
          className="primary-button"
        >
          <PlusCircle className="button-icon" size={20} />
          <span>New Template</span>
        </button>
      </div>
      
      {loading ? (
        <div className="loading">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="empty-message">No templates found. Create your first template.</div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr className="table-header">
                <th className="table-header-cell">Name</th>
                <th className="table-header-cell">Description</th>
                <th className="table-header-cell">Items</th>
                <th className="table-header-cell">Default</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map(template => (
                <tr key={template._id} className="table-row">
                  <td className="table-cell">{template.name}</td>
                  <td className="table-cell">{template.description}</td>
                  <td className="table-cell">{template.checkItems?.length || 0} items</td>
                  <td className="table-cell">{template.isDefault ? 'Yes' : 'No'}</td>
                  <td className="table-cell">
                    <div className="table-actions">
                      <button
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowModal(true);
                        }}
                        className="action-button edit-button"
                        title="Edit template"
                      >
                        <Edit className="button-icon" size={20} />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template._id)}
                        className="action-button delete-button"
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
      
      {showModal && (
        <PreStartTemplateModal
          template={selectedTemplate}
          onClose={() => setShowModal(false)}
          onSave={handleSaveTemplate}
        />
      )}
    </div>
  );
};

export default TabPreStartTemplates;