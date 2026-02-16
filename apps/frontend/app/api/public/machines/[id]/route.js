import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Solo campos seguros para acceso público — NO exponer userId, organizationId, etc.
const PUBLIC_SAFE_FIELDS = {
  _id: 1,
  machineId: 1,
  maquinaId: 1,
  customId: 1,
  Machine_ID: 1,
  model: 1,
  modelo: 1,
  brand: 1,
  serialNumber: 1,
  serie: 1,
  year: 1,
  currentHours: 1,
  horasActuales: 1,
  engineOil: 1,
  hydraulicOil: 1,
  transmissionOil: 1,
  filters: 1,
  chemicalFilters: 1,
  tires: 1,
  lastService: 1,
  nextService: 1,
  proximoService: 1
};

export async function GET(request, context) {
  try {
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid machine ID format' }, { status: 400 });
    }

    const db = await connectDB();

    // Buscar la máquina por ID — solo campos públicos
    const machine = await db.collection('machines').findOne(
      { _id: new ObjectId(id) },
      { projection: PUBLIC_SAFE_FIELDS }
    );

    if (!machine) {
      return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
    }

    return NextResponse.json(machine);
  } catch (error) {
    console.error('Error fetching public machine:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}