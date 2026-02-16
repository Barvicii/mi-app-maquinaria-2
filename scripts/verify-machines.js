require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error('MONGODB_URI environment variable is not set');
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
