import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const userId = session.user.id;
    const id = params?.id;
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid prestart ID" }, { status: 400 });
    }
    
    const db = await connectDB();
    
    // Buscar prestart por ID y asegurarse de que pertenece al usuario
    const prestart = await db.collection('prestarts').findOne({
      _id: new ObjectId(id),
      userId: userId
    });

    if (!prestart) {
      return NextResponse.json({ error: "Prestart not found" }, { status: 404 });
    }
    
    return NextResponse.json(prestart);
  } catch (error) {
    console.error('Error fetching prestart:', error);
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
      return NextResponse.json({ error: "Invalid prestart ID" }, { status: 400 });
    }

    const db = await connectDB();
    
    // Verificar que el prestart existe y pertenece al usuario
    const existingPrestart = await db.collection('prestarts').findOne({
      _id: new ObjectId(id),
      userId: userId
    });

    if (!existingPrestart) {
      return NextResponse.json({ error: "Prestart not found" }, { status: 404 });
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

    const result = await db.collection('prestarts').updateOne(
      { _id: new ObjectId(id), userId: userId },
      { $set: data }
    );

    const updatedPrestart = await db.collection('prestarts').findOne({
      _id: new ObjectId(id)
    });

    return NextResponse.json(updatedPrestart);
  } catch (error) {
    console.error('Error updating prestart:', error);
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
      return NextResponse.json({ error: "Invalid prestart ID" }, { status: 400 });
    }
    
    const db = await connectDB();
    
    // Eliminar solo si pertenece al usuario
    const result = await db.collection('prestarts').deleteOne({
      _id: new ObjectId(id),
      userId: userId
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Prestart not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting prestart:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}