// src/app/api/prestart/templates/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET - Fetch a specific template
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    if (!id || (id !== 'default' && !ObjectId.isValid(id))) {
      return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
    }
    
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
    const template = await db.collection('prestartTemplates').findOne({
      _id: new ObjectId(id)
    });
    
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
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
    
    // Only allow updates if user owns the template or is admin
    if (existingTemplate.userId !== userId && session.user.role !== 'admin') {
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
    
    // Only allow deletion if user owns the template or is admin
    if (existingTemplate.userId !== userId && session.user.role !== 'admin') {
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