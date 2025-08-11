import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request, { params }) {
  try {
    // Extract reportId from parameters
    const reportId = params.reportId;
    console.log('[API] Report export requested:', reportId);

    // Get format from URL
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format')?.toLowerCase() || 'csv';
    
    // Verify user session
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Connect to database
    const { db } = await connectDB();
    
    // Retrieve the report data
    const report = await db.collection('reports').findOne({ 
      _id: new ObjectId(reportId)
    });
    
    if (!report) {
      console.error(`[API] Report not found: ${reportId}`);
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    console.log(`[API] Found report: ${reportId}, format: ${format}`);
    
    // Return CSV data
    if (format === 'csv') {
      // Generate CSV content
      const csvContent = generateCsvContent(report);
      
      // Return as a downloadable file
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv;charset=utf-8',
          'Content-Disposition': `attachment; filename="report-${reportId}.csv"`
        }
      });
    }
    
    // Default response as JSON
    return NextResponse.json(report);
    
  } catch (error) {
    console.error('[API] Error getting report:', error);
    return NextResponse.json({ error: 'Error processing report' }, { status: 500 });
  }
}

// Helper function to generate CSV content
function generateCsvContent(report) {
  if (!report.data || !Array.isArray(report.data) || report.data.length === 0) {
    return 'No data available';
  }
  
  try {
    // Headers
    const headers = Object.keys(report.data[0]).join(',');
    
    // Rows
    const rows = report.data.map(item => 
      Object.values(item).map(val => {
        // Handle values with commas by quoting them
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`; 
      }).join(',')
    ).join('\n');
    
    return `${headers}\n${rows}`;
  } catch (error) {
    console.error('Error generating CSV:', error);
    return 'Error generating CSV';
  }
}