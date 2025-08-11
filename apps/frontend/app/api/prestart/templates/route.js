// src/app/api/prestart/templates/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import { ObjectId } from 'mongodb';

// Helper function to check organization suspension
const checkOrganizationSuspension = (session) => {
  if (session.user.role !== 'SUPER_ADMIN' && session.user.organizationSuspended === true) {
    return NextResponse.json(
      { error: 'Organization is suspended. Contact support for assistance.' },
      { status: 403 }
    );
  }
  return null;
};

// GET - Fetch all templates
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get('public') === 'true';
    
    // Si es acceso público (QR), solo devolver plantillas globales
    if (isPublic) {
      const db = await connectDB();
      const templates = await db.collection('prestartTemplates')
        .find({ isGlobal: true })
        .sort({ name: 1 })
        .toArray();
      
      return NextResponse.json(templates);
    }
    
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verificar si la organización está suspendida
    const suspensionCheck = checkOrganizationSuspension(session);
    if (suspensionCheck) {
      return suspensionCheck;
    }
    
    const userId = session.user.id;
    const userRole = session.user.role;
    const userOrganization = session.user.organizationId;
    const db = await connectDB();
    
    // Build query based on user role and organization
    let query = {};
    
    if (userRole === 'SUPER_ADMIN') {
      // Super admins can see all templates
      query = {};
    } else if (userRole === 'ADMIN') {
      // Organization admins can see:
      // 1. Templates they created
      // 2. Global templates
      // 3. Templates from their organization
      query = {
        $or: [
          { userId: userId },
          { isGlobal: true },
          { organizationId: userOrganization }
        ]
      };
    } else {
      // Regular users can see:
      // 1. Templates they created
      // 2. Global templates  
      // 3. ALL templates from their organization (both from admins and other users)
      query = {
        $or: [
          { userId: userId },
          { isGlobal: true },
          { organizationId: userOrganization }
        ]
      };
    }
    
    const templates = await db.collection('prestartTemplates')
      .find(query)
      .sort({ name: 1 })
      .toArray();
    
    // Add creator information for templates
    for (let template of templates) {
      if (template.userId) {
        const creator = await db.collection('users').findOne(
          { _id: new ObjectId(template.userId) },
          { projection: { name: 1, email: 1, role: 1 } }
        );
        if (creator) {
          template.createdBy = {
            name: creator.name || creator.email,
            role: creator.role
          };
        }
      }
    }
    
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

    // Verificar si la organización está suspendida
    const suspensionCheck = checkOrganizationSuspension(session);
    if (suspensionCheck) {
      return suspensionCheck;
    }
    
    const userId = session.user.id;
    const userRole = session.user.role;
    const userOrganization = session.user.organizationId;
    const data = await request.json();
    
    // Validate data
    if (!data.name || !data.checkItems || !Array.isArray(data.checkItems)) {
      return NextResponse.json({ error: "Invalid template data" }, { status: 400 });
    }
    
    const db = await connectDB();
    
    // Create the template
    const template = {
      name: data.name,
      description: data.description || '',
      checkItems: data.checkItems,
      userId: userId,
      organizationId: userOrganization,
      organizationName: data.organizationName || session.user.organization, // Agregar nombre de organización
      createdByAdmin: userRole === 'ADMIN' || userRole === 'SUPER_ADMIN',
      createdByUser: data.createdByUser || session.user.name || session.user.email, // Nombre del usuario que crea
      createdByUserId: data.createdByUserId || userId, // ID del usuario que crea
      isGlobal: userRole === 'SUPER_ADMIN' && data.isGlobal === true, // Only super admins can create global templates
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


