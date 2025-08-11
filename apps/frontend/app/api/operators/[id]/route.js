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

export async function GET(request, { params }) {
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
    const id = params?.id;
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid operator ID" }, { status: 400 });
    }
    
    const db = await connectDB();
    
    // Buscar operador por ID y asegurarse de que pertenece al usuario
    const operator = await db.collection('operators').findOne({
      _id: new ObjectId(id),
      userId: userId
    });

    if (!operator) {
      return NextResponse.json({ error: "Operator not found" }, { status: 404 });
    }
    
    return NextResponse.json(operator);
  } catch (error) {
    console.error('Error fetching operator:', error);
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

    // Verificar si la organización está suspendida
    const suspensionCheck = checkOrganizationSuspension(session);
    if (suspensionCheck) {
      return suspensionCheck;
    }
    
    const userId = session.user.id;
    const id = params?.id;
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid operator ID" }, { status: 400 });
    }

    const db = await connectDB();
    
    // Verificar que el operador existe y pertenece al usuario
    const existingOperator = await db.collection('operators').findOne({
      _id: new ObjectId(id),
      userId: userId
    });

    if (!existingOperator) {
      return NextResponse.json({ error: "Operator not found" }, { status: 404 });
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

    const result = await db.collection('operators').updateOne(
      { _id: new ObjectId(id), userId: userId },
      { $set: data }
    );

    const updatedOperator = await db.collection('operators').findOne({
      _id: new ObjectId(id)
    });

    return NextResponse.json(updatedOperator);
  } catch (error) {
    console.error('Error updating operator:', error);
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

    // Verificar si la organización está suspendida
    const suspensionCheck = checkOrganizationSuspension(session);
    if (suspensionCheck) {
      return suspensionCheck;
    }
    
    const userId = session.user.id;
    const id = params?.id;
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid operator ID" }, { status: 400 });
    }
    
    const db = await connectDB();
    
    // Eliminar solo si pertenece al usuario
    const result = await db.collection('operators').deleteOne({
      _id: new ObjectId(id),
      userId: userId
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Operator not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting operator:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}