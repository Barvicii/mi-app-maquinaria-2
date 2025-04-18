import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    const { searchParams } = new URL(request.url);
    const publicAccess = searchParams.get('public') === 'true';
    
    let userId = null;
    
    if (!publicAccess) {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }
      userId = session.user.id;
    }
    
    const { id } = params;
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid service ID" }, { status: 400 });
    }
    
    const db = await connectDB();
    
    // Construir consulta - incluir verificación de userId cuando no es público
    let query = { _id: new ObjectId(id) };
    if (!publicAccess) {
      query.userId = userId;
    }
    
    const service = await db.collection('services').findOne(query);
    
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }
    
    return NextResponse.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
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
    const { id } = params;
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid service ID" }, { status: 400 });
    }

    const db = await connectDB();
    
    // Verificar que el servicio existe y pertenece al usuario
    const existingService = await db.collection('services').findOne({
      _id: new ObjectId(id),
      userId: userId  // Solo permitir actualizar servicios propios
    });

    if (!existingService) {
      return NextResponse.json({ error: "Service not found or you don't have permission" }, { status: 404 });
    }
    
    let data;
    try {
      data = await request.json();
    } catch (error) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    
    // Actualizar servicio
    const result = await db.collection('services').updateOne(
      { _id: new ObjectId(id), userId: userId },
      { $set: data }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }
    
    return NextResponse.json({ message: "Service updated successfully" });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    console.log('DELETE /api/services/[id] called with params:', params);
    
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { id } = await params; // Usar await para asegurarse de que params está resuelto
    
    if (!id || !ObjectId.isValid(id)) {
      console.error(`Invalid service ID: ${id}`);
      return NextResponse.json({ error: "Invalid service ID" }, { status: 400 });
    }
    
    const db = await connectDB();
    
    // Verificar primero si el servicio existe
    const service = await db.collection('services').findOne({
      _id: new ObjectId(id)
    });
    
    if (!service) {
      console.error(`Service with ID ${id} not found`);
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }
    
    // Permitir eliminar si:
    // 1. El servicio pertenece al usuario actual
    // 2. O el servicio es público Y está asociado a una máquina del usuario
    
    let canDelete = false;
    
    if (service.userId === userId) {
      // El servicio pertenece directamente al usuario
      canDelete = true;
    } else if (service.userId === "public_user") {
      // Es un servicio público, verificar si la máquina pertenece al usuario
      try {
        const machine = await db.collection('machines').findOne({
          _id: new ObjectId(service.maquinaId),
          userId: userId
        });
        
        canDelete = !!machine; // Puede eliminar si la máquina existe y pertenece al usuario
      } catch (error) {
        console.error(`Error verifying machine ownership: ${error.message}`);
      }
    }
    
    if (!canDelete) {
      console.error(`User ${userId} not authorized to delete service ${id}`);
      return NextResponse.json({ error: "Not authorized to delete this service" }, { status: 403 });
    }
    
    // Realizar eliminación
    console.log(`Deleting service ${id} for user ${userId}`);
    const result = await db.collection('services').deleteOne({
      _id: new ObjectId(id)
    });
    
    if (result.deletedCount === 0) {
      console.error(`Failed to delete service ${id}`);
      return NextResponse.json({ error: "Failed to delete service" }, { status: 500 });
    }
    
    console.log(`Service ${id} successfully deleted`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}