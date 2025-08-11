import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectDB } from "@/lib/mongodb";
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tankId = searchParams.get('tankId');
    const publicAccess = searchParams.get('public') === 'true';
    
    console.log(`[machines-by-tank] Request received - tankId: ${tankId}, public: ${publicAccess}`);
    
    if (!tankId) {
      console.log('[machines-by-tank] Error: tankId is required');
      return NextResponse.json({ error: 'tankId is required' }, { status: 400 });
    }

    const db = await connectDB();
    console.log('[machines-by-tank] Database connected');
    
    // 1. First, find the tank to get its credentialId
    console.log(`[machines-by-tank] Searching for tank with ID: ${tankId}`);
    console.log(`[machines-by-tank] tankId type: ${typeof tankId}`);
    console.log(`[machines-by-tank] Is valid ObjectId: ${ObjectId.isValid(tankId)}`);
    
    const tank = await db.collection('dieseltanks').findOne({
      $or: [
        { tankId: tankId },                                                    // String tankId
        { tankId: tankId.toString() },                                         // Ensure string
        { _id: ObjectId.isValid(tankId) ? new ObjectId(tankId) : null },      // ObjectId _id
        { name: tankId },                                                      // Tank name as fallback
        ...(ObjectId.isValid(tankId) ? [{ tankId: new ObjectId(tankId) }] : []) // ObjectId tankId
      ]
    });

    if (!tank) {
      console.log(`[machines-by-tank] Tank not found for ID: ${tankId}`);
      // Let's see what tanks exist in the database
      console.log('[machines-by-tank] Listing available tanks...');
      const allTanks = await db.collection('dieseltanks').find({}).limit(5).toArray();
      allTanks.forEach((t, i) => {
        console.log(`[machines-by-tank] Tank ${i + 1}: _id=${t._id}, tankId=${t.tankId}, name=${t.name}, type=${typeof t.tankId}`);
      });
      
      return NextResponse.json({ error: 'Tank not found' }, { status: 404 });
    }

    console.log(`[machines-by-tank] Found tank:`, {
      _id: tank._id,
      tankId: tank.tankId,
      name: tank.name,
      credentialId: tank.credentialId,
      userId: tank.userId,
      organization: tank.organization
    });

    // 2. Get machines that belong to the same credentialId or userId
    let machinesQuery = {};
    
    if (tank.credentialId) {
      // Filter by tank's credentialId
      console.log(`[machines-by-tank] Filtering by credentialId: ${tank.credentialId}`);
      machinesQuery = { 
        credentialId: ObjectId.isValid(tank.credentialId) ? 
          new ObjectId(tank.credentialId) : tank.credentialId 
      };
    } else if (tank.userId) {
      // Fallback to tank owner's userId - handle both string and ObjectId
      console.log(`[machines-by-tank] Filtering by userId: ${tank.userId} (type: ${typeof tank.userId})`);
      
      // Convert userId to string for comparison
      const userIdString = tank.userId.toString();
      
      machinesQuery = {
        $or: [
          // Match as string
          { userId: userIdString },
          { createdBy: userIdString },
          // Match as ObjectId (if the machine has ObjectId userId)
          { userId: ObjectId.isValid(tank.userId) ? new ObjectId(tank.userId) : null },
          { createdBy: ObjectId.isValid(tank.userId) ? new ObjectId(tank.userId) : null },
          // Also try the original value in case it's already the right type
          { userId: tank.userId },
          { createdBy: tank.userId }
        ].filter(query => {
          // Remove null entries
          return Object.values(query)[0] !== null;
        })
      };
      
      console.log(`[machines-by-tank] UserID as string: ${userIdString}`);
      console.log(`[machines-by-tank] Query:`, JSON.stringify(machinesQuery));
    } else {
      // If no credentialId or userId, return empty array
      console.log('[machines-by-tank] No credentialId or userId found, returning empty array');
      return NextResponse.json({ tank: tank, machines: [] });
    }

    console.log(`[machines-by-tank] Machines query:`, JSON.stringify(machinesQuery));

    const machines = await db.collection('machines').find(machinesQuery).toArray();
    
    console.log(`[machines-by-tank] Found ${machines.length} machines for tank's owner`);
    
    if (machines.length === 0) {
      // Debug: Let's see what machines exist for this user
      console.log('[machines-by-tank] No machines found, checking available machines...');
      const allMachines = await db.collection('machines').find({}).limit(5).toArray();
      allMachines.forEach((m, i) => {
        console.log(`[machines-by-tank] Machine ${i + 1}: _id=${m._id}, name=${m.name}, userId=${m.userId}, credentialId=${m.credentialId}`);
      });
    } else {
      machines.forEach((m, i) => {
        console.log(`[machines-by-tank] Machine ${i + 1}: _id=${m._id}, name=${m.name}`);
      });
    }

    // 3. Return tank info and machines
    return NextResponse.json({
      tank: {
        _id: tank._id,
        tankId: tank.tankId,
        name: tank.name,
        credentialId: tank.credentialId,
        organization: tank.organization
      },
      machines: machines
    });

  } catch (error) {
    console.error('[API] Error in machines-by-tank:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


