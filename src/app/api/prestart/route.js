import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    console.log('[API] POST /api/prestart - Endpoint called');
    
    const requestUrl = request.url;
    const { searchParams } = new URL(requestUrl);
    const publicAccess = searchParams.get('public') === 'true';
    
    console.log('[API] Public access:', publicAccess);
    
    // Get request data
    let data;
    try {
      data = await request.json();
      console.log('[API] Received data:', data);
    } catch (error) {
      console.error('[API] Error parsing body:', error);
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    
    // Validate machine ID
    if (!data.maquinaId) {
      console.error('[API] Missing machineId in request');
      return NextResponse.json({ error: "Machine ID is required" }, { status: 400 });
    }
    
    const db = await connectDB();
    
    // Find machine and creator details
    let machine = null;
    let machineCreatorId = null;
    let operadorData = null;
    
    try {
      if (ObjectId.isValid(data.maquinaId)) {
        machine = await db.collection('machines').findOne({
          _id: new ObjectId(data.maquinaId)
        });
      }
      
      if (!machine) {
        machine = await db.collection('machines').findOne({
          $or: [
            { machineId: data.maquinaId },
            { maquinaId: data.maquinaId },
            { customId: data.maquinaId }
          ]
        });
      }
      
      if (machine) {
        machineCreatorId = machine.userId;
        console.log(`[API] Found machine, creator: ${machineCreatorId}`);
        
        // Try to find operator
        if (data.operador) {
          const operadorName = data.operador.split(' ')[0];
          
          operadorData = await db.collection('operators').findOne({
            userId: machineCreatorId,
            nombre: { $regex: new RegExp(operadorName, 'i') }
          });
          
          console.log(`[API] Operator found:`, operadorData);
        }
      }
    } catch (error) {
      console.error('[API] Error finding machine/operator:', error);
    }
    
    // Determine userId based on context
    let userId;
    if (!publicAccess) {
      try {
        const session = await getServerSession(authOptions);
        if (!session) {
          return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }
        userId = session.user.id;
      } catch (authError) {
        console.error('[API] Auth error:', authError);
        return NextResponse.json({ error: "Authentication error" }, { status: 401 });
      }
    } else {
      // For public access, set userId to public_user and track machine creator
      userId = "public_user";
    }
    
    // Add metadata to prestart
    const prestartData = {
      maquinaId: data.maquinaId,
      horasMaquina: data.horasMaquina,
      horasProximoService: data.horasProximoService,
      operador: data.operador,
      observaciones: data.observaciones || '',
      // Store all check values from the checkValues object
      ...data.checkValues,
      // Include template ID if provided
      templateId: data.templateId || null,
      // Metadata
      userId: userId,
      machineCreatorId: machineCreatorId,
      operadorId: operadorData ? operadorData._id.toString() : null,
      createdAt: new Date(),
      source: publicAccess ? 'public' : 'system'
    };
    
    // Determine status based on check values
    const hasFailedChecks = Object.values(data.checkValues).some(val => val === false);
    prestartData.estado = hasFailedChecks ? 'Requiere atención' : 'OK';
    
    // Save to database
    const result = await db.collection('prestart').insertOne(prestartData);
    console.log("[API] Prestart saved successfully. ID:", result.insertedId);
    
    return NextResponse.json({
      id: result.insertedId.toString(),
      message: "Prestart created successfully",
      machineCreator: machineCreatorId
    });
  } catch (error) {
    console.error('[API] Error creating prestart:', error);
    return NextResponse.json({ error: error.message || "Failed to create prestart" }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    console.log('[API] GET /api/prestart - Endpoint llamado');
    
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get('public') === 'true';
    const machineId = searchParams.get('machineId');
    
    let currentUserId = null;
    let isAdmin = false;
    
    // Si no es público, verificar autenticación
    if (!isPublic) {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }
      currentUserId = session.user.id;
      
      // Verificar si el usuario es administrador
      isAdmin = session.user.role === 'admin';
      console.log(`[API] Usuario autenticado: ${currentUserId}, Admin: ${isAdmin}`);
    }
    
    const db = await connectDB();
    
    // Construir la consulta según el contexto
    let query = {};
    
    if (machineId) {
      // Si se especifica una máquina, filtrar por esa máquina
      if (ObjectId.isValid(machineId)) {
        query.maquinaId = machineId;
      } else {
        query.$or = [
          { maquinaId: machineId },
          { 'machine.machineId': machineId },
          { 'machine.customId': machineId }
        ];
      }
    }
    
    if (!isAdmin && currentUserId) {
      // Para usuarios normales, mostrar:
      // 1. Los prestart que creó directamente
      // 2. Los prestart de máquinas que él creó (donde machineCreatorId = currentUserId)
      
      // Primero, buscar las máquinas creadas por este usuario
      const userMachines = await db.collection('machines')
        .find({ userId: currentUserId })
        .project({ _id: 1 })
        .toArray();
      
      const userMachineIds = userMachines.map(m => m._id.toString());
      
      // Filtrar por usuario o por máquinas creadas por el usuario
      query = {
        $or: [
          { userId: currentUserId },
          { machineCreatorId: currentUserId },
          { maquinaId: { $in: userMachineIds } }
        ]
      };
      
      console.log(`[API] Filtrando prestarts por usuario ${currentUserId} y sus ${userMachineIds.length} máquinas`);
    } else if (isAdmin) {
      // Los administradores ven todos los prestart
      console.log('[API] Usuario es admin, mostrando todos los prestart');
    } else if (isPublic && machineId) {
      // En modo público con machineId, mostrar solo los de esa máquina
      console.log(`[API] Modo público, filtrando solo por máquina: ${machineId}`);
    }
    
    console.log("[API] Consulta final:", JSON.stringify(query, null, 2));
    
    const prestarts = await db.collection('prestart')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log(`[API] Encontrados ${prestarts.length} registros de prestart`);
    
    // Procesar resultados para incluir información de máquinas y operadores
    const processedPrestarts = await Promise.all(prestarts.map(async (prestart) => {
      try {
        // Buscar información de la máquina
        if (prestart.maquinaId && !prestart.machine) {
          let machineData;
          if (ObjectId.isValid(prestart.maquinaId)) {
            machineData = await db.collection('machines').findOne({ 
              _id: new ObjectId(prestart.maquinaId) 
            });
          }
          
          if (machineData) {
            prestart.machine = {
              _id: machineData._id.toString(),
              marca: machineData.marca,
              modelo: machineData.modelo,
              machineId: machineData.machineId || machineData.maquinaId,
              type: machineData.type || machineData.tipo
            };
          }
        }
        
        return prestart;
      } catch (err) {
        console.error('[API] Error procesando prestart:', err);
        return prestart;
      }
    }));
    
    return NextResponse.json(processedPrestarts);
  } catch (error) {
    console.error('[API] Error obteniendo prestarts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}