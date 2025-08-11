import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/api/auth/[...nextauth]/route';

export async function GET(request) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Only allow admins to access workplaces
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    // Connect to database
    const db = await connectDB();
    
    // Get distinct workplaces from users collection within admin's organization
    let filter = {};
    
    // If ADMIN (not SUPER_ADMIN), filter by organization
    if (session.user.role === 'ADMIN') {
      filter.organizationId = session.user.organizationId;
    }

    const workplaces = await db.collection('users').distinct('workplaceName', filter);
    
    // Filter out null, undefined, and empty values
    const validWorkplaces = workplaces.filter(wp => wp && wp.trim() !== '');
    
    console.log(`[API] Found ${validWorkplaces.length} workplaces for ${session.user.role}:`, validWorkplaces);
    
    return NextResponse.json(validWorkplaces);
    
  } catch (error) {
    console.error('Error fetching workplaces:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


