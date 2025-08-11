'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Edit, Trash2, Users, Building, CheckCircle, AlertCircle } from 'lucide-react';
import PreStartTemplateModal from './PreStartTemplateModal';
import Notification from './Notification';
import '@/styles/tables.css';

const OrganizationPrestartTemplates = () => {
  const { data: session } = useSession();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // Check if user is admin or regular user (both can manage templates now)
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';
  const canManageTemplates = session?.user ? true : false; // Any authenticated user can manage templates

  useEffect(() => {
    if (canManageTemplates) {
      fetchTemplates();
    }
  }, [canManageTemplates]);

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
      
      // Agregar información de organización y usuario al template
      const templateWithCreatorInfo = {
        ...template,
        organizationName: session?.user?.organization, // Agregar nombre de organización
        organizationId: session?.user?.organizationId, // Mantener ID si existe
        createdByAdmin: isAdmin, // Marcar si fue creado por admin
        createdByUser: session?.user?.name || session?.user?.email, // Nombre del usuario que crea
        createdByUserId: session?.user?.id // ID del usuario que crea
      };
      
      const url = isEditing 
        ? `/api/prestart/templates/${template._id}` 
        : '/api/prestart/templates';
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateWithCreatorInfo)
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
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) return;
    
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

  const getTemplateTypeInfo = (template) => {
    if (template.isGlobal) {
      return {
        label: 'Global Template',
        icon: <CheckCircle className="w-4 h-4" />,
        color: 'bg-green-100 text-green-800'
      };
    } else if (template.createdByAdmin) {
      return {
        label: 'Organization Template',
        icon: <Building className="w-4 h-4" />,
        color: 'bg-blue-100 text-blue-800'
      };
    } else {
      return {
        label: 'User Template',
        icon: <Users className="w-4 h-4" />,
        color: 'bg-gray-100 text-gray-800'
      };
    }
  };

  // Check if user can edit/delete a specific template
  const canEditTemplate = (template) => {
    if (!session?.user) return false;
    
    const userId = session.user.id;
    const userRole = session.user.role;
    const userOrganizationId = session.user.organizationId;
    
    // User can edit if:
    // 1. User owns the template
    // 2. User is SUPER_ADMIN (can edit any)
    // 3. User is ADMIN and template belongs to their organization
    return (
      template.userId === userId ||
      template.createdByUserId === userId ||
      userRole === 'SUPER_ADMIN' ||
      (userRole === 'ADMIN' && template.organizationId === userOrganizationId)
    );
  };

  if (!canManageTemplates) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-gray-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>Please log in to manage prestart templates</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="space-y-6">
        {notification.show && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification({ ...notification, show: false })}
          />
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Prestart Templates</h2>
            <p className="text-gray-600 mt-1">
              Create and manage prestart check templates. {isAdmin ? 'As an administrator, you can view and edit all organization templates.' : 'You can create your own templates and view organization templates.'}
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedTemplate(null);
              setShowModal(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </button>
        </div>

      {/* Templates List */}
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3">Loading templates...</span>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-500 mb-4">
            Create your first prestart template to standardize checks
          </p>
          <button
            onClick={() => {
              setSelectedTemplate(null);
              setShowModal(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th className="table-cell text-left">Template</th>
                <th className="table-cell text-left">Type</th>
                <th className="table-cell text-left">Check Items</th>
                <th className="table-cell text-left">Created By</th>
                <th className="table-cell text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map(template => {
                const typeInfo = getTemplateTypeInfo(template);
                const canEdit = canEditTemplate(template);
                return (
                  <tr key={template._id} className="table-row">
                    <td className="table-cell">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {template.name}
                        </div>
                        {template.description && (
                          <div className="text-sm text-gray-500">
                            {template.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                        {typeInfo.icon}
                        <span className="ml-1">{typeInfo.label}</span>
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center">
                        <span className="font-medium">{template.checkItems?.length || 0}</span>
                        <span className="text-gray-500 ml-2">
                          ({template.checkItems?.filter(item => item.required).length || 0} required)
                        </span>
                      </div>
                    </td>
                    <td className="table-cell">
                      {template.createdBy ? (
                        <div>
                          <div className="font-medium">{template.createdBy.name}</div>
                          <div className="text-gray-500 capitalize">
                            {template.createdBy.role === 'ADMIN' || template.createdBy.role === 'SUPER_ADMIN' 
                              ? 'Administrator' 
                              : 'User'}
                          </div>
                        </div>
                      ) : template.createdByUser ? (
                        <div>
                          <div className="font-medium">{template.createdByUser}</div>
                          <div className="text-gray-500 capitalize">
                            {template.createdByAdmin ? 'Administrator' : 'User'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">System</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="action-buttons">
                        {canEdit ? (
                          <>
                            <button
                              onClick={() => {
                                setSelectedTemplate(template);
                                setShowModal(true);
                              }}
                              className="action-button edit-button text-blue-600 hover:text-blue-900 p-2"
                              title="Edit template"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(template._id)}
                              className="action-button delete-button text-red-600 hover:text-red-900 p-2"
                              title="Delete template"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <span className="text-gray-400 text-sm">View only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <PreStartTemplateModal
          template={selectedTemplate}
          onClose={() => setShowModal(false)}
          onSave={handleSaveTemplate}
        />
      )}
      </div>
    </div>
  );
};

export default OrganizationPrestartTemplates;
