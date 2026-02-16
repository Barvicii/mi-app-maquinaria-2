/**
 * Servicio de auditoría — guarda eventos en la colección activityLogs de MongoDB
 */
import { connectDB } from '@/lib/mongodb';

export async function logAuditEvent(eventType, details, userId = null, organization = null) {
  try {
    const db = await connectDB();
    const logEntry = {
      timestamp: new Date(),
      eventType,
      action: eventType,
      details: typeof details === 'string' ? { message: details } : details,
      userId,
      organization: organization || null,
      source: 'system',
    };

    await db.collection('activityLogs').insertOne(logEntry);
    return { success: true };
  } catch (error) {
    console.error('Error logging audit event:', error.message);
    return { success: false, error: error.message };
  }
}

export async function logAction(logData, metadata = {}) {
  try {
    const db = await connectDB();
    const logEntry = {
      timestamp: new Date(),
      action: logData.action,
      eventType: logData.action,
      actionCategory: logData.actionCategory || 'general',
      userId: logData.userId,
      userName: logData.userName,
      userEmail: logData.userEmail,
      organization: logData.organization || null,
      organizationId: logData.organizationId || null,
      details: logData.details || {},
      status: logData.status || 'success',
      targetEntity: logData.targetEntity || null,
      metadata: {
        ipAddress: metadata.ipAddress || 'unknown',
        userAgent: metadata.userAgent || 'unknown',
        source: metadata.source || 'system',
      },
    };

    const result = await db.collection('activityLogs').insertOne(logEntry);
    return { success: true, id: result.insertedId };
  } catch (error) {
    console.error('Error logging action:', error.message);
    return { success: false, error: error.message };
  }
}

export const AuditService = {
  logAuditEvent,
  logAction,
};

export default AuditService;
