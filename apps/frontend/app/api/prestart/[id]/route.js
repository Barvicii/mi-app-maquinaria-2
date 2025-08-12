import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

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

// GET - Obtener un prestart por ID
export async function GET(request, { params }) {
  try {
    // Esperar a que params esté disponible 
    const { id } = await params;
    
    console.log(`[API] GET /api/prestart/${id} - Endpoint llamado`);
    
    if (!id) {
      return NextResponse.json({ error: "Prestart ID is required" }, { status: 400 });
    }
    
    const db = await connectDB();
    
    let prestart;
    if (ObjectId.isValid(id)) {
      prestart = await db.collection('prestart').findOne({
        _id: new ObjectId(id)
      });
    }
      if (!prestart) {
      return NextResponse.json({ error: "Prestart not found" }, { status: 404 });
    }
    
    return NextResponse.json(prestart);
  } catch (error) {
    console.error('[API] Error obteniendo prestart:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Actualizar un prestart por ID
export async function PUT(request, { params }) {
  try {
    // Verificar autenticación
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
    const { id } = await params;
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid prestart ID" }, { status: 400 });
    }

    const db = await connectDB();
    
    // Verificar que el prestart existe y pertenece al usuario
    const existingPrestart = await db.collection('prestart').findOne({
      _id: new ObjectId(id),
      userId: userId  // Solo permitir actualizar prestarts propios
    });

    if (!existingPrestart) {
      return NextResponse.json({ error: "Prestart not found or you don't have permission" }, { status: 404 });
    }
    
    let data;
    try {
      data = await request.json();
    } catch (error) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    
    // Actualizar prestart
    const result = await db.collection('prestart').updateOne(
      { _id: new ObjectId(id), userId: userId },
      { $set: data }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Prestart not found" }, { status: 404 });
    }
    
    return NextResponse.json({ message: "Prestart updated successfully" });
  } catch (error) {
    console.error('Error updating prestart:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Eliminar un prestart por ID
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    console.log(`[API] DELETE /api/prestart/${id} - Endpoint llamado`);
    
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('[API] Error: No autenticado');
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verificar si la organización está suspendida
    const suspensionCheck = checkOrganizationSuspension(session);
    if (suspensionCheck) {
      return suspensionCheck;
    }
    
    const userId = session.user.id;
    const isAdmin = session.user.role === 'admin';
    
    // Verificar que el ID existe
    if (!id) {
      console.error('[API] Error: ID no proporcionado');
      return NextResponse.json({ error: "Prestart ID is required" }, { status: 400 });
    }
    
    // Validar que el ID es un ObjectId válido
    if (!ObjectId.isValid(id)) {
      console.error(`[API] Error: ID inválido ${id}`);
      return NextResponse.json({ error: "Invalid prestart ID format" }, { status: 400 });
    }
    
    const db = await connectDB();
    
    // Primero, buscar el prestart para verificar permisos
    const prestart = await db.collection('prestart').findOne({
      _id: new ObjectId(id)
    });
    
    if (!prestart) {
      console.error(`[API] Error: Prestart con ID ${id} no encontrado`);
      return NextResponse.json({ error: "Prestart not found" }, { status: 404 });
    }
    
    // Verificar permisos: solo el creador o un admin pueden eliminar
    if (!isAdmin && prestart.userId !== userId) {
      console.error(`[API] Error: Usuario ${userId} no tiene permiso para eliminar prestart de ${prestart.userId}`);
      return NextResponse.json({ 
        error: "You don't have permission to delete this prestart" 
      }, { status: 403 });
    }
    
    // Eliminar el prestart
    const result = await db.collection('prestart').deleteOne({
      _id: new ObjectId(id)
    });
    
    if (result.deletedCount === 0) {
      console.error(`[API] Error: No se pudo eliminar prestart ${id}`);
      return NextResponse.json({ error: "Failed to delete prestart" }, { status: 500 });
    }
    
    console.log(`[API] Prestart ${id} eliminado exitosamente`);
    
    return NextResponse.json({ 
      message: "Prestart deleted successfully",
      id: id
    });
  } catch (error) {
    console.error('[API] Error eliminando prestart:', error);
    return NextResponse.json({ 
      error: error.message || "Failed to delete prestart" 
    }, { status: 500 });
  }
}