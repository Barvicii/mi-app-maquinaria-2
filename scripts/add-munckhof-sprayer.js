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

async function addMunckhofSprayer() {
  console.log('🚿 Agregando Munckhof Air System Orchard Sprayer (VariMAS)...');
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
    
    // Datos completos del Munckhof Air System Orchard Sprayer
    const munckhofSprayer = {
      model: 'VariMAS Orchard Sprayer',
      brand: 'Munckhof Air System',
      serialNumber: 'MAS-3000-2023001', // Número de serie ejemplo - debe ser el real del equipo
      machineId: 'MUNCKHOF_001',
      year: '2023',
      currentHours: '0',
      lastService: '',
      nextService: '',
      
      // Aceites - Información limitada disponible para equipos de pulverización
      engineOil: {
        type: '', // No especificado - depende del motor
        capacity: '',
        brand: ''
      },
      hydraulicOil: {
        type: 'ISO VG 46',
        capacity: '150 L (aprox)', // Estimado para sistema hidráulico
        brand: 'Hydraulic Oil'
      },
      transmissionOil: {
        type: '', // No aplicable para la mayoría de pulverizadores
        capacity: '',
        brand: ''
      },
      
      // Filtros - Números de parte específicos no disponibles
      filters: {
        engine: '',
        engineBrand: '',
        transmission: '',
        transmissionBrand: '',
        fuel: '',
        fuelBrand: ''
      },
      
      // Neumáticos - Especificaciones típicas para pulverizadores de huerta
      tires: {
        front: {
          size: '12.4-24',
          pressure: '22 PSI (152 kPa)',
          brand: 'Agricultural Tire'
        },
        rear: {
          size: '12.4-24',
          pressure: '22 PSI (152 kPa)',
          brand: 'Agricultural Tire'
        }
      },
      
      prestartTemplateId: '',
      userId: userId,
      createdBy: userId,
      createdAt: new Date()
    };
    
    // Verificar si ya existe una máquina con este machineId
    const existingMachine = await machinesCollection.findOne({
      machineId: munckhofSprayer.machineId
    });
    
    if (existingMachine) {
      console.log('⚠️ Ya existe una máquina con ID:', munckhofSprayer.machineId);
      console.log('Máquina existente:', {
        _id: existingMachine._id,
        model: existingMachine.model,
        brand: existingMachine.brand,
        machineId: existingMachine.machineId
      });
      return;
    }
    
    // Insertar la nueva máquina
    const result = await machinesCollection.insertOne(munckhofSprayer);
    
    if (result.insertedId) {
      console.log('🎉 ¡Munckhof Air System Sprayer agregado exitosamente!');
      console.log('📋 Detalles de la máquina:');
      console.log('  🆔 MongoDB ID:', result.insertedId.toString());
      console.log('  🏷️ Machine ID:', munckhofSprayer.machineId);
      console.log('  🚿 Modelo:', munckhofSprayer.model);
      console.log('  🏭 Marca:', munckhofSprayer.brand);
      console.log('  📅 Año:', munckhofSprayer.year);
      console.log('  👤 Asignado a:', user.name);
      console.log('  📧 Email usuario:', user.email);
      
      console.log('\n🔧 Especificaciones técnicas agregadas:');
      console.log('  🛢️ Aceite motor:', munckhofSprayer.engineOil.type || 'No especificado');
      console.log('  🔧 Aceite hidráulico:', munckhofSprayer.hydraulicOil.type, '-', munckhofSprayer.hydraulicOil.capacity);
      console.log('  🚗 Neumáticos delanteros:', munckhofSprayer.tires.front.size, '-', munckhofSprayer.tires.front.pressure);
      console.log('  🚗 Neumáticos traseros:', munckhofSprayer.tires.rear.size, '-', munckhofSprayer.tires.rear.pressure);
      
      console.log('\n📝 Características del pulverizador:');
      console.log('  🚿 Tipo: Pulverizador de huerta con sistema de aire');
      console.log('  💧 Capacidad: 3000 litros');
      console.log('  🌪️ Sistema: VariMAS (Variable Multi Air System)');
      console.log('  🌳 Aplicación: Frutales y viñedos');
      console.log('  💨 Tecnología: Asistencia de aire para mejor penetración');
      console.log('  🎯 Características: Control preciso de pulverización');
      console.log('  ⚙️ Componentes: Tanque, bomba, sistema de aire, brazos pulverizadores');
      console.log('  🔧 Mantenimiento: Sistema hidráulico, filtros, boquillas');
      
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

console.log('🚿 SCRIPT: Agregar Munckhof Air System Orchard Sprayer (VariMAS)');
console.log('👤 Usuario destino: Facundo Barbosa (686cbe4ef25910e08a0d2ed6)');
console.log('📅 Fecha:', new Date().toLocaleString());
console.log(''.padEnd(60, '='));

addMunckhofSprayer().catch(console.error);
