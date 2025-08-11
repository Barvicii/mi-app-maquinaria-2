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

async function addJohnDeere5420() {
  console.log('🚜 Agregando John Deere 5420...');
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
    
    // Datos completos del John Deere 5420
    const johnDeere5420 = {
      model: '5420',
      brand: 'John Deere',
      serialNumber: 'JD5420-2010001', // Número de serie ejemplo - debe ser el real del tractor
      machineId: 'JD5420_001',
      year: '2010',
      currentHours: '0',
      lastService: '',
      nextService: '',
      
      // Aceites - Especificaciones para John Deere 5420
      engineOil: {
        type: 'SAE 15W-40',
        capacity: '10.5 L (11.1 qt)',
        brand: 'John Deere Plus-50 II'
      },
      hydraulicOil: {
        type: 'John Deere Hy-Gard',
        capacity: '65 L (17.2 gal)',
        brand: 'John Deere'
      },
      transmissionOil: {
        type: 'John Deere Hy-Gard',
        capacity: '65 L (17.2 gal)',
        brand: 'John Deere'
      },
      
      // Filtros - Números de parte para John Deere 5420
      filters: {
        engine: 'RE59754',
        engineBrand: 'John Deere',
        transmission: 'AL78405',
        transmissionBrand: 'John Deere',
        fuel: 'RE62418',
        fuelBrand: 'John Deere'
      },
      
      // Neumáticos - Especificaciones para John Deere 5420
      tires: {
        front: {
          size: '12.4-24',
          pressure: '18 PSI (124 kPa)',
          brand: 'Firestone'
        },
        rear: {
          size: '18.4-34',
          pressure: '16 PSI (110 kPa)',
          brand: 'Firestone'
        }
      },
      
      prestartTemplateId: '',
      userId: userId,
      createdBy: userId,
      createdAt: new Date()
    };
    
    // Verificar si ya existe una máquina con este machineId
    const existingMachine = await machinesCollection.findOne({
      machineId: johnDeere5420.machineId
    });
    
    if (existingMachine) {
      console.log('⚠️ Ya existe una máquina con ID:', johnDeere5420.machineId);
      console.log('Máquina existente:', {
        _id: existingMachine._id,
        model: existingMachine.model,
        brand: existingMachine.brand,
        machineId: existingMachine.machineId
      });
      return;
    }
    
    // Insertar la nueva máquina
    const result = await machinesCollection.insertOne(johnDeere5420);
    
    if (result.insertedId) {
      console.log('🎉 ¡John Deere 5420 agregado exitosamente!');
      console.log('📋 Detalles de la máquina:');
      console.log('  🆔 MongoDB ID:', result.insertedId.toString());
      console.log('  🏷️ Machine ID:', johnDeere5420.machineId);
      console.log('  🚜 Modelo:', johnDeere5420.model);
      console.log('  🏭 Marca:', johnDeere5420.brand);
      console.log('  📅 Año:', johnDeere5420.year);
      console.log('  👤 Asignado a:', user.name);
      console.log('  📧 Email usuario:', user.email);
      
      console.log('\n🔧 Especificaciones técnicas agregadas:');
      console.log('  🛢️ Aceite motor:', johnDeere5420.engineOil.type, '-', johnDeere5420.engineOil.capacity);
      console.log('  🔧 Aceite hidráulico:', johnDeere5420.hydraulicOil.type, '-', johnDeere5420.hydraulicOil.capacity);
      console.log('  ⚙️ Aceite transmisión:', johnDeere5420.transmissionOil.type, '-', johnDeere5420.transmissionOil.capacity);
      console.log('  🔍 Filtro motor:', johnDeere5420.filters.engine);
      console.log('  🔍 Filtro transmisión:', johnDeere5420.filters.transmission);
      console.log('  🔍 Filtro combustible:', johnDeere5420.filters.fuel);
      console.log('  🚗 Neumáticos delanteros:', johnDeere5420.tires.front.size, '-', johnDeere5420.tires.front.pressure);
      console.log('  🚗 Neumáticos traseros:', johnDeere5420.tires.rear.size, '-', johnDeere5420.tires.rear.pressure);
      
      console.log('\n📝 Características del tractor:');
      console.log('  🚜 Tipo: Tractor agrícola utilitario');
      console.log('  ⚡ Potencia: Aprox. 85 HP');
      console.log('  🔋 Motor: 4 cilindros, 4.5L turbo diésel');
      console.log('  ⚙️ Transmisión: PowerReverser 16F/16R');
      console.log('  🔧 Sistema hidráulico: Carga sensible');
      console.log('  💺 Cabina: ROPS/FOPS certificada');
      
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

console.log('🚜 SCRIPT: Agregar John Deere 5420');
console.log('👤 Usuario destino: Facundo Barbosa (686cbe4ef25910e08a0d2ed6)');
console.log('📅 Fecha:', new Date().toLocaleString());
console.log(''.padEnd(50, '='));

addJohnDeere5420().catch(console.error);
