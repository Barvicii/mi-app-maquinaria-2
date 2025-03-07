import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET(request) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const userId = session.user.id;
    console.log('GET prestarts for user:', userId);
    
    const db = await connectDB();
    // Filtrar prestarts por userId
    const prestarts = await db.collection('prestarts')
      .find({ userId: userId })
      .sort({ createdAt: -1 })
      .toArray();
      
    return NextResponse.json(prestarts);
  } catch (error) {
    console.error('Error fetching prestarts:', error);
    return NextResponse.json({ error: error.message || "Failed to fetch prestarts" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const userId = session.user.id;
    console.log('Creating prestart for user:', userId);
    
    let data;
    try {
      data = await request.json();
    } catch (error) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    
    // Añadir userId al documento
    data.userId = userId;
    data.createdAt = new Date();
    
    const db = await connectDB();
    const result = await db.collection('prestarts').insertOne(data);
    
    const newPrestart = await db.collection('prestarts').findOne({
      _id: result.insertedId
    });
    
    return NextResponse.json(newPrestart);
  } catch (error) {
    console.error('Error creating prestart:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}