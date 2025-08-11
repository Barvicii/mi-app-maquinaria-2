import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/api/auth/[...nextauth]/route';
import { connectDB } from "@/lib/mongodb";
import { PERMISSIONS } from "@/lib/roles";
import { withPermission } from "@/middleware/permissionsMiddleware";

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
      query.credentialId = session.user.credentialId;
    }

    // Add workplace filter if specified
    if (workplace && workplace !== '') {
      query.workplaceName = workplace;
    }

    console.log(`[API] Fetching machines with query:`, JSON.stringify(query));
    
    const machines = await db.collection('machines')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    // Format the data - pick only the important fields
    const formattedData = machines.map(machine => ({
      _id: machine._id.toString(),
      model: machine.model || machine.modelo || '',
      brand: machine.brand || machine.marca || '',
      machineId: machine.machineId || machine.maquinariaId || '',
      serialNumber: machine.serialNumber || machine.serie || '',
      year: machine.year || machine.anio || '',
      currentHours: machine.currentHours || machine.horasActuales || '',
      lastService: machine.lastService || machine.ultimoService || '',
      nextService: machine.nextService || machine.proximoService || '',
      createdAt: machine.createdAt ? new Date(machine.createdAt).toISOString() : '',
      updatedAt: machine.updatedAt ? new Date(machine.updatedAt).toISOString() : '',
    }));
    
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error generating machines report:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});


