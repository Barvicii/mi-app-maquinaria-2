import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/api/auth/[...nextauth]/route';
import scheduler from "@/lib/scheduler";

// GET - Get basic scheduler status for current user (limited info for non-admins)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const status = scheduler.getStatus();
    
    // Return basic status for all users, detailed info only for admins
    const basicInfo = {
      active: status.initialized,
      lastCheck: new Date().toISOString(),
    };
    
    if (session.user?.role === 'admin') {
      return NextResponse.json({
        ...basicInfo,
        taskCount: status.taskCount,
        activeTasks: status.activeTasks,
        environment: process.env.NODE_ENV,
        autoEnabled: process.env.ENABLE_SCHEDULER === 'true' || process.env.NODE_ENV === 'production'
      });
    }
    
    return NextResponse.json(basicInfo);
    
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    return NextResponse.json({ 
      error: 'Failed to get scheduler status',
      details: error.message 
    }, { status: 500 });
  }
}


