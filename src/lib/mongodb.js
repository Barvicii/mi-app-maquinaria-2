import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = 'orchardservice';

if (!uri) {
  throw new Error("Please add MongoDB URI to .env.local");
}

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable to preserve the value
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, {});
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, create a new client
  client = new MongoClient(uri, {});
  clientPromise = client.connect();
}

// Modifica esta función para que devuelva el cliente
export async function connectDB() {
  const client = await clientPromise;
  // No devolver client.db(dbName) aquí
  return client;
}

// Función adicional para obtener directamente la base de datos
export async function getDatabase() {
  const client = await clientPromise;
  return client.db(dbName);
}

export default clientPromise;