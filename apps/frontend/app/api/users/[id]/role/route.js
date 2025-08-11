import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';
import { hasRole } from '@/config/roles';

// Actualizar el rol de un usuario
export async function PUT(request, { params }) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    // Verificar que el usuario tenga permisos para cambiar roles
    if (!hasRole(session.user, 'ADMIN')) {
      return NextResponse.json({ error: "You don't have permission to change roles" }, { status: 403 });
    }
    
    const { id } = params;
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }
    
    const data = await request.json();
    const { role, customPermissions } = data;
    
    if (!role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }
    
    // Validar que el rol sea válido
    const validRoles = ['VIEWER', 'OPERATOR', 'TECHNICIAN', 'USER', 'MANAGER', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    
    // Solo SUPER_ADMIN puede asignar rol de ADMIN
    if (role === 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ 
        error: "Only super admins can assign admin roles" 
      }, { status: 403 });
    }
    
    const db = await connectDB();
    
    // Verificar que el usuario existe
    const user = await db.collection('users').findOne({
      _id: new ObjectId(id)
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Verificar que el usuario modificado pertenece a la misma organización (credentialId)
    if (user.credentialId !== session.user.credentialId && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ 
        error: "You can only change roles for users in your organization" 
      }, { status: 403 });
    }
    
    // Actualizar rol y permisos personalizados
    const updateData = { role };
    if (customPermissions && Array.isArray(customPermissions)) {
      updateData.customPermissions = customPermissions;
    }
    
    // Guardar cambios
    await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    // Registrar actividad
    await db.collection('activityLogs').insertOne({
      userId: session.user.id,
      targetUserId: id,
      action: 'user_role_update',
      details: {
        role,
        customPermissions: customPermissions || [],
        previousRole: user.role
      },
      timestamp: new Date()
    });
    
    return NextResponse.json({
      success: true,
      message: "User role updated successfully"
    });
    
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}