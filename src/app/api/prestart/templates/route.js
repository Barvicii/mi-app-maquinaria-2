// src/app/api/prestart/templates/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET - Fetch all templates
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const userId = session.user.id;
    const db = await connectDB();
    
    // Get templates created by this user or global ones
    const templates = await db.collection('prestartTemplates')
      .find({ 
        $or: [
          { userId: userId },
          { isGlobal: true }
        ]
      })
      .sort({ name: 1 })
      .toArray();
    
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create a new template
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const userId = session.user.id;
    const data = await request.json();
    
    // Validate data
    if (!data.name || !data.checkItems || !Array.isArray(data.checkItems)) {
      return NextResponse.json({ error: "Invalid template data" }, { status: 400 });
    }
    
    const db = await connectDB();
    
    // Create the template
    const template = {
      name: data.name,
      checkItems: data.checkItems,
      userId: userId,
      isGlobal: false, // Only admins can create global templates
      createdAt: new Date()
    };
    
    const result = await db.collection('prestartTemplates').insertOne(template);
    
    return NextResponse.json({ 
      _id: result.insertedId,
      ...template
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}