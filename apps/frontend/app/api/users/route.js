import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/mongodb";
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { withPermission } from "@/middleware/permissionsMiddleware";
import { PERMISSIONS } from "@/lib/roles";

// Helper function to check organization suspension
const checkOrganizationSuspension = (session) => {
  if (session.user.role !== 'SUPER_ADMIN' && session.user.organizationSuspended === true) {
    return NextResponse.json(
      { error: 'Organization is suspended. Contact support for assistance.' },
      { status: 403 }
    );
  }
  return null;
};

// GET: Obtener lista de usuarios (requiere permiso de visualización de usuarios)
export const GET = withPermission(PERMISSIONS.USER_VIEW)(async (request) => {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if organization is suspended
    const suspensionCheck = checkOrganizationSuspension(session);
    if (suspensionCheck) return suspensionCheck;
    
    const db = await connectDB();
    
    // Construir query según el rol del usuario
    const query = {};
    
    // Si no es super admin, solo ver usuarios de su organización
    if (session.user.role !== 'SUPER_ADMIN') {
      query.credentialId = session.user.credentialId;
    }
    
    // Obtener usuarios
    const users = await db.collection('users')
      .find(query)
      .project({ password: 0 }) // Excluir contraseñas
      .sort({ createdAt: -1 })
      .toArray();
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
});

// POST: Crear un nuevo usuario (requiere permiso de creación de usuarios)
export const POST = withPermission(PERMISSIONS.USER_CREATE)(async (request) => {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if organization is suspended
    const suspensionCheck = checkOrganizationSuspension(session);
    if (suspensionCheck) return suspensionCheck;
    
    const data = await request.json();
    const db = await connectDB();
    
    // Validaciones básicas
    if (!data.name || !data.email || !data.password || !data.workplaceName) {
      return NextResponse.json(
        { error: 'Nombre, email, contraseña y nombre del lugar de trabajo son requeridos' },
        { status: 400 }
      );
    }
    
    // Verificar si el usuario ya existe
    const existingUser = await db.collection('users').findOne({ 
      email: data.email.toLowerCase().trim() 
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Un usuario con este email ya existe' },
        { status: 400 }
      );
    }
    
    // Establecer credentialId del usuario actual
    data.credentialId = session.user.credentialId;
    
    // Limitar el rol que puede asignar según su propio rol
    if (session.user.role !== 'SUPER_ADMIN' && 
        (data.role === 'SUPER_ADMIN' || data.role === 'ADMIN')) {
      return NextResponse.json(
        { error: 'No tiene permisos para asignar ese rol' },
        { status: 403 }
      );
    }
    
    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);
    
    // Crear objeto usuario
    const newUser = {
      name: data.name,
      email: data.email.toLowerCase().trim(),
      password: hashedPassword,
      company: data.company || session.user.company,
      workplace: data.workplaceName, // Guardar en el campo workplace
      role: data.role || 'USER',
      credentialId: session.user.credentialId,
      organizationId: session.user.organizationId,
      permissions: data.permissions || ['read:machines'],
      active: true,
      createdAt: new Date(),
      createdBy: session.user.id,
      // Initialize suspension fields
      organizationSuspended: false,
      organizationSuspendedAt: null,
      organizationSuspendedBy: null
    };
    
    // Crear usuario en la base de datos
    const result = await db.collection('users').insertOne(newUser);
    
    // Retornar usuario creado sin la contraseña
    const { password: _, ...userWithoutPassword } = newUser;
    
    return NextResponse.json({ 
      success: true, 
      user: { 
        ...userWithoutPassword,
        _id: result.insertedId 
      } 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    );
  }
});


