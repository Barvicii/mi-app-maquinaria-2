import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const publicAccess = searchParams.get('public') === 'true';
    
    let userId = null;
    
    // Verificar autenticación excepto para acceso público
    if (!publicAccess) {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }
      userId = session.user.id;
    }
    
    const db = await connectDB();
    
    // Crear consulta - Filtrar por userId cuando no es público
    let query = {};
    if (!publicAccess) {
      // Solo obtener máquinas pertenecientes al usuario actual
      query.userId = userId;
    }
    
    console.log('Machines query:', query);
    
    const machines = await db.collection('machines')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    return NextResponse.json(machines);
  } catch (error) {
    console.error('Error fetching machines:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const data = await request.json();
    
    // Validation...
    
    const db = await connectDB();
    
    // Add credential info and user info
    const machineData = {
      ...data,
      credentialId: session.user.credentialId, // Store the credential ID
      createdBy: session.user.id,
      createdAt: new Date(),
    };
    
    const result = await db.collection('machines').insertOne(machineData);
    
    return NextResponse.json({
      _id: result.insertedId,
      ...machineData
    });
  } catch (error) {
    console.error('[ERROR] Error creating machine:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}