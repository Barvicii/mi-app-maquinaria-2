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

async function addKawasakiMuleTemplate() {
  console.log('📋 Agregando Template de Pre-Start para Kawasaki Mule...');
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
    
    // Datos del template basado en la imagen
    const kawasakiMuleTemplate = {
      name: 'Kawasaki Mule KAF400K - Pre-Start Check',
      checkItems: [
        'Check Hours',
        '360 checks for damage',
        'Safety cage',
        'Engine Oil',
        'Coolant level',
        'Grease points',
        'Fuel',
        'Tyres',
        'Steering',
        'Horn',
        'Seatbelt',
        'Lights',
        'Hand brake',
        'Foot brake'
      ],
      userId: userId,
      isGlobal: false,
      createdAt: new Date()
    };
    
    // Verificar si ya existe un template con este nombre para el usuario
    const existingTemplate = await templatesCollection.findOne({
      name: kawasakiMuleTemplate.name,
      userId: userId
    });
    
    if (existingTemplate) {
      console.log('⚠️ Ya existe un template con este nombre para el usuario:', kawasakiMuleTemplate.name);
      console.log('Template existente:', {
        _id: existingTemplate._id,
        name: existingTemplate.name,
        checkItems: existingTemplate.checkItems.length + ' items'
      });
      return existingTemplate._id;
    }
    
    // Insertar el nuevo template
    const result = await templatesCollection.insertOne(kawasakiMuleTemplate);
    
    if (result.insertedId) {
      console.log('🎉 ¡Template de Kawasaki Mule agregado exitosamente!');
      console.log('📋 Detalles del template:');
      console.log('  🆔 MongoDB ID:', result.insertedId.toString());
      console.log('  📝 Nombre:', kawasakiMuleTemplate.name);
      console.log('  👤 Usuario:', user.name);
      console.log('  📧 Email usuario:', user.email);
      console.log('  🌐 Global:', kawasakiMuleTemplate.isGlobal ? 'Sí' : 'No');
      
      console.log('\n📝 Items de verificación incluidos:');
      kawasakiMuleTemplate.checkItems.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item}`);
      });
      
      // Ahora actualizar la máquina Kawasaki Mule para usar este template
      console.log('\n🔗 Actualizando máquina Kawasaki Mule con el template...');
      
      const updateResult = await machinesCollection.updateOne(
        { 
          machineId: 'KAW_MULE_001',
          userId: userId 
        },
        { 
          $set: { 
            prestartTemplateId: result.insertedId.toString() 
          } 
        }
      );
      
      if (updateResult.modifiedCount > 0) {
        console.log('✅ Máquina Kawasaki Mule actualizada con el template');
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

console.log('📋 SCRIPT: Agregar Template Pre-Start para Kawasaki Mule KAF400K');
console.log('👤 Usuario destino: Facundo Barbosa (686cbe4ef25910e08a0d2ed6)');
console.log('📅 Fecha:', new Date().toLocaleString());
console.log(''.padEnd(60, '='));

addKawasakiMuleTemplate().catch(console.error);
