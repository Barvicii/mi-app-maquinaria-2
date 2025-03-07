const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Intenta leer la configuración desde .env.local
let mongoUri;
try {
  const envPath = path.join(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  for (const line of envLines) {
    if (line.startsWith('MONGODB_URI=')) {
      mongoUri = line.substring('MONGODB_URI='.length).trim();
      break;
    }
  }
} catch (e) {
  console.log('Could not read .env.local file');
}

// Usa la URI hardcodeada si no se encontró en .env.local
if (!mongoUri) {
  console.log('No MONGODB_URI found in .env.local, using default connection string');
  mongoUri = "mongodb+srv://youruser:yourpassword@yourcluster.mongodb.net/orchardservice";
}

// Aseguramos que usamos la base de datos 'orchardservice'
// Primero eliminamos cualquier referencia a base de datos en el URI
mongoUri = mongoUri.split('/').slice(0, -1).join('/');
// Luego agregamos 'orchardservice'
mongoUri = `${mongoUri}/orchardservice`;

async function checkUsers() {
  console.log('Connecting to MongoDB...');
  console.log('URI available:', !!mongoUri);
  console.log('Using database: orchardservice');
  
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('orchardservice');
    const users = await db.collection('users').find({}).toArray();
    
    console.log(`Found ${users.length} users`);
    
    for (const user of users) {
      console.log({
        _id: user._id,
        name: user.name,
        email: user.email,
        hasPassword: !!user.password,
        passwordLength: user.password?.length
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkUsers().catch(console.error);