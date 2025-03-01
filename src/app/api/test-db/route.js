import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Machine from '@/models/Machine';

export async function GET() {
  try {
    // Test DB connection
    await dbConnect();
    console.log("Database connected successfully");

    // Count machines in DB
    const count = await Machine.countDocuments({});
    console.log(`Found ${count} machines in database`);

    // Get first 3 machines to see sample data
    const machines = await Machine.find({}).limit(3);
    
    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      count,
      sampleData: machines.map(m => ({
        id: m._id,
        model: m.model || m.modelo,
        brand: m.brand || m.marca
      }))
    });
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}