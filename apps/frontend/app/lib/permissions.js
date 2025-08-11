import { connectDB } from './mongodb';
import { ROLES, PERMISSIONS, hasPermission as baseHasPermission } from '@/config/roles';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
// Remover la importación directa de mongodb
// import { ObjectId } from 'mongodb';

/**
 * Verificar si un usuario tiene un permiso específico, considerando roles personalizados
 * @param {Object} user Usuario a verificar
 * @param {String} permission Permiso requerido
 * @returns {Promise<Boolean>} True si tiene permiso, false en caso contrario
 */
export async function hasPermission(user, permission) {
  if (!user || !user.id) return false;
  
  // Super Admin siempre tiene todos los permisos
  if (user.role === 'SUPER_ADMIN') return true;
  
  // Si el usuario tiene un rol personalizado
  if (user.customRole) {
    try {
      const db = await connectDB();
      
      // Verificar si el customRole es un string (ID) o un objeto
      const roleId = typeof user.customRole === 'string' 
                     ? user.customRole 
                     : user.customRole.toString();
      
      // Buscar el rol personalizado - Sin usar ObjectId
      const customRole = await db.collection('organizationRoles').findOne({
        _id: roleId, // Sin convertir a ObjectId
        organizationId: user.credentialId
      });
      
      // Si se encuentra el rol personalizado, verificar el permiso
      if (customRole && customRole.permissions) {
        return customRole.permissions.includes(permission);
      }
    } catch (error) {
      console.error('Error al verificar permisos personalizados:', error);
    }
  }
  
  // Si no tiene un rol personalizado o hubo un error, usar la verificación base
  return baseHasPermission(user, permission);
}

/**
 * Middleware de autorización para APIs
 * @param {String} permission Permiso requerido para acceder
 * @returns {Function} Middleware que verifica el permiso
 */
export function withPermission(permission) {
  return function(handler) {
    return async function(req, context) {
      const session = await getServerSession(authOptions);
      
      if (!session) {
        return NextResponse.json(
          { error: 'No autenticado' },
          { status: 401 }
        );
      }
      
      const hasAccess = await hasPermission(session.user, permission);
      
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'No tiene permisos suficientes' },
          { status: 403 }
        );
      }
      
      return handler(req, context);
    };
  };
}
