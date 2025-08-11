import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { connectDB, dbConnect } from "@/lib/mongodb";
import AccessRequest from "@/models/AccessRequest";
import User from "@/models/User";
import bcrypt from 'bcryptjs';
import { generateTemporaryPassword, sendTemporaryPasswordEmail } from "@/lib/emailUtils";

export async function GET(request) {
  try {
    console.log('🔥 NEW VERSION: Fetching access requests from MongoDB');
    
    // Test 1: Verificar sesión con manejo robusto de errores
    console.log('1️⃣ Verificando sesión...');
    let session = null;
    try {
      // Importar authOptions dinámicamente para evitar problemas de SSR
      const { authOptions } = await import("@/lib/auth");
      session = await getServerSession(authOptions);
      console.log('✅ Sesión obtenida:', session ? `${session.user?.email} (${session.user?.role})` : 'No hay sesión');
    } catch (sessionError) {
      console.error('❌ Error obteniendo sesión:', sessionError);
      console.error('❌ Stack trace:', sessionError.stack);
      return NextResponse.json({ 
        error: 'Error en autenticación', 
        details: sessionError.message,
        stack: sessionError.stack
      }, { status: 500 });
    }
    
    if (!session) {
      console.log('❌ No hay sesión activa');
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }
    
    if (!session.user) {
      console.log('❌ No hay usuario en la sesión');
      return NextResponse.json({ error: 'No user in session' }, { status: 401 });
    }
    
    if (session.user.role !== 'SUPER_ADMIN') {
      console.log('❌ Usuario no es SUPER_ADMIN:', session.user.role);
      return NextResponse.json({ error: 'Unauthorized - requires SUPER_ADMIN role' }, { status: 401 });
    }

    // Test 2: Conectar a la base de datos
    console.log('2️⃣ Conectando a MongoDB...');
    try {
      await dbConnect();
      console.log('✅ Connected to database successfully');
    } catch (dbError) {
      console.error('❌ Error conectando a MongoDB:', dbError);
      return NextResponse.json({ 
        error: 'Error de conexión a base de datos', 
        details: dbError.message 
      }, { status: 500 });
    }

    // Test 3: Obtener todas las solicitudes de acceso
    console.log('3️⃣ Querying AccessRequest collection...');
    let accessRequests;
    try {
      accessRequests = await AccessRequest.find({})
        .sort({ submittedAt: -1 })
        .lean();
      console.log(`✅ Found ${accessRequests.length} access requests`);
    } catch (queryError) {
      console.error('❌ Error consultando access requests:', queryError);
      return NextResponse.json({ 
        error: 'Error consultando solicitudes', 
        details: queryError.message 
      }, { status: 500 });
    }

    // Si no encontramos nada, log simple sin listar colecciones
    if (accessRequests.length === 0) {
      console.log('⚠️ No access requests found in the database');
    }

    // Test 4: Transformar los datos para compatibilidad con el frontend
    console.log('4️⃣ Transformando datos...');
    try {
      const transformedRequests = accessRequests.map(request => ({
        id: request._id.toString(),
        email: request.email,
        organizationName: request.organizationName,
        contactName: request.contactName,
        phone: request.phone,
        status: request.status,
        requestDate: request.submittedAt,
        createdAt: request.submittedAt,
        approvedAt: request.approvedAt,
        rejectedAt: request.rejectedAt,
        tempPassword: request.tempPassword
      }));

      console.log('✅ Datos transformados correctamente');
      return NextResponse.json({ requests: transformedRequests });
    } catch (transformError) {
      console.error('❌ Error transformando datos:', transformError);
      return NextResponse.json({ 
        error: 'Error transformando datos', 
        details: transformError.message 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error general fetching access requests:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    console.log('🔥 POST: Processing access request action');
    
    // Test 1: Verificar sesión con manejo robusto de errores
    console.log('1️⃣ Verificando sesión para POST...');
    let session = null;
    try {
      // Importar authOptions dinámicamente para evitar problemas de SSR
      const { authOptions } = await import("@/lib/auth");
      session = await getServerSession(authOptions);
      console.log('✅ Sesión POST obtenida:', session ? `${session.user?.email} (${session.user?.role})` : 'No hay sesión');
    } catch (sessionError) {
      console.error('❌ Error obteniendo sesión en POST:', sessionError);
      return NextResponse.json({ 
        error: 'Error en autenticación', 
        details: sessionError.message 
      }, { status: 500 });
    }
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      console.log('❌ Unauthorized POST request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Test 2: Parsear body del request
    console.log('2️⃣ Parseando request body...');
    let body;
    try {
      body = await request.json();
      console.log('✅ Body parseado:', body);
    } catch (parseError) {
      console.error('❌ Error parseando body:', parseError);
      return NextResponse.json({ 
        error: 'Invalid request body', 
        details: parseError.message 
      }, { status: 400 });
    }

    const { action, requestId, email, name, company } = body;

    // Test 3: Conectar a la base de datos
    console.log('3️⃣ Conectando a MongoDB para POST...');
    try {
      await dbConnect();
      console.log('✅ Connected to database for POST');
    } catch (dbError) {
      console.error('❌ Error conectando a MongoDB en POST:', dbError);
      return NextResponse.json({ 
        error: 'Database connection error', 
        details: dbError.message 
      }, { status: 500 });
    }

    if (action === 'approve') {
      console.log('4️⃣ Procesando aprobación...');
      try {
        // Generar password temporal
        const tempPassword = Math.random().toString(36).slice(-8);
        console.log('✅ Generated temp password');
        
        // Encontrar la solicitud
        console.log('🔍 Finding access request by ID:', requestId);
        const accessRequest = await AccessRequest.findById(requestId);
        if (!accessRequest) {
          console.error('❌ Access request not found:', requestId);
          return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }
        console.log('✅ Access request found:', accessRequest.email);

        // Verificar si el usuario ya existe
        console.log('🔍 Checking if user already exists:', accessRequest.email);
        const existingUser = await User.findOne({ email: accessRequest.email });
        if (existingUser) {
          console.log('⚠️ User already exists, just approving request');
          // Si el usuario ya existe, no creamos uno nuevo, solo aprobamos la solicitud
          accessRequest.status = 'approved';
          accessRequest.approvedAt = new Date();
          await accessRequest.save();
          console.log(`✅ User ${accessRequest.email} already exists. Request marked as approved.`);
          return NextResponse.json({ message: 'User already exists, request approved.' });
        }

        // Marcar como aprobado
        console.log('📝 Updating access request status...');
        accessRequest.status = 'approved';
        accessRequest.approvedAt = new Date();
        accessRequest.tempPassword = tempPassword;
        accessRequest.approvedBy = session.user.id;
        
        await accessRequest.save();
        console.log('✅ Access request updated successfully');

        // Crear el nuevo usuario
        console.log('👤 Creating new user...');
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        
        const newUser = new User({
          name: accessRequest.contactName,
          email: accessRequest.email,
          password: hashedPassword,
          company: accessRequest.organizationName,
          role: 'USER', // Rol por defecto para nuevos usuarios
          active: true,
          emailVerified: true, // El email se considera verificado en la aprobación
          createdBy: session.user.id,
          organization: accessRequest.organizationName,
          requestId: accessRequest._id.toString(),
        });

        await newUser.save();
        console.log(`✅ New user created successfully: ${newUser.email}`);

        // Enviar email con contraseña temporal
        try {
          console.log(`📧 Sending temporary password email to ${accessRequest.email}...`);
          await sendTemporaryPasswordEmail(
            accessRequest.email, 
            accessRequest.contactName, 
            tempPassword
          );
          console.log(`✅ Temporary password email sent successfully to ${accessRequest.email}`);
        } catch (emailError) {
          console.error('❌ Failed to send temporary password email:', emailError);
          // No fallar la aprobación si el email falla, pero log el error
        }

        return NextResponse.json({ 
          message: 'Request approved successfully',
          tempPassword: tempPassword 
        });
      } catch (approveError) {
        console.error('❌ Error en proceso de aprobación:', approveError);
        return NextResponse.json({ 
          error: 'Error approving request', 
          details: approveError.message 
        }, { status: 500 });
      }
    }

    if (action === 'reject') {
      console.log('4️⃣ Procesando rechazo...');
      try {
        // Encontrar la solicitud
        const accessRequest = await AccessRequest.findById(requestId);
        if (!accessRequest) {
          return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        // Marcar como rechazado
        accessRequest.status = 'rejected';
        accessRequest.rejectedAt = new Date();
        accessRequest.rejectedBy = session.user.id;
        
        await accessRequest.save();

        // Aquí podrías enviar un email de notificación de rechazo si lo deseas
        console.log(`Access request from ${accessRequest.email} has been rejected`);

        return NextResponse.json({ message: 'Request rejected successfully' });
      } catch (rejectError) {
        console.error('❌ Error en proceso de rechazo:', rejectError);
        return NextResponse.json({ 
          error: 'Error rejecting request', 
          details: rejectError.message 
        }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('❌ Error general processing POST request:', error);
    console.error('❌ Stack trace:', error.stack);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}


