import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';

// Configuraciones de conexión
const ATLAS_URI = process.env.MONGODB_URI || 'mongodb+srv://judco:judco123@cluster0.f4mj4.mongodb.net/orchardservice?retryWrites=true&w=majority';
const LOCAL_URI = 'mongodb://localhost:27017/orchardservice';

// Validar que existe alguna configuración
if (!ATLAS_URI && !LOCAL_URI) {
  throw new Error('No hay configuración de base de datos disponible');
}

const dbName = process.env.MONGODB_DB || 'orchardservice';

// Cache para conexiones
let client;
let clientPromise;
let activeConnectionType = null;

// Cache para Mongoose
let cached = global.mongoose || { conn: null, promise: null };
global.mongoose = cached;

async function tryConnection(uri, type) {
  try {
    console.log(`[DB] Intentando conexión ${type}...`);
    const testClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
      socketTimeoutMS: 3000,
    });
    
    await testClient.connect();
    await testClient.db(dbName).collection('users').countDocuments(); // Test rápido
    console.log(`[DB] ✅ Conexión ${type} exitosa`);
    return testClient;
    
  } catch (error) {
    console.log(`[DB] ❌ Conexión ${type} falló: ${error.message}`);
    throw error;
  }
}

async function establishConnection() {
  console.log('[DB] Estableciendo conexión inteligente...');
  
  // Prioridad: Atlas primero, local como fallback
  const connectionAttempts = [
    { uri: ATLAS_URI, type: 'Atlas Cloud', priority: 1 },
    { uri: LOCAL_URI, type: 'Local', priority: 2 }
  ];
  
  for (const attempt of connectionAttempts) {
    try {
      const testClient = await tryConnection(attempt.uri, attempt.type);
      await testClient.close();
      
      // Si el test pasó, crear la conexión real
      activeConnectionType = attempt.type;
      console.log(`[DB] 🎯 Usando base de datos: ${attempt.type}`);
      
      return new MongoClient(attempt.uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      
    } catch (error) {
      console.log(`[DB] Continuando al siguiente intento...`);
      continue;
    }
  }
  
  throw new Error('No se pudo establecer conexión con ninguna base de datos');
}

// Inicializar conexión inteligente
async function initializeConnection() {
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      try {
        client = await establishConnection();
        global._mongoClientPromise = client.connect();
      } catch (error) {
        console.error('[DB] Error en inicialización:', error);
        throw error;
      }
    }
    clientPromise = global._mongoClientPromise;
  } else {
    try {
      client = await establishConnection();
      clientPromise = client.connect();
    } catch (error) {
      console.error('[DB] Error en inicialización:', error);
      throw error;
    }
  }
  
  return clientPromise;
}

// Función para conectar con MongoClient
export async function connectDB() {
  try {
    if (!clientPromise) {
      await initializeConnection();
    }
    
    const client = await clientPromise;
    console.log(`[DB] Conectado a: ${activeConnectionType} - Base: ${dbName}`);
    const db = client.db(dbName);
    return db;
  } catch (error) {
    console.error('[DB] Error connecting to database:', error);
    throw new Error('Error de conexión a la base de datos');
  }
}

// Función para conectar con Mongoose
export async function dbConnect() {
  if (cached.conn) {
    console.log('[DB] Using cached Mongoose connection');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('[DB] Creating new Mongoose connection');
    
    // Determinar URI para Mongoose
    let mongooseUri = ATLAS_URI;
    try {
      // Test rápido para ver qué conexión usar
      await tryConnection(ATLAS_URI, 'Atlas');
    } catch {
      console.log('[DB] Atlas no disponible, usando local para Mongoose');
      mongooseUri = LOCAL_URI;
    }
    
    const mongooseOptions = {
      bufferCommands: false,
      dbName: dbName
    };
    
    cached.promise = mongoose.connect(mongooseUri, mongooseOptions);
  }

  try {
    cached.conn = await cached.promise;
    console.log('[DB] Connected to MongoDB with Mongoose:', cached.conn.connection.db.databaseName);
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    console.error('[DB] MongoDB connection error with Mongoose:', e);
    throw e;
  }
}

// Función para obtener estado de conexión
export async function getConnectionStatus() {
  try {
    await connectDB();
    return {
      connected: true,
      type: activeConnectionType,
      database: dbName
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
}

// Exportar la promesa del cliente para NextAuth
export default clientPromise;
