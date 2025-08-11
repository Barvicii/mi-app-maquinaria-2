/**
 * Middleware de permisos simplificado
 * Solo dos roles: USER y SUPER_ADMIN
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/api/auth/[...nextauth]/route';

// Importar funciones específicas para evitar problemas circulares
import { hasPermission } from '@/lib/roles';

// Definir permisos localmente para evitar problemas de importación
const PERMISSIONS = {
  VIEW_DASHBOARD: 'dashboard:view',
  MACHINE_VIEW: 'machine:view',
  MACHINE_CREATE: 'machine:create',
  MACHINE_EDIT: 'machine:edit',
  SERVICE_VIEW: 'service:view',
  SERVICE_CREATE: 'service:create',
  PRESTART_VIEW: 'prestart:view',
  PRESTART_CREATE: 'prestart:create',
  REPORT_VIEW: 'report:view',
  REPORT_EXPORT: 'report:export',
  
  // Permisos de ADMIN
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_EDIT: 'user:edit',
  ORGANIZATION_MANAGE: 'organization:manage',
  
  // Permisos de SUPER_ADMIN
  ADMIN_ACCESS: 'admin:access',
  USER_MANAGEMENT: 'user:management',
  ACCESS_REQUESTS: 'access:requests',
  SYSTEM_SETTINGS: 'system:settings',
  ALL_ACCESS: 'all:access',
};

/**
 * Middleware de autorización para APIs
 * @param {string} permission - Permiso requerido
 * @returns {Function} Middleware que verifica el permiso
 */
export function withPermission(permission) {
  return function(handler) {
    return async function(request, context) {
      try {
        // Obtener sesión actual
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
          return NextResponse.json(
            { error: 'Unauthorized - No session' },
            { status: 401 }
          );
        }

        // SUPER_ADMIN tiene acceso a todo
        if (session.user.role === 'SUPER_ADMIN') {
          return handler(request, context);
        }

        // Verificar permiso específico
        if (!hasPermission(session.user, permission)) {
          return NextResponse.json(
            { error: 'Forbidden - Insufficient permissions' },
            { status: 403 }
          );
        }

        // Verificar si la organización está suspendida (excepto SUPER_ADMIN)
        if (session.user.organizationSuspended === true) {
          return NextResponse.json(
            { error: 'Organization is suspended. Contact support for assistance.' },
            { status: 403 }
          );
        }

        // Ejecutar el handler original
        return handler(request, context);
        
      } catch (error) {
        console.error('Permission middleware error:', error);
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
    };
  };
}

/**
 * Middleware simplificado para verificar solo autenticación
 */
export function withAuth(handler) {
  return async function(request, context) {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session || !session.user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      return handler(request, context);
      
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware para SUPER_ADMIN solamente
 */
export function withSuperAdmin(handler) {
  return async function(request, context) {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session || !session.user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      if (session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: 'Forbidden - Super Admin access required' },
          { status: 403 }
        );
      }

      return handler(request, context);
      
    } catch (error) {
      console.error('SuperAdmin middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Exportar PERMISSIONS para uso en otros archivos
export { PERMISSIONS };

