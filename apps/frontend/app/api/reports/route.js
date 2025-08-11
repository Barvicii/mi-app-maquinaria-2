import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(request) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get parameters from request
    const { searchParams } = new URL(request.url);
    const machineId = searchParams.get('machineId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const type = searchParams.get('type');

    // Connect to database
    const db = await connectDB();
    
    // Build query
    const query = { userId: session.user.id };
    
    if (machineId) {
      query.machineId = machineId;
    }
    
    if (fromDate) {
      query.createdAt = { ...query.createdAt, $gte: new Date(fromDate) };
    }
    
    if (toDate) {
      // Add one day to include the end date
      const endDate = new Date(toDate);
      endDate.setDate(endDate.getDate() + 1);
      query.createdAt = { ...query.createdAt, $lt: endDate };
    }
    
    if (type) {
      query.type = type;
    }
    
    console.log('Reports query:', JSON.stringify(query));
    
    // Get reports from database
    const reports = await db.collection('reports')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    // Convert MongoDB ObjectId to string for proper JSON serialization
    const processedReports = reports.map(report => {
      // Convert _id to string if it's not already
      if (report._id && typeof report._id !== 'string') {
        report._id = report._id.toString();
      }
      
      // Return with proper date formatting
      return {
        ...report,
        // Convert dates to ISO strings for proper serialization
        createdAt: report.createdAt instanceof Date ? report.createdAt.toISOString() : report.createdAt,
        dateFrom: report.dateFrom instanceof Date ? report.dateFrom.toISOString() : report.dateFrom,
        dateTo: report.dateTo instanceof Date ? report.dateTo.toISOString() : report.dateTo
      };
    });
    
    return NextResponse.json(processedReports);
    
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


