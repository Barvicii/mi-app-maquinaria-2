import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/mongodb";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const db = await connectDB();
    
    // Get unique workplaces from users in the same organization
    const workplaces = await db.collection('users')
      .distinct('workplace', {
        organization: session.user.organization,
        workplace: { $ne: null, $ne: '' }
      });

    // Also get workplaces from machines in the same organization
    const machineWorkplaces = await db.collection('machines')
      .distinct('workplace', {
        organization: session.user.organization,
        workplace: { $ne: null, $ne: '', $ne: 'N/A' }
      });

    // Combine and deduplicate
    const allWorkplaces = [...new Set([...workplaces, ...machineWorkplaces])];
    
    return NextResponse.json(allWorkplaces.sort());
  } catch (error) {
    console.error('Error fetching workplaces:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Solo admins pueden crear workplaces
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { workplace } = await request.json();
    
    if (!workplace || workplace.trim() === '') {
      return NextResponse.json({ error: "Workplace name is required" }, { status: 400 });
    }

    const db = await connectDB();
    
    // Check if workplace already exists in the organization
    const existingWorkplace = await db.collection('users').findOne({
      organization: session.user.organization,
      workplace: workplace.trim()
    });

    if (existingWorkplace) {
      return NextResponse.json({ error: "Workplace already exists" }, { status: 409 });
    }

    // We don't actually need to store workplaces separately since they exist as part of users and machines
    // This endpoint is mainly for validation, but we could create a separate workplaces collection if needed
    
    return NextResponse.json({ 
      success: true, 
      workplace: workplace.trim(),
      message: "Workplace can be used for new machines and users"
    });
  } catch (error) {
    console.error('Error creating workplace:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
