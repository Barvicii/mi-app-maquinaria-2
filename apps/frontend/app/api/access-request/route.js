import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/mongodb";
import ApplicationRequest from "@/models/ApplicationRequest";

// Función para verificar captcha
async function verifyCaptcha(token) {
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: token
      })
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error verifying captcha:', error);
    return false;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { fullName, email, company, phone, description, captchaToken } = body;
    
    // Validar campos requeridos
    if (!fullName || !email || !company || !phone || !description) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'El formato del email no es válido' }, { status: 400 });
    }
    
    // Verificar captcha (desactiva en desarrollo si no está configurado)
    if (process.env.NODE_ENV === 'production') {
      const captchaValid = await verifyCaptcha(captchaToken);
      if (!captchaValid) {
        return NextResponse.json({ error: 'Verificación de captcha fallida' }, { status: 400 });
      }
    }
    
    // Conectar a la base de datos
    const db = await connectDB();
    
    // Verificar si ya existe una solicitud con este email
    const existingRequest = await db.collection('applicationRequests').findOne({
      'applicationData.email': email
    });
    
    if (existingRequest) {
      return NextResponse.json({ error: 'Ya existe una solicitud con este email' }, { status: 409 });
    }
    
    // Crear nueva solicitud
    const newRequest = {
      status: 'pending',
      applicationData: {
        fullName,
        email,
        company,
        phone,
        description
      },
      requestDate: new Date()
    };
    
    // Guardar en la base de datos
    const result = await db.collection('applicationRequests').insertOne(newRequest);
    
    // Enviar email de confirmación (implementar más adelante)
    // await sendConfirmationEmail(email, fullName);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Solicitud recibida correctamente',
      id: result.insertedId
    });
    
  } catch (error) {
    console.error('Error procesando solicitud de acceso:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    // Verificar si el usuario es admin
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Conectar a la base de datos
    const db = await connectDB();
    
    // Crear filtro
    const filter = {};
    if (status !== 'all') {
      filter.status = status;
    }
    
    // Contar total para paginación
    const total = await db.collection('applicationRequests').countDocuments(filter);
    
    // Obtener solicitudes
    const requests = await db.collection('applicationRequests')
      .find(filter)
      .sort({ requestDate: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    return NextResponse.json({
      requests,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo solicitudes de acceso:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}


