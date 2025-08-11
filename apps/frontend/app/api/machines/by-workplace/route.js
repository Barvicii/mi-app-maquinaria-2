import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/api/auth/[...nextauth]/route';
import { connectDB } from "@/lib/mongodb";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has ADMIN or SUPER_ADMIN role
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    
    const { searchParams } = new URL(request.url);
    const workplace = searchParams.get('workplace');

    const db = await connectDB();
    
    // Base query for machines
    let query = {};
    
    if (isAdmin) {
      // Admin logic: can access all machines from their workplace or all workplaces
      if (session.user.role === 'ADMIN') {
        // ADMIN can see machines from their workplace
        if (session.user.workplace) {
          query = { workplaceName: session.user.workplace };
          console.log(`[API] Admin filtering by their workplace: ${session.user.workplace}`);
        } else {
          // If admin doesn't have workplace set, can see all machines
          query = {};
          console.log(`[API] Admin without workplace - showing all machines`);
        }
      } else if (session.user.role === 'SUPER_ADMIN') {
        // SUPER_ADMIN can see all machines from all workplaces
        query = {};
        console.log(`[API] Super admin - showing all machines`);
      }
    } else {
      // Regular user: can only access machines from their workplace
      if (!session.user.workplace) {
        return NextResponse.json({ error: 'User workplace not found' }, { status: 400 });
      }
      
      // Filter machines by user's workplace
      query = { workplaceName: session.user.workplace };
      console.log(`[API] Regular user filtering by workplace: ${session.user.workplace}`);
    }

    // If workplace is specified and user is admin, override the workplace filter
    if (workplace && workplace !== '' && isAdmin) {
      query.workplaceName = workplace;
      console.log(`[API] Admin filtering by specific workplace: ${workplace}`);
    }

    console.log(`[API] Fetching machines for workplace filtering with query:`, JSON.stringify(query));
    console.log(`[API] User role: ${session.user.role}, Organization: ${session.user.organizationId}`);

    const machines = await db.collection('machines')
      .find(query)
      .sort({ name: 1, model: 1 })
      .toArray();
    
    console.log(`[API] Found ${machines.length} machines${workplace ? ` for workplace: ${workplace}` : ' for user workplace'}`);

    // Debug info when no machines found for a specific workplace
    if (workplace && machines.length === 0 && isAdmin) {
      // Show all machines with workplace info for debugging
      const allMachines = await db.collection('machines')
        .find({})
        .limit(10)
        .toArray();
      
      console.log(`[DEBUG] Sample machines in database:`);
      allMachines.forEach(machine => {
        console.log(`[DEBUG] Machine: ${machine.name || machine.model || machine._id} - Workplace: ${machine.workplaceName || 'NO WORKPLACE'}`);
      });
    }

    return NextResponse.json(machines);
  } catch (error) {
    console.error('Error fetching machines by workplace:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

