import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/api/auth/[...nextauth]/route';
import { connectDB } from "@/lib/mongodb";
import { PERMISSIONS } from "@/config/roles";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has permission to view reports
    if (!session.user.permissions?.includes(PERMISSIONS.REPORT_VIEW)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    
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
    
    // If not admin, only show operators from the user's organization
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      query.credentialId = session.user.credentialId;
    }
    
    const operators = await db.collection('operators')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    // Format the data - pick only the important fields
    const formattedData = operators.map(operator => ({
      _id: operator._id.toString(),
      name: operator.nombre || '',
      lastName: operator.apellido || '',
      type: operator.tipo || '',
      phone: operator.telefono || '',
      email: operator.email || '',
      specialty: operator.especialidad || '',
      license: operator.licencia || '',
      joinDate: operator.fechaIngreso ? new Date(operator.fechaIngreso).toISOString() : '',
      active: operator.activo !== undefined ? operator.activo : true,
      createdAt: operator.createdAt ? new Date(operator.createdAt).toISOString() : '',
      updatedAt: operator.updatedAt ? new Date(operator.updatedAt).toISOString() : '',
    }));
    
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error generating operators report:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


