import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/api/auth/[...nextauth]/route';
import { connectDB } from "@/lib/mongodb";
import { ObjectId } from 'mongodb';

// GET - Obtener historial de recargas de un tanque
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tankId = searchParams.get('tankId');

    if (!tankId) {
      return NextResponse.json({ error: 'Tank ID requerido' }, { status: 400 });
    }

    const db = await connectDB();

    // Verificar que el tanque pertenece al usuario
    const tank = await db.collection('dieseltanks').findOne({
      _id: new ObjectId(tankId),
      $or: [
        { userId: session.user.id },
        { userId: new ObjectId(session.user.id) }
      ]
    });

    if (!tank) {
      return NextResponse.json({ error: 'Tanque no encontrado' }, { status: 404 });
    }

    // Obtener historial de recargas
    const refills = await db.collection('diesel_refills').find({
      tankId: new ObjectId(tankId)
    }).sort({ refillDate: -1 }).toArray();

    return NextResponse.json({
      success: true,
      refills: refills.map(refill => ({
        ...refill,
        _id: refill._id.toString(),
        tankId: refill.tankId.toString()
      }))
    });

  } catch (error) {
    console.error('Error obteniendo recargas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Registrar una nueva recarga de tanque
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { tankId, liters, refillDate, notes, workplace } = body;

    // Validaciones
    if (!tankId || !liters || !refillDate) {
      return NextResponse.json({ 
        error: 'Tank ID, litros y fecha son requeridos' 
      }, { status: 400 });
    }

    if (liters <= 0) {
      return NextResponse.json({ 
        error: 'Los litros deben ser mayor a 0' 
      }, { status: 400 });
    }

    const db = await connectDB();

    // Verificar que el tanque pertenece al usuario
    const tank = await db.collection('dieseltanks').findOne({
      _id: new ObjectId(tankId),
      $or: [
        { userId: session.user.id },
        { userId: new ObjectId(session.user.id) }
      ]
    });

    if (!tank) {
      return NextResponse.json({ error: 'Tanque no encontrado' }, { status: 404 });
    }

    // Crear registro de recarga
    const refillRecord = {
      tankId: new ObjectId(tankId),
      userId: session.user.id,
      liters: parseFloat(liters),
      refillDate: new Date(refillDate),
      notes: notes || '',
      workplace: workplace || '',
      createdAt: new Date(),
      createdBy: session.user.email || session.user.name
    };

    const result = await db.collection('diesel_refills').insertOne(refillRecord);

    // Actualizar el nivel actual del tanque (opcional - sumar los litros)
    await db.collection('dieseltanks').updateOne(
      { _id: new ObjectId(tankId) },
      { 
        $inc: { currentLevel: parseFloat(liters) },
        $set: { lastRefillDate: new Date(refillDate) }
      }
    );

    return NextResponse.json({
      success: true,
      refillId: result.insertedId.toString(),
      message: 'Recarga registrada exitosamente'
    });

  } catch (error) {
    console.error('Error registrando recarga:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}


