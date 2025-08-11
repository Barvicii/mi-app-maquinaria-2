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
      dateFilter['$or'] = [
        { 'createdAt': { $gte: new Date(startDate) } },
        { 'fecha': { $gte: new Date(startDate) } }
      ];
    }
    
    if (endDate) {
      const endDateTime = new Date(endDate + 'T23:59:59.999Z');
      if (dateFilter['$or']) {
        dateFilter['$or'] = [
          { 'createdAt': { $gte: new Date(startDate), $lte: endDateTime } },
          { 'fecha': { $gte: new Date(startDate), $lte: endDateTime } }
        ];
      } else {
        dateFilter['$or'] = [
          { 'createdAt': { $lte: endDateTime } },
          { 'fecha': { $lte: endDateTime } }
        ];
      }
    }
    
    const db = await connectDB();
    
    // Filter based on user's role and permissions
    const query = { ...dateFilter };
    
    // If not admin, only show prestarts from the user's organization
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      query.credentialId = session.user.credentialId;
    }
    
    const prestarts = await db.collection('prestart')
      .find(query)
      .sort({ createdAt: -1, fecha: -1 })
      .toArray();
    
    // Format the data - normalize fields from different prestart structures
    const formattedData = prestarts.map(prestart => {
      const data = prestart.datos || prestart;
      const checkValues = data.checkValues || {};
      
      // Get check values from wherever they might exist
      const getCheckValue = (key) => {
        if (data[key] !== undefined) return data[key];
        if (checkValues[key] !== undefined) return checkValues[key];
        return false;
      };
      
      const result = {
        _id: prestart._id.toString(),
        machineId: prestart.maquinaId || prestart.machineId || '',
        operator: data.operador || '',
        hours: data.horasMaquina || '',
        date: prestart.fecha ? new Date(prestart.fecha).toISOString() :
              (prestart.createdAt ? new Date(prestart.createdAt).toISOString() : ''),
        observations: data.observaciones || '',
        status: data.estado || 'Unknown',
        
        // Check items
        aceite: getCheckValue('aceite'),
        agua: getCheckValue('agua'),
        neumaticos: getCheckValue('neumaticos'),
        nivelCombustible: getCheckValue('nivelCombustible'),
        lucesYAlarmas: getCheckValue('lucesYAlarmas'),
        frenos: getCheckValue('frenos'),
        extintores: getCheckValue('extintores'),
        cinturonSeguridad: getCheckValue('cinturonSeguridad'),
        
        // Additional metadata
        createdAt: prestart.createdAt ? new Date(prestart.createdAt).toISOString() : ''
      };
      
      // Calculate overall status
      const checkItems = [
        'aceite', 'agua', 'neumaticos', 'nivelCombustible',
        'lucesYAlarmas', 'frenos', 'extintores', 'cinturonSeguridad'
      ];
      
      result.allChecksPass = checkItems.every(item => getCheckValue(item) === true);
      result.overallStatus = result.allChecksPass ? 'OK' : 'Needs Review';
      
      return result;
    });
    
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error generating prestarts report:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


