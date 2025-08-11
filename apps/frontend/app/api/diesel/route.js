import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { ObjectId } from "mongodb";
import { createSafeRegexQuery } from "@/lib/security";

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
    // Check if request is public
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get('public') === 'true';
    
    console.log('[API] POST /api/diesel - Public mode:', isPublic);
    
    let userId = null;
    let credentialId = null;
    let organization = null;
    
    // Connect to database
    const db = await connectDB();
    
    // Get and validate request data
    const data = await request.json();
    console.log('[API] Received diesel data:', data);
    
    // Basic validations
    if (!data.tankId) {
      return NextResponse.json({ error: "Tank ID is required" }, { status: 400 });
    }
    
    if (!data.maquinaId) {
      return NextResponse.json({ error: "Machine ID is required" }, { status: 400 });
    }
    
    if (!data.litros || data.litros <= 0) {
      return NextResponse.json({ error: "Fuel amount must be greater than 0" }, { status: 400 });
    }
    
    if (!data.operador || data.operador.trim() === '') {
      return NextResponse.json({ error: "Operator name is required" }, { status: 400 });
    }
    
    // If not public access, verify authentication
    if (!isPublic) {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }
      userId = session.user.id;
      credentialId = session.user.credentialId;
      organization = session.user.organization || session.user.company;

      // Check if organization is suspended
      const suspensionCheck = checkOrganizationSuspension(session);
      if (suspensionCheck) {
        return suspensionCheck;
      }
    } else {
      // First, get tank information to determine the correct credentialId
      let tankCredentialId = null;
      let tankOrganization = null;
      let tankOwner = null;
      
      if (data.tankId) {
        try {
          console.log('[API] Looking for tank with ID:', data.tankId);
          console.log('[API] tankId type:', typeof data.tankId);
          console.log('[API] Is valid ObjectId:', ObjectId.isValid(data.tankId));
          
          const tank = await db.collection('dieseltanks').findOne({
            $or: [
              { tankId: data.tankId },                                                    // String tankId
              { tankId: data.tankId.toString() },                                         // Ensure string
              { _id: ObjectId.isValid(data.tankId) ? new ObjectId(data.tankId) : null }, // ObjectId _id
              { name: data.tankId },                                                      // Tank name as fallback
              ...(ObjectId.isValid(data.tankId) ? [{ tankId: new ObjectId(data.tankId) }] : []) // ObjectId tankId
            ]
          });
          
          if (tank) {
            console.log('[API] Found tank:', tank._id);
            console.log('[API] Tank details:', { tankId: tank.tankId, name: tank.name, credentialId: tank.credentialId });
            tankCredentialId = tank.credentialId;
            tankOrganization = tank.organization;
            tankOwner = tank.userId;
            console.log(`[API] Tank belongs to credentialId: ${tankCredentialId}, organization: ${tankOrganization}`);
          } else {
            console.log('[API] Tank not found for ID:', data.tankId);
            // Let's see what tanks exist
            const allTanks = await db.collection('dieseltanks').find({}).limit(3).toArray();
            console.log('[API] Available tanks:');
            allTanks.forEach((t, i) => {
              console.log(`[API] Tank ${i + 1}: _id=${t._id}, tankId=${t.tankId}, name=${t.name}, type=${typeof t.tankId}`);
            });
          }
        } catch (err) {
          console.error('[API] Error finding tank:', err);
        }
      }

      // Use tank's credentialId as primary source
      userId = tankOwner || "public_user";
      credentialId = tankCredentialId;
      organization = tankOrganization;
      
      // If no tank found, try to find machine owner as fallback
      if (!credentialId && data.maquinaId) {
        let machineOwner = null;
        let machineCredentialId = null;
        let machineOrganization = null;
        
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
            console.log('[API] Found machine for diesel record:', machine._id);
            // Get machine owner's userId
            machineOwner = machine.userId || machine.createdBy;
            
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
          }
        } catch (err) {
          console.error('[API] Error finding machine owner:', err);
        }
        
        // Use machine values as fallback
        userId = machineOwner || userId;
        credentialId = machineCredentialId;
        organization = machineOrganization;
      }
      
      console.log(`[API] Final values - userId: ${userId}, credentialId: ${credentialId}, organization: ${organization}`);
    }
    
    // Prepare diesel record data
    const dieselRecord = {
      tankId: data.tankId,
      tankName: data.tankName || '',
      maquinaId: data.maquinaId,
      machineName: data.machineName || '',
      customMachineId: data.customMachineId || '',
      litros: parseFloat(data.litros),
      operador: data.operador.trim(),
      fecha: data.fecha ? new Date(data.fecha) : new Date(),
      trabajo: data.trabajo ? data.trabajo.trim() : '',
      observaciones: data.observaciones || '',
      workplace: data.workplace || '',
      userId: ObjectId.isValid(userId) ? new ObjectId(userId) : userId,
      credentialId: credentialId,
      organization: organization,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Try to find the machine ObjectId and workplace if possible
    if (data.maquinaId) {
      try {
        const machine = await db.collection('machines').findOne({
          $or: [
            { _id: ObjectId.isValid(data.maquinaId) ? new ObjectId(data.maquinaId) : null },
            { machineId: data.maquinaId },
            { customId: data.maquinaId }
          ]
        });
        
        if (machine) {
          dieselRecord.machineId = machine._id;
          dieselRecord.machineName = machine.name || machine.machineId || data.maquinaId;
          // Get workplace from machine if not provided in data
          if (!data.workplace && machine.workplace) {
            dieselRecord.workplace = machine.workplace;
          }
        }
      } catch (err) {
        console.error('[API] Error finding machine for ObjectId:', err);
      }
    }
    
    console.log('[API] Saving diesel record:', dieselRecord);
    
    // Save to database
    const result = await db.collection('diesel_records').insertOne(dieselRecord);
    
    if (!result.insertedId) {
      throw new Error('Failed to save diesel record');
    }
    
    console.log('[API] Diesel record saved successfully:', result.insertedId);
    
    // 🚀 NEW: Update tank currentLevel by subtracting the consumed amount
    try {
      console.log('[API] Updating tank level - tankId:', data.tankId, 'consumed:', parseFloat(data.litros));
      
      // Find the tank and update its currentLevel
      const tankUpdateResult = await db.collection('dieseltanks').updateOne(
        { 
          $or: [
            { tankId: data.tankId },                                        // Search by tankId string
            { tankId: data.tankId.toString() },                             // Ensure string
            { _id: ObjectId.isValid(data.tankId) ? new ObjectId(data.tankId) : null }, // Search by ObjectId _id
            { name: data.tankId },                                          // Tank name as fallback
            ...(ObjectId.isValid(data.tankId) ? [{ tankId: new ObjectId(data.tankId) }] : []) // ObjectId tankId
          ]
        },
        { 
          $inc: { currentLevel: -parseFloat(data.litros) }, // Subtract consumed amount
          $set: { updatedAt: new Date() }
        }
      );
      
      if (tankUpdateResult.matchedCount > 0) {
        console.log('[API] Tank level updated successfully. Modified count:', tankUpdateResult.modifiedCount);
        
        // Get updated tank info for logging
        const updatedTank = await db.collection('dieseltanks').findOne({
          $or: [
            { tankId: data.tankId },
            { tankId: data.tankId.toString() },
            { _id: ObjectId.isValid(data.tankId) ? new ObjectId(data.tankId) : null },
            { name: data.tankId },
            ...(ObjectId.isValid(data.tankId) ? [{ tankId: new ObjectId(data.tankId) }] : [])
          ]
        });
        
        if (updatedTank) {
          console.log('[API] Tank after update:', {
            name: updatedTank.name,
            tankId: updatedTank.tankId,
            currentLevel: updatedTank.currentLevel,
            capacity: updatedTank.capacity
          });
        }
      } else {
        console.warn('[API] No tank found to update for tankId:', data.tankId);
        
        // Debug: Let's see what tanks are available
        const allTanks = await db.collection('dieseltanks').find({}).limit(3).toArray();
        console.log('[API] Available tanks for debugging:');
        allTanks.forEach((t, i) => {
          console.log(`[API] Tank ${i + 1}: _id=${t._id}, tankId=${t.tankId}, name=${t.name}, currentLevel=${t.currentLevel}`);
        });
      }
    } catch (tankError) {
      console.error('[API] Error updating tank level:', tankError);
      // Don't fail the entire operation if tank update fails
    }
    
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
    console.error('[API] Error in POST /api/diesel:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if organization is suspended
    const suspensionCheck = checkOrganizationSuspension(session);
    if (suspensionCheck) {
      return suspensionCheck;
    }

    const db = await connectDB();
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const machineId = searchParams.get('machineId');
    const workplace = searchParams.get('workplace');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Build filter based on user credentials
    let filter = {};
    
    // Filter by user's credential or organization
    if (session.user.role === 'SUPER_ADMIN') {
      // Super admin can see all records
    } else if (session.user.credentialId) {
      filter.credentialId = session.user.credentialId;
    } else if (session.user.organization || session.user.company) {
      filter.organization = session.user.organization || session.user.company;
    } else {
      // Handle userId with both string and ObjectId formats
      const userIdValue = session.user.id;
      filter.$or = [
        { userId: userIdValue },
        { userId: userIdValue.toString() },
        { userId: ObjectId.isValid(userIdValue) ? new ObjectId(userIdValue) : null }
      ].filter(q => Object.values(q)[0] !== null);
    }
    
    // Add additional filters
    if (machineId) {
      filter.maquinaId = machineId;
    }
    
    if (workplace) {
      const safeWorkplaceRegex = createSafeRegexQuery(workplace);
      if (safeWorkplaceRegex) {
        filter.workplace = safeWorkplaceRegex;
      }
    }
    
    if (startDate || endDate) {
      filter.fecha = {};
      if (startDate) {
        filter.fecha.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.fecha.$lte = new Date(endDate);
      }
    }
    
    console.log('[API] GET /api/diesel - Filter:', filter);
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Get records with pagination
    const records = await db.collection('diesel_records')
      .find(filter)
      .sort({ fecha: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Get total count for pagination
    const totalCount = await db.collection('diesel_records').countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);
    
    console.log(`[API] GET /api/diesel - Found ${records.length} records (${totalCount} total)`);
    
    return NextResponse.json({
      success: true,
      data: records,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    console.error('[API] Error in GET /api/diesel:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}


