import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/api/auth/[...nextauth]/route';
import scheduler from "@/lib/scheduler";

// POST - Control scheduler (start/stop/restart) - ADMIN ONLY
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin or super admin
    if (!['ADMIN', 'SUPER_ADMIN', 'admin'].includes(session.user?.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const { action } = await request.json();
    
    let result = {};
    
    switch (action) {
      case 'start':
        scheduler.init();
        result = { 
          message: 'Alert monitoring started',
          status: scheduler.getStatus() 
        };
        break;
        
      case 'stop':
        scheduler.stopAll();
        result = { 
          message: 'Alert monitoring stopped',
          status: scheduler.getStatus() 
        };
        break;
        
      case 'restart':
        scheduler.stopAll();
        setTimeout(() => scheduler.init(), 1000);
        result = { 
          message: 'Alert monitoring restarted',
          status: scheduler.getStatus() 
        };
        break;
        
      case 'runServiceCheck':
        const serviceResult = await scheduler.runServiceReminders();
        result = { 
          message: 'Service check executed',
          result: serviceResult,
          status: scheduler.getStatus()
        };
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    console.log(`[AlertControl] User ${session.user.id} executed action: ${action}`);
    
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error controlling scheduler:', error);
    return NextResponse.json({ 
      error: 'Failed to control scheduler',
      details: error.message 
    }, { status: 500 });
  }
}


