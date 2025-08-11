import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/mongodb";
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    console.log('[SETUP-ADMIN] Iniciando configuración de administrador...');
    
    // Conectar a la base de datos
    const { db } = await connectDB();
    console.log('[SETUP-ADMIN] Conectado a MongoDB Atlas');
    
    // Verificar si ya existe un usuario administrador
    const existingAdmin = await db.collection('users').findOne({ 
      role: 'SUPER_ADMIN' 
    });
    
    if (existingAdmin) {
      console.log('[SETUP-ADMIN] Ya existe un usuario administrador:', existingAdmin.email);
      return NextResponse.json({ 
        success: false, 
        message: 'Ya existe un usuario administrador',
        adminEmail: existingAdmin.email
      });
    }
    
    // Crear usuario administrador
    const adminEmail = 'orchardservices96@gmail.com';
    const adminPassword = 'BaltonInalen321!';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    const adminUser = {
      email: adminEmail,
      password: hashedPassword,
      name: 'Administrador',
      role: 'SUPER_ADMIN',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('users').insertOne(adminUser);
    console.log('[SETUP-ADMIN] Usuario administrador creado:', result.insertedId);
    
    // Verificar todas las colecciones
    const collections = await db.listCollections().toArray();
    console.log('[SETUP-ADMIN] Colecciones disponibles:', collections.map(c => c.name));
    
    // Contar documentos en cada colección principal
    const collectionCounts = {};
    const mainCollections = ['users', 'machines', 'prestart', 'services', 'dieselRecords', 'prestartTemplates'];
    
    for (const collectionName of mainCollections) {
      try {
        const count = await db.collection(collectionName).countDocuments();
        collectionCounts[collectionName] = count;
      } catch (error) {
        collectionCounts[collectionName] = 'Error: ' + error.message;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Usuario administrador creado exitosamente',
      admin: {
        email: adminEmail,
        password: adminPassword,
        role: 'SUPER_ADMIN'
      },
      database: {
        name: db.databaseName,
        collections: collections.map(c => c.name),
        counts: collectionCounts
      }
    });
    
  } catch (error) {
    console.error('[SETUP-ADMIN] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    console.log('[SETUP-ADMIN] Verificando estado de la base de datos...');
    
    const { db } = await connectToDatabase();
    console.log('[SETUP-ADMIN] Conectado a MongoDB Atlas');
    
    // Verificar usuarios existentes
    const users = await db.collection('users').find({}).toArray();
    console.log('[SETUP-ADMIN] Usuarios encontrados:', users.length);
    
    // Verificar colecciones
    const collections = await db.listCollections().toArray();
    
    // Contar documentos
    const counts = {};
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      counts[collection.name] = count;
    }
    
    return NextResponse.json({
      success: true,
      database: db.databaseName,
      collections: collections.map(c => c.name),
      counts,
      users: users.map(u => ({ 
        email: u.email, 
        role: u.role, 
        isActive: u.isActive,
        createdAt: u.createdAt 
      }))
    });
    
  } catch (error) {
    console.error('[SETUP-ADMIN] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}


