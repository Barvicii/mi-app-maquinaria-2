import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/mongodb";
import { ObjectId } from 'mongodb';
import { sanitizeSearchFilters, searchRateLimiter } from "@/lib/security";

// Fields that are safe to expose publicly (via QR scan)
const PUBLIC_SAFE_FIELDS = {
  _id: 1, machineId: 1, maquinaId: 1, customId: 1, Machine_ID: 1,
  model: 1, modelo: 1, brand: 1, serialNumber: 1, serie: 1,
  year: 1, currentHours: 1, horasActuales: 1,
  engineOil: 1, hydraulicOil: 1, transmissionOil: 1,
  filters: 1, chemicalFilters: 1, tires: 1,
  lastService: 1, nextService: 1, proximoService: 1,
  prestartTemplateId: 1
};

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
    const { searchParams } = new URL(request.url);
    const publicAccess = searchParams.get('public') === 'true';
    
    let userId = null;
    let credentialId = null;
    let userRole = null;
    let userOrganization = null;
    
    // Verificar autenticación excepto para acceso público
    if (!publicAccess) {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }
      
      // Check if organization is suspended
      const suspensionCheck = checkOrganizationSuspension(session);
      if (suspensionCheck) return suspensionCheck;
      
      userId = session.user.id;
      userRole = session.user.role;
      userOrganization = session.user.organization || session.user.company; // Fallback para compatibilidad
      
      // Debug log para verificar el rol y organización
      console.log(`🔍 User Debug - ID: ${userId}, Role: ${userRole}, Organization: ${userOrganization}`);
      
      // Get credentialId from session
      if (session.user.credentialId) {
        credentialId = session.user.credentialId;
        // Check if it's already an ObjectId or needs conversion
        if (typeof credentialId === 'string') {
          credentialId = new ObjectId(credentialId);
        }
      }
    }
    
    const db = await connectDB();
    
    // Crear consulta basada en el rol del usuario
    let query = {};
    if (!publicAccess) {
      if (userRole === 'SUPER_ADMIN') {
        // Super admin puede ver todas las máquinas
        query = {};
      } else if ((userRole === 'ADMIN' || userRole === 'admin') && userOrganization) {
        // Admin puede ver todas las máquinas de su organización
        query = { 
          $or: [
            { organization: userOrganization },
            { userId: userId }, // También las máquinas que creó personalmente
            { createdBy: userId }
          ]
        };
      } else if (credentialId) {
        // Usuario regular filtrado por credentialId
        console.log(`Filtering by credentialId: ${credentialId}`);
        query = { "credentialId": credentialId };
      } else if (userId) {
        // Fallback a userId si no hay credentialId
        query = {
          $or: [
            { userId: userId },
            { createdBy: userId }
          ]
        };
      }
    }
    
    // Debug log para verificar la query construida
    console.log(`🔍 Query constructed:`, JSON.stringify(query, null, 2));
    
    // Rate limiting for search queries to prevent abuse
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!searchRateLimiter.isAllowed(clientIp)) {
      return NextResponse.json(
        { error: 'Too many search requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    // Agregar filtros adicionales desde los parámetros de búsqueda - SECURED
    const rawFilters = {
      machineId: searchParams.get('machineId'),
      brand: searchParams.get('brand'),
      model: searchParams.get('model'),
      workplace: searchParams.get('workplace')
    };
    
    // Sanitize all search filters to prevent NoSQL injection
    const searchFilters = sanitizeSearchFilters(rawFilters);
    
    // Handle special case for model field (dual field names)
    if (rawFilters.model && searchFilters.model) {
      // Convert the single model filter to an $or query for both field names
      const modelFilter = searchFilters.model;
      delete searchFilters.model;
      searchFilters.$or = [
        { model: modelFilter },
        { modelo: modelFilter }
      ];
    }
    
    // Combinar filtros de autorización con filtros de búsqueda
    if (Object.keys(searchFilters).length > 0 && Object.keys(query).length > 0) {
      query = {
        $and: [
          query,
          searchFilters
        ]
      };
    } else if (Object.keys(searchFilters).length > 0) {
      query = searchFilters;
    }
    
    console.log('Machines query with filters:', JSON.stringify(query));
    console.log('User role:', userRole, 'Organization:', userOrganization);
    
    const machines = await db.collection('machines')
      .find(query)
      .project(publicAccess ? PUBLIC_SAFE_FIELDS : {})
      .toArray();
    return NextResponse.json(machines);
  } catch (error) {
    console.error('Error fetching machines:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
      // Obtener la sesión del usuario
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Check if organization is suspended
    const suspensionCheck = checkOrganizationSuspension(session);
    if (suspensionCheck) return suspensionCheck;
    
    const db = await connectDB();
    
    // Estandarizar utilizando userId para propiedad y agregar organización
    const userOrganization = session.user.organization || session.user.company || 'Default';
    
    console.log(`🏭 Creating machine with organization: ${userOrganization} for user: ${session.user.email}`);
    
    const machineData = {
      ...body,
      userId: session.user.id,              // Campo estándar para propiedad
      createdBy: session.user.id,           // Mantener para auditoría
      organization: userOrganization,       // Usar organización real del usuario
      createdAt: new Date()
    };

    // Para usuarios regulares, usar automáticamente su workplace asignado
    if (session.user.role === 'USER' && session.user.workplace) {
      machineData.workplace = session.user.workplace;
    }
    // Para admins, usar el workplace que seleccionaron en el formulario
    else if (!machineData.workplace) {
      machineData.workplace = 'N/A';
    }
    
    const result = await db.collection('machines').insertOne(machineData);
    
    return NextResponse.json({ 
      _id: result.insertedId,
      ...machineData
    });
  } catch (error) {
    console.error('Error al crear máquina:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const data = await request.json();
    
    console.log('[API] PUT /api/machines - Updating machine:', id);
    console.log('[API] Machine data:', data);
    
    // Validar la sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    
    // Conectar a la base de datos
    const db = await connectDB();
    
    // Buscar la máquina por diferentes posibles identificadores
    let query = {};
    
    if (ObjectId.isValid(id)) {
      query._id = new ObjectId(id);
    } else {
      // Si no es un ObjectId válido, intentar otros campos
      query = {
        $or: [
          { machineId: id },
          { customId: id }
        ]
      };
    }
    
    console.log('[API] Search query:', JSON.stringify(query));
    
    // Verificar si la máquina existe
    const existingMachine = await db.collection('machines').findOne(query);
    
    if (!existingMachine) {
      console.error('[API] Machine not found with ID:', id);
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }
    
    console.log('[API] Found machine to update:', existingMachine._id);
    
    // Eliminar campos que no se deben actualizar
    delete data._id; // No actualizar el _id
    
    // Special handling for chemical filters
    if (data.chemicalFilters && data.chemicalFilters.hasFilters) {
      const currentHours = data.currentHours || existingMachine.currentHours || 0;
      const expectedLifeHours = data.chemicalFilters.expectedLifeHours || 100;
      
      // If hasFilters is enabled and there are no current filters, create them automatically
      if (!data.chemicalFilters.currentFilters || data.chemicalFilters.currentFilters.length === 0) {
        const activeFilters = [];
        
        // Create air filter if configured
        if (data.filters && data.filters.air) {
          activeFilters.push({
            type: 'air',
            partNumber: data.filters.air,
            brand: data.filters.airBrand || 'Unknown',
            installationDate: new Date(),
            installationHours: currentHours,
            expectedLifeHours: expectedLifeHours,
            isActive: true
          });
        }
        
        // Create carbon filter if configured
        if (data.filters && data.filters.carbon) {
          activeFilters.push({
            type: 'carbon',
            partNumber: data.filters.carbon,
            brand: data.filters.carbonBrand || 'Unknown',
            installationDate: new Date(),
            installationHours: currentHours,
            expectedLifeHours: expectedLifeHours,
            isActive: true
          });
        }
        
        // If we have filters to create, add them
        if (activeFilters.length > 0) {
          data.chemicalFilters.currentFilters = activeFilters;
          console.log('[API] Auto-created chemical filters:', activeFilters);
        }
      }
    }
    
    // Actualizar la máquina
    const result = await db.collection('machines').updateOne(
      { _id: existingMachine._id },
      { 
        $set: {
          ...data,
          updatedBy: session.user.id,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      console.error('[API] No machine matched for update');
      return NextResponse.json({ error: "Failed to update machine" }, { status: 404 });
    }
    
    console.log('[API] Machine updated successfully');
    
    // Obtener la máquina actualizada
    const updatedMachine = await db.collection('machines').findOne({ _id: existingMachine._id });
    
    return NextResponse.json(updatedMachine);
  } catch (error) {
    console.error('[API] Error updating machine:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


