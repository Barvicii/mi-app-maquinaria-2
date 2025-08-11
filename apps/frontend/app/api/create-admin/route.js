import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcryptjs from 'bcryptjs';

export async function POST(request) {
  try {
    console.log('[CREATE-ADMIN] Iniciando creación de usuario administrador...');
    
    // Conectar a MongoDB
    await connectDB();
    console.log('[CREATE-ADMIN] Conectado a MongoDB');

    // Eliminar usuario administrador existente si existe
    await User.deleteOne({ email: 'admin@company.com' });
    console.log('[CREATE-ADMIN] Usuario existente eliminado');

    // Crear hash de la contraseña
    const password = 'Admin123!'; // Contraseña temporal
    const hashedPassword = await bcryptjs.hash(password, 12);
    console.log('[CREATE-ADMIN] Contraseña hasheada');

    // Crear el usuario administrador
    const adminUser = new User({
      name: 'Administrador',
      email: 'admin@company.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      emailVerified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await adminUser.save();
    console.log('[CREATE-ADMIN] Usuario administrador creado exitosamente');

    return NextResponse.json({
      success: true,
      message: 'Usuario administrador recreado exitosamente',
      user: {
        email: adminUser.email,
        role: adminUser.role,
        name: adminUser.name
      },
      credentials: {
        email: 'admin@company.com',
        password: 'Admin123!'
      }
    });

  } catch (error) {
    console.error('[CREATE-ADMIN] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

// También permitir GET para verificar
export async function GET() {
  try {
    await connectDB();
    
    const adminUsers = await User.find({ role: 'SUPER_ADMIN' });
    const allUsers = await User.find({});
    
    return NextResponse.json({
      success: true,
      adminUsers: adminUsers.map(u => ({
        email: u.email,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt
      })),
      totalUsers: allUsers.length,
      allUsers: allUsers.map(u => ({
        email: u.email,
        name: u.name,
        role: u.role
      }))
    });
    
  } catch (error) {
    console.error('[CREATE-ADMIN] Error en GET:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}


