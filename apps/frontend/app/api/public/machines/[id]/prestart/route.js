import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Solo devolver resumen público del prestart (sin observaciones internas)
const PUBLIC_PRESTART_FIELDS = {
  _id: 0,
  fecha: 1,
  estado: 1,
  horasMaquina: 1,
  hasCriticalFailure: 1,
  checkValues: 1,
  templateId: 1,
  // Legacy boolean fields
  aceite: 1,
  agua: 1,
  neumaticos: 1,
  nivelCombustible: 1,
  lucesYAlarmas: 1,
  frenos: 1,
  extintores: 1,
  cinturonSeguridad: 1,
  createdAt: 1
};

export async function GET(request, context) {
  try {
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid machine ID format' }, { status: 400 });
    }

    const db = await connectDB();

    // Verificar que la máquina existe
    const machine = await db.collection('machines').findOne(
      { _id: new ObjectId(id) },
      { projection: { _id: 1 } }
    );

    if (!machine) {
      return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
    }

    // Buscar el último prestart de esta máquina
    const prestart = await db.collection('prestart')
      .findOne(
        { machineId: new ObjectId(id) },
        {
          projection: PUBLIC_PRESTART_FIELDS,
          sort: { fecha: -1 }
        }
      );

    // Si no se encontró por ObjectId, intentar con machineId como string
    if (!prestart) {
      const prestartByString = await db.collection('prestart')
        .findOne(
          { maquinaId: id },
          {
            projection: PUBLIC_PRESTART_FIELDS,
            sort: { fecha: -1 }
          }
        );

      return NextResponse.json({ prestart: prestartByString || null });
    }

    return NextResponse.json({ prestart });
  } catch (error) {
    console.error('Error fetching public prestart:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
