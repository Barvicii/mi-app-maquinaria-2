import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const userId = session.user.id;
    console.log('GET services for user:', userId);
    
    const db = await connectDB();
    // Filtrar services por userId
    const services = await db.collection('services')
      .find({ userId: userId })
      .sort({ createdAt: -1 })
      .toArray();
      
    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: error.message || "Failed to fetch services" }, { status: 500 });
  }
}

// Implementación de POST similar a prestarts
export async function POST(request) {
  // Código similar al POST de prestarts
}