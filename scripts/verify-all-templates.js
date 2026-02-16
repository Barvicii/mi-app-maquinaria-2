require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error('MONGODB_URI environment variable is not set');
}

async function verifyAllTemplatesAndMachines() {
  console.log('🔍 Verificando todos los Templates y Máquinas...');
  
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
    
    // Buscar todos los templates del usuario
    const templates = await templatesCollection.find({ 
      userId: userId 
    }).toArray();
    
    console.log(`\n📋 Templates encontrados: ${templates.length}`);
    console.log(''.padEnd(80, '='));
    
    templates.forEach((template, index) => {
      console.log(`\n📝 [${index + 1}] ${template.name}`);
      console.log(`   🆔 Template ID: ${template._id}`);
      console.log(`   📄 Descripción: ${template.description || 'Sin descripción'}`);
      console.log(`   🌐 Global: ${template.isGlobal ? 'Sí' : 'No'}`);
      console.log(`   📅 Creado: ${template.createdAt}`);
      console.log(`   🔢 Items de verificación: ${template.checkItems.length}`);
      
      // Verificar estructura de los items
      const validStructure = template.checkItems.every(item => 
        typeof item === 'object' && 
        item.id && 
        item.name && 
        item.label && 
        typeof item.required === 'boolean'
      );
      
      console.log(`   ✅ Estructura válida: ${validStructure ? 'Sí' : 'No'}`);
      
      if (validStructure) {
        console.log('   📝 Items:');
        template.checkItems.forEach((item, idx) => {
          console.log(`      ${idx + 1}. ${item.label} (${item.name}) ${item.required ? '[Requerido]' : '[Opcional]'}`);
        });
      } else {
        console.log('   ❌ Estructura inválida - algunos items no tienen la estructura correcta');
      }
    });
    
    // Verificar todas las máquinas del usuario
    console.log('\n' + ''.padEnd(80, '-'));
    console.log('🚜 Verificando máquinas del usuario...');
    
    const machines = await machinesCollection.find({
      userId: userId
    }).toArray();
    
    console.log(`\n🔧 Máquinas encontradas: ${machines.length}`);
    
    for (let i = 0; i < machines.length; i++) {
      const machine = machines[i];
      console.log(`\n🚜 [${i + 1}] ${machine.brand} ${machine.model}`);
      console.log(`   🆔 Machine ID: ${machine.machineId}`);
      console.log(`   📅 Año: ${machine.year}`);
      console.log(`   🔗 Template ID: ${machine.prestartTemplateId || 'No asignado'}`);
      
      // Verificar si el template está asociado y existe
      if (machine.prestartTemplateId) {
        try {
          const associatedTemplate = await templatesCollection.findOne({
            _id: new ObjectId(machine.prestartTemplateId)
          });
          
          if (associatedTemplate) {
            console.log(`   ✅ Template asociado: "${associatedTemplate.name}"`);
            console.log(`   📋 Items disponibles: ${associatedTemplate.checkItems.length}`);
            
            // Verificar estructura del template asociado
            const validStructure = associatedTemplate.checkItems.every(item => 
              typeof item === 'object' && 
              item.id && 
              item.name && 
              item.label && 
              typeof item.required === 'boolean'
            );
            console.log(`   ✅ Estructura del template: ${validStructure ? 'Válida' : 'Inválida'}`);
          } else {
            console.log(`   ❌ Template asociado no encontrado en la base de datos`);
          }
        } catch (error) {
          console.log(`   ❌ Error al verificar template: ${error.message}`);
        }
      } else {
        console.log(`   ⚠️ Máquina sin template asignado`);
      }
    }
    
    // Resumen final
    console.log('\n' + ''.padEnd(80, '='));
    console.log('📊 RESUMEN:');
    
    const templatesWithValidStructure = templates.filter(t => 
      t.checkItems.every(item => 
        typeof item === 'object' && 
        item.id && 
        item.name && 
        item.label && 
        typeof item.required === 'boolean'
      )
    );
    
    const machinesWithTemplates = machines.filter(m => m.prestartTemplateId);
    
    console.log(`✅ Templates totales: ${templates.length}`);
    console.log(`✅ Templates con estructura válida: ${templatesWithValidStructure.length}`);
    console.log(`✅ Máquinas totales: ${machines.length}`);
    console.log(`✅ Máquinas con template asignado: ${machinesWithTemplates.length}`);
    console.log(`${machinesWithTemplates.length === machines.length ? '🎉' : '⚠️'} Todas las máquinas tienen template: ${machinesWithTemplates.length === machines.length ? 'Sí' : 'No'}`);
    
    console.log('\n✅ Verificación completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Conexión cerrada');
  }
}

verifyAllTemplatesAndMachines().catch(console.error);
