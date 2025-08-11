import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/mongodb";
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validar campos requeridos
    if (!data.maquinaId) {
      return NextResponse.json({
        error: 'Missing required machine ID'
      }, { status: 400 });
    }
    
    const db = await connectDB();
    
    // Buscar la máquina por ID para obtener tanto el userId como el credentialId
    let machineOwner = null;
    let machineCredentialId = null;
    
    try {
      // Buscar la máquina por ID (intentando diferentes campos)
      const machine = await db.collection('machines').findOne({
        $or: [
          { _id: ObjectId.isValid(data.maquinaId) ? new ObjectId(data.maquinaId) : null },
          { machineId: data.maquinaId },
          { customId: data.maquinaId }
        ]
      });
      
      if (machine) {
        // Obtener tanto el userId como el credentialId
        machineOwner = machine.userId || machine.createdBy;
        
        // Si la máquina no tiene credentialId directamente, buscar el credentialId del usuario
        if (machineOwner) {
          // Primero intentar obtener del objeto machine directamente
          machineCredentialId = machine.credentialId;
          
          // Si no existe, buscar el usuario dueño para obtener su credentialId
          if (!machineCredentialId) {
            const owner = await db.collection('users').findOne({ _id: new ObjectId(machineOwner) });
            if (owner) {
              machineCredentialId = owner.credentialId;
            }
          }
        }
        
        console.log(`[API] Found machine owner: ${machineOwner}, credentialId: ${machineCredentialId}`);
      }
    } catch (err) {
      console.error('[API] Error finding machine owner:', err);
    }
    
    // Añadir metadatos
    const prestart = {
      ...data,
      userId: machineOwner || "public_user",    // El userId del dueño de la máquina
      credentialId: machineCredentialId,        // El credentialId del dueño (crucial para filtrado)
      createdBy: "public_user",                 // Mantener para auditoría
      createdAt: new Date(),
      source: 'public',                         // Marcar como creado desde acceso público
    };
    
    console.log('[API] Public prestart data to save:', prestart);
    
    // Guardar en la colección prestart (singular)
    const result = await db.collection('prestart').insertOne(prestart);
    
    // Obtener documento insertado
    const savedPrestart = await db.collection('prestart').findOne({ _id: result.insertedId });
    
    console.log('[API] Public prestart saved with ID:', result.insertedId);
    
    return NextResponse.json(savedPrestart, { status: 201 });
  } catch (error) {
    console.error('Error creating public prestart:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


