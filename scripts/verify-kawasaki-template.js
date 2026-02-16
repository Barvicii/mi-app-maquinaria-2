require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error('MONGODB_URI environment variable is not set');
}

async function verifyKawasakiMuleTemplate() {
  console.log('🔍 Verificando Template y asociación con máquina Kawasaki Mule...');
  
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db('orchardservice');
    const templatesCollection = db.collection('prestartTemplates');
    const machinesCollection = db.collection('machines');
    const usersCollection = db.collection('users');
    
    // Verificar usuario
    const userId = '686cbe4ef25910e08a0d2ed6';
    const user = await usersCollection.findOne({ 
      _id: new ObjectId(userId) 
    });
    
    console.log(`\n👤 Usuario: ${user.name} (${user.email})`);
    
    // Buscar templates del usuario
    const templates = await templatesCollection.find({ 
      userId: userId 
    }).toArray();
    
    console.log(`\n📋 Templates encontrados: ${templates.length}`);
    console.log(''.padEnd(70, '='));
    
    templates.forEach((template, index) => {
      console.log(`\n📝 [${index + 1}] ${template.name}`);
      console.log(`   🆔 Template ID: ${template._id}`);
      console.log(`   🌐 Global: ${template.isGlobal ? 'Sí' : 'No'}`);
      console.log(`   📅 Creado: ${template.createdAt}`);
      console.log(`   🔢 Items de verificación: ${template.checkItems.length}`);
      
      console.log('   📝 Lista de verificaciones:');
      template.checkItems.forEach((item, idx) => {
        console.log(`      ${idx + 1}. ${item}`);
      });
    });
    
    // Verificar máquina Kawasaki Mule
    console.log('\n' + ''.padEnd(70, '-'));
    console.log('🚗 Verificando máquina Kawasaki Mule...');
    
    const kawasakiMule = await machinesCollection.findOne({
      machineId: 'KAW_MULE_001',
      userId: userId
    });
    
    if (kawasakiMule) {
      console.log('✅ Máquina Kawasaki Mule encontrada:');
      console.log(`   🆔 Machine ID: ${kawasakiMule.machineId}`);
      console.log(`   🚗 Modelo: ${kawasakiMule.brand} ${kawasakiMule.model}`);
      console.log(`   🔗 Template ID: ${kawasakiMule.prestartTemplateId || 'No asignado'}`);
      
      // Verificar si el template está asociado
      if (kawasakiMule.prestartTemplateId) {
        const associatedTemplate = await templatesCollection.findOne({
          _id: new ObjectId(kawasakiMule.prestartTemplateId)
        });
        
        if (associatedTemplate) {
          console.log('✅ Template asociado encontrado:');
          console.log(`   📝 Nombre: ${associatedTemplate.name}`);
          console.log(`   🔢 Items: ${associatedTemplate.checkItems.length} verificaciones`);
        } else {
          console.log('❌ Template asociado no encontrado en la base de datos');
        }
      } else {
        console.log('⚠️ Máquina no tiene template asignado');
      }
    } else {
      console.log('❌ Máquina Kawasaki Mule no encontrada');
    }
    
    console.log('\n' + ''.padEnd(70, '='));
    console.log('✅ Verificación completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Conexión cerrada');
  }
}

verifyKawasakiMuleTemplate().catch(console.error);
