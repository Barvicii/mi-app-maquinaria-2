import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/mongodb"; // Cambia a connectDB
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';

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

export async function GET(request) {
  try {
    // Verificar si es una solicitud pública
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get('public') === 'true';
    
    console.log(`[DEBUG] GET /api/operators (public: ${isPublic})`);
    
    let userId = null;
      // Si no es solicitud pública, verificar autenticación
    if (!isPublic) {
      const session = await getServerSession(authOptions);
      
      if (!session) {
        console.log('[WARN] No session found for non-public request');
        // IMPORTANTE: Devolver un error real en lugar de operadores falsos
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }

      // Verificar si la organización está suspendida
      const suspensionCheck = checkOrganizationSuspension(session);
      if (suspensionCheck) {
        return suspensionCheck;
      }
      
      userId = session.user.id;
      console.log(`[DEBUG] User authenticated, userId: ${userId}`);
    }
    
    // Si es solicitud pública y no hay userId específico, devolver un array vacío
    if (isPublic && !userId && !searchParams.get('userId')) {
      console.log('[INFO] Public request without userId, returning empty array');
      return NextResponse.json([]);
    }
    
    const db = await connectDB();
    
    // Construir la consulta adecuada
    let query = {};
    
    // Si hay un userId específico en los parámetros (prioridad)
    if (searchParams.get('userId')) {
      query.userId = searchParams.get('userId');
      console.log(`[DEBUG] Filtering by specific userId: ${query.userId}`);
    } 
    // Si no es público y hay un usuario autenticado
    else if (!isPublic && userId) {
      query.userId = userId;
      console.log(`[DEBUG] Filtering by authenticated userId: ${userId}`);
    }
    
    console.log(`[DEBUG] Query for operators:`, query);
    
    const operators = await db.collection('operators')
      .find(query)
      .sort({ nombre: 1 })
      .toArray();
    
    console.log(`[DEBUG] Found ${operators.length} operators`);
    
    return NextResponse.json(operators);
  } catch (error) {
    console.error('[ERROR] Error in /api/operators:', error);
    // Devolver error real en lugar de operadores falsos
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Verificación de autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verificar si la organización está suspendida
    const suspensionCheck = checkOrganizationSuspension(session);
    if (suspensionCheck) {
      return suspensionCheck;
    }
    
    const userId = session.user.id;
    const operatorData = await request.json();
    
    // Asignar userId al operador
    operatorData.userId = userId;
    
    // Añadir timestamp
    operatorData.createdAt = new Date();
    
    const client = await connectDB();
    
    const db = await connectDB();
    // Insertar el nuevo operador
    const result = await db.collection('operators').insertOne(operatorData);
    
    return NextResponse.json({
      _id: result.insertedId,
      ...operatorData
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating operator:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar si la organización está suspendida
    const suspensionCheck = checkOrganizationSuspension(session);
    if (suspensionCheck) {
      return suspensionCheck;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const client = await connectDB();
    const db = await connectDB();
    const result = await db.collection('operators').deleteOne({
      _id: new ObjectId(id),
      userId: session.user.id
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting operator:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}


