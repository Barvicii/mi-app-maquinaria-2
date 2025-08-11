import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    console.log('[API] GET /api/diesel/scan - Machine ID:', id);
    
    // Connect to database
    const db = await connectDB();
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get('public') === 'true';
    
    console.log('[API] Public mode:', isPublic);
    
    // Search for machine by different possible ID fields
    const machine = await db.collection('machines').findOne({
      $or: [
        { _id: ObjectId.isValid(id) ? new ObjectId(id) : null },
        { machineId: id },
        { customId: id }
      ]
    });
    
    if (!machine) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }
    
    console.log('[API] Found machine:', machine.name || machine.machineId);
    
    // Get organization info
    let organizationName = 'Unknown';
    if (machine.userId || machine.createdBy) {
      try {
        const owner = await db.collection('users').findOne({
          $or: [
            { _id: ObjectId.isValid(machine.userId || machine.createdBy) ? new ObjectId(machine.userId || machine.createdBy) : null },
            { id: machine.userId || machine.createdBy }
          ]
        });
        
        if (owner) {
          organizationName = owner.organization || owner.company || 'Unknown';
        }
      } catch (err) {
        console.error('[API] Error finding owner:', err);
      }
    }
    
    // Return machine data formatted for diesel form
    const responseData = {
      success: true,
      machine: {
        _id: machine._id,
        machineId: machine.machineId || id,
        customId: machine.customId || id,
        name: machine.name || machine.machineId || id,
        organization: organizationName,
        location: machine.location || '',
        model: machine.model || '',
        year: machine.year || '',
        // Additional fields that might be useful for diesel tracking
        fuelCapacity: machine.fuelCapacity || '',
        engineType: machine.engineType || ''
      }
    };
    
    console.log('[API] Returning machine data for diesel scan:', responseData);
    
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('[API] Error in GET /api/diesel/scan:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
