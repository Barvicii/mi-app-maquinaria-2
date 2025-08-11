import { NextResponse } from 'next/server';
import { dbConnect } from "@/lib/mongodb";
import AccessRequest from "@/models/AccessRequest";

export async function POST(request) {
  try {
    console.log('🔥 NEW VERSION: Using MongoDB for access requests');
    const body = await request.json();
    const { email, organizationName, contactName, phone } = body;

    // Validar campos requeridos
    if (!email || !organizationName || !contactName || !phone) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Conectar a la base de datos
    await dbConnect();

    // Verificar si ya existe una solicitud con este email
    const existingRequest = await AccessRequest.findOne({ email: email.toLowerCase() });
    if (existingRequest) {
      return NextResponse.json(
        { error: 'A request with this email already exists' },
        { status: 400 }
      );
    }

    // Obtener información adicional del request
    const userAgent = request.headers.get('user-agent') || '';
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.ip || '';

    // Crear nueva solicitud en MongoDB
    const newRequest = new AccessRequest({
      email: email.toLowerCase(),
      organizationName,
      contactName,
      phone,
      metadata: {
        userAgent,
        ipAddress
      }
    });

    await newRequest.save();

    console.log('New access request saved to MongoDB:', newRequest);

    return NextResponse.json(
      { message: 'Access request submitted successfully' },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error processing access request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Conectar a la base de datos
    await dbConnect();
    
    // Obtener todas las solicitudes de acceso
    const allRequests = await AccessRequest.find({})
      .sort({ submittedAt: -1 })
      .lean();

    return NextResponse.json(allRequests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


