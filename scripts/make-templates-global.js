// Script para hacer los templates utilizados por máquinas como globales
// Esto permite que funcionen con códigos QR (acceso público)

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '../apps/frontend/.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = 'orchardservice';

async function makeTemplatesGlobal() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI no encontrada en variables de entorno');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔗 Conectando a MongoDB...');
    await client.connect();
    console.log('✅ Conectado a MongoDB');

    const db = client.db(DATABASE_NAME);
    
    // 1. Obtener todos los templates únicos usados por máquinas
    console.log('\n📋 Obteniendo templates usados por máquinas...');
    const machines = await db.collection('machines')
      .find({ prestartTemplateId: { $exists: true, $ne: null } })
      .toArray();
    
    const templateIds = [...new Set(machines.map(m => m.prestartTemplateId))];
    console.log(`Encontradas ${machines.length} máquinas con ${templateIds.length} templates únicos`);
    
    // 2. Hacer globales todos los templates usados por máquinas
    for (const templateId of templateIds) {
      try {
        const objectId = new ObjectId(templateId);
        
        const template = await db.collection('prestartTemplates')
          .findOne({ _id: objectId });
        
        if (template) {
          const result = await db.collection('prestartTemplates')
            .updateOne(
              { _id: objectId },
              { $set: { isGlobal: true } }
            );
          
          if (result.modifiedCount > 0) {
            console.log(`✅ Template "${template.name}" (${templateId}) marcado como global`);
          } else {
            console.log(`ℹ️  Template "${template.name}" (${templateId}) ya era global`);
          }
        } else {
          console.log(`⚠️  Template ${templateId} no encontrado`);
        }
      } catch (error) {
        console.error(`❌ Error procesando template ${templateId}:`, error.message);
      }
    }
    
    // 3. Verificar resultados
    console.log('\n🔍 Verificando templates globales...');
    const globalTemplates = await db.collection('prestartTemplates')
      .find({ isGlobal: true })
      .toArray();
    
    console.log(`\n📊 Resumen:`);
    console.log(`- Templates globales: ${globalTemplates.length}`);
    console.log(`- Máquinas con templates: ${machines.length}`);
    
    globalTemplates.forEach(template => {
      console.log(`  • ${template.name} (${template._id})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔒 Conexión cerrada');
  }
}

makeTemplatesGlobal();
