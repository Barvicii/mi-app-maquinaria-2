// src/app/api/prestart/templates/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "../../../auth/[...nextauth]/route";
import { connectDB } from '@/lib/mongodb';
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

// GET - Fetch a specific template
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    if (!id || (id !== 'default' && !ObjectId.isValid(id))) {
      return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
    }
    
    // Verificar si es una solicitud pública
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get('public') === 'true';
    const machineId = searchParams.get('machineId');
    
    // For 'default', return the default template
    if (id === 'default') {
      return NextResponse.json({
        _id: 'default',
        name: 'Default Template',
        checkItems: [
          { name: 'aceite', label: 'Nivel de Aceite', required: true },
          { name: 'agua', label: 'Nivel de Agua', required: true },
          { name: 'neumaticos', label: 'Estado de Neumáticos', required: true },
          { name: 'nivelCombustible', label: 'Nivel de Combustible', required: true },
          { name: 'lucesYAlarmas', label: 'Luces y Alarmas', required: false },
          { name: 'frenos', label: 'Sistema de Frenos', required: true },
          { name: 'extintores', label: 'Extintores', required: false },
          { name: 'cinturonSeguridad', label: 'Cinturón de Seguridad', required: false }
        ]
      });
    }
    
    const db = await connectDB();
    
    // Si es acceso público, permitir templates globales O templates de organización si viene machineId
    if (isPublic) {
      const template = await db.collection('prestartTemplates').findOne({
        _id: new ObjectId(id)
      });
      
      if (!template) {
        return NextResponse.json({ error: "Template not found or not public" }, { status: 404 });
      }
      
      // Si el template es global, permitir acceso
      if (template.isGlobal === true) {
        return NextResponse.json(template);
      }
      
      // Si no es global pero viene machineId, verificar que la máquina pertenezca a la misma organización
      if (machineId && ObjectId.isValid(machineId)) {
        const machine = await db.collection('machines').findOne({
          _id: new ObjectId(machineId)
        });
        
        // Verificar coincidencia por organizationId O por nombre de organización
        const organizationMatch = 
          (machine && machine.organizationId && machine.organizationId === template.organizationId) ||
          (machine && machine.organization && template.organizationName && machine.organization === template.organizationName);
        
        if (organizationMatch) {
          // Add creator information if template has userId
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
          return NextResponse.json(template);
        }
      }
      
      return NextResponse.json({ error: "Template not found or not public" }, { status: 404 });
    }
    
    // Para acceso autenticado
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verificar si la organización está suspendida
    const suspensionCheck = checkOrganizationSuspension(session);
    if (suspensionCheck) {
      return suspensionCheck;
    }
    
    const template = await db.collection('prestartTemplates').findOne({
      _id: new ObjectId(id)
    });
    
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    
    // Check permissions: user can access template if:
    // 1. User is SUPER_ADMIN (can access all)
    // 2. Template is global (isGlobal: true)
    // 3. User owns the template (template.userId === session.user.id)
    // 4. Template belongs to user's organization (template.organizationId === session.user.organizationId)
    const userId = session.user.id;
    const userRole = session.user.role;
    const userOrganizationId = session.user.organizationId;
    
    const hasAccess = 
      userRole === 'SUPER_ADMIN' ||
      template.isGlobal === true ||
      template.userId === userId ||
      template.organizationId === userOrganizationId;
    
    if (!hasAccess) {
      return NextResponse.json({ 
        error: "Access denied. You don't have permission to access this template." 
      }, { status: 403 });
    }
    
    // Add creator information if template has userId
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
    
    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update a template
export async function PUT(request, { params }) {
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
    const { id } = params;
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
    }
    
    const data = await request.json();
    
    // Validate data
    if (!data.name || !data.checkItems || !Array.isArray(data.checkItems)) {
      return NextResponse.json({ error: "Invalid template data" }, { status: 400 });
    }
    
    const db = await connectDB();
    
    // Check if template exists and user owns it
    const existingTemplate = await db.collection('prestartTemplates').findOne({
      _id: new ObjectId(id)
    });
    
    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    
    // Allow updates if:
    // 1. User owns the template
    // 2. User is ADMIN/SUPER_ADMIN and template belongs to their organization
    // 3. User is SUPER_ADMIN (can edit any template)
    const userRole = session.user.role;
    const userOrganizationId = session.user.organizationId;
    
    const canEdit = 
      existingTemplate.userId === userId || // User owns the template
      (userRole === 'SUPER_ADMIN') || // Super admin can edit any template
      (userRole === 'ADMIN' && existingTemplate.organizationId === userOrganizationId); // Org admin can edit org templates
    
    if (!canEdit) {
      return NextResponse.json({ error: "Not authorized to update this template" }, { status: 403 });
    }
    
    // Update the template
    const result = await db.collection('prestartTemplates').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          name: data.name,
          checkItems: data.checkItems,
          updatedAt: new Date()
        }
      }
    );
    
    return NextResponse.json({ message: "Template updated successfully" });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a template
export async function DELETE(request, { params }) {
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
    const { id } = params;
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
    }
    
    const db = await connectDB();
    
    // Check if template exists and user owns it
    const existingTemplate = await db.collection('prestartTemplates').findOne({
      _id: new ObjectId(id)
    });
    
    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    
    // Allow deletion if:
    // 1. User owns the template
    // 2. User is ADMIN/SUPER_ADMIN and template belongs to their organization
    // 3. User is SUPER_ADMIN (can delete any template)
    const userRole = session.user.role;
    const userOrganizationId = session.user.organizationId;
    
    const canDelete = 
      existingTemplate.userId === userId || // User owns the template
      (userRole === 'SUPER_ADMIN') || // Super admin can delete any template
      (userRole === 'ADMIN' && existingTemplate.organizationId === userOrganizationId); // Org admin can delete org templates
    
    if (!canDelete) {
      return NextResponse.json({ error: "Not authorized to delete this template" }, { status: 403 });
    }
    
    // Delete the template
    await db.collection('prestartTemplates').deleteOne({ _id: new ObjectId(id) });
    
    return NextResponse.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}