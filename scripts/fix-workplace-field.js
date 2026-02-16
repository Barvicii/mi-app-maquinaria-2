// Script para corregir el campo workplaceName a workplace en usuarios
require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not set');
}

async function fixWorkplaceField() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔗 Conectando a MongoDB...');
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db('orchardservice');
    const usersCollection = db.collection('users');
    
    // Buscar usuarios que tengan workplaceName pero no workplace
    const usersWithWorkplaceName = await usersCollection.find({
      workplaceName: { $exists: true }
    }).toArray();
    
    console.log(`📋 Encontrados ${usersWithWorkplaceName.length} usuarios con campo workplaceName`);
    
    if (usersWithWorkplaceName.length === 0) {
      console.log('✅ No hay usuarios que necesiten corrección');
      return;
    }
    
    // Mostrar usuarios encontrados
    for (const user of usersWithWorkplaceName) {
      console.log(`👤 Usuario: ${user.name} (${user.email})`);
      console.log(`   - workplaceName: "${user.workplaceName}"`);
      console.log(`   - workplace: "${user.workplace || 'undefined'}"`);
    }
    
    console.log('\n🔧 Corrigiendo campos...');
    
    // Actualizar cada usuario
    for (const user of usersWithWorkplaceName) {
      try {
        const updateFields = {};
        
        // Si no tiene workplace, copiar de workplaceName
        if (!user.workplace && user.workplaceName) {
          updateFields.workplace = user.workplaceName;
        }
        
        // Siempre remover workplaceName
        const unsetFields = { workplaceName: "" };
        
        const result = await usersCollection.updateOne(
          { _id: user._id },
          {
            ...(Object.keys(updateFields).length > 0 && { $set: updateFields }),
            $unset: unsetFields
          }
        );
        
        if (result.modifiedCount > 0) {
          console.log(`✅ Usuario ${user.name} corregido`);
          if (updateFields.workplace) {
            console.log(`   - workplace establecido como: "${updateFields.workplace}"`);
          }
          console.log(`   - workplaceName removido`);
        } else {
          console.log(`⚠️ Usuario ${user.name} no necesitaba cambios`);
        }
      } catch (error) {
        console.error(`❌ Error corrigiendo usuario ${user.name}:`, error.message);
      }
    }
    
    // Verificar resultados
    console.log('\n🔍 Verificando corrección...');
    const stillHaveWorkplaceName = await usersCollection.countDocuments({
      workplaceName: { $exists: true }
    });
    
    const allUsers = await usersCollection.find({}, { 
      projection: { name: 1, email: 1, workplace: 1, workplaceName: 1 } 
    }).toArray();
    
    console.log(`📊 Estadísticas finales:`);
    console.log(`   - Usuarios con workplaceName: ${stillHaveWorkplaceName}`);
    console.log(`   - Total usuarios: ${allUsers.length}`);
    
    console.log('\n👥 Estado actual de usuarios:');
    for (const user of allUsers) {
      console.log(`   - ${user.name}: workplace="${user.workplace || 'undefined'}"${user.workplaceName ? `, workplaceName="${user.workplaceName}"` : ''}`);
    }
    
    console.log('\n🎉 Corrección completada!');
    
  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
  } finally {
    await client.close();
    console.log('🔌 Conexión cerrada');
  }
}

// Ejecutar el script
fixWorkplaceField().catch(console.error);
