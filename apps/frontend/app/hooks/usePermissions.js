'use client';

import { useSession } from 'next-auth/react';
import { PERMISSIONS, ROLE_PERMISSIONS } from '@/config/roles';

/**
 * Hook para verificar permisos de usuario
 */
export function usePermissions() {
  const { data: session } = useSession();
  
  /**
   * Verifica si el usuario tiene un permiso específico
   * @param {string} permission - El permiso a verificar
   * @returns {boolean} - True si el usuario tiene el permiso
   */
  const can = (permission) => {
    // Si no hay sesión, no tiene permisos
    if (!session || !session.user) return false;
    
    // SUPER_ADMIN tiene todos los permisos
    if (session.user.role === 'SUPER_ADMIN') return true;
    
    // Verificar si el rol del usuario tiene el permiso específico
    const userRole = session.user.role;
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    
    return rolePermissions.includes(permission);
  };
  
  /**
   * Verifica si el usuario tiene alguno de los permisos especificados
   * @param {string[]} permissions - Lista de permisos a verificar
   * @returns {boolean} - True si el usuario tiene al menos uno de los permisos
   */
  const canAny = (permissions) => {
    return permissions.some(permission => can(permission));
  };
  
  /**
   * Verifica si el usuario tiene todos los permisos especificados
   * @param {string[]} permissions - Lista de permisos a verificar
   * @returns {boolean} - True si el usuario tiene todos los permisos
   */
  const canAll = (permissions) => {
    return permissions.every(permission => can(permission));
  };
  
  return { can, canAny, canAll };
}
