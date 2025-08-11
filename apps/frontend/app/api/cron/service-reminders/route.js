import { NextResponse } from 'next/server';
import { checkServiceReminders } from "@/lib/alertService";

// API endpoint to manually trigger service reminder checks
export async function POST(request) {
  try {
    console.log('[CRON] Manual service reminders check triggered');
    
    // Check authorization header for security
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN || 'default-secret';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      console.log('[CRON] Unauthorized service reminder check attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Run service reminder checks
    const alertsCreated = await checkServiceReminders();
    
    console.log(`[CRON] Service reminder check completed. Created ${alertsCreated.length} alerts`);
    
    return NextResponse.json({
      success: true,
      message: `Service reminder check completed successfully`,
      alertsCreated: alertsCreated.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[CRON] Error in service reminders check:', error);
    return NextResponse.json({ 
      error: 'Service reminder check failed',
      details: error.message 
    }, { status: 500 });
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    endpoint: 'Service Reminders Cron Job',
    status: 'active',
    description: 'Checks for machines that need service within 10 hours',
    lastCheck: new Date().toISOString()
  });
}


