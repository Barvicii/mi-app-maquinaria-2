import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/api/auth/[...nextauth]/route';
import { connectDB } from "@/lib/mongodb";
import { PERMISSIONS } from "@/lib/roles";
import { withPermission } from "@/middleware/permissionsMiddleware";
import { ObjectId } from 'mongodb';

// Usando el middleware de permisos para asegurar que solo usuarios con permiso puedan acceder
export const GET = withPermission(PERMISSIONS.REPORT_VIEW)(async (request) => {
  try {
    const session = await getServerSession(authOptions);
    
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const workplace = url.searchParams.get('workplace');
    
    // Create date objects from the parameters
    const dateFilter = {};
    if (startDate) {
      dateFilter['createdAt'] = { $gte: new Date(startDate) };
    }
    if (endDate) {
      dateFilter['createdAt'] = { ...dateFilter['createdAt'], $lte: new Date(endDate + 'T23:59:59.999Z') };
    }
    
    const db = await connectDB();
    
    // Filter based on user's role and permissions
    const query = { ...dateFilter };
    
    // If not admin, only show machines from the user's organization
    if (session.user.role !== 'SUPER_ADMIN') {
      // Use credentialId if available, otherwise fall back to userId for machines/vehicles without credentialId
      if (session.user.credentialId) {
        query.credentialId = session.user.credentialId;
      } else {
        // Use both string and ObjectId format to ensure compatibility
        const userId = session.user.id;
        const userObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;
        query.$or = [
          { userId: userId },
          { userId: userObjectId },
          { createdBy: userId },
          { createdBy: userObjectId }
        ];
      }
    }

    // Add workplace filter if specified
    if (workplace && workplace !== '') {
      query.workplaceName = workplace;
    }

    console.log(`[API] Fetching equipment with query:`, JSON.stringify(query));
    
    // Fetch both machines and vehicles
    const machines = await db.collection('machines')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
      
    const vehicles = await db.collection('vehicles')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log(`[API] Found ${machines.length} machines and ${vehicles.length} vehicles`);
    
    // Format the machine data
    const formattedMachines = machines.map(machine => ({
      _id: machine._id.toString(),
      equipmentType: 'machine',
      model: machine.model || machine.modelo || '',
      brand: machine.brand || machine.marca || '',
      machineId: machine.machineId || machine.maquinariaId || '',
      serialNumber: machine.serialNumber || machine.serie || '',
      year: machine.year || machine.anio || '',
      currentHours: machine.currentHours || machine.horasActuales || '',
      currentKilometers: '', // Empty for machines
      lastService: machine.lastService || machine.ultimoService || '',
      nextService: machine.nextService || machine.proximoService || '',
      nextServiceKm: '', // Empty for machines
      plateNumber: '', // Empty for machines
      createdAt: machine.createdAt ? new Date(machine.createdAt).toISOString() : '',
      updatedAt: machine.updatedAt ? new Date(machine.updatedAt).toISOString() : '',
    }));
    
    // Format the vehicle data
    const formattedVehicles = vehicles.map(vehicle => ({
      _id: vehicle._id.toString(),
      equipmentType: 'vehicle',
      model: vehicle.model || vehicle.modelo || '',
      brand: vehicle.brand || vehicle.marca || '',
      machineId: vehicle.machineId || vehicle.maquinariaId || '',
      serialNumber: vehicle.serialNumber || vehicle.serie || '',
      year: vehicle.year || vehicle.anio || '',
      currentHours: '', // Empty for vehicles
      currentKilometers: vehicle.currentKilometers || vehicle.kilometersActuales || '',
      lastService: vehicle.lastService || vehicle.ultimoService || '',
      nextService: vehicle.nextServiceKm || vehicle.proximoServiceKm || '', // Use KM field for vehicles
      nextServiceKm: vehicle.nextServiceKm || vehicle.proximoServiceKm || '',
      plateNumber: vehicle.plateNumber || vehicle.patente || '',
      createdAt: vehicle.createdAt ? new Date(vehicle.createdAt).toISOString() : '',
      updatedAt: vehicle.updatedAt ? new Date(vehicle.updatedAt).toISOString() : '',
    }));
    
    // Combine and sort by creation date
    const formattedData = [...formattedMachines, ...formattedVehicles]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error generating machines report:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});


