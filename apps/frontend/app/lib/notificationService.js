import { connectDB } from './mongodb';
// Remover la importación directa de mongodb
// import { ObjectId } from 'mongodb';

/**
 * Servicio para manejar notificaciones del sistema
 */
export const NotificationService = {
  /**
   * Enviar una notificación a un usuario específico
   */
  sendToUser: async ({
    userId,
    organizationId,
    title,
    message,
    type,
    actionUrl = null,
    relatedEntityId = null,
    relatedEntityType = null,
    additionalData = {}
  }) => {
    try {
      const db = await connectDB();
      
      // Asegurar que userId sea un string
      const userIdStr = typeof userId === 'object' ? userId.toString() : userId;
      
      // Crear objeto de notificación
      const notification = {
        userId: userIdStr,
        organizationId,
        title,
        message,
        type,
        read: false,
        createdAt: new Date(),
        actionUrl,
        data: {
          relatedEntityId,
          relatedEntityType,
          ...additionalData
        }
      };
      
      await db.collection('notifications').insertOne(notification);
      
      return true;
    } catch (error) {
      console.error('Error enviando notificación:', error);
      return false;
    }
  },
  
  /**
   * Enviar notificación a múltiples usuarios
   */
  sendToMultipleUsers: async ({
    userIds,
    organizationId,
    title,
    message,
    type,
    actionUrl = null,
    relatedEntityId = null,
    relatedEntityType = null,
    additionalData = {}
  }) => {
    try {
      if (!userIds || !userIds.length) return false;
      
      const db = await connectDB();
      
      // Crear notificaciones para cada usuario
      const notifications = userIds.map(userId => ({
        userId: typeof userId === 'object' ? userId.toString() : userId,
        organizationId,
        title,
        message,
        type,
        read: false,
        createdAt: new Date(),
        actionUrl,
        data: {
          relatedEntityId,
          relatedEntityType,
          ...additionalData
        }
      }));
      
      await db.collection('notifications').insertMany(notifications);
      
      return true;
    } catch (error) {
      console.error('Error enviando notificaciones a múltiples usuarios:', error);
      return false;
    }
  },
  
  /**
   * Enviar notificación a todos los usuarios con un rol específico
   */
  sendToUsersWithRole: async ({
    organizationId,
    role, // Ej: 'ADMIN', 'MANAGER', etc.
    title,
    message,
    type,
    actionUrl = null,
    relatedEntityId = null,
    relatedEntityType = null,
    additionalData = {}
  }) => {
    try {
      const db = await connectDB();
      
      // Encontrar usuarios con el rol especificado
      const users = await db.collection('users').find({
        credentialId: organizationId,
        role,
        active: true
      }).project({ _id: 1 }).toArray();
      
      if (!users || users.length === 0) return false;
      
      // Obtener los IDs de los usuarios
      const userIds = users.map(user => user._id.toString());
      
      // Enviar notificaciones a estos usuarios
      return await NotificationService.sendToMultipleUsers({
        userIds,
        organizationId,
        title,
        message,
        type,
        actionUrl,
        relatedEntityId,
        relatedEntityType,
        additionalData
      });
      
    } catch (error) {
      console.error('Error enviando notificaciones a usuarios con rol:', error);
      return false;
    }
  },
  
  /**
   * Enviar notificación a usuarios con permisos específicos
   */
  sendToUsersWithPermission: async ({
    organizationId,
    permission, // Ej: 'machine:edit', 'user:create', etc.
    title,
    message,
    type,
    actionUrl = null,
    relatedEntityId = null,
    relatedEntityType = null,
    additionalData = {}
  }) => {
    try {
      const db = await connectDB();
      
      // 1. Encontrar roles del sistema con este permiso
      const systemRoles = await db.collection('systemRoles')
        .find({ permissions: permission })
        .project({ name: 1 })
        .toArray();
      
      const systemRoleNames = systemRoles.map(role => role.name);
      
      // 2. Encontrar roles personalizados con este permiso
      const customRoles = await db.collection('organizationRoles')
        .find({
          organizationId,
          permissions: permission
        })
        .project({ _id: 1 })
        .toArray();
      
      const customRoleIds = customRoles.map(role => role._id.toString());
      
      // 3. Encontrar usuarios con los roles del sistema o roles personalizados
      const usersWithSystemRoles = systemRoleNames.length > 0
        ? await db.collection('users').find({
            credentialId: organizationId,
            role: { $in: systemRoleNames },
            active: true
          }).project({ _id: 1 }).toArray()
        : [];
      
      const usersWithCustomRoles = customRoleIds.length > 0
        ? await db.collection('users').find({
            credentialId: organizationId,
            customRole: { $in: customRoleIds },
            active: true
          }).project({ _id: 1 }).toArray()
        : [];
      
      // 4. Combinar y deduplicar los IDs de usuarios
      const allUsers = [...usersWithSystemRoles, ...usersWithCustomRoles];
      const uniqueUserIds = [...new Set(allUsers.map(user => user._id.toString()))];
      
      if (uniqueUserIds.length === 0) return false;
      
      // 5. Enviar notificaciones a estos usuarios
      return await NotificationService.sendToMultipleUsers({
        userIds: uniqueUserIds,
        organizationId,
        title,
        message,
        type,
        actionUrl,
        relatedEntityId,
        relatedEntityType,
        additionalData
      });
      
    } catch (error) {
      console.error('Error enviando notificaciones a usuarios con permiso:', error);
      return false;
    }
  },
  
  /**
   * Obtener el recuento de notificaciones no leídas para un usuario
   */
  getUnreadCount: async (userId, organizationId) => {
    try {
      const db = await connectDB();
      
      const count = await db.collection('notifications').countDocuments({
        userId,
        organizationId,
        read: false
      });
      
      return count;
    } catch (error) {
      console.error('Error obteniendo recuento de notificaciones no leídas:', error);
      return 0;
    }
  }
};