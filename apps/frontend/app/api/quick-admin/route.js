import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import bcryptjs from 'bcryptjs';

const uri = process.env.MONGODB_URI;

export async function POST(request) {
  let client;
  
  try {
    console.log('[QUICK-ADMIN] Iniciando conexión directa a MongoDB...');
    
    // Conectar directamente usando MongoClient
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });
    
    await client.connect();
    console.log('[QUICK-ADMIN] Conectado a MongoDB');
    
    const db = client.db('orchardservice');
    const usersCollection = db.collection('users');
    
    // Eliminar usuario admin existente
    await usersCollection.deleteOne({ email: 'admin@company.com' });
    console.log('[QUICK-ADMIN] Usuario existente eliminado');
    
    // Crear hash de la contraseña
    const password = 'Admin123!';
    const hashedPassword = await bcryptjs.hash(password, 12);
    console.log('[QUICK-ADMIN] Contraseña hasheada');
    
    // Crear el usuario administrador
    const adminUser = {
      name: 'Super Administrator',
      email: 'admin@company.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      emailVerified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await usersCollection.insertOne(adminUser);
    console.log('[QUICK-ADMIN] Usuario administrador creado:', result.insertedId);
    
    return NextResponse.json({
      success: true,
      message: 'Usuario administrador creado exitosamente',
      credentials: {
        email: 'admin@company.com',
        password: 'Admin123!'
      },
      id: result.insertedId
    });
    
  } catch (error) {
    console.error('[QUICK-ADMIN] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
    
  } finally {
    if (client) {
      await client.close();
      console.log('[QUICK-ADMIN] Conexión cerrada');
    }
  }
}

export async function GET() {
  let client;
  
  try {
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });
    
    await client.connect();
    const db = client.db('orchardservice');
    
    const users = await db.collection('users').find({}).limit(10).toArray();
    
    return NextResponse.json({
      success: true,
      users: users.map(u => ({
        email: u.email,
        name: u.name,
        role: u.role,
        hasPassword: !!u.password
      }))
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
    
  } finally {
    if (client) {
      await client.close();
    }
  }
}

