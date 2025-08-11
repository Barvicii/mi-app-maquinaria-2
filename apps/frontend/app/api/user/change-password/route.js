import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from 'bcryptjs';

export async function PUT(request) {
  try {
    // Verificar que el usuario esté autenticado
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obtener los datos del cuerpo de la solicitud
    const { currentPassword, newPassword } = await request.json();

    // Validar que se proporcionaron ambas contraseñas
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ 
        error: 'Both current and new passwords are required' 
      }, { status: 400 });
    }

    // Validar que la nueva contraseña tenga al menos 6 caracteres
    if (newPassword.length < 6) {
      return NextResponse.json({ 
        error: 'New password must be at least 6 characters long' 
      }, { status: 400 });
    }

    // Conectar a la base de datos
    await dbConnect();

    // Buscar el usuario en la base de datos
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verificar que la contraseña actual sea correcta
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ 
        error: 'Current password is incorrect' 
      }, { status: 400 });
    }

    // Hashear la nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña en la base de datos
    await User.findByIdAndUpdate(user._id, { 
      password: hashedNewPassword,
      updatedAt: new Date()
    });

    console.log(`✅ Password changed successfully for user: ${user.email}`);

    return NextResponse.json({ 
      message: 'Password changed successfully' 
    }, { status: 200 });

  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}


