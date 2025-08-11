import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/mongodb";

// Helper function to check organization suspension
const checkOrganizationSuspension = (session) => {
  if (session.user.role !== 'SUPER_ADMIN' && session.user.organizationSuspended === true) {
    return NextResponse.json(
      { error: 'Organization is suspended. Contact support for assistance.' },
      { status: 403 }
    );
  }
  return null;
};

export async function GET(request) {
  try {
    console.log('[API] GET /api/services - Request received');
    
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get('public') === 'true';
    const machineId = searchParams.get('machineId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const status = searchParams.get('status');
    const workplace = searchParams.get('workplace');
    
    let userId = null;
    let isAdmin = false;
    
    if (!isPublic) {
      try {
        const session = await getServerSession(authOptions);
        
        if (session && session.user) {
          userId = session.user.id;
          isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
          console.log(`[API] Authenticated user: ${userId}, Admin: ${isAdmin}`);
        }
      } catch (err) {
        console.error('[API] Error checking session:', err);
      }
    }
    
    const db = await connectDB();
    
    // Construir una consulta que incluya los servicios del usuario
    let query = {};
    
    // Filtrar por máquina específica si se proporciona ID
    if (machineId) {
      query.$or = [
        { machineId: machineId },
        { maquinaId: machineId },
        { 'datos.machineId': machineId }
      ];
    }
    
    // Filtrar por fechas si se proporcionan
    if (dateFrom || dateTo) {
      const dateQuery = {};
      if (dateFrom) {
        dateQuery.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        dateQuery.$lte = new Date(dateTo);
      }
      
      // Aplicar filtro de fecha a múltiples campos posibles
      query.$or = query.$or ? query.$or.concat([
        { createdAt: dateQuery },
        { fecha: dateQuery },
        { 'datos.fecha': dateQuery }
      ]) : [
        { createdAt: dateQuery },
        { fecha: dateQuery },
        { 'datos.fecha': dateQuery }
      ];
    }
    
    // Filtrar por estado si se proporciona
    if (status) {
      query.status = status;
    }
    
    // Si no es admin, filtrar por usuario
    if (!isAdmin && userId) {
      console.log('[API] Filtering services by user credentials:', userId);
      
      // Buscar máquinas del usuario para incluir servicios relacionados
      const userMachines = await db.collection('machines').find({
        $or: [
          { userId: userId },
          { createdBy: userId }
        ]
      }).toArray();
      
      const userMachineIds = userMachines.map(m => 
        [m._id.toString(), m.machineId, m.customId].filter(Boolean)
      ).flat();
      
      console.log('[API] User machine IDs:', userMachineIds);
      
      // Construir consulta para incluir:
      // 1. Servicios del usuario
      // 2. Servicios públicos asociados a las máquinas del usuario
      // 3. Servicios de las máquinas del usuario creados por otros
      
      const finalQuery = {
        $or: [
          // Servicios creados por el usuario
          { userId: userId },
          { machineCreatorId: userId },
          
          // Servicios públicos para máquinas del usuario
          { 
            userId: "public_user",
            machineCreatorId: userId
          },
          
          // Incluir todos los servicios relacionados con máquinas del usuario
          // (si hay máquinas)
          ...(userMachineIds.length > 0 ? [
            {
              $or: [
                { machineId: { $in: userMachineIds } },
                { maquinaId: { $in: userMachineIds } },
                { 'datos.machineId': { $in: userMachineIds } },
                { 'datos.maquinaId': { $in: userMachineIds } },
                { customId: { $in: userMachineIds } },
                { 'datos.customId': { $in: userMachineIds } }
              ]
            }
          ] : [])
        ]
      };
      
      // Mezclar con filtros existentes si hay
      if (Object.keys(query).length > 0) {
        query = { $and: [query, finalQuery] };
      } else {
        query = finalQuery;
      }
      
      console.log('[API] Final query:', JSON.stringify(query, null, 2));
    }
    
    const services = await db.collection('services')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log(`[API] Found ${services.length} services`);
    
    return NextResponse.json(services);
  } catch (error) {
    console.error('[API] Error fetching services:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    console.log('[API] POST /api/services - Request received');
    
    const { searchParams } = new URL(request.url);
    let isPublic = searchParams.get('public') === 'true';
    
    console.log('[API] Services - Public access:', isPublic);
    
    const db = await connectDB();
    
    let userId = null;
    let machineCreatorId = null;
    
    // Obtener los datos del servicio
    const data = await request.json();
    console.log('[API] Services - Request data:', data);
      // Si no es acceso público, obtener la sesión
    if (!isPublic) {
      try {
        // Obtener la sesión
        const session = await getServerSession(authOptions);
        if (session && session.user) {
          userId = session.user.id;
          console.log(`[API] Services - Authenticated user: ${userId}`);
          
          // Verificar si la organización está suspendida
          const suspensionCheck = checkOrganizationSuspension(session);
          if (suspensionCheck) {
            return suspensionCheck;
          }
        }
      } catch (err) {
        console.warn('[API] Services - Error checking session:', err);
      }
    }
    
    // Buscar la máquina relacionada
    let machine = null;
    try {
      // Obtener información de la máquina
      if (ObjectId.isValid(data.machineId)) {
        machine = await db.collection('machines').findOne({
          _id: new ObjectId(data.machineId)
        });
      }
      
      if (!machine) {
        machine = await db.collection('machines').findOne({
          $or: [
            { machineId: data.machineId },
            { maquinaId: data.machineId },
            { customId: data.machineId }
          ]
        });
      }
      
      if (machine) {
        // Obtener el ID del creador de la máquina
        machineCreatorId = machine.userId || machine.createdBy;
        console.log(`[API] Services - Found machine with creator ID: ${machineCreatorId}`);
      }
    } catch (error) {
      console.error('[API] Services - Error finding machine:', error);
    }
    
    // Asignar userId para el servicio
    if (!userId && machineCreatorId) {
      userId = machineCreatorId;
    }
    
    // Si aún no hay userId, usar el modo público
    if (!userId) {
      isPublic = true;
      userId = "public_user";
    }
    
    console.log(`[API] Services - Using userId for ${isPublic ? 'public' : 'authenticated'} request: ${userId}`);
    
    // Crear registro de servicio (estructura mejorada)
    const serviceData = {
      ...data,
      userId: userId,                  // Campo estándar para propiedad
      machineCreatorId: machineCreatorId, // Añadir referencia al creador de la máquina
      createdAt: new Date()
    };
    
    console.log('[API] Services - Saving service with data:', {
      ...serviceData,
      _id: undefined,
      datos: '...' // Ocultar datos anidados en el log
    });
    
    // Insertar el servicio en la base de datos
    const result = await db.collection('services').insertOne(serviceData);
    
    console.log(`[API] Services - Saved with ID: ${result.insertedId}`);
    
    // Devolver el servicio creado
    return NextResponse.json({ 
      _id: result.insertedId,
      ...serviceData
    });
  } catch (error) {
    console.error('[API] Services - Error creating service:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


