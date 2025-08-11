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

async function addDeutzFahr5090DV() {
  console.log('🚜 Agregando Deutz Fahr 5090DV...');
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
    
    // Datos completos del Deutz Fahr 5090DV
    const deutzFahr5090DV = {
      model: '5090DV',
      brand: 'Deutz Fahr',
      serialNumber: 'DF5090DV-2022001', // Número de serie ejemplo - debe ser el real del tractor
      machineId: 'DF5090DV_001',
      year: '2022',
      currentHours: '0',
      lastService: '',
      nextService: '',
      
      // Aceites - Especificaciones para Deutz Fahr 5090DV
      engineOil: {
        type: 'SAE 15W-40',
        capacity: '13.5 L (14.3 qt)',
        brand: 'Deutz Genuine Engine Oil'
      },
      hydraulicOil: {
        type: 'ISO VG 46',
        capacity: '70 L (18.5 gal)',
        brand: 'Deutz Hydraulic Oil'
      },
      transmissionOil: {
        type: 'Deutz Gear Oil 80W-90',
        capacity: '42 L (11.1 gal)',
        brand: 'Deutz'
      },
      
      // Filtros - Números de parte para Deutz Fahr 5090DV
      filters: {
        engine: '01174416',
        engineBrand: 'Deutz',
        transmission: '01174420',
        transmissionBrand: 'Deutz',
        fuel: '01030776',
        fuelBrand: 'Deutz'
      },
      
      // Neumáticos - Especificaciones para Deutz Fahr 5090DV
      tires: {
        front: {
          size: '14.9-24',
          pressure: '20 PSI (138 kPa)',
          brand: 'Michelin'
        },
        rear: {
          size: '18.4-38',
          pressure: '18 PSI (124 kPa)',
          brand: 'Michelin'
        }
      },
      
      prestartTemplateId: '',
      userId: userId,
      createdBy: userId,
      createdAt: new Date()
    };
    
    // Verificar si ya existe una máquina con este machineId
    const existingMachine = await machinesCollection.findOne({
      machineId: deutzFahr5090DV.machineId
    });
    
    if (existingMachine) {
      console.log('⚠️ Ya existe una máquina con ID:', deutzFahr5090DV.machineId);
      console.log('Máquina existente:', {
        _id: existingMachine._id,
        model: existingMachine.model,
        brand: existingMachine.brand,
        machineId: existingMachine.machineId
      });
      return;
    }
    
    // Insertar la nueva máquina
    const result = await machinesCollection.insertOne(deutzFahr5090DV);
    
    if (result.insertedId) {
      console.log('🎉 ¡Deutz Fahr 5090DV agregado exitosamente!');
      console.log('📋 Detalles de la máquina:');
      console.log('  🆔 MongoDB ID:', result.insertedId.toString());
      console.log('  🏷️ Machine ID:', deutzFahr5090DV.machineId);
      console.log('  🚜 Modelo:', deutzFahr5090DV.model);
      console.log('  🏭 Marca:', deutzFahr5090DV.brand);
      console.log('  📅 Año:', deutzFahr5090DV.year);
      console.log('  👤 Asignado a:', user.name);
      console.log('  📧 Email usuario:', user.email);
      
      console.log('\n🔧 Especificaciones técnicas agregadas:');
      console.log('  🛢️ Aceite motor:', deutzFahr5090DV.engineOil.type, '-', deutzFahr5090DV.engineOil.capacity);
      console.log('  🔧 Aceite hidráulico:', deutzFahr5090DV.hydraulicOil.type, '-', deutzFahr5090DV.hydraulicOil.capacity);
      console.log('  ⚙️ Aceite transmisión:', deutzFahr5090DV.transmissionOil.type, '-', deutzFahr5090DV.transmissionOil.capacity);
      console.log('  🔍 Filtro motor:', deutzFahr5090DV.filters.engine);
      console.log('  🔍 Filtro transmisión:', deutzFahr5090DV.filters.transmission);
      console.log('  🔍 Filtro combustible:', deutzFahr5090DV.filters.fuel);
      console.log('  🚗 Neumáticos delanteros:', deutzFahr5090DV.tires.front.size, '-', deutzFahr5090DV.tires.front.pressure);
      console.log('  🚗 Neumáticos traseros:', deutzFahr5090DV.tires.rear.size, '-', deutzFahr5090DV.tires.rear.pressure);
      
      console.log('\n📝 Características del tractor:');
      console.log('  🚜 Tipo: Tractor agrícola especializado');
      console.log('  ⚡ Potencia: Aprox. 90 HP');
      console.log('  🔋 Motor: 4 cilindros Deutz TCD 3.6 turbo diésel');
      console.log('  ⚙️ Transmisión: 40 KM/H PowerShift');
      console.log('  🔧 Sistema hidráulico: Load Sensing 105 L/min');
      console.log('  💺 Cabina: Panorámica con suspensión');
      console.log('  🌱 Característica: Diseño para viñedos y frutales');
      
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

console.log('🚜 SCRIPT: Agregar Deutz Fahr 5090DV');
console.log('👤 Usuario destino: Facundo Barbosa (686cbe4ef25910e08a0d2ed6)');
console.log('📅 Fecha:', new Date().toLocaleString());
console.log(''.padEnd(50, '='));

addDeutzFahr5090DV().catch(console.error);
