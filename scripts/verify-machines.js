const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Leer la configuración desde .env.local
let mongoUri;
try {
  const envPath = path.join(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  for (const line of envLines) {
    if (line.startsWith('MONGODB_URI=')) {
      mongoUri = line.substring('MONGODB_URI='.length).trim();
      // Remove quotes if present
      if (mongoUri.startsWith('"') && mongoUri.endsWith('"')) {
        mongoUri = mongoUri.slice(1, -1);
      }
      break;
    }
  }
} catch (e) {
  console.log('Could not read .env.local file');
}

// Usar URI por defecto si no se encontró
if (!mongoUri) {
  console.log('No MONGODB_URI found in .env.local, using default connection string');
  mongoUri = "mongodb+srv://barviciigame:Apple123@cluster0.wkwfk.mongodb.net/orchardservice?retryWrites=true&w=majority&appName=Cluster0";
}

async function verifyMachines() {
  console.log('🔍 Verificando máquinas agregadas para Facundo Barbosa...');
  
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db('orchardservice');
    const machinesCollection = db.collection('machines');
    const usersCollection = db.collection('users');
    
    // Verificar usuario
    const userId = '686cbe4ef25910e08a0d2ed6';
    const user = await usersCollection.findOne({ 
      _id: new ObjectId(userId) 
    });
    
    console.log(`\n👤 Usuario: ${user.name} (${user.email})`);
    
    // Buscar todas las máquinas del usuario
    const machines = await machinesCollection.find({ 
      userId: userId 
    }).toArray();
    
    console.log(`\n📋 Máquinas encontradas: ${machines.length}`);
    console.log(''.padEnd(70, '='));
    
    machines.forEach((machine, index) => {
      console.log(`\n🚜 [${index + 1}] ${machine.brand} ${machine.model}`);
      console.log(`   🆔 MongoDB ID: ${machine._id}`);
      console.log(`   🏷️  Machine ID: ${machine.machineId}`);
      console.log(`   📅 Año: ${machine.year}`);
      console.log(`   📊 Horas actuales: ${machine.currentHours}`);
      console.log(`   🛢️  Aceite motor: ${machine.engineOil?.type} - ${machine.engineOil?.capacity}`);
      console.log(`   🔧 Aceite hidráulico: ${machine.hydraulicOil?.type} - ${machine.hydraulicOil?.capacity}`);
      console.log(`   🔍 Filtro motor: ${machine.filters?.engine}`);
      console.log(`   🚗 Neumáticos delanteros: ${machine.tires?.front?.size}`);
      console.log(`   🚗 Neumáticos traseros: ${machine.tires?.rear?.size}`);
      console.log(`   📅 Creado: ${machine.createdAt}`);
    });
    
    console.log('\n' + ''.padEnd(70, '='));
    console.log('✅ Verificación completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Conexión cerrada');
  }
}

verifyMachines().catch(console.error);
