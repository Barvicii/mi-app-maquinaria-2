import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Campos seguros para mostrar públicamente de un servicio
// projection: 1 = include, 0 = exclude
const PUBLIC_SERVICE_FIELDS = {
  _id: 0,
  userId: 0,
  machineCreatorId: 0,
  machineId: 0,
  maquinaId: 0,
  customId: 0,
  'datos.machineId': 0,
  'datos.maquinaId': 0,
  'datos.customId': 0,
  'datos.costo': 0,
};

export async function GET(request, context) {
  try {
    const { id } = await context.params;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);
    const skip = (page - 1) * limit;

    const db = await connectDB();

    // Buscar la máquina primero para obtener todos sus IDs posibles
    let machine = null;
    if (ObjectId.isValid(id)) {
      machine = await db.collection('machines').findOne(
        { $or: [{ _id: new ObjectId(id) }, { machineId: id }] },
        { projection: { _id: 1, machineId: 1, customId: 1, maquinariaId: 1 } }
      );
    }
    if (!machine) {
      machine = await db.collection('machines').findOne(
        { $or: [{ machineId: id }, { customId: id }, { maquinariaId: id }] },
        { projection: { _id: 1, machineId: 1, customId: 1, maquinariaId: 1 } }
      );
    }

    if (!machine) {
      return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
    }

    // Build all possible IDs this machine could be referenced by in services
    const possibleIds = [
      machine._id.toString(),
      machine.machineId,
      machine.customId,
      machine.maquinariaId
    ].filter(Boolean);

    // Also try as ObjectId
    const objectIdVariants = possibleIds
      .filter(mid => ObjectId.isValid(mid))
      .map(mid => new ObjectId(mid));

    // Search services using all possible field names and ID formats
    const serviceFilter = {
      $or: [
        { machineId: { $in: possibleIds } },
        { maquinaId: { $in: possibleIds } },
        { 'datos.machineId': { $in: possibleIds } },
        { 'datos.maquinaId': { $in: possibleIds } },
        { customId: { $in: possibleIds } },
        { 'datos.customId': { $in: possibleIds } },
        ...(objectIdVariants.length > 0 ? [
          { machineId: { $in: objectIdVariants } }
        ] : [])
      ]
    };

    const [services, total] = await Promise.all([
      db.collection('services')
        .find(serviceFilter)
        .project(PUBLIC_SERVICE_FIELDS)
        .sort({ createdAt: -1, fechaInicio: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('services')
        .countDocuments(serviceFilter)
    ]);

    // Normalize service data for consistent frontend display
    const normalizedServices = services.map(svc => ({
      serviceType: svc.tipoService || svc.datos?.tipoService || svc.serviceType || 'Unknown',
      description: svc.datos?.observaciones || svc.datos?.trabajosRealizados?.join(', ') || svc.description || '',
      horasIniciales: svc.datos?.horasActuales || svc.horasActuales || svc.horasIniciales || null,
      horasFinales: svc.datos?.horasProximoService || svc.horasProximoService || svc.horasFinales || null,
      tecnico: svc.datos?.tecnico || null,
      status: svc.status || 'Pendiente',
      fechaInicio: svc.fecha || svc.fechaInicio || svc.createdAt,
    }));

    return NextResponse.json({
      services: normalizedServices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching public services:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
