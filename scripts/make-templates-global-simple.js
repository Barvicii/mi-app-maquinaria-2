// Script simple para hacer templates globales
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '../apps/frontend/.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = 'orchardservice';

async function makeTemplatesGlobal() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI no encontrada');
    return;
  }

  console.log('🔗 Conectando a MongoDB...');
  console.log('URI:', MONGODB_URI.replace(/\/\/.*:.*@/, '//***:***@')); // Ocultar credenciales
  
  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000, // 10 segundos
    connectTimeoutMS: 10000
  });

  try {
    await client.connect();
    console.log('✅ Conectado exitosamente');

    const db = client.db(DATABASE_NAME);
    
    // Actualizar todos los templates para que sean globales
    const result = await db.collection('prestartTemplates')
      .updateMany(
        {},
        { $set: { isGlobal: true } }
      );
    
    console.log(`✅ ${result.modifiedCount} templates marcados como globales`);
    
    // Verificar
    const count = await db.collection('prestartTemplates').countDocuments({ isGlobal: true });
    console.log(`📊 Total de templates globales: ${count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('🔒 Conexión cerrada');
  }
}

makeTemplatesGlobal().catch(console.error);
