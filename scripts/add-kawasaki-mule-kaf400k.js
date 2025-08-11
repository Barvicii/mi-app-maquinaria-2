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

async function addKawasakiMuleKAF400K() {
  console.log('🚗 Agregando Kawasaki Mule KAF400K Side by Side...');
  console.log('Conectando a MongoDB...');
  
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db('orchardservice');
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
    
    // Datos completos del Kawasaki Mule KAF400K Side by Side
    const kawasakiMuleKAF400K = {
      model: 'KAF400K',
      brand: 'Kawasaki',
      serialNumber: 'KAF400K2024001', // Número de serie ejemplo - debe ser el real del vehículo
      machineId: 'KAW_MULE_001',
      year: '2024',
      currentHours: '0',
      lastService: '',
      nextService: '',
      
      // Aceites - Especificaciones para Kawasaki Mule KAF400K
      engineOil: {
        type: 'SAE 10W-40 4-Stroke',
        capacity: '3.2 L (3.4 qt)',
        brand: 'Kawasaki 4-Stroke Engine Oil'
      },
      hydraulicOil: {
        type: 'Kawasaki Genuine CVT Fluid',
        capacity: '2.8 L (3.0 qt)',
        brand: 'Kawasaki'
      },
      transmissionOil: {
        type: 'Kawasaki CVT Belt Drive Oil',
        capacity: '1.2 L (1.3 qt)',
        brand: 'Kawasaki'
      },
      
      // Filtros - Números de parte para Kawasaki Mule KAF400K
      filters: {
        engine: '16097-0008',
        engineBrand: 'Kawasaki',
        transmission: '49065-0721',
        transmissionBrand: 'Kawasaki',
        fuel: '49019-0027',
        fuelBrand: 'Kawasaki'
      },
      
      // Neumáticos - Especificaciones para Side by Side Kawasaki Mule
      tires: {
        front: {
          size: '25x8-12',
          pressure: '15 PSI (103 kPa)',
          brand: 'Carlisle Trail Wolf'
        },
        rear: {
          size: '25x10-12',
          pressure: '15 PSI (103 kPa)',
          brand: 'Carlisle Trail Wolf'
        }
      },
      
      prestartTemplateId: '',
      userId: userId,
      createdBy: userId,
      createdAt: new Date()
    };
    
    // Verificar si ya existe una máquina con este machineId
    const existingMachine = await machinesCollection.findOne({
      machineId: kawasakiMuleKAF400K.machineId
    });
    
    if (existingMachine) {
      console.log('⚠️ Ya existe una máquina con ID:', kawasakiMuleKAF400K.machineId);
      console.log('Máquina existente:', {
        _id: existingMachine._id,
        model: existingMachine.model,
        brand: existingMachine.brand,
        machineId: existingMachine.machineId
      });
      return;
    }
    
    // Insertar la nueva máquina
    const result = await machinesCollection.insertOne(kawasakiMuleKAF400K);
    
    if (result.insertedId) {
      console.log('🎉 ¡Kawasaki Mule KAF400K agregado exitosamente!');
      console.log('📋 Detalles de la máquina:');
      console.log('  🆔 MongoDB ID:', result.insertedId.toString());
      console.log('  🏷️ Machine ID:', kawasakiMuleKAF400K.machineId);
      console.log('  🚗 Modelo:', kawasakiMuleKAF400K.model);
      console.log('  🏭 Marca:', kawasakiMuleKAF400K.brand);
      console.log('  📅 Año:', kawasakiMuleKAF400K.year);
      console.log('  👤 Asignado a:', user.name);
      console.log('  📧 Email usuario:', user.email);
      
      console.log('\n🔧 Especificaciones técnicas agregadas:');
      console.log('  🛢️ Aceite motor:', kawasakiMuleKAF400K.engineOil.type, '-', kawasakiMuleKAF400K.engineOil.capacity);
      console.log('  🔧 Aceite CVT:', kawasakiMuleKAF400K.hydraulicOil.type, '-', kawasakiMuleKAF400K.hydraulicOil.capacity);
      console.log('  ⚙️ Aceite transmisión:', kawasakiMuleKAF400K.transmissionOil.type, '-', kawasakiMuleKAF400K.transmissionOil.capacity);
      console.log('  🔍 Filtro motor:', kawasakiMuleKAF400K.filters.engine);
      console.log('  🔍 Filtro transmisión:', kawasakiMuleKAF400K.filters.transmission);
      console.log('  🔍 Filtro combustible:', kawasakiMuleKAF400K.filters.fuel);
      console.log('  🚗 Neumáticos delanteros:', kawasakiMuleKAF400K.tires.front.size, '-', kawasakiMuleKAF400K.tires.front.pressure);
      console.log('  🚗 Neumáticos traseros:', kawasakiMuleKAF400K.tires.rear.size, '-', kawasakiMuleKAF400K.tires.rear.pressure);
      
      console.log('\n📝 Características del Side by Side:');
      console.log('  🛺 Tipo: Vehículo utilitario Side by Side');
      console.log('  👥 Capacidad: 2 pasajeros');
      console.log('  🏋️ Carga útil: Aprox. 400 kg');
      console.log('  🚛 Capacidad de remolque: Aprox. 680 kg');
      console.log('  🔋 Motor: Monocilíndrico 4 tiempos refrigerado por aire');
      console.log('  ⚙️ Transmisión: CVT automática con marcha atrás');
      
      // Verificar la inserción
      const insertedMachine = await machinesCollection.findOne({
        _id: result.insertedId
      });
      
      if (insertedMachine) {
        console.log('\n✅ Verificación exitosa - Máquina encontrada en la base de datos');
      } else {
        console.log('\n❌ Error en la verificación - No se pudo encontrar la máquina insertada');
      }
      
    } else {
      console.log('❌ Error: No se pudo insertar la máquina');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Conexión cerrada');
  }
}

console.log('🚗 SCRIPT: Agregar Kawasaki Mule KAF400K Side by Side');
console.log('👤 Usuario destino: Facundo Barbosa (686cbe4ef25910e08a0d2ed6)');
console.log('📅 Fecha:', new Date().toLocaleString());
console.log(''.padEnd(50, '='));

addKawasakiMuleKAF400K().catch(console.error);
