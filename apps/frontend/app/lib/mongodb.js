import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';

// Configuración de conexión (Prioridad a variable de entorno)
const MONGODB_URI = process.env.MONGODB_URI;

// Validar configuración (solo advertencia para permitir build sin DB)
if (!MONGODB_URI) {
  console.warn('⚠️ MONGODB_URI no está configurada. La base de datos no estará disponible.');
}

const dbName = process.env.MONGODB_DB || 'orchardservice';

// Cache para conexiones
let client;
let clientPromise;

// Cache para Mongoose
let cached = global.mongoose || { conn: null, promise: null };
global.mongoose = cached;

// Función para conectar a la base de datos
async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI no definida');
  }

  console.log('[DB] Conectando a MongoDB...');
  
  try {
    // Opciones base
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    // Si es una conexión Atlas (srv), no necesitamos opciones extra usualmente
    // Si es local, tampoco. El driver maneja la mayoría.
    
    const dbClient = new MongoClient(MONGODB_URI, options);
    
    await dbClient.connect();
    console.log(`[DB] ✅ Conexión exitosa a MongoDB (${MONGODB_URI.includes('localhost') || MONGODB_URI.includes('mongo') ? 'Local' : 'Atlas'})`);
    return dbClient;
    
  } catch (error) {
    console.error('[DB] ❌ Error conectando a MongoDB:', error.message);
    throw new Error('No se pudo conectar a MongoDB');
  }
}

// Inicializar conexión
async function initializeConnection() {
  if (!MONGODB_URI) return null;

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      try {
        client = await connectToDatabase();
        global._mongoClientPromise = client.connect();
      } catch (error) {
        console.error('[DB] Error en inicialización:', error);
        // No relanzar error para no romper el build si no hay DB
        return null; 
      }
    }
    clientPromise = global._mongoClientPromise;
  } else {
    try {
      client = await connectToDatabase();
      clientPromise = client.connect();
    } catch (error) {
      console.error('[DB] Error en inicialización:', error);
      return null;
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
    
    if (!clientPromise) {
      throw new Error('No hay conexión a base de datos establecida');
    }

    const client = await clientPromise;
    console.log(`[DB] Conectado a Base: ${dbName}`);
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
    
    cached.promise = mongoose.connect(MONGODB_URI, mongooseOptions);
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
