import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';

// Configuración de conexión Atlas Cloud únicamente
const ATLAS_URI = process.env.MONGODB_URI || 'mongodb+srv://barviciigame:Apple123@cluster0.wkwfk.mongodb.net/orchardservice?retryWrites=true&w=majority&appName=Cluster0';

// Validar que existe la configuración de Atlas
if (!ATLAS_URI) {
  throw new Error('MONGODB_URI no está configurada');
}

const dbName = process.env.MONGODB_DB || 'orchardservice';

// Cache para conexiones
let client;
let clientPromise;

// Cache para Mongoose
let cached = global.mongoose || { conn: null, promise: null };
global.mongoose = cached;

// Función para conectar directamente a Atlas
async function connectToAtlas() {
  console.log('[DB] Conectando a MongoDB Atlas...');
  
  try {
    const atlasClient = new MongoClient(ATLAS_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await atlasClient.connect();
    console.log('[DB] ✅ Conexión exitosa a Atlas Cloud');
    return atlasClient;
    
  } catch (error) {
    console.error('[DB] ❌ Error conectando a Atlas:', error.message);
    throw new Error('No se pudo conectar a MongoDB Atlas Cloud');
  }
}

// Inicializar conexión a Atlas
async function initializeConnection() {
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      try {
        client = await connectToAtlas();
        global._mongoClientPromise = client.connect();
      } catch (error) {
        console.error('[DB] Error en inicialización:', error);
        throw error;
      }
    }
    clientPromise = global._mongoClientPromise;
  } else {
    try {
      client = await connectToAtlas();
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
    console.log(`[DB] Conectado a Atlas Cloud - Base: ${dbName}`);
    const db = client.db(dbName);
    return db;
  } catch (error) {
    console.error('[DB] Error connecting to database:', error);
    throw new Error('Error de conexión a MongoDB Atlas');
  }
}

// Función para conectar con Mongoose
export async function dbConnect() {
  if (cached.conn) {
    console.log('[DB] Using cached Mongoose connection');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('[DB] Creating new Mongoose connection to Atlas');
    
    const mongooseOptions = {
      bufferCommands: false,
      dbName: dbName
    };
    
    cached.promise = mongoose.connect(ATLAS_URI, mongooseOptions);
  }

  try {
    cached.conn = await cached.promise;
    console.log('[DB] Connected to MongoDB Atlas with Mongoose:', cached.conn.connection.db.databaseName);
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    console.error('[DB] MongoDB Atlas connection error with Mongoose:', e);
    throw e;
  }
}

// Función para obtener estado de conexión
export async function getConnectionStatus() {
  try {
    await connectDB();
    return {
      connected: true,
      type: 'Atlas Cloud',
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
