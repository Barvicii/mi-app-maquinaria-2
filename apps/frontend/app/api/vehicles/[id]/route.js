import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

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

export async function GET(request, { params }) {
  try {
    // Asegurarse de que params esté definido antes de acceder a id
    if (!params) {
      console.error('params is undefined');
      return NextResponse.json({ error: "Invalid request: params is undefined" }, { status: 400 });
    }
    
    const { id } = await params;
    
    console.log(`GET /api/vehicles/${id} (public: true)`);
    
    if (!id) {
      return NextResponse.json({ error: "Vehicle ID is required" }, { status: 400 });
    }
    
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get('public') === 'true';
    
    const db = await connectDB();
    
    // Mejora: Búsqueda más flexible por diferentes tipos de ID
    let vehicle = null;
    
    // 1. Intentar buscar por ObjectId
    if (ObjectId.isValid(id)) {
      vehicle = await db.collection('machines').findOne({ 
        _id: new ObjectId(id),
        equipmentType: 'vehicle'
      });
      console.log(`Búsqueda por ObjectId: ${!!vehicle}`);
    }
    
    // 2. Si no se encuentra, buscar por machineId, vehicleId o cualquier otro campo ID
    if (!vehicle) {
      vehicle = await db.collection('machines').findOne({
        $and: [
          { equipmentType: 'vehicle' },
          {
            $or: [
              { machineId: id },
              { vehicleId: id },
              { customId: id }
            ]
          }
        ]
      });
      console.log(`Búsqueda por IDs alternativos: ${!!vehicle}`);
    }
    
    if (!vehicle) {
      console.log(`Vehicle with ID ${id} not found`);
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }
    
    console.log(`Vehicle found: ${vehicle._id}`);
    
    // Asegurarse de que la respuesta incluya todos los campos necesarios
    const response = {
      ...vehicle,
      _id: vehicle._id.toString(),
      // Agregar múltiples variaciones del ID para máxima compatibilidad
      machineId: vehicle.machineId || vehicle.Machine_ID || vehicle.customId || vehicle._id.toString(),
      vehicleId: vehicle.vehicleId || vehicle.Machine_ID || vehicle.machineId || vehicle.customId || vehicle._id.toString(),
      customId: vehicle.customId || vehicle.Machine_ID || vehicle.machineId || vehicle._id.toString(),
      Machine_ID: vehicle.Machine_ID || vehicle.machineId || vehicle.customId || vehicle.vehicleId || vehicle._id.toString()
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, context) {
  try {
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get('public') === 'true';
    
    // Para actualizaciones públicas (renovaciones de RUC/REGO), no requerir autenticación
    if (!isPublic) {
      // Verificar autenticación solo para operaciones no públicas
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }

      // Verificar si la organización está suspendida
      const suspensionCheck = checkOrganizationSuspension(session);
      if (suspensionCheck) {
        return suspensionCheck;
      }
    }
    
    const { id } = await context.params;
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid vehicle ID" }, { status: 400 });
    }

    const db = await connectDB();
    
    // Para actualizaciones públicas, buscar vehículo sin restricción de usuario
    let existingVehicle;
    if (isPublic) {
      existingVehicle = await db.collection('machines').findOne({
        _id: new ObjectId(id),
        equipmentType: 'vehicle'
      });
    } else {
      const session = await getServerSession(authOptions);
      const userId = session.user.id;
      
      existingVehicle = await db.collection('machines').findOne({
        _id: new ObjectId(id),
        userId: userId,
        equipmentType: 'vehicle'
      });
    }

    if (!existingVehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }
    
    let data;
    try {
      data = await request.json();
    } catch (error) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (data._id) {
      delete data._id;
    }
    
    // Para actualizaciones públicas (renovaciones), solo permitir actualizar campos específicos
    if (isPublic) {
      const allowedFields = ['ruc', 'rego', 'currentKilometers', 'lastService', 'nextService'];
      const filteredData = {};
      
      allowedFields.forEach(field => {
        if (data[field] !== undefined) {
          filteredData[field] = data[field];
        }
      });
      
      // Solo continuar si hay campos permitidos para actualizar
      if (Object.keys(filteredData).length === 0) {
        return NextResponse.json({ error: "No allowed fields to update in public mode" }, { status: 400 });
      }
      
      data = filteredData;
      
      // Para actualizaciones públicas, también limpiar campos que no deberían estar en vehículos
      const fieldsToRemove = ['currentHours', 'nextServiceHours', 'carbonFilterLifeHours'];
      const unsetFields = {};
      fieldsToRemove.forEach(field => {
        unsetFields[field] = "";
      });
      
      if (Object.keys(unsetFields).length > 0) {
        data.$unset = unsetFields;
      }
    } else {
      // Para actualizaciones privadas, verificar duplicados como antes
      if (data.machineId || data.plateNumber) {
        const duplicateQuery = {
          $and: [
            {
              $or: []
            },
            { equipmentType: 'vehicle' },
            { _id: { $ne: new ObjectId(id) } }
          ]
        };
        
        if (data.machineId) {
          duplicateQuery.$and[0].$or.push({ machineId: data.machineId });
        }
        if (data.plateNumber) {
          duplicateQuery.$and[0].$or.push({ plateNumber: data.plateNumber });
        }
        
        if (duplicateQuery.$and[0].$or.length > 0) {
          const duplicateVehicle = await db.collection('machines').findOne(duplicateQuery);
          
          if (duplicateVehicle) {
            return NextResponse.json(
              { error: 'Vehicle with this ID or Plate Number already exists' },
              { status: 409 }
            );
          }
        }
      }
    }
    
    // Mantener userId y equipmentType para actualizaciones privadas
    if (!isPublic) {
      const session = await getServerSession(authOptions);
      data.userId = session.user.id;
      data.equipmentType = 'vehicle';
    }
    
    data.updatedAt = new Date();

    console.log(`[PUT /api/vehicles/${id}] Updating vehicle with data:`, JSON.stringify(data, null, 2));

    let updateOperation = { $set: data };
    
    // Si hay campos para eliminar (para limpiar datos incorrectos de vehículos)
    if (data.$unset) {
      updateOperation.$unset = data.$unset;
      delete updateOperation.$set.$unset; // Remover $unset del $set
    }

    const result = await db.collection('machines').updateOne(
      { _id: new ObjectId(id), equipmentType: 'vehicle' },
      updateOperation
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    const updatedVehicle = await db.collection('machines').findOne({
      _id: new ObjectId(id)
    });

    console.log(`[PUT /api/vehicles/${id}] Vehicle updated successfully`);
    return NextResponse.json(updatedVehicle);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verificar si la organización está suspendida
    const suspensionCheck = checkOrganizationSuspension(session);
    if (suspensionCheck) {
      return suspensionCheck;
    }
    
    const userId = session.user.id;
    const { id } = await context.params;
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid vehicle ID" }, { status: 400 });
    }
    
    const db = await connectDB();
    
    // Eliminar solo si pertenece al usuario y es un vehículo
    const result = await db.collection('machines').deleteOne({
      _id: new ObjectId(id),
      userId: userId,
      equipmentType: 'vehicle'
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
