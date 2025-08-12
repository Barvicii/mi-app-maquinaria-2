import { NextResponse } from 'next/server';
import { dbConnect } from "@/lib/mongodb";
import { MongoClient } from 'mongodb';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('[SUSPENSION-CHECK] Checking suspension status for:', email);

    // Conectar directamente a MongoDB (similar a como lo hace NextAuth)
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();

    const user = await db.collection("users").findOne({ 
      email: email 
    });

    if (!user) {
      await client.close();
      return NextResponse.json({ 
        suspended: false, 
        exists: false 
      });
    }

    // Verificar si el usuario está suspendido
    // Para usuarios más antiguos usar el campo 'active', para nuevos usar 'status'
    const userIsActive = user.status ? user.status === 'active' : user.active !== false;
    const isSuspended = user.organizationSuspended === true || !userIsActive;
    
    await client.close();

    console.log('[SUSPENSION-CHECK] User suspension status:', isSuspended);
    console.log('[SUSPENSION-CHECK] organizationSuspended:', user.organizationSuspended);
    console.log('[SUSPENSION-CHECK] status:', user.status);
    console.log('[SUSPENSION-CHECK] active (legacy):', user.active);
    console.log('[SUSPENSION-CHECK] userIsActive:', userIsActive);

    return NextResponse.json({ 
      suspended: isSuspended,
      exists: true,
      organizationSuspended: user.organizationSuspended || false,
      userActive: userIsActive
    });

  } catch (error) {
    console.error('[SUSPENSION-CHECK] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
