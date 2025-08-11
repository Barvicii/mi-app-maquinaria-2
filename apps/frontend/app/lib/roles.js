/**
 * Sistema de roles simplificado
 * Solo dos roles: USER (usuario estándar) y SUPER_ADMIN (administrador total)
 */

// Permisos disponibles en el sistema
export const PERMISSIONS = {
  // Permisos básicos para usuarios
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
  ALL_ACCESS: 'all:access', // Acceso total del sistema
};

// Definición de roles simplificada
export const ROLES = {
  // Usuario estándar: acceso completo a funcionalidades normales
  USER: {
    name: 'User',
    description: 'Standard user with full access to normal functionality',
    permissions: [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.MACHINE_VIEW,
      PERMISSIONS.MACHINE_CREATE,
      PERMISSIONS.MACHINE_EDIT,
      PERMISSIONS.SERVICE_VIEW,
      PERMISSIONS.SERVICE_CREATE,
      PERMISSIONS.PRESTART_VIEW,
      PERMISSIONS.PRESTART_CREATE,
      PERMISSIONS.REPORT_VIEW,
      PERMISSIONS.REPORT_EXPORT,
    ]
  },
  
  // Administrador de organización: puede gestionar usuarios y reportes de su organización
  ADMIN: {
    name: 'Admin',
    description: 'Organization administrator with user and report management',
    permissions: [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.MACHINE_VIEW,
      PERMISSIONS.MACHINE_CREATE,
      PERMISSIONS.MACHINE_EDIT,
      PERMISSIONS.SERVICE_VIEW,
      PERMISSIONS.SERVICE_CREATE,
      PERMISSIONS.PRESTART_VIEW,
      PERMISSIONS.PRESTART_CREATE,
      PERMISSIONS.REPORT_VIEW,
      PERMISSIONS.REPORT_EXPORT,
      PERMISSIONS.USER_VIEW,
      PERMISSIONS.USER_CREATE,
      PERMISSIONS.USER_EDIT,
      PERMISSIONS.ORGANIZATION_MANAGE,
    ]
  },
  
  // Super administrador: acceso total al sistema
  SUPER_ADMIN: {
    name: 'Super Admin',
    description: 'Full system administrator with all permissions',
    permissions: [
      PERMISSIONS.ALL_ACCESS, // Tiene acceso a todo
    ]
  }
};

/**
 * Verificar si un usuario tiene un permiso específico
 * @param {Object} user Usuario a verificar
 * @param {String} permission Permiso requerido
 * @returns {Boolean} True si tiene permiso, false en caso contrario
 */
export function hasPermission(user, permission) {
  if (!user || !user.role) return false;
  
  // Super Admin siempre tiene todos los permisos
  if (user.role === 'SUPER_ADMIN') return true;
  
  // Admin también tiene permisos amplios para su organización
  if (user.role === 'ADMIN') {
    const adminRole = ROLES['ADMIN'];
    return adminRole && adminRole.permissions.includes(permission);
  }
  
  // Obtener el rol del usuario
  const role = ROLES[user.role];
  if (!role) return false;
  
  // Si el rol tiene ALL_ACCESS, tiene todos los permisos
  if (role.permissions.includes(PERMISSIONS.ALL_ACCESS)) return true;
  
  // Verificar si el permiso está en la lista de permisos del rol
  return role.permissions.includes(permission);
}

/**
 * Verificar si un usuario tiene un rol específico o superior
 * @param {Object} user Usuario a verificar
 * @param {String} requiredRole Rol requerido
 * @returns {Boolean} True si tiene el rol requerido o superior, false en caso contrario
 */
export function hasRole(user, requiredRole) {
  if (!user || !user.role) return false;
  
  // Jerarquía simplificada
  const roleHierarchy = [
    'USER',
    'ADMIN',
    'SUPER_ADMIN'
  ];
  
  const userRoleIndex = roleHierarchy.indexOf(user.role);
  const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
  
  // Si alguno de los roles no existe en la jerarquía
  if (userRoleIndex === -1 || requiredRoleIndex === -1) return false;
  
  // Verificar si el rol del usuario es mayor o igual al requerido
  return userRoleIndex >= requiredRoleIndex;
}

/**
 * Función de compatibilidad para usar con el hook de permisos
 * @param {Object} user Usuario actual
 * @returns {Function} Función can() para verificar permisos
 */
export function createPermissionChecker(user) {
  return function can(permission) {
    return hasPermission(user, permission);
  };
}

// Exportación para compatibilidad con código existente
export const ROLE_PERMISSIONS = ROLES;
