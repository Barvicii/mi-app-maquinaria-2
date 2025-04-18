import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';

// GET para obtener técnicos
export async function GET(request) {
  console.log('[API] GET /api/technicians - Request received');
  
  const { searchParams } = new URL(request.url);
  const isPublic = searchParams.get('public') === 'true';
  const machineId = searchParams.get('machineId');
  
  console.log(`[API] Technicians - Public: ${isPublic}, MachineId: ${machineId}`);
  
  try {
    const db = await connectDB();
    let userId = null;
    
    // IMPORTANTE: Si se proporciona machineId, buscar el creador de la máquina
    // y filtrar técnicos por ese usuario
    if (machineId) {
      console.log(`[API] Buscando creador de la máquina ${machineId}`);
      
      let machine;
      if (ObjectId.isValid(machineId)) {
        machine = await db.collection('machines').findOne({ 
          _id: new ObjectId(machineId) 
        });
      }
      
      if (!machine) {
        // Buscar usando otros campos posibles
        machine = await db.collection('machines').findOne({
          $or: [
            { machineId: machineId },
            { maquinaId: machineId },
            { customId: machineId }
          ]
        });
      }
      
      if (machine && machine.userId) {
        userId = machine.userId;
        console.log(`[API] Máquina encontrada. Creador: ${userId}`);
      } else {
        console.log(`[API] No se encontró la máquina o no tiene userId`);
      }
    } 
    // Si no hay machineId y no es público, obtener usuario de la sesión
    else if (!isPublic) {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: "Not authenticated" }, { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      userId = session.user.id;
    }
    
    // Construir la consulta para buscar técnicos
    let query = { 
      $or: [
        { tipo: { $in: ['technician', 'técnico', 'Técnico'] } },
        { especialidad: { $exists: true } }
      ]
    };
    
    // CLAVE: Filtrar por userId si está disponible (ya sea del creador de la máquina o sesión)
    if (userId) {
      query.userId = userId;
      console.log(`[API] Filtrando técnicos por userId: ${userId}`);
    }
    
    console.log('[API] Query:', JSON.stringify(query));
    
    // Buscar técnicos
    let technicians = [];
    try {
      technicians = await db.collection('operators')
        .find(query)
        .sort({ nombre: 1 })
        .toArray();
      
      console.log(`[API] Encontrados ${technicians.length} técnicos`);
    } catch (dbError) {
      console.error('[API] Error al consultar técnicos:', dbError);
    }
    
    // Si no hay técnicos de ese usuario, mostrar predeterminados
    if (!technicians || technicians.length === 0) {
      console.log('[API] Sin técnicos, devolviendo predeterminados');
      
      // Si tenemos un userId, intentar obtener al menos operadores normales
      if (userId) {
        try {
          const operators = await db.collection('operators')
            .find({ userId: userId })
            .sort({ nombre: 1 })
            .limit(2)
            .toArray();
          
          if (operators.length > 0) {
            console.log('[API] Usando operadores regulares como fallback');
            return NextResponse.json(operators, {
              headers: { 'Content-Type': 'application/json' }
            });
          }
        } catch (err) {
          console.error('[API] Error al buscar operadores fallback:', err);
        }
      }
      
      const defaultTechnicians = [
        { _id: 'default1', nombre: 'Técnico', apellido: 'General', especialidad: 'Mantenimiento' },
        { _id: 'default2', nombre: 'Técnico', apellido: 'Especialista', especialidad: 'Eléctrica' }
      ];
      
      return NextResponse.json(defaultTechnicians, {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return NextResponse.json(technicians, {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[API] Error en API de técnicos:', error);
    return NextResponse.json([
      { _id: 'error1', nombre: 'Técnico', apellido: 'General', especialidad: 'Mantenimiento' }
    ], {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST para crear un nuevo técnico
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const data = await request.json();
    const { nombre, especialidad, contacto } = data;

    if (!nombre) {
      return NextResponse.json({ error: "Nombre is required" }, { status: 400 });
    }

    const db = await connectDB();
    
    const result = await db.collection('technicians').insertOne({
      nombre,
      especialidad: especialidad || '',
      contacto: contacto || '',
      userId: session.user.id,
      createdAt: new Date()
    });

    return NextResponse.json({
      id: result.insertedId,
      message: "Technician created successfully"
    });
  } catch (error) {
    console.error('Error creating technician:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}