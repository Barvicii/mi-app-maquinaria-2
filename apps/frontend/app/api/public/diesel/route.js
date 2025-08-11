import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    console.log('[API] POST /api/public/diesel - Public diesel record submission');
    
    // Connect to database
    const db = await connectDB();
    
    // Get and validate request data
    const data = await request.json();
    console.log('[API] Received public diesel data:', data);
    
    // Basic validations
    if (!data.maquinaId) {
      return NextResponse.json({ error: "Machine ID is required" }, { status: 400 });
    }
    
    if (!data.litros || data.litros <= 0) {
      return NextResponse.json({ error: "Fuel amount must be greater than 0" }, { status: 400 });
    }
    
    if (!data.operador || data.operador.trim() === '') {
      return NextResponse.json({ error: "Operator name is required" }, { status: 400 });
    }
    
    // Try to find machine owner for public access
    let machineOwner = null;
    let machineCredentialId = null;
    let machineOrganization = null;
    let machineName = '';
    
    try {
      // Search for machine by different possible ID fields
      const machine = await db.collection('machines').findOne({
        $or: [
          { _id: ObjectId.isValid(data.maquinaId) ? new ObjectId(data.maquinaId) : null },
          { machineId: data.maquinaId },
          { customId: data.maquinaId }
        ]
      });
      
      if (machine) {
        console.log('[API] Found machine for public diesel record:', machine._id);
        // Get machine owner's userId
        machineOwner = machine.userId || machine.createdBy;
        machineName = machine.name || machine.machineId || data.maquinaId;
        
        // Get credentialId directly or from user
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
            machineOrganization = owner.organization || owner.company;
          }
        }
        
        console.log(`[API] Found machine owner: ${machineOwner}, credentialId: ${machineCredentialId}, organization: ${machineOrganization}`);
      } else {
        console.log('[API] Machine not found for ID:', data.maquinaId);
        return NextResponse.json({ error: "Machine not found" }, { status: 404 });
      }
    } catch (err) {
      console.error('[API] Error finding machine owner:', err);
      return NextResponse.json({ error: "Error finding machine" }, { status: 500 });
    }
    
    // Prepare diesel record data
    const dieselRecord = {
      maquinaId: data.maquinaId,
      machineName: machineName,
      customMachineId: data.customMachineId || data.maquinaId,
      litros: parseFloat(data.litros),
      operador: data.operador.trim(),
      fecha: data.fecha ? new Date(data.fecha) : new Date(),
      observaciones: data.observaciones || '',
      userId: ObjectId.isValid(machineOwner) ? new ObjectId(machineOwner) : machineOwner || "public_user",
      credentialId: machineCredentialId,
      organization: machineOrganization,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add machine ObjectId if found
    if (machine) {
      dieselRecord.machineId = machine._id;
    }
    
    console.log('[API] Saving public diesel record:', dieselRecord);
    
    // Save to database
    const result = await db.collection('diesel_records').insertOne(dieselRecord);
    
    if (!result.insertedId) {
      throw new Error('Failed to save diesel record');
    }
    
    console.log('[API] Public diesel record saved successfully:', result.insertedId);
    
    return NextResponse.json({
      success: true,
      message: 'Diesel record saved successfully',
      id: result.insertedId,
      data: {
        ...dieselRecord,
        _id: result.insertedId
      }
    });
    
  } catch (error) {
    console.error('[API] Error in POST /api/public/diesel:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}


