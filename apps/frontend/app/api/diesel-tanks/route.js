import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { ObjectId } from "mongodb";
import { validateDieselTank } from "@/models/DieselTank";

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

// POST - Create a new diesel tank
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if organization is suspended
    const suspensionCheck = checkOrganizationSuspension(session);
    if (suspensionCheck) {
      return suspensionCheck;
    }

    const db = await connectDB();
    const data = await request.json();
    
    console.log('[API] POST /api/diesel-tanks - Received data:', data);
    
    // Convert capacity to number if it's a string
    if (data.capacity && typeof data.capacity === 'string') {
      data.capacity = parseFloat(data.capacity);
    }
    
    // Validate input data
    const validation = validateDieselTank(data);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }
    
    // Check if tankId already exists for this user/organization
    const existingTank = await db.collection('dieseltanks').findOne({
      tankId: data.tankId,
      $or: [
        { userId: ObjectId.isValid(session.user.id) ? new ObjectId(session.user.id) : session.user.id },
        { credentialId: session.user.credentialId },
        { organization: session.user.organization || session.user.company }
      ]
    });
    
    if (existingTank) {
      return NextResponse.json(
        { error: 'A tank with this ID already exists' },
        { status: 409 }
      );
    }
    
    // Prepare tank data
    const tankData = {
      name: data.name.trim(),
      capacity: parseFloat(data.capacity),
      currentLevel: 0, // Tanque empieza vacío
      location: data.location.trim(),
      description: data.description ? data.description.trim() : '',
      tankId: data.tankId.trim(),
      workplace: data.workplace ? data.workplace.trim() : '',
      userId: ObjectId.isValid(session.user.id) ? new ObjectId(session.user.id) : session.user.id,
      credentialId: session.user.credentialId,
      organization: session.user.organization || session.user.company,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastRefillDate: null,
      isActive: true
    };
    
    // Save to database
    const result = await db.collection('dieseltanks').insertOne(tankData);
    
    if (!result.insertedId) {
      throw new Error('Failed to create diesel tank');
    }
    
    console.log('[API] Diesel tank created successfully:', result.insertedId);
    
    return NextResponse.json({
      success: true,
      message: 'Diesel tank created successfully',
      id: result.insertedId,
      data: {
        ...tankData,
        _id: result.insertedId
      }
    });
    
  } catch (error) {
    console.error('[API] Error in POST /api/diesel-tanks:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// GET - Retrieve diesel tanks
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
    
    // Build filter based on user credentials
    let filter = { isActive: true };
    
    if (session.user.role === 'SUPER_ADMIN') {
      // Super admin can see all tanks
    } else if (session.user.credentialId) {
      filter.credentialId = session.user.credentialId;
    } else if (session.user.organization || session.user.company) {
      filter.organization = session.user.organization || session.user.company;
    } else {
      // Search for both string and ObjectId formats
      filter.$or = [
        { userId: session.user.id },
        { userId: ObjectId.isValid(session.user.id) ? new ObjectId(session.user.id) : session.user.id }
      ];
    }
    
    console.log('[API] GET /api/diesel-tanks - Filter:', filter);
    
    // Get tanks
    const tanks = await db.collection('dieseltanks')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log(`[API] GET /api/diesel-tanks - Found ${tanks.length} tanks`);
    
    return NextResponse.json({
      success: true,
      tanks: tanks
    });
    
  } catch (error) {
    console.error('[API] Error in GET /api/diesel-tanks:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// PUT - Update a diesel tank
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if organization is suspended
    const suspensionCheck = checkOrganizationSuspension(session);
    if (suspensionCheck) {
      return suspensionCheck;
    }

    const db = await connectDB();
    const data = await request.json();
    
    if (!data._id) {
      return NextResponse.json({ error: 'Tank ID is required' }, { status: 400 });
    }
    
    // Validate input data
    const validation = validateDieselTank(data);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }
    
    // Build filter to ensure user can only update their own tanks
    let filter = { _id: new ObjectId(data._id) };
    
    if (session.user.role !== 'SUPER_ADMIN') {
      if (session.user.credentialId) {
        filter.credentialId = session.user.credentialId;
      } else if (session.user.organization || session.user.company) {
        filter.organization = session.user.organization || session.user.company;
      } else {
        // Combine _id filter with userId filter using $and
        filter = {
          $and: [
            { _id: new ObjectId(data._id) },
            {
              $or: [
                { userId: session.user.id },
                { userId: ObjectId.isValid(session.user.id) ? new ObjectId(session.user.id) : session.user.id }
              ]
            }
          ]
        };
      }
    }
    
    // Update tank
    const updateData = {
      name: data.name.trim(),
      capacity: parseFloat(data.capacity),
      location: data.location.trim(),
      description: data.description ? data.description.trim() : '',
      tankId: data.tankId.trim(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('dieseltanks').updateOne(
      filter,
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Tank not found or access denied' }, { status: 404 });
    }
    
    console.log('[API] Diesel tank updated successfully:', data._id);
    
    return NextResponse.json({
      success: true,
      message: 'Diesel tank updated successfully'
    });
    
  } catch (error) {
    console.error('[API] Error in PUT /api/diesel-tanks:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}


