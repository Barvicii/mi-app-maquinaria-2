require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error('MONGODB_URI environment variable is not set');
}

async function addDeutzFahr5100DV() {
  console.log('🚜 Agregando Deutz Fahr 5100DV...');
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
    
    // Datos completos del Deutz Fahr 5100DV
    const deutzFahr5100DV = {
      model: '5100DV',
      brand: 'Deutz Fahr',
      serialNumber: 'DF5100DV-2022001', // Número de serie ejemplo - debe ser el real del tractor
      machineId: 'DF5100DV_001',
      year: '2022',
      currentHours: '0',
      lastService: '',
      nextService: '',
      
      // Aceites - Especificaciones para Deutz Fahr 5100DV
      engineOil: {
        type: 'SAE 15W-40',
        capacity: '14.5 L (15.3 qt)',
        brand: 'Deutz Genuine Engine Oil'
      },
      hydraulicOil: {
        type: 'ISO VG 46',
        capacity: '75 L (19.8 gal)',
        brand: 'Deutz Hydraulic Oil'
      },
      transmissionOil: {
        type: 'Deutz Gear Oil 80W-90',
        capacity: '45 L (11.9 gal)',
        brand: 'Deutz'
      },
      
      // Filtros - Números de parte para Deutz Fahr 5100DV
      filters: {
        engine: '01174416',
        engineBrand: 'Deutz',
        transmission: '01174421',
        transmissionBrand: 'Deutz',
        fuel: '01030776',
        fuelBrand: 'Deutz'
      },
      
      // Neumáticos - Especificaciones para Deutz Fahr 5100DV
      tires: {
        front: {
          size: '14.9-24',
          pressure: '20 PSI (138 kPa)',
          brand: 'Michelin'
        },
        rear: {
          size: '20.8-38',
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
      machineId: deutzFahr5100DV.machineId
    });
    
    if (existingMachine) {
      console.log('⚠️ Ya existe una máquina con ID:', deutzFahr5100DV.machineId);
      console.log('Máquina existente:', {
        _id: existingMachine._id,
        model: existingMachine.model,
        brand: existingMachine.brand,
        machineId: existingMachine.machineId
      });
      return;
    }
    
    // Insertar la nueva máquina
    const result = await machinesCollection.insertOne(deutzFahr5100DV);
    
    if (result.insertedId) {
      console.log('🎉 ¡Deutz Fahr 5100DV agregado exitosamente!');
      console.log('📋 Detalles de la máquina:');
      console.log('  🆔 MongoDB ID:', result.insertedId.toString());
      console.log('  🏷️ Machine ID:', deutzFahr5100DV.machineId);
      console.log('  🚜 Modelo:', deutzFahr5100DV.model);
      console.log('  🏭 Marca:', deutzFahr5100DV.brand);
      console.log('  📅 Año:', deutzFahr5100DV.year);
      console.log('  👤 Asignado a:', user.name);
      console.log('  📧 Email usuario:', user.email);
      
      console.log('\n🔧 Especificaciones técnicas agregadas:');
      console.log('  🛢️ Aceite motor:', deutzFahr5100DV.engineOil.type, '-', deutzFahr5100DV.engineOil.capacity);
      console.log('  🔧 Aceite hidráulico:', deutzFahr5100DV.hydraulicOil.type, '-', deutzFahr5100DV.hydraulicOil.capacity);
      console.log('  ⚙️ Aceite transmisión:', deutzFahr5100DV.transmissionOil.type, '-', deutzFahr5100DV.transmissionOil.capacity);
      console.log('  🔍 Filtro motor:', deutzFahr5100DV.filters.engine);
      console.log('  🔍 Filtro transmisión:', deutzFahr5100DV.filters.transmission);
      console.log('  🔍 Filtro combustible:', deutzFahr5100DV.filters.fuel);
      console.log('  🚗 Neumáticos delanteros:', deutzFahr5100DV.tires.front.size, '-', deutzFahr5100DV.tires.front.pressure);
      console.log('  🚗 Neumáticos traseros:', deutzFahr5100DV.tires.rear.size, '-', deutzFahr5100DV.tires.rear.pressure);
      
      console.log('\n📝 Características del tractor:');
      console.log('  🚜 Tipo: Tractor agrícola especializado');
      console.log('  ⚡ Potencia: Aprox. 100 HP');
      console.log('  🔋 Motor: 4 cilindros Deutz TCD 3.6 turbo diésel');
      console.log('  ⚙️ Transmisión: 40 KM/H PowerShift');
      console.log('  🔧 Sistema hidráulico: Load Sensing 110 L/min');
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

console.log('🚜 SCRIPT: Agregar Deutz Fahr 5100DV');
console.log('👤 Usuario destino: Facundo Barbosa (686cbe4ef25910e08a0d2ed6)');
console.log('📅 Fecha:', new Date().toLocaleString());
console.log(''.padEnd(50, '='));

addDeutzFahr5100DV().catch(console.error);
