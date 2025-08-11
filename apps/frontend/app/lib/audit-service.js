/**
 * Servicio de auditoría simplificado
 */

export async function logAuditEvent(eventType, details, userId = null) {
  try {
    // En un entorno de producción, esto se guardaría en la base de datos
    console.log('AUDIT LOG:', {
      timestamp: new Date().toISOString(),
      eventType,
      details,
      userId,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error logging audit event:', error);
    return { success: false, error: error.message };
  }
}

// Export del servicio completo
export const AuditService = {
  logAuditEvent
};

export default AuditService;
