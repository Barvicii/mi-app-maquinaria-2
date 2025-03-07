import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Validar que el ID sea un ObjectId válido
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid machine ID format' }, { status: 400 });
    }
    
    const client = await connectDB();
    const db = client.db();
    
    // Solo devolver campos necesarios para acceso público
    const machine = await db.collection('machines').findOne(
      { _id: new ObjectId(id) },
      { projection: { 
        model: 1, 
        brand: 1, 
        machineId: 1, 
        customId: 1,
        serialNumber: 1,
        // Añadir cualquier otro campo necesario para prestart/service
        imagen: 1, // Si hay imagen de la máquina
        lastService: 1, // Puede ser útil mostrar última fecha de servicio
      }}
    );
    
    if (!machine) {
      return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
    }
    
    return NextResponse.json(machine);
  } catch (error) {
    console.error('Error fetching machine:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const userId = session.user.id;
    const id = params?.id;
    
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

export async function DELETE(request, { params }) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const userId = session.user.id;
    const id = params?.id;
    
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