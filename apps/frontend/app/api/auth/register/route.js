import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/mongodb";
import bcrypt from 'bcryptjs';
import { validateOrganizationName } from "@/lib/security";

export async function POST(request) {
  try {
    const { 
      email, 
      password, 
      organizationName, 
      contactName, 
      phone,
      directAccess = true 
    } = await request.json();

    // Validaciones básicas
    if (!email || !password || !organizationName || !contactName) {
      return NextResponse.json(
        { error: 'Todos los campos obligatorios deben ser completados' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    const db = await connectDB();

    // Verificar si el email ya existe
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con este email' },
        { status: 400 }
      );
    }

    // Validate and sanitize organization name to prevent NoSQL injection
    const orgValidation = validateOrganizationName(organizationName);
    if (!orgValidation.isValid) {
      return NextResponse.json(
        { error: orgValidation.error },
        { status: 400 }
      );
    }

    // Verificar si la organización ya existe - Using safe exact match
    const existingOrg = await db.collection('organizations').findOne({ 
      name: { $regex: `^${orgValidation.sanitized}$`, $options: 'i' }
    });
    if (existingOrg) {
      return NextResponse.json(
        { error: 'Ya existe una organización con este nombre' },
        { status: 400 }
      );
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear la organización primero - using validated name
    const organizationData = {
      name: orgValidation.sanitized,  // Use sanitized organization name
      email: email,
      phone: phone,
      status: 'pending_approval',
      contactName: contactName,
      // Configuración simplificada - sin planes complejos
      settings: {
        maxUsers: 10,        // Límite inicial generoso
        maxMachines: 25,     // Límite inicial generoso
        features: {
          reports: true,
          fuelTracking: true,
          maintenance: true,
          operators: true,
          prestart: true
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const orgResult = await db.collection('organizations').insertOne(organizationData);
    const organizationId = orgResult.insertedId;

    // Crear el usuario admin de la organización
    const userData = {
      email,
      password: hashedPassword,
      name: contactName,
      phone: phone || null,
      organizationId,
      role: 'ORG_ADMIN', // Admin de la organización
      status: 'pending_approval',
      isActive: false, // Se activará cuando sea aprobado
      // Acceso directo simplificado
      accessLevel: 'full', // Acceso completo una vez aprobado
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const userResult = await db.collection('users').insertOne(userData);

    // Actualizar la organización con el ID del admin
    await db.collection('organizations').updateOne(
      { _id: organizationId },
      { 
        $set: { 
          adminUserId: userResult.insertedId,
          updatedAt: new Date()
        } 
      }
    );

    // Crear solicitud de acceso para el panel de admin
    await db.collection('access_requests').insertOne({
      userId: userResult.insertedId,
      organizationId,
      email,
      organizationName,
      contactName,
      phone,
      status: 'pending',
      requestType: 'organization_registration',
      // Sin información de planes - registro simplificado
      accessLevel: 'full',
      submittedAt: new Date(),
      metadata: {
        userAgent: request.headers.get('user-agent'),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        registrationType: 'direct_access'
      }
    });

    // Log de actividad
    await db.collection('activityLogs').insertOne({
      type: 'USER_REGISTRATION',
      userId: userResult.insertedId,
      organizationId,
      details: {
        email,
        organizationName,
        registrationType: 'simplified_registration'
      },
      timestamp: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Solicitud de registro enviada exitosamente',
      userId: userResult.insertedId,
      organizationId,
      status: 'pending_approval'
    });

  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


