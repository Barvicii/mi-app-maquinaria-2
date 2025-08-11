import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { ObjectId } from "mongodb";

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
    const resolvedParams = await params;
    console.log('[API] GET diesel record - params:', resolvedParams);
    
    if (!resolvedParams || !resolvedParams.id) {
      return NextResponse.json({ error: "Invalid record ID" }, { status: 400 });
    }
    
    const { id } = resolvedParams;

    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if organization is suspended
    const suspensionCheck = checkOrganizationSuspension(session);
    if (suspensionCheck) return suspensionCheck;

    const db = await connectDB();
    
    console.log('[API] GET diesel record - Looking for ID:', id, 'Type:', typeof id);
    
    // Try to find the diesel record with flexible ID matching
    let record = null;
    
    // First try with ObjectId if the ID is valid
    if (ObjectId.isValid(id)) {
      record = await db.collection('diesel_records').findOne({ 
        _id: new ObjectId(id)
      });
      console.log('[API] Search by ObjectId result:', record ? 'Found' : 'Not found');
    }
    
    // If not found and ID is not ObjectId format, try as string
    if (!record) {
      record = await db.collection('diesel_records').findOne({ 
        _id: id
      });
      console.log('[API] Search by string ID result:', record ? 'Found' : 'Not found');
    }

    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    // Check if user has access to this record (same credentialId)
    if (session.user.role !== 'SUPER_ADMIN' && 
        session.user.credentialId && 
        record.credentialId && 
        session.user.credentialId !== record.credentialId.toString()) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ record });
  } catch (error) {
    console.error('Error fetching diesel record:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const resolvedParams = await params;
    console.log('[API] PUT diesel record - params:', resolvedParams);
    
    if (!resolvedParams || !resolvedParams.id) {
      return NextResponse.json({ error: "Invalid record ID" }, { status: 400 });
    }
    
    const { id } = resolvedParams;

    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if organization is suspended
    const suspensionCheck = checkOrganizationSuspension(session);
    if (suspensionCheck) return suspensionCheck;

    const db = await connectDB();
    
    // Get update data
    const updateData = await request.json();
    console.log('[API] PUT diesel record - ID:', id, 'Type:', typeof id, 'UpdateData:', updateData);

    // Basic validations
    if (updateData.litros !== undefined && (updateData.litros <= 0 || isNaN(updateData.litros))) {
      return NextResponse.json({ error: "Fuel amount must be greater than 0" }, { status: 400 });
    }
    
    if (updateData.operador !== undefined && updateData.operador.trim() === '') {
      return NextResponse.json({ error: "Operator name cannot be empty" }, { status: 400 });
    }

    // Find the existing record with flexible ID matching
    let existingRecord = null;
    
    console.log('[API] PUT - Detailed search info:');
    console.log('  - ID received:', id);
    console.log('  - ID type:', typeof id);
    console.log('  - ID length:', id?.length);
    console.log('  - ObjectId.isValid(id):', ObjectId.isValid(id));
    
    // First try with ObjectId if the ID is valid
    if (ObjectId.isValid(id)) {
      const searchQuery = { _id: new ObjectId(id) };
      console.log('[API] PUT - Searching with ObjectId query:', JSON.stringify(searchQuery, null, 2));
      
      existingRecord = await db.collection('diesel_records').findOne(searchQuery);
      console.log('[API] PUT - Search by ObjectId result:', existingRecord ? 'Found' : 'Not found');
      
      if (existingRecord) {
        console.log('[API] PUT - Found record _id type:', typeof existingRecord._id);
        console.log('[API] PUT - Found record _id value:', existingRecord._id);
      }
    }
    
    // If not found and ID is not ObjectId format, try as string
    if (!existingRecord) {
      const searchQuery = { _id: id };
      console.log('[API] PUT - Searching with string query:', JSON.stringify(searchQuery, null, 2));
      
      existingRecord = await db.collection('diesel_records').findOne(searchQuery);
      console.log('[API] PUT - Search by string ID result:', existingRecord ? 'Found' : 'Not found');
    }
    
    // Additional debug: let's try to find ANY record to see the structure
    if (!existingRecord) {
      console.log('[API] PUT - Record not found with standard searches. Checking collection...');
      const sampleRecord = await db.collection('diesel_records').findOne({});
      if (sampleRecord) {
        console.log('[API] PUT - Sample record _id:', sampleRecord._id);
        console.log('[API] PUT - Sample record _id type:', typeof sampleRecord._id);
      } else {
        console.log('[API] PUT - No records found in diesel_records collection');
      }
    }

    if (!existingRecord) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    // Check if user has access to this record
    if (session.user.role !== 'SUPER_ADMIN' && 
        session.user.credentialId && 
        existingRecord.credentialId && 
        session.user.credentialId !== existingRecord.credentialId.toString()) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Prepare update data
    const updateFields = {
      ...updateData,
      updatedAt: new Date(),
      updatedBy: session.user.id
    };

    // Remove fields that shouldn't be updated
    delete updateFields._id;
    delete updateFields.tankId;
    delete updateFields.maquinaId;
    delete updateFields.credentialId;
    delete updateFields.userId;
    delete updateFields.createdAt;
    delete updateFields.createdBy;

    // 🚀 Calculate tank level adjustment if litros changed
    let tankLevelAdjustment = 0;
    if (updateData.litros !== undefined && updateData.litros !== existingRecord.litros) {
      const oldLitros = parseFloat(existingRecord.litros) || 0;
      const newLitros = parseFloat(updateData.litros) || 0;
      tankLevelAdjustment = oldLitros - newLitros; // If new amount is higher, we need to subtract more from tank
      
      console.log('[API] PUT - Litros change detected:');
      console.log('  Old amount:', oldLitros);
      console.log('  New amount:', newLitros);
      console.log('  Tank adjustment needed:', tankLevelAdjustment);
    }

    // Update the record using the same ID format as found
    let result;
    if (ObjectId.isValid(id) && existingRecord._id instanceof ObjectId) {
      result = await db.collection('diesel_records').updateOne(
        { _id: new ObjectId(id) },
        { $set: updateFields }
      );
    } else {
      result = await db.collection('diesel_records').updateOne(
        { _id: id },
        { $set: updateFields }
      );
    }

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Failed to update record" }, { status: 404 });
    }

    // 🚀 Update tank level if litros changed
    if (tankLevelAdjustment !== 0 && existingRecord.tankId) {
      try {
        console.log('[API] PUT - Updating tank level for tankId:', existingRecord.tankId, 'adjustment:', tankLevelAdjustment);
        
        const tankUpdateResult = await db.collection('dieseltanks').updateOne(
          { 
            $or: [
              { tankId: existingRecord.tankId },                                        // Search by tankId string
              { tankId: existingRecord.tankId.toString() },                             // Ensure string
              { _id: ObjectId.isValid(existingRecord.tankId) ? new ObjectId(existingRecord.tankId) : null }, // Search by ObjectId _id
              { name: existingRecord.tankId },                                          // Tank name as fallback
              ...(ObjectId.isValid(existingRecord.tankId) ? [{ tankId: new ObjectId(existingRecord.tankId) }] : []) // ObjectId tankId
            ]
          },
          { 
            $inc: { currentLevel: tankLevelAdjustment }, // Add the adjustment (positive if less consumption, negative if more)
            $set: { updatedAt: new Date() }
          }
        );
        
        if (tankUpdateResult.matchedCount > 0) {
          console.log('[API] PUT - Tank level updated successfully. Modified count:', tankUpdateResult.modifiedCount);
          
          // Get updated tank info for logging
          const updatedTank = await db.collection('dieseltanks').findOne({
            $or: [
              { tankId: existingRecord.tankId },
              { tankId: existingRecord.tankId.toString() },
              { _id: ObjectId.isValid(existingRecord.tankId) ? new ObjectId(existingRecord.tankId) : null },
              { name: existingRecord.tankId },
              ...(ObjectId.isValid(existingRecord.tankId) ? [{ tankId: new ObjectId(existingRecord.tankId) }] : [])
            ]
          });
          
          if (updatedTank) {
            console.log('[API] PUT - Tank after update:', {
              name: updatedTank.name,
              tankId: updatedTank.tankId,
              currentLevel: updatedTank.currentLevel,
              capacity: updatedTank.capacity
            });
          }
        } else {
          console.warn('[API] PUT - No tank found to update for tankId:', existingRecord.tankId);
        }
      } catch (tankError) {
        console.error('[API] PUT - Error updating tank level:', tankError);
        // Don't fail the entire operation if tank update fails
      }
    }

    // Get the updated record using the same search logic
    let updatedRecord = null;
    if (ObjectId.isValid(id) && existingRecord._id instanceof ObjectId) {
      updatedRecord = await db.collection('diesel_records').findOne({ 
        _id: new ObjectId(id)
      });
    } else {
      updatedRecord = await db.collection('diesel_records').findOne({ 
        _id: id
      });
    }

    console.log('[API] Diesel record updated successfully');
    return NextResponse.json({ 
      message: "Record updated successfully",
      record: updatedRecord 
    });

  } catch (error) {
    console.error('Error updating diesel record:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    console.log('[API] DELETE diesel record - params:', resolvedParams);
    
    if (!resolvedParams || !resolvedParams.id) {
      return NextResponse.json({ error: "Invalid record ID" }, { status: 400 });
    }
    
    const { id } = resolvedParams;

    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if organization is suspended
    const suspensionCheck = checkOrganizationSuspension(session);
    if (suspensionCheck) return suspensionCheck;

    const db = await connectDB();
    
    console.log('[API] DELETE diesel record - ID:', id, 'Type:', typeof id);
    
    // Find the existing record with flexible ID matching
    let existingRecord = null;
    
    // First try with ObjectId if the ID is valid
    if (ObjectId.isValid(id)) {
      existingRecord = await db.collection('diesel_records').findOne({ 
        _id: new ObjectId(id)
      });
      console.log('[API] DELETE - Search by ObjectId result:', existingRecord ? 'Found' : 'Not found');
    }
    
    // If not found and ID is not ObjectId format, try as string
    if (!existingRecord) {
      existingRecord = await db.collection('diesel_records').findOne({ 
        _id: id
      });
      console.log('[API] DELETE - Search by string ID result:', existingRecord ? 'Found' : 'Not found');
    }

    if (!existingRecord) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    // Check if user has access to this record
    if (session.user.role !== 'SUPER_ADMIN' && 
        session.user.credentialId && 
        existingRecord.credentialId && 
        session.user.credentialId !== existingRecord.credentialId.toString()) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get the fuel amount that needs to be returned to the tank
    const fuelToReturn = parseFloat(existingRecord.litros) || 0;
    console.log('[API] DELETE - Fuel to return to tank:', fuelToReturn, 'liters');

    // Delete the record using the same ID format as found
    let result;
    if (ObjectId.isValid(id) && existingRecord._id instanceof ObjectId) {
      result = await db.collection('diesel_records').deleteOne({ 
        _id: new ObjectId(id)
      });
    } else {
      result = await db.collection('diesel_records').deleteOne({ 
        _id: id
      });
    }

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Failed to delete record" }, { status: 404 });
    }

    // 🚀 Return fuel to tank after successful deletion
    if (fuelToReturn > 0 && existingRecord.tankId) {
      try {
        console.log('[API] DELETE - Returning fuel to tank. TankId:', existingRecord.tankId, 'Amount:', fuelToReturn);
        
        const tankUpdateResult = await db.collection('dieseltanks').updateOne(
          { 
            $or: [
              { tankId: existingRecord.tankId },                                        // Search by tankId string
              { tankId: existingRecord.tankId.toString() },                             // Ensure string
              { _id: ObjectId.isValid(existingRecord.tankId) ? new ObjectId(existingRecord.tankId) : null }, // Search by ObjectId _id
              { name: existingRecord.tankId },                                          // Tank name as fallback
              ...(ObjectId.isValid(existingRecord.tankId) ? [{ tankId: new ObjectId(existingRecord.tankId) }] : []) // ObjectId tankId
            ]
          },
          { 
            $inc: { currentLevel: fuelToReturn }, // Add back the consumed fuel
            $set: { updatedAt: new Date() }
          }
        );
        
        if (tankUpdateResult.matchedCount > 0) {
          console.log('[API] DELETE - Tank level updated successfully. Modified count:', tankUpdateResult.modifiedCount);
          
          // Get updated tank info for logging
          const updatedTank = await db.collection('dieseltanks').findOne({
            $or: [
              { tankId: existingRecord.tankId },
              { tankId: existingRecord.tankId.toString() },
              { _id: ObjectId.isValid(existingRecord.tankId) ? new ObjectId(existingRecord.tankId) : null },
              { name: existingRecord.tankId },
              ...(ObjectId.isValid(existingRecord.tankId) ? [{ tankId: new ObjectId(existingRecord.tankId) }] : [])
            ]
          });
          
          if (updatedTank) {
            console.log('[API] DELETE - Tank after fuel return:', {
              name: updatedTank.name,
              tankId: updatedTank.tankId,
              currentLevel: updatedTank.currentLevel,
              capacity: updatedTank.capacity
            });
          }
        } else {
          console.warn('[API] DELETE - No tank found to update for tankId:', existingRecord.tankId);
        }
      } catch (tankError) {
        console.error('[API] DELETE - Error returning fuel to tank:', tankError);
        // Don't fail the entire operation if tank update fails
      }
    }

    console.log('[API] Diesel record deleted successfully:', id);
    return NextResponse.json({ 
      message: "Record deleted successfully" 
    });

  } catch (error) {
    console.error('Error deleting diesel record:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
