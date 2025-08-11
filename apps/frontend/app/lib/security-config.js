/**
 * Configuración de seguridad para sesiones "Remember me"
 */

export const SECURITY_CONFIG = {
  // Duración de sesiones
  SESSION_DURATION: {
    STANDARD: 24 * 60 * 60, // 24 horas en segundos
    EXTENDED: 30 * 24 * 60 * 60, // 30 días en segundos
  },
  
  // Configuración de cookies
  COOKIE_CONFIG: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  },
  
  // Configuración de auditoría
  AUDIT_CONFIG: {
    LOG_EXTENDED_SESSIONS: true,
    LOG_SESSION_EXPIRY: true,
    LOG_SUSPICIOUS_ACTIVITY: true,
  },
  
  // Límites de seguridad
  LIMITS: {
    MAX_CONCURRENT_SESSIONS: 5, // Máximo 5 sesiones simultáneas por usuario
    EXTENDED_SESSION_WARNING_DAYS: 3, // Advertir 3 días antes de expirar
  },
};

/**
 * Función para validar si una sesión debe ser extendida
 */
export function shouldExtendSession(user, rememberMe) {
  // Verificar que el usuario esté activo
  if (!user.active) {
    console.log(`🔒 [Security] Extended session denied - User not active: ${user.email}`);
    return false;
  }
  
  // Verificar que remember me esté explícitamente solicitado
  if (!rememberMe) {
    return false;
  }
  
  console.log(`🔒 [Security] Extended session granted for: ${user.email}`);
  return true;
}

/**
 * Función para calcular tiempo de expiración
 */
export function calculateExpiry(isExtended = false) {
  const now = Math.floor(Date.now() / 1000);
  const duration = isExtended 
    ? SECURITY_CONFIG.SESSION_DURATION.EXTENDED 
    : SECURITY_CONFIG.SESSION_DURATION.STANDARD;
  
  return now + duration;
}

/**
 * Función para validar y limpiar sesiones expiradas
 */
export function isSessionValid(token) {
  if (!token || !token.exp) {
    return false;
  }
  
  const now = Math.floor(Date.now() / 1000);
  const isValid = now < token.exp;
  
  if (!isValid) {
    console.log(`⏰ [Security] Session expired at: ${new Date(token.exp * 1000).toISOString()}`);
  }
  
  return isValid;
}

/**
 * Función para generar logs de auditoría de seguridad
 */
export function logSecurityEvent(event, details) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    details,
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'Server',
  };
  
  console.log(`🔐 [Security Audit] ${JSON.stringify(logEntry)}`);
  
  // En producción, aquí enviarías esto a un servicio de logging
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrar con servicio de logging como Winston, Datadog, etc.
  }
}

export default SECURITY_CONFIG;
