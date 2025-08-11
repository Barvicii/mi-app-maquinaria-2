'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { 
  User, Save, X, AlertTriangle,
  Shield, Check, Mail, Key 
} from 'lucide-react';

export default function EditUserPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    customRole: '',
    active: true
  });
  
  // Verificar autenticación y permisos
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
        router.push('/dashboard');
        return;
      }
      
      fetchUser();
      fetchRoles();
    }
  }, [status, session, router, id]);
  
  // Obtener datos del usuario
  const fetchUser = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/users/${id}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar usuario');
      }
      
      const data = await response.json();
      setUser(data.user);
      
      // Inicializar formulario con datos del usuario
      setFormData({
        name: data.user.name || '',
        email: data.user.email || '',
        role: data.user.role || '',
        customRole: data.user.customRole || '',
        active: data.user.active !== false
      });
      
    } catch (error) {
      console.error('Error fetching user:', error);
      setError('No se pudo cargar la información del usuario. Por favor, inténtelo de nuevo.');
    } finally {
      setLoading(false);
    }
  };
  
  // Obtener roles disponibles
  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/organization/roles');
      
      if (!response.ok) {
        throw new Error('Error al cargar roles');
      }
      
      const data = await response.json();
      setRoles(data.roles);
      
    } catch (error) {
      console.error('Error fetching roles:', error);
      setError('No se pudieron cargar los roles disponibles.');
    }
  };
  
  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Manejar cambio de rol
  const handleRoleChange = (e) => {
    const { value } = e.target;
    
    // Si selecciona un rol del sistema, quitar el rol personalizado
    if (value === 'ADMIN' || value === 'USER' || value === 'MANAGER' || 
        value === 'TECHNICIAN' || value === 'OPERATOR' || value === 'VIEWER') {
      setFormData(prev => ({
        ...prev,
        role: value,
        customRole: ''
      }));
    } else {
      // Si selecciona un rol personalizado
      setFormData(prev => ({
        ...prev,
        role: 'CUSTOM',
        customRole: value
      }));
    }
  };
  
  // Guardar cambios del usuario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      
      // Preparar datos para la API
      const userData = {
        name: formData.name,
        role: formData.role,
        active: formData.active
      };
      
      // Si es un rol personalizado, incluir el ID
      if (formData.role === 'CUSTOM' && formData.customRole) {
        userData.customRole = formData.customRole;
      }
      
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar usuario');
      }
      
      setSuccess(true);
      
      // Redirigir a la lista de usuarios después de 2 segundos
      setTimeout(() => {
        router.push('/users');
      }, 2000);
      
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error.message || 'Error al actualizar usuario. Por favor, inténtelo de nuevo.');
    } finally {
      setSaving(false);
    }
  };
  
  // Mostrar spinner mientras carga
  if (loading && !user) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-3 text-gray-600">Loading user information...</p>
        </div>
      </AdminLayout>
    );
  }
  
  // Organizar los roles para el selector
  const systemRoles = [
    { id: 'ADMIN', name: 'Administrador', isSystem: true },
    { id: 'MANAGER', name: 'Gerente', isSystem: true },
    { id: 'USER', name: 'Usuario', isSystem: true },
    { id: 'TECHNICIAN', name: 'Técnico', isSystem: true },
    { id: 'OPERATOR', name: 'Operador', isSystem: true },
    { id: 'VIEWER', name: 'Visualizador', isSystem: true }
  ];
  
  // Filtrar roles personalizados
  const customRoles = roles.filter(role => !role.isSystem);
  
  // Si la operación fue exitosa, mostrar mensaje de éxito
  if (success) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
            <div className="flex">
              <Check className="h-6 w-6 text-green-400" />
              <div className="ml-3">
                <h3 className="text-green-800 font-medium">Actualización exitosa</h3>
                <p className="text-green-700 mt-1">
                  La información del usuario ha sido actualizada correctamente.
                </p>
                <p className="text-green-700">
                  Redirigiendo a la lista de usuarios...
                </p>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Editar Usuario
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Actualice la información y permisos del usuario
            </p>
          </div>
          
          <Link
            href="/users"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Volver a usuarios
          </Link>
        </div>
        
        {/* Mensaje de error */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        {/* Formulario de edición */}
        <form onSubmit={handleSubmit} className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 flex items-center">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-lg font-medium text-gray-900">
              {user?.name || 'Usuario'} ({user?.email})
            </h2>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Nombre */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nombre completo
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Nombre del usuario"
                />
              </div>
              
              {/* Email (solo lectura) */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Correo electrónico
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <div className="relative flex items-stretch flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      disabled
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  El correo electrónico no se puede modificar
                </p>
              </div>
            </div>
            
            {/* Selección de Rol */}
            <div className="mt-6">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Rol del usuario
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="role"
                  name="role"
                  value={
                    formData.role === 'CUSTOM' 
                      ? formData.customRole 
                      : formData.role
                  }
                  onChange={handleRoleChange}
                  className="mt-1 block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="" disabled>Seleccione un rol</option>
                  
                  {/* Roles del sistema */}
                  <optgroup label="Roles del sistema">
                    {systemRoles.map(role => (
                      <option 
                        key={role.id} 
                        value={role.id}
                        disabled={
                          // No permitir cambiar rol ADMIN si es el único admin
                          (user?.role === 'ADMIN' && role.id !== 'ADMIN' && user?.isOnlyAdmin) ||
                          // No permitir asignar rol ADMIN a otra persona si el usuario actual no es ADMIN
                          (user?.role !== 'ADMIN' && role.id === 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN')
                        }
                      >
                        {role.name}
                      </option>
                    ))}
                  </optgroup>
                  
                  {/* Roles personalizados */}
                  {customRoles.length > 0 && (
                    <optgroup label="Roles personalizados">
                      {customRoles.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
              
              {formData.role === 'ADMIN' && (
                <p className="mt-2 text-sm text-blue-600">
                  Este usuario tendrá acceso completo a la administración de la organización.
                </p>
              )}
              
              {user?.isOnlyAdmin && user?.role === 'ADMIN' && (
                <p className="mt-2 text-sm text-yellow-600">
                  No se puede cambiar el rol porque es el único administrador de la organización.
                </p>
              )}
            </div>
            
            {/* Estado del usuario */}
            <div className="mt-6">
              <div className="flex items-center">
                <input
                  id="active"
                  name="active"
                  type="checkbox"
                  checked={formData.active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={user?.isOnlyAdmin && user?.role === 'ADMIN'}
                />
                <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                  Usuario activo
                </label>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Los usuarios inactivos no podrán iniciar sesión en el sistema.
              </p>
              {user?.isOnlyAdmin && user?.role === 'ADMIN' && formData.active && (
                <p className="mt-1 text-sm text-yellow-600">
                  No se puede desactivar al único administrador de la organización.
                </p>
              )}
            </div>
            
            {/* Acciones adicionales */}
            <div className="mt-8 pt-5 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Otras acciones</h3>
              
              <div className="space-y-4">
                {/* Restablecer contraseña */}
                <Link
                  href={`/users/${id}/reset-password`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Key className="mr-2 h-4 w-4 text-gray-500" />
                  Restablecer contraseña
                </Link>
                
                {/* Si hay más acciones, añadirlas aquí */}
              </div>
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 border-t border-gray-200 flex justify-end">
            <Link
              href="/users"
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 mr-3"
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Link>
            
            <button
              type="submit"
              disabled={saving || (user?.isOnlyAdmin && user?.role === 'ADMIN' && (formData.role !== 'ADMIN' || !formData.active))}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                saving || (user?.isOnlyAdmin && user?.role === 'ADMIN' && (formData.role !== 'ADMIN' || !formData.active))
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
