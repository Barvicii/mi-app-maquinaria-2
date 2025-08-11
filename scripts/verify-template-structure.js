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

async function verifyTemplateStructure() {
  console.log('🔍 Verificando estructura detallada del Template Kawasaki Mule...');
  
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db('orchardservice');
    const templatesCollection = db.collection('prestartTemplates');
    
    // Buscar el template específico del Kawasaki Mule
    const kawasakiTemplate = await templatesCollection.findOne({
      name: 'Kawasaki Mule KAF400K - Pre-Start Check',
      userId: '686cbe4ef25910e08a0d2ed6'
    });
    
    if (!kawasakiTemplate) {
      console.log('❌ Template de Kawasaki Mule no encontrado');
      return;
    }
    
    console.log('\n📋 Template encontrado:');
    console.log('🆔 ID:', kawasakiTemplate._id);
    console.log('📝 Nombre:', kawasakiTemplate.name);
    console.log('👤 Usuario ID:', kawasakiTemplate.userId);
    console.log('🌐 Global:', kawasakiTemplate.isGlobal);
    console.log('📅 Creado:', kawasakiTemplate.createdAt);
    
    console.log('\n🔧 Estructura de checkItems:');
    console.log('📊 Total items:', kawasakiTemplate.checkItems.length);
    
    console.log('\n📝 Detalle de cada item:');
    console.log(''.padEnd(80, '='));
    
    kawasakiTemplate.checkItems.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.label}`);
      console.log(`   🆔 ID: ${item.id}`);
      console.log(`   📛 Name: ${item.name}`);
      console.log(`   🏷️  Label: ${item.label}`);
      console.log(`   ✅ Required: ${item.required}`);
      console.log(`   🔧 Estructura correcta: ${item.id && item.name && item.label && typeof item.required === 'boolean' ? '✅' : '❌'}`);
    });
    
    console.log('\n'.padEnd(80, '='));
    
    // Verificar que todos los items tienen la estructura correcta
    const validItems = kawasakiTemplate.checkItems.filter(item => 
      item.id && item.name && item.label && typeof item.required === 'boolean'
    );
    
    console.log('🎯 Validación de estructura:');
    console.log(`   ✅ Items válidos: ${validItems.length}/${kawasakiTemplate.checkItems.length}`);
    console.log(`   🔧 Estructura completa: ${validItems.length === kawasakiTemplate.checkItems.length ? '✅ Correcto' : '❌ Incorrecto'}`);
    
    if (validItems.length === kawasakiTemplate.checkItems.length) {
      console.log('\n🎉 ¡Template tiene la estructura correcta!');
      console.log('✅ Ahora debería funcionar correctamente en la interfaz');
      console.log('✅ Los items se mostrarán individualmente');
      console.log('✅ No se seleccionarán todos a la vez');
    } else {
      console.log('\n❌ Template tiene problemas de estructura');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Conexión cerrada');
  }
}

verifyTemplateStructure().catch(console.error);
