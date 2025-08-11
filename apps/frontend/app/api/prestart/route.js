import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { ObjectId } from "mongodb";
import { checkPrestartStatus } from "@/lib/alertService";
import { sanitizeInput, createSafeRegexQuery } from "@/lib/security";

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

export async function POST(request) {
  try {
    // Verificar si la solicitud es pública
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get('public') === 'true';
    
    console.log('[API] POST /api/prestart - Public mode:', isPublic);
    
    let userId = null;
    let credentialId = null;
    
    // Conectar a la base de datos
    const db = await connectDB();
    
    // Obtener y validar los datos de la solicitud
    const data = await request.json();
    
    // Validaciones básicas
    if (!data.maquinaId) {
      return NextResponse.json({ error: "Machine ID is required" }, { status: 400 });
    }
      // Si no es acceso público, verificar autenticación
    if (!isPublic) {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }
      userId = session.user.id;
      credentialId = session.user.credentialId;

      // Verificar si la organización está suspendida
      const suspensionCheck = checkOrganizationSuspension(session);
      if (suspensionCheck) {
        return suspensionCheck;
      }
    } else {
      // Si es acceso público, intentar encontrar el propietario de la máquina
      let machineOwner = null;
      let machineCredentialId = null;
      
      try {
        // Buscar la máquina por diferentes campos de ID posibles
        const machine = await db.collection('machines').findOne({
          $or: [
            { _id: ObjectId.isValid(data.maquinaId) ? new ObjectId(data.maquinaId) : null },
            { machineId: data.maquinaId },
            { customId: data.maquinaId }
          ]
        });
        
        if (machine) {
          console.log('[API] Found machine for prestart:', machine._id);
          // Obtener el userId del dueño de la máquina
          machineOwner = machine.userId || machine.createdBy;
          
          // Obtener el credentialId directamente o desde el usuario
          if (machine.credentialId) {
            machineCredentialId = machine.credentialId;
          } else if (machineOwner) {
            const owner = await db.collection('users').findOne({ 
              $or: [
                { _id: ObjectId.isValid(machineOwner) ? new ObjectId(machineOwner) : null },
                { id: machineOwner }
              ]
            });
            
            if (owner) {
              machineCredentialId = owner.credentialId;
            }
          }
          
          console.log(`[API] Found machine owner: ${machineOwner}, credentialId: ${machineCredentialId}`);
        } else {
          console.log('[API] Machine not found for ID:', data.maquinaId);
        }
      } catch (err) {
        console.error('[API] Error finding machine owner:', err);
      }
      
      // Usar los valores encontrados o public_user si no se encontraron
      userId = machineOwner || "public_user";
      credentialId = machineCredentialId;
    }
    
    // Crear objeto de prestart con los datos recibidos
    const prestartData = {
      ...data,
      userId: userId,
      createdBy: isPublic ? "public_user" : userId, // Para mantener el origen público
      credentialId: credentialId, // Agregar credentialId si está disponible
      createdAt: new Date(),
      source: isPublic ? 'public' : 'system',
    };
    
    console.log('[API] Prestart data to save:', {
      ...prestartData,
      _id: undefined, // No mostrar demasiados datos en el log
      checkValues: "..." // No mostrar todos los valores
    });
    
    // Guardar en la base de datos
    const result = await db.collection('prestart').insertOne(prestartData);
    
    console.log(`[API] Prestart created successfully with ID: ${result.insertedId}`);
    
    // Check for alerts after successful creation
    try {
      const createdPrestart = { ...prestartData, _id: result.insertedId };
      await checkPrestartStatus(createdPrestart);
      console.log('[API] Prestart alert check completed');
    } catch (alertError) {
      console.error('[API] Error checking prestart for alerts:', alertError);
      // Don't fail the prestart creation if alert creation fails
    }
    
    // Devolver respuesta exitosa
    return NextResponse.json({ 
      _id: result.insertedId,
      ...prestartData
    }, { status: 201 });
    
  } catch (error) {
    console.error('[API] Error creating prestart:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Verificar si la solicitud es pública
    const isPublic = searchParams.get('public') === 'true';
    
    // Soporte para ambos formatos de fecha para compatibilidad
    const fromDate = searchParams.get('fromDate') || searchParams.get('dateFrom');
    const toDate = searchParams.get('toDate') || searchParams.get('dateTo');
    const machineId = searchParams.get('machineId');
    const workplace = searchParams.get('workplace');
    
    let userId = null;
    let credentialId = null;
    let isAdmin = false;
    
    // Si no es acceso público, verificar autenticación
    if (!isPublic) {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }

      // Verificar si la organización está suspendida
      const suspensionCheck = checkOrganizationSuspension(session);
      if (suspensionCheck) {
        return suspensionCheck;
      }
      
      // Get user credentials
      userId = session.user.id;
      isAdmin = session.user.role === 'SUPER_ADMIN' || session.user.role === 'ADMIN';
      
      if (session.user.credentialId) {
        credentialId = session.user.credentialId;
        // Check if it's already an ObjectId or needs conversion
        if (typeof credentialId === 'string') {
          credentialId = new ObjectId(credentialId);
        }
      }
    }
    
    const db = await connectDB();
    
    // Build query with credential filtering
    let query = {};
    
    // Filter by credential ID if not admin and not public
    if (!isPublic && !isAdmin && credentialId) {
      query.credentialId = credentialId;
    } else if (!isPublic && !isAdmin && userId) {
      // Fallback to userId if no credentialId
      query.userId = userId;
    } else if (!isPublic && isAdmin) {
      // Para admins, no filtrar en la consulta inicial - aplicaremos filtro después del enriquecimiento
      console.log(`[API] Admin access detected - will enrich all prestarts with user data`);
    }
    // Para acceso público, no aplicar filtros de usuario
    
    // Lista de condiciones para combinar con $and si hay múltiples
    let conditions = [];
    
    // Add date filters if provided (para todos los usuarios)
    if (fromDate || toDate) {
      const dateQuery = {};
      if (fromDate) dateQuery.$gte = new Date(fromDate);
      if (toDate) dateQuery.$lte = new Date(toDate);
      
      conditions.push({ fecha: dateQuery });
    }
    
    // Add machine filter if provided - buscar en múltiples campos (para todos los usuarios)
    if (machineId) {
      // Primero buscar máquinas que coincidan con el custom ID - SECURED
      const sanitizedMachineId = sanitizeInput(machineId);
      const machineRegex = createSafeRegexQuery(sanitizedMachineId);
      
      if (!machineRegex) {
        console.log('[API] Invalid machine ID format');
        return NextResponse.json({ error: "Invalid machine ID format" }, { status: 400 });
      }
      
      const machinesWithCustomId = await db.collection('machines').find({
        $or: [
          { machineId: machineRegex },
          { customId: machineRegex },
          { maquinariaId: machineRegex }
        ]
      }).toArray();
      
      console.log(`[API] Found ${machinesWithCustomId.length} machines matching "${machineId}"`);
      
      // Los prestarts guardan el ObjectId de la máquina como STRING en maquinaId
      const machineObjectIdStrings = machinesWithCustomId.map(m => m._id.toString());
      
      // Buscar por ID de máquina de manera flexible
      const machineQuery = {
        $or: [
          // Búsqueda directa por texto (para prestarts que guardan custom ID directamente)
          { maquinaId: machineId },
          { 'datos.machineId': machineId },
          { 'datos.maquinaId': machineId },
          { customId: machineId },
          // Búsqueda por ObjectIds como STRING (como se guardan en prestarts)
          ...(machineObjectIdStrings.length > 0 ? [
            { maquinaId: { $in: machineObjectIdStrings } },
            { 'datos.machineId': { $in: machineObjectIdStrings } },
            { 'datos.maquinaId': { $in: machineObjectIdStrings } }
          ] : [])
        ]
      };
      
      console.log(`[API] PreStart machine query:`, JSON.stringify(machineQuery));
      
      conditions.push(machineQuery);
    }
    
    // Combinar todas las condiciones
    if (conditions.length > 1) {
      query.$and = conditions;
    } else if (conditions.length === 1) {
      query = conditions[0];
    }
    
    // Solo para usuarios no-admin, aplicar filtro de usuario adicional
    if (!isPublic && !isAdmin && userId && !credentialId && machineId) {
      // Si ya hay condiciones, agregar el filtro de usuario
      const userCondition = { userId: userId };
      
      if (query.$and) {
        query.$and.push(userCondition);
      } else {
        query = {
          $and: [
            query,
            userCondition
          ]
        };
      }
    }
      console.log("PreStart query with filters:", JSON.stringify(query));
    
    let prestarts = await db.collection('prestart')
      .find(query)
      .sort({ fecha: -1 })
      .toArray();

    console.log(`Found ${prestarts.length} prestart records`);

    // Si es admin y hay filtro de workplace, filtrar por workplace y enriquecer con datos de usuario
    let enrichedPrestarts = prestarts;
    
    if (isAdmin && (workplace || true)) { // Always enrich for admin to show workplace column
      try {
        // Obtener información de usuarios para enriquecer los prestarts
        const usersCollection = db.collection('users');
        
        // Crear un mapa de userId -> usuario para eficiencia
        const userIds = [...new Set(prestarts.map(prestart => prestart.userId).filter(Boolean))];
        const users = await usersCollection.find({ 
          _id: { $in: userIds.map(id => new ObjectId(id)) } 
        }).toArray();
        
        const userMap = {};
        users.forEach(user => {
          userMap[user._id.toString()] = user;
        });
        
        // Enriquecer prestarts con información del workplace del usuario
        enrichedPrestarts = prestarts.map(prestart => {
          const user = userMap[prestart.userId];
          return {
            ...prestart,
            userWorkplace: user?.workplaceName || user?.workplace || 'N/A',
            userName: user?.name || 'N/A'
          };
        });
        
        // Filtrar por workplace si se especifica
        if (workplace && workplace.trim() !== '') {
          enrichedPrestarts = enrichedPrestarts.filter(prestart => 
            prestart.userWorkplace && 
            prestart.userWorkplace.toLowerCase().includes(workplace.toLowerCase())
          );
        }
        
        console.log(`[API] After workplace filtering: ${enrichedPrestarts.length} prestarts`);
      } catch (error) {
        console.error('[API] Error enriching prestarts with user data:', error);
        // En caso de error, devolver los prestarts originales
        enrichedPrestarts = prestarts;
      }
    }

    return NextResponse.json(enrichedPrestarts);
  } catch (error) {
    console.error('Error fetching prestarts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


