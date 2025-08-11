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
    
    // If not admin, only show services from the user's organization
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      query.credentialId = session.user.credentialId;
    }
    
    const services = await db.collection('services')
      .find(query)
      .sort({ createdAt: -1, fecha: -1 })
      .toArray();
    
    // Format the data - normalize fields from different service structures
    const formattedData = services.map(service => {
      const serviceData = {};
      
      // ID
      serviceData._id = service._id.toString();
      
      // Machine ID - could be in different locations
      serviceData.machineId = service.machineId || service.maquinaId || 
                              (service.datos && service.datos.maquinaId) || '';
      
      // Service details
      serviceData.serviceType = service.tipoService || (service.datos && service.datos.tipoService) || '';
      serviceData.technician = service.tecnico || (service.datos && service.datos.tecnico) || '';
      serviceData.currentHours = service.horasActuales || (service.datos && service.datos.horasActuales) || '';
      serviceData.nextServiceHours = service.horasProximoService || 
                                    (service.datos && service.datos.horasProximoService) || '';
      
      // Work performed
      if (service.trabajosRealizados || (service.datos && service.datos.trabajosRealizados)) {
        const trabajos = service.trabajosRealizados || (service.datos && service.datos.trabajosRealizados) || [];
        serviceData.workPerformed = Array.isArray(trabajos) ? trabajos.join(', ') : trabajos.toString();
      } else {
        serviceData.workPerformed = '';
      }
      
      // Other details
      serviceData.parts = service.repuestos || (service.datos && service.datos.repuestos) || '';
      serviceData.observations = service.observaciones || (service.datos && service.datos.observaciones) || '';
      serviceData.cost = service.costo || (service.datos && service.datos.costo) || '';
      
      // Dates
      serviceData.date = service.fecha ? new Date(service.fecha).toISOString() : 
                        (service.createdAt ? new Date(service.createdAt).toISOString() : '');
      serviceData.createdAt = service.createdAt ? new Date(service.createdAt).toISOString() : '';
      
      return serviceData;
    });
    
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error generating services report:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


