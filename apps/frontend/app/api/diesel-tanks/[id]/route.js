import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Tank ID is required' }, { status: 400 });
    }
    
    const db = await connectDB();
    
    // Find tank by tankId or _id
    const tank = await db.collection('dieseltanks').findOne({
      $or: [
        { tankId: id },
        { _id: ObjectId.isValid(id) ? new ObjectId(id) : null }
      ],
      isActive: true
    });
    
    if (!tank) {
      return NextResponse.json({ error: 'Tank not found' }, { status: 404 });
    }
    
    console.log(`[API] GET /api/diesel-tanks/${id} - Found tank:`, tank.name);
    
    return NextResponse.json({
      success: true,
      tank: tank
    });
    
  } catch (error) {
    console.error(`[API] Error in GET /api/diesel-tanks/${params?.id}:`, error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Valid Tank ID is required' }, { status: 400 });
    }
    
    const body = await request.json();
    const { name, capacity, location, description, tankId, workplace } = body;
    
    // Validate required fields
    if (!name || !capacity || !location || !tankId) {
      return NextResponse.json({ 
        error: 'Name, capacity, location, and tankId are required' 
      }, { status: 400 });
    }
    
    const db = await connectDB();
    
    // Check if tankId is already used by another tank
    const existingTank = await db.collection('dieseltanks').findOne({
      tankId: tankId,
      _id: { $ne: new ObjectId(id) },
      isActive: true
    });
    
    if (existingTank) {
      return NextResponse.json({ 
        error: 'Tank ID already exists' 
      }, { status: 400 });
    }
    
    const updateData = {
      name: name.trim(),
      capacity: Number(capacity),
      location: location.trim(),
      tankId: tankId.trim(),
      description: description ? description.trim() : '',
      workplace: workplace ? workplace.trim() : '',
      updatedAt: new Date()
    };
    
    const result = await db.collection('dieseltanks').updateOne(
      { _id: new ObjectId(id), isActive: true },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Tank not found' }, { status: 404 });
    }
    
    console.log(`[API] PUT /api/diesel-tanks/${id} - Tank updated:`, name);
    
    return NextResponse.json({
      success: true,
      message: 'Tank updated successfully'
    });
    
  } catch (error) {
    console.error(`[API] Error in PUT /api/diesel-tanks/${params?.id}:`, error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Valid Tank ID is required' }, { status: 400 });
    }
    
    const db = await connectDB();
    
    // Soft delete - mark as inactive
    const result = await db.collection('dieseltanks').updateOne(
      { _id: new ObjectId(id), isActive: true },
      { 
        $set: { 
          isActive: false,
          deletedAt: new Date()
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Tank not found' }, { status: 404 });
    }
    
    console.log(`[API] DELETE /api/diesel-tanks/${id} - Tank deleted`);
    
    return NextResponse.json({
      success: true,
      message: 'Tank deleted successfully'
    });
    
  } catch (error) {
    console.error(`[API] Error in DELETE /api/diesel-tanks/${params?.id}:`, error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
