import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/mongodb";
import { ObjectId } from 'mongodb';
import { sanitizeSearchFilters, searchRateLimiter } from "@/lib/security";

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
      userOrganization = session.user.organization || session.user.company;
      
      console.log(`🔍 Vehicle GET - User ID: ${userId}, Role: ${userRole}, Organization: ${userOrganization}`);
      
      if (session.user.credentialId) {
        credentialId = session.user.credentialId;
        if (typeof credentialId === 'string') {
          credentialId = new ObjectId(credentialId);
        }
      }
    }
    
    const db = await connectDB();
    
    // Crear consulta basada en el rol del usuario
    let query = { equipmentType: 'vehicle' }; // Solo vehículos
    
    if (!publicAccess) {
      if (userRole === 'SUPER_ADMIN') {
        // Super admin puede ver todos los vehículos
        query = { equipmentType: 'vehicle' };
      } else if ((userRole === 'ADMIN' || userRole === 'admin') && userOrganization) {
        // Admin puede ver todos los vehículos de su organización
        query = { 
          equipmentType: 'vehicle',
          $or: [
            { organization: userOrganization },
            { userId: userId },
            { createdBy: userId }
          ]
        };
      } else if (credentialId) {
        query = { 
          equipmentType: 'vehicle',
          "credentialId": credentialId 
        };
      } else if (userId) {
        query = {
          equipmentType: 'vehicle',
          $or: [
            { userId: userId },
            { createdBy: userId }
          ]
        };
      }
    }
    
    console.log(`🔍 Vehicle Query:`, JSON.stringify(query, null, 2));
    
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!searchRateLimiter.isAllowed(clientIp)) {
      return NextResponse.json(
        { error: 'Too many search requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    // Filtros adicionales desde parámetros de búsqueda
    const filterParams = {};
    ['machineId', 'brand', 'model', 'workplace', 'plateNumber', 'vehicleType'].forEach(field => {
      const value = searchParams.get(field);
      if (value) {
        filterParams[field] = value;
      }
    });
    
    // Sanitizar filtros para prevenir inyección
    const sanitizedFilters = sanitizeSearchFilters(filterParams);
    Object.assign(query, sanitizedFilters);
    
    console.log(`🔍 Final Vehicle Query with filters:`, JSON.stringify(query, null, 2));
    
    const vehicles = await db.collection('machines').find(query).toArray();
    
    console.log(`✅ Found ${vehicles.length} vehicles`);
    
    return NextResponse.json(vehicles);
    
  } catch (error) {
    console.error('❌ Error fetching vehicles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicles' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    // Check if organization is suspended
    const suspensionCheck = checkOrganizationSuspension(session);
    if (suspensionCheck) return suspensionCheck;
    
    const vehicleData = await request.json();
    console.log('Creating vehicle with data:', vehicleData);
    
    // Validaciones específicas para vehículos
    if (!vehicleData.machineId || !vehicleData.plateNumber || !vehicleData.vehicleType) {
      return NextResponse.json(
        { error: 'Vehicle ID, Plate Number, and Vehicle Type are required' },
        { status: 400 }
      );
    }
    
    const db = await connectDB();
    
    // Verificar si ya existe un vehículo con el mismo machineId o plateNumber
    const existingVehicle = await db.collection('machines').findOne({
      $and: [
        {
          $or: [
            { machineId: vehicleData.machineId },
            { plateNumber: vehicleData.plateNumber }
          ]
        },
        { equipmentType: 'vehicle' }
      ]
    });
    
    if (existingVehicle) {
      return NextResponse.json(
        { error: 'Vehicle with this ID or Plate Number already exists' },
        { status: 409 }
      );
    }
    
    // Preparar datos del vehículo
    const now = new Date();
    const vehicle = {
      ...vehicleData,
      equipmentType: 'vehicle',
      userId: session.user.id,
      createdBy: session.user.id,
      organization: session.user.organization || session.user.company,
      credentialId: session.user.credentialId ? new ObjectId(session.user.credentialId) : null,
      createdAt: now,
      updatedAt: now,
      isActive: true,
      // Calcular currentHours basado en kilómetros para compatibilidad
      currentHours: vehicleData.currentKilometers ? Math.round(vehicleData.currentKilometers / 50) : 0, // Factor de conversión por defecto
      // Procesar datos de RUC
      ruc: {
        ...vehicleData.ruc,
        isActive: vehicleData.ruc?.isActive ?? true,
        kmInterval: vehicleData.ruc?.kmInterval || 5000
      },
      // Procesar datos de REGO
      rego: {
        ...vehicleData.rego,
        isActive: vehicleData.rego?.isActive ?? true
      }
    };
    
    // Calcular alertas de vencimiento
    if (vehicle.ruc.nextDueKm && vehicle.currentKilometers) {
      const kmRemaining = vehicle.ruc.nextDueKm - vehicle.currentKilometers;
      vehicle.ruc.alertStatus = kmRemaining <= 500 ? 'urgent' : kmRemaining <= 1000 ? 'warning' : 'ok';
    }
    
    if (vehicle.rego.expiryDate) {
      const daysUntilExpiry = Math.ceil((new Date(vehicle.rego.expiryDate) - now) / (1000 * 60 * 60 * 24));
      vehicle.rego.alertStatus = daysUntilExpiry <= 7 ? 'urgent' : daysUntilExpiry <= 30 ? 'warning' : 'ok';
    }
    
    console.log('Processed vehicle data:', vehicle);
    
    const result = await db.collection('machines').insertOne(vehicle);
    
    const createdVehicle = await db.collection('machines').findOne({ _id: result.insertedId });
    
    console.log('✅ Vehicle created successfully:', result.insertedId);
    
    return NextResponse.json(createdVehicle, { status: 201 });
    
  } catch (error) {
    console.error('❌ Error creating vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to create vehicle' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    // Check if organization is suspended
    const suspensionCheck = checkOrganizationSuspension(session);
    if (suspensionCheck) return suspensionCheck;
    
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('id');
    
    if (!vehicleId) {
      return NextResponse.json({ error: 'Vehicle ID is required' }, { status: 400 });
    }
    
    const updateData = await request.json();
    console.log('Updating vehicle:', vehicleId, updateData);
    
    const db = await connectDB();
    
    // Verificar que el vehículo existe y el usuario tiene permisos
    const query = { 
      _id: new ObjectId(vehicleId),
      equipmentType: 'vehicle'
    };
    
    // Agregar filtros de permisos
    if (session.user.role !== 'SUPER_ADMIN') {
      if (session.user.role === 'ADMIN') {
        query.$or = [
          { organization: session.user.organization },
          { userId: session.user.id },
          { createdBy: session.user.id }
        ];
      } else {
        query.$or = [
          { userId: session.user.id },
          { createdBy: session.user.id }
        ];
      }
    }
    
    const existingVehicle = await db.collection('machines').findOne(query);
    
    if (!existingVehicle) {
      return NextResponse.json({ error: 'Vehicle not found or access denied' }, { status: 404 });
    }
    
    // Preparar datos de actualización
    const now = new Date();
    const vehicle = {
      ...updateData,
      equipmentType: 'vehicle',
      updatedAt: now,
      // Recalcular currentHours basado en kilómetros
      currentHours: updateData.currentKilometers ? Math.round(updateData.currentKilometers / 50) : existingVehicle.currentHours
    };
    
    // Actualizar alertas
    if (vehicle.ruc?.nextDueKm && vehicle.currentKilometers) {
      const kmRemaining = vehicle.ruc.nextDueKm - vehicle.currentKilometers;
      vehicle.ruc.alertStatus = kmRemaining <= 500 ? 'urgent' : kmRemaining <= 1000 ? 'warning' : 'ok';
    }
    
    if (vehicle.rego?.expiryDate) {
      const daysUntilExpiry = Math.ceil((new Date(vehicle.rego.expiryDate) - now) / (1000 * 60 * 60 * 24));
      vehicle.rego.alertStatus = daysUntilExpiry <= 7 ? 'urgent' : daysUntilExpiry <= 30 ? 'warning' : 'ok';
    }
    
    delete vehicle._id; // Remover _id del body
    
    const result = await db.collection('machines').updateOne(
      { _id: new ObjectId(vehicleId) },
      { $set: vehicle }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }
    
    const updatedVehicle = await db.collection('machines').findOne({ _id: new ObjectId(vehicleId) });
    
    console.log('✅ Vehicle updated successfully:', vehicleId);
    
    return NextResponse.json(updatedVehicle);
    
  } catch (error) {
    console.error('❌ Error updating vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to update vehicle' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    // Check if organization is suspended
    const suspensionCheck = checkOrganizationSuspension(session);
    if (suspensionCheck) return suspensionCheck;
    
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('id');
    
    if (!vehicleId) {
      return NextResponse.json({ error: 'Vehicle ID is required' }, { status: 400 });
    }
    
    const db = await connectDB();
    
    // Verificar permisos
    const query = { 
      _id: new ObjectId(vehicleId),
      equipmentType: 'vehicle'
    };
    
    if (session.user.role !== 'SUPER_ADMIN') {
      if (session.user.role === 'ADMIN') {
        query.$or = [
          { organization: session.user.organization },
          { userId: session.user.id },
          { createdBy: session.user.id }
        ];
      } else {
        query.$or = [
          { userId: session.user.id },
          { createdBy: session.user.id }
        ];
      }
    }
    
    const result = await db.collection('machines').deleteOne(query);
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Vehicle not found or access denied' }, { status: 404 });
    }
    
    console.log('✅ Vehicle deleted successfully:', vehicleId);
    
    return NextResponse.json({ message: 'Vehicle deleted successfully' });
    
  } catch (error) {
    console.error('❌ Error deleting vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to delete vehicle' },
      { status: 500 }
    );
  }
}
