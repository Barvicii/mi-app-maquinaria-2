// src/app/api/prestart/templates/default/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await connectDB();
    
    // First try to find a template marked as default
    let template = await db.collection('prestartTemplates').findOne({ isDefault: true });
    
    // If no default is set, get the most recently created one
    if (!template) {
      const templates = await db.collection('prestartTemplates')
        .find({})
        .sort({ createdAt: -1 })
        .limit(1)
        .toArray();
        
      if (templates.length > 0) {
        template = templates[0];
      }
    }
    
    // If still no template, create a basic one
    if (!template) {
      template = {
        name: 'Basic Template',
        description: 'Default system template',
        isDefault: true,
        checkItems: [
          { id: '1', name: 'aceite', label: 'Nivel de Aceite', required: true },
          { id: '2', name: 'agua', label: 'Nivel de Agua', required: true },
          { id: '3', name: 'neumaticos', label: 'Estado de Neumáticos', required: true },
          { id: '4', name: 'nivelCombustible', label: 'Nivel de Combustible', required: true },
          { id: '5', name: 'lucesYAlarmas', label: 'Luces y Alarmas', required: false },
          { id: '6', name: 'frenos', label: 'Sistema de Frenos', required: true },
          { id: '7', name: 'extintores', label: 'Extintores', required: false },
          { id: '8', name: 'cinturonSeguridad', label: 'Cinturón de Seguridad', required: false }
        ],
        createdAt: new Date()
      };
      
      // Save this basic template to the database
      await db.collection('prestartTemplates').insertOne(template);
    }
    
    return NextResponse.json(template);
  } catch (error) {
    console.error('[API] Error getting default template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}