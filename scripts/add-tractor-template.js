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

async function addTractorTemplate() {
  console.log('🚜 Agregando Template de Pre-Start para Tractores...');
  console.log('Conectando a MongoDB...');
  
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db('orchardservice');
    const templatesCollection = db.collection('prestartTemplates');
    const machinesCollection = db.collection('machines');
    const usersCollection = db.collection('users');
    
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
    
    // Datos del template para tractores basado en la imagen actualizada
    const tractorTemplate = {
      name: 'Tractor - Pre-Start Check',
      description: 'Template de verificación pre-operacional para tractores agrícolas',
      checkItems: [
        {
          id: 'check_hours',
          name: 'checkHours',
          label: 'Check Hours',
          required: true
        },
        {
          id: 'damage_360',
          name: 'damage360Check',
          label: '360 checks for damage',
          required: true
        },
        {
          id: 'safety_cage',
          name: 'safetyCage',
          label: 'Safety cage',
          required: true
        },
        {
          id: 'engine_oil',
          name: 'engineOil',
          label: 'Engine Oil',
          required: true
        },
        {
          id: 'coolant_level',
          name: 'coolantLevel',
          label: 'Coolant level',
          required: true
        },
        {
          id: 'adblue',
          name: 'adBlue',
          label: 'AdBlue',
          required: true
        },
        {
          id: 'grease_points',
          name: 'greasePoints',
          label: 'Grease points',
          required: true
        },
        {
          id: 'fuel',
          name: 'fuel',
          label: 'Fuel',
          required: true
        },
        {
          id: 'tyres',
          name: 'tyres',
          label: 'Tyres',
          required: true
        },
        {
          id: 'steering',
          name: 'steering',
          label: 'Steering',
          required: true
        },
        {
          id: 'horn',
          name: 'horn',
          label: 'Horn',
          required: true
        },
        {
          id: 'seatbelt',
          name: 'seatbelt',
          label: 'Seatbelt',
          required: true
        },
        {
          id: 'lights',
          name: 'lights',
          label: 'Lights',
          required: true
        },
        {
          id: 'hand_brake',
          name: 'handBrake',
          label: 'Hand brake',
          required: true
        },
        {
          id: 'foot_brake',
          name: 'footBrake',
          label: 'Foot brake',
          required: true
        },
        {
          id: 'safety_guards',
          name: 'safetyGuards',
          label: 'Safety guards/covers',
          required: true
        },
        {
          id: 'initial',
          name: 'initial',
          label: 'Initial',
          required: true
        }
      ],
      userId: userId,
      isGlobal: false,
      createdAt: new Date()
    };
    
    // Verificar si ya existe un template con este nombre para el usuario
    const existingTemplate = await templatesCollection.findOne({
      name: tractorTemplate.name,
      userId: userId
    });
    
    if (existingTemplate) {
      console.log('⚠️ Ya existe un template con este nombre para el usuario:', tractorTemplate.name);
      console.log('Template existente:', {
        _id: existingTemplate._id,
        name: existingTemplate.name,
        checkItems: existingTemplate.checkItems.length + ' items'
      });
      
      // Preguntar si queremos actualizar el existente
      console.log('🔄 Actualizando template existente...');
      
      const updateResult = await templatesCollection.updateOne(
        { _id: existingTemplate._id },
        { 
          $set: {
            checkItems: tractorTemplate.checkItems,
            description: tractorTemplate.description,
            updatedAt: new Date()
          }
        }
      );
      
      if (updateResult.modifiedCount > 0) {
        console.log('✅ Template actualizado exitosamente');
        return existingTemplate._id;
      } else {
        console.log('⚠️ No se realizaron cambios en el template');
        return existingTemplate._id;
      }
    }
    
    // Insertar el nuevo template
    const result = await templatesCollection.insertOne(tractorTemplate);
    
    if (result.insertedId) {
      console.log('🎉 ¡Template de Tractor agregado exitosamente!');
      console.log('📋 Detalles del template:');
      console.log('  🆔 MongoDB ID:', result.insertedId.toString());
      console.log('  📝 Nombre:', tractorTemplate.name);
      console.log('  📄 Descripción:', tractorTemplate.description);
      console.log('  👤 Usuario:', user.name);
      console.log('  📧 Email usuario:', user.email);
      console.log('  🌐 Global:', tractorTemplate.isGlobal ? 'Sí' : 'No');
      
      console.log('\n📝 Items de verificación incluidos:');
      tractorTemplate.checkItems.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.label} (${item.name}) - Requerido: ${item.required ? 'Sí' : 'No'}`);
      });
      
      // Actualizar tractores existentes con este template
      console.log('\n🔗 Actualizando tractores existentes con el template...');
      
      const tractors = await machinesCollection.find({
        userId: userId,
        brand: { $in: ['John Deere', 'Deutz Fahr'] }
      }).toArray();
      
      console.log(`📊 Tractores encontrados: ${tractors.length}`);
      
      if (tractors.length > 0) {
        const updateResults = await machinesCollection.updateMany(
          { 
            userId: userId,
            brand: { $in: ['John Deere', 'Deutz Fahr'] }
          },
          { 
            $set: { 
              prestartTemplateId: result.insertedId.toString() 
            } 
          }
        );
        
        console.log(`✅ ${updateResults.modifiedCount} tractores actualizados con el template`);
        
        // Mostrar detalles de los tractores actualizados
        tractors.forEach((tractor, index) => {
          console.log(`   ${index + 1}. ${tractor.brand} ${tractor.model} (${tractor.machineId})`);
        });
      } else {
        console.log('ℹ️ No se encontraron tractores para asignar el template');
      }
      
      // Verificar la inserción
      const insertedTemplate = await templatesCollection.findOne({
        _id: result.insertedId
      });
      
      if (insertedTemplate) {
        console.log('\n✅ Verificación exitosa - Template encontrado en la base de datos');
        console.log('📊 Total de check items:', insertedTemplate.checkItems.length);
        console.log('📊 Items con estructura correcta:', insertedTemplate.checkItems.every(item => 
          item.id && item.name && item.label && typeof item.required === 'boolean'
        ) ? 'Sí' : 'No');
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

console.log('🚜 SCRIPT: Agregar Template Pre-Start para Tractores');
console.log('👤 Usuario destino: Facundo Barbosa (686cbe4ef25910e08a0d2ed6)');
console.log('📅 Fecha:', new Date().toLocaleString());
console.log(''.padEnd(70, '='));

addTractorTemplate().catch(console.error);
