import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import bcryptjs from 'bcryptjs';

export async function POST(request) {
  let client;
  
  try {
    console.log('[SIMPLE-ADMIN] Creando usuario administrador simple...');
    
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI no está configurado');
    }

    // Conectar directamente con MongoDB driver
    client = new MongoClient(uri);
    await client.connect();
    console.log('[SIMPLE-ADMIN] Conectado a MongoDB');

    const db = client.db('orchardservice');
    
    // Verificar si ya existe admin@company.com
    const existingUser = await db.collection('users').findOne({ 
      email: 'admin@company.com' 
    });

    if (existingUser) {
      console.log('[SIMPLE-ADMIN] Usuario administrador ya existe');
      return NextResponse.json({
        success: true,
        message: 'Usuario administrador ya existe',
        user: {
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role
        }
      });
    }

    // Crear hash de contraseña simple
    const password = 'admin123';
    const hashedPassword = await bcryptjs.hash(password, 10);
    console.log('[SIMPLE-ADMIN] Contraseña hasheada');

    // Insertar usuario administrador simple
    const result = await db.collection('users').insertOne({
      email: 'admin@company.com',
      name: 'Administrador',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      emailVerified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('[SIMPLE-ADMIN] Usuario creado con ID:', result.insertedId);

    return NextResponse.json({
      success: true,
      message: 'Usuario administrador creado exitosamente',
      credentials: {
        email: 'admin@company.com',
        password: 'admin123'
      },
      userId: result.insertedId.toString()
    });

  } catch (error) {
    console.error('[SIMPLE-ADMIN] Error:', error);
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

export async function GET() {
  let client;
  
  try {
    const uri = process.env.MONGODB_URI;
    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db('orchardservice');
    const users = await db.collection('users').find({}).toArray();
    
    return NextResponse.json({
      success: true,
      totalUsers: users.length,
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

