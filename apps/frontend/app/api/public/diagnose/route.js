import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log("🔍 [PUBLIC-DIAGNOSE] Starting production diagnosis...");
    
    // Verificar variables de entorno
    const mongoUri = process.env.MONGODB_URI;
    const nextAuthSecret = process.env.NEXTAUTH_SECRET;
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    
    const envCheck = {
      MONGODB_URI: mongoUri ? 'Set' : 'Missing',
      MONGODB_URI_LENGTH: mongoUri ? mongoUri.length : 0,
      MONGODB_URI_PREVIEW: mongoUri ? `${mongoUri.substring(0, 20)}...` : 'None',
      NEXTAUTH_SECRET: nextAuthSecret ? 'Set' : 'Missing',
      NEXTAUTH_URL: nextAuthUrl ? nextAuthUrl : 'Missing',
      NODE_ENV: process.env.NODE_ENV || 'undefined'
    };
    
    console.log("📊 [PUBLIC-DIAGNOSE] Environment variables:", envCheck);
    
    let dbConnection = null;
    let dbError = null;
    
    // Probar conexión directa a MongoDB
    try {
      const { MongoClient } = await import('mongodb');
      
      console.log("🔌 [PUBLIC-DIAGNOSE] Attempting MongoDB connection...");
      
      const client = new MongoClient(mongoUri, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
        maxPoolSize: 1
      });
      
      await client.connect();
      console.log("✅ [PUBLIC-DIAGNOSE] MongoDB connection successful");
      
      const db = client.db();
      const collections = await db.listCollections().toArray();
      
      dbConnection = {
        status: 'Connected',
        dbName: db.databaseName,
        collections: collections.map(c => c.name)
      };
      
      // Verificar si existe la colección de usuarios
      if (collections.find(c => c.name === 'users')) {
        const usersCollection = db.collection("users");
        const userCount = await usersCollection.countDocuments();
        const sampleUser = await usersCollection.findOne({});
        
        dbConnection.userCount = userCount;
        dbConnection.sampleUserStructure = sampleUser ? {
          hasId: !!sampleUser._id,
          hasEmail: !!sampleUser.email,
          hasName: !!sampleUser.name,
          hasPassword: !!sampleUser.password,
          hasRole: !!sampleUser.role,
          fields: Object.keys(sampleUser)
        } : null;
      }
      
      await client.close();
      
    } catch (error) {
      console.error("❌ [PUBLIC-DIAGNOSE] MongoDB connection failed:", error);
      dbError = {
        message: error.message,
        code: error.code || 'Unknown',
        name: error.name || 'Unknown',
        stack: error.stack
      };
    }
    
    // Probar la función connectDB
    let connectDBTest = null;
    let connectDBError = null;
    
    try {
      const { connectDB } = await import("@/lib/mongodb");
      console.log("🔌 [PUBLIC-DIAGNOSE] Testing connectDB function...");
      
      const db = await connectDB();
      console.log("✅ [PUBLIC-DIAGNOSE] connectDB function successful");
      
      connectDBTest = {
        status: 'Success',
        dbName: db.databaseName
      };
      
    } catch (error) {
      console.error("❌ [PUBLIC-DIAGNOSE] connectDB function failed:", error);
      connectDBError = {
        message: error.message,
        code: error.code || 'Unknown',
        name: error.name || 'Unknown',
        stack: error.stack
      };
    }
    
    const result = {
      timestamp: new Date().toISOString(),
      environment: envCheck,
      directConnection: dbConnection || { error: dbError },
      connectDBFunction: connectDBTest || { error: connectDBError },
      versions: {
        node: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };
    
    console.log("📋 [PUBLIC-DIAGNOSE] Final diagnosis result:", result);
    
    return NextResponse.json(result, { status: 200 });
    
  } catch (error) {
    console.error("💥 [PUBLIC-DIAGNOSE] Unexpected error:", error);
    return NextResponse.json({
      error: 'Unexpected error in diagnosis',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}


