import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to environment variables');
}

const uri = process.env.MONGODB_URI;
const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  // En desarrollo, usa una variable global para que el valor
  // persista entre recargas de módulos causadas por HMR (Hot Module Replacement)
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // En producción, es mejor no usar una variable global
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function connectDB() {
  try {
    const client = await clientPromise;
    const db = client.db();
    return db;
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw new Error('Database connection error');
  }
}