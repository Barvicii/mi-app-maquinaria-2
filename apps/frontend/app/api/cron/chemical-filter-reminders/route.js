import { NextResponse } from 'next/server';
import { checkChemicalFilterReminders } from "@/lib/alertService";

// API endpoint to manually trigger chemical filter reminder checks
export async function POST(request) {
  try {
    console.log('[CRON] Manual chemical filter reminders check triggered');
    
    // Check authorization header for security
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN || 'default-secret';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      console.log('[CRON] Unauthorized chemical filter reminder check attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Run chemical filter reminder checks
    const alertsCreated = await checkChemicalFilterReminders();
    
    console.log(`[CRON] Chemical filter reminder check completed. Created ${alertsCreated.length} alerts`);
    
    return NextResponse.json({
      success: true,
      message: `Chemical filter reminder check completed successfully`,
      alertsCreated: alertsCreated.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[CRON] Error in chemical filter reminders check:', error);
    return NextResponse.json({ 
      error: 'Chemical filter reminder check failed',
      details: error.message 
    }, { status: 500 });
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    service: 'Chemical Filter Reminders',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
}
