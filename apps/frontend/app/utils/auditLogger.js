/**
 * Utility para registrar acciones de auditoría en el sistema
 */

/**
 * Registra una acción en el log de auditoría
 * @param {Object} options - Opciones del log de auditoría
 * @param {string} options.action - Tipo de acción (ej: 'login', 'user_create', etc.)
 * @param {Object} options.details - Detalles específicos de la acción
 * @param {string} options.severity - Nivel de severidad ('info', 'warning', 'error', 'critical')
 * @param {string} options.module - Módulo del sistema (ej: 'auth', 'users', 'billing', etc.)
 * @param {string} options.targetUserId - ID del usuario objetivo (si aplica)
 * @param {string} options.targetUserName - Nombre del usuario objetivo (si aplica)
 * @param {string} options.targetUserEmail - Email del usuario objetivo (si aplica)
 * @param {string} options.organizationId - ID de la organización relacionada (si aplica)
 * @param {string} options.organizationName - Nombre de la organización relacionada (si aplica)
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function logAuditAction(options) {
  try {
    const {
      action,
      details,
      severity = 'info',
      module,
      targetUserId,
      targetUserName,
      targetUserEmail,
      organizationId,
      organizationName
    } = options;
    
    if (!action) {
      console.error('Error al registrar acción de auditoría: "action" es obligatorio');
      return { success: false, error: 'Action is required' };
    }
    
    const payload = {
      action,
      details: details || {},
      severity,
      module,
      targetUserId,
      targetUserName,
      targetUserEmail,
      organizationId,
      organizationName
    };
    
    // Realizar petición a la API de logs de auditoría
    const response = await fetch('/api/admin/audit-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error al registrar acción de auditoría:', errorData);
      return { success: false, error: errorData.error || 'Error desconocido' };
    }
    
    const result = await response.json();
    return { success: true, logId: result.logId };
  } catch (error) {
    console.error('Error al registrar acción de auditoría:', error);
    return { success: false, error: error.message || 'Error desconocido' };
  }
}

/**
 * Acciones comunes de auditoría para facilitar su uso
 */
export const AUDIT_ACTIONS = {
  // Autenticación
  LOGIN: 'login',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET: 'password_reset',
  MFA_ENABLED: 'mfa_enabled',
  MFA_DISABLED: 'mfa_disabled',
  
  // Usuarios
  USER_CREATE: 'user_create',
  USER_UPDATE: 'user_update',
  USER_DELETE: 'user_delete',
  ROLE_CHANGE: 'role_change',
  PERMISSIONS_CHANGE: 'permissions_change',
  
  // Organizaciones
  ORGANIZATION_CREATE: 'organization_create',
  ORGANIZATION_UPDATE: 'organization_update',
  ORGANIZATION_DELETE: 'organization_delete',
  ORGANIZATION_SUSPENSION: 'organization_suspension',
  
  // Planes y Suscripciones
  PLAN_CHANGE: 'plan_change',
  PLAN_CREATE: 'plan_create',
  PLAN_UPDATE: 'plan_update',
  PLAN_DELETE: 'plan_delete',
  CUSTOM_LIMITS_SET: 'custom_limits_set',
  
  // API
  API_KEY_GENERATED: 'api_key_generated',
  API_KEY_REVOKED: 'api_key_revoked',
  
  // Datos
  DATA_EXPORT: 'data_export',
  DATA_IMPORT: 'data_import',
  DATA_DELETE: 'data_delete',
  
  // Configuración
  SECURITY_SETTING_CHANGE: 'security_setting_change',
  SYSTEM_SETTING_CHANGE: 'system_setting_change',
  MAINTENANCE_MODE: 'maintenance_mode',
  
  // Facturación
  INVOICE_GENERATED: 'invoice_generated',
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_FAILED: 'payment_failed',
  REFUND_PROCESSED: 'refund_processed',
  
  // Notificaciones
  NOTIFICATION_SENT: 'notification_sent',
  ALERT_CREATED: 'alert_created',
  ALERT_TRIGGERED: 'alert_triggered',
  
  // Seguridad
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  BRUTE_FORCE_ATTEMPT: 'brute_force_attempt'
};

/**
 * Módulos del sistema para categorizar las acciones de auditoría
 */
export const AUDIT_MODULES = {
  AUTH: 'auth',
  USERS: 'users',
  ORGANIZATIONS: 'organizations',
  BILLING: 'billing',
  PLANS: 'plans',
  API: 'api',
  DATA: 'data',
  SYSTEM: 'system',
  SECURITY: 'security',
  NOTIFICATIONS: 'notifications'
};

/**
 * Niveles de severidad para las acciones de auditoría
 */
export const AUDIT_SEVERITY = {
  INFO: 'info',         // Informativo, sin impacto en la seguridad o funcionamiento
  WARNING: 'warning',   // Advertencia, potencial problema o cambio importante
  ERROR: 'error',       // Error, problema con impacto en el funcionamiento
  CRITICAL: 'critical'  // Crítico, incidente de seguridad o problema grave
};