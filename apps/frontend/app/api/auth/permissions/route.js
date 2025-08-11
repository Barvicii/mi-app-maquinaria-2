import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/mongodb";
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]/route';
import { ObjectId } from 'mongodb';
import { ROLES, PERMISSIONS } from "@/config/roles";

export async function GET(request) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const db = await connectDB();
    
    // Obtener usuario actualizado (por si los permisos han cambiado)
    const user = await db.collection('users').findOne({
      _id: new ObjectId(session.user.id)
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Obtener permisos según el rol
    const rolePermissions = ROLES[user.role]?.permissions || [];
    
    // Combinar con permisos personalizados
    const customPermissions = user.customPermissions || [];
    const allPermissions = [...new Set([...rolePermissions, ...customPermissions])];
    
    return NextResponse.json({
      role: user.role,
      permissions: allPermissions,
      customPermissions
    });
    
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


