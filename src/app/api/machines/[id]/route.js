import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(request, { params }) {
  try {
    // Asegurarse de que params esté definido antes de acceder a id
    if (!params) {
      console.error('params is undefined');
      return NextResponse.json({ error: "Invalid request: params is undefined" }, { status: 400 });
    }
    
    const id = params.id;
    
    console.log(`GET /api/machines/${id} (public: true)`);
    
    if (!id) {
      return NextResponse.json({ error: "Machine ID is required" }, { status: 400 });
    }
    
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get('public') === 'true';
    
    const db = await connectDB();
    
    // Mejora: Búsqueda más flexible por diferentes tipos de ID
    let machine = null;
    
    // 1. Intentar buscar por ObjectId
    if (ObjectId.isValid(id)) {
      machine = await db.collection('machines').findOne({ 
        _id: new ObjectId(id) 
      });
      console.log(`Búsqueda por ObjectId: ${!!machine}`);
    }
    
    // 2. Si no se encuentra, buscar por machineId, maquinaId o cualquier otro campo ID
    if (!machine) {
      machine = await db.collection('machines').findOne({
        $or: [
          { machineId: id },
          { maquinaId: id },
          { customId: id }
        ]
      });
      console.log(`Búsqueda por IDs alternativos: ${!!machine}`);
    }
    
    if (!machine) {
      console.log(`Machine with ID ${id} not found`);
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }
    
    console.log(`Machine found: ${machine._id}`);
    
    // Asegurarse de que la respuesta incluya todos los campos necesarios
    const response = {
      ...machine,
      _id: machine._id.toString(),
      machineId: machine.machineId || machine._id.toString(),
      maquinaId: machine.maquinaId || machine.machineId || machine._id.toString()
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching machine:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, context) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { id } = await context.params;
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid machine ID" }, { status: 400 });
    }

    const db = await connectDB();
    
    // Verificar que la máquina existe y pertenece al usuario
    const existingMachine = await db.collection('machines').findOne({
      _id: new ObjectId(id),
      userId: userId
    });

    if (!existingMachine) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }
    
    let data;
    try {
      data = await request.json();
    } catch (error) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (data._id) {
      delete data._id;
    }
    
    // Asegurar que no se puede cambiar el userId
    data.userId = userId;
    data.updatedAt = new Date();

    const result = await db.collection('machines').updateOne(
      { _id: new ObjectId(id), userId: userId },
      { $set: data }
    );

    const updatedMachine = await db.collection('machines').findOne({
      _id: new ObjectId(id)
    });

    return NextResponse.json(updatedMachine);
  } catch (error) {
    console.error('Error updating machine:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { id } = await context.params;
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid machine ID" }, { status: 400 });
    }
    
    const db = await connectDB();
    
    // Eliminar solo si pertenece al usuario
    const result = await db.collection('machines').deleteOne({
      _id: new ObjectId(id),
      userId: userId
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting machine:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}