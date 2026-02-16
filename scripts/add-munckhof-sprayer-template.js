require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error('MONGODB_URI environment variable is not set');
}

async function addMunckhofSprayerTemplate() {
  console.log('🚿 Agregando Template de Pre-Start para Munckhof Sprayer...');
  console.log('Conectando a MongoDB...');
  
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db('orchardservice');
    const templatesCollection = db.collection('prestartTemplates');
    const usersCollection = db.collection('users');
    const machinesCollection = db.collection('machines');
    
    // Verificar que el usuario existe
    const userId = '686cbe4ef25910e08a0d2ed6';
    const user = await usersCollection.findOne({ 
      _id: new ObjectId(userId) 
    });
    
    if (!user) {
      console.log('❌ Usuario no encontrado con ID:', userId);
      return;
    }
    
    console.log('✅ Usuario encontrado:', {
      name: user.name,
      email: user.email,
      role: user.role
    });
    
    // Datos del template basado en la imagen para pulverizador
    const munckhofSprayerTemplate = {
      name: 'Munckhof Orchard Sprayer - Pre-Start Check',
      checkItems: [
        {
          id: 'axle_wheels_tyres',
          name: 'axle_wheels_tyres',
          label: 'Axle, Wheels & Tyres',
          required: true
        },
        {
          id: 'cabin_filters_charged',
          name: 'cabin_filters_charged',
          label: 'Cabin filters are charged',
          required: true
        },
        {
          id: 'check_hydraulic_oil_hoses',
          name: 'check_hydraulic_oil_hoses',
          label: 'Check Hydraulic Oil & Hoses',
          required: true
        },
        {
          id: 'link_arm_drawbar',
          name: 'link_arm_drawbar',
          label: 'Link Arm & Drawbar',
          required: true
        },
        {
          id: 'nozzles_power_module',
          name: 'nozzles_power_module',
          label: 'Nozzles are working (Power Module)',
          required: true
        },
        {
          id: 'check_all_nozzles_working',
          name: 'check_all_nozzles_working',
          label: 'Check all Nozzles are working',
          required: true
        },
        {
          id: 'grease_spray_boom',
          name: 'grease_spray_boom',
          label: 'Grease Spray Boom',
          required: true
        },
        {
          id: 'pto_shaft_attached_correctly',
          name: 'pto_shaft_attached_correctly',
          label: 'PTO shaft is attached correctly',
          required: true
        },
        {
          id: 'check_for_damage_defects',
          name: 'check_for_damage_defects',
          label: 'Check for damage or defects',
          required: true
        }
      ],
      userId: userId,
      isGlobal: false,
      createdAt: new Date()
    };
    
    // Verificar si ya existe un template con este nombre para el usuario
    const existingTemplate = await templatesCollection.findOne({
      name: munckhofSprayerTemplate.name,
      userId: userId
    });
    
    if (existingTemplate) {
      console.log('⚠️ Ya existe un template con este nombre para el usuario:', munckhofSprayerTemplate.name);
      console.log('Template existente:', {
        _id: existingTemplate._id,
        name: existingTemplate.name,
        checkItems: existingTemplate.checkItems.length + ' items'
      });
      return existingTemplate._id;
    }
    
    // Insertar el nuevo template
    const result = await templatesCollection.insertOne(munckhofSprayerTemplate);
    
    if (result.insertedId) {
      console.log('🎉 ¡Template de Munckhof Sprayer agregado exitosamente!');
      console.log('📋 Detalles del template:');
      console.log('  🆔 MongoDB ID:', result.insertedId.toString());
      console.log('  📝 Nombre:', munckhofSprayerTemplate.name);
      console.log('  👤 Usuario:', user.name);
      console.log('  📧 Email usuario:', user.email);
      console.log('  🌐 Global:', munckhofSprayerTemplate.isGlobal ? 'Sí' : 'No');
      
      console.log('\n📝 Items de verificación incluidos:');
      munckhofSprayerTemplate.checkItems.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.label} (${item.required ? 'Requerido' : 'Opcional'})`);
      });
      
      // Ahora actualizar la máquina Munckhof Sprayer para usar este template
      console.log('\n🔗 Actualizando máquina Munckhof Sprayer con el template...');
      
      const updateResult = await machinesCollection.updateOne(
        { 
          machineId: 'MUNCKHOF_SPRAY_001',
          userId: userId 
        },
        { 
          $set: { 
            prestartTemplateId: result.insertedId.toString() 
          } 
        }
      );
      
      if (updateResult.modifiedCount > 0) {
        console.log('✅ Máquina Munckhof Sprayer actualizada con el template');
      } else {
        console.log('⚠️ No se pudo actualizar la máquina (puede que no exista)');
      }
      
      // Verificar la inserción
      const insertedTemplate = await templatesCollection.findOne({
        _id: result.insertedId
      });
      
      if (insertedTemplate) {
        console.log('\n✅ Verificación exitosa - Template encontrado en la base de datos');
        console.log('📊 Total de check items:', insertedTemplate.checkItems.length);
        console.log('📋 Estructura de items:', insertedTemplate.checkItems[0] ? 'Correcta (objetos con id, name, label, required)' : 'Error');
      } else {
        console.log('\n❌ Error en la verificación - No se pudo encontrar el template insertado');
      }
      
      return result.insertedId;
      
    } else {
      console.log('❌ Error: No se pudo insertar el template');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  } finally {
    await client.close();
    console.log('\n🔌 Conexión cerrada');
  }
}

console.log('🚿 SCRIPT: Agregar Template Pre-Start para Munckhof Orchard Sprayer');
console.log('👤 Usuario destino: Facundo Barbosa (686cbe4ef25910e08a0d2ed6)');
console.log('📅 Fecha:', new Date().toLocaleString());
console.log(''.padEnd(70, '='));

addMunckhofSprayerTemplate().catch(console.error);
