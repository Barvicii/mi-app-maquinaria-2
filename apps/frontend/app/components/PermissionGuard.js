'use client';

import { useSession } from 'next-auth/react';
import { hasPermission, hasRole } from '@/config/roles';
import { Fragment } from 'react';

/**
 * Componente que renderiza contenido solo si el usuario tiene el permiso necesario
 * @param {Object} props - Propiedades del componente
 * @param {String|Array} props.permission - Permiso o array de permisos requeridos (cualquiera)
 * @param {Boolean} props.fallback - Si es true, renderiza el contenido de fallback si no tiene permisos
 * @param {ReactNode} props.children - Contenido a renderizar si tiene permisos
 * @param {ReactNode} props.fallbackContent - Contenido a renderizar si no tiene permisos
 */
export function PermissionGuard({ 
  permission, 
  fallback = false, 
  children, 
  fallbackContent = null 
}) {
  const { data: session, status } = useSession();
  
  // Mientras carga la sesión, no mostrar nada
  if (status === 'loading') {
    return null;
  }
  
  // Si no hay sesión, no mostrar nada
  if (!session || !session.user) {
    return fallback ? fallbackContent : null;
  }
  
  // Si es super admin, siempre permitir
  if (session.user.role === 'SUPER_ADMIN') {
    return <Fragment>{children}</Fragment>;
  }
  
  // Verificar permisos
  let hasAccess = false;
  
  if (Array.isArray(permission)) {
    hasAccess = permission.some(p => hasPermission(session.user, p));
  } else {
    hasAccess = hasPermission(session.user, permission);
  }
  
  if (hasAccess) {
    return <Fragment>{children}</Fragment>;
  }
  
  return fallback ? fallbackContent : null;
}

/**
 * Componente que renderiza contenido solo si el usuario tiene el rol necesario
 * @param {Object} props - Propiedades del componente
 * @param {String|Array} props.role - Rol o array de roles requeridos (cualquiera)
 * @param {Boolean} props.fallback - Si es true, renderiza el contenido de fallback si no tiene el rol
 * @param {ReactNode} props.children - Contenido a renderizar si tiene el rol
 * @param {ReactNode} props.fallbackContent - Contenido a renderizar si no tiene el rol
 */
export function RoleGuard({ 
  role, 
  fallback = false, 
  children, 
  fallbackContent = null 
}) {
  const { data: session, status } = useSession();
  
  // Mientras carga la sesión, no mostrar nada
  if (status === 'loading') {
    return null;
  }
  
  // Si no hay sesión, no mostrar nada
  if (!session || !session.user) {
    return fallback ? fallbackContent : null;
  }
  
  // Verificar roles
  let hasAccess = false;
  
  if (Array.isArray(role)) {
    hasAccess = role.some(r => hasRole(session.user, r));
  } else {
    hasAccess = hasRole(session.user, role);
  }
  
  if (hasAccess) {
    return <Fragment>{children}</Fragment>;
  }
  
  return fallback ? fallbackContent : null;
}
