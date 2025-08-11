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

// Definir todas las máquinas
const machines = [
  {
    name: 'Kawasaki Mule KAF400K',
    data: {
      model: 'KAF400K',
      brand: 'Kawasaki',
      serialNumber: 'KAF400K2024001',
      machineId: 'KAW_MULE_001',
      year: '2024',
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
      filters: {
        engine: '16097-0008',
        engineBrand: 'Kawasaki',
        transmission: '49065-0721',
        transmissionBrand: 'Kawasaki',
        fuel: '49019-0027',
        fuelBrand: 'Kawasaki'
      },
      tires: {
        front: { size: '25x8-12', pressure: '15 PSI (103 kPa)', brand: 'Carlisle Trail Wolf' },
        rear: { size: '25x10-12', pressure: '15 PSI (103 kPa)', brand: 'Carlisle Trail Wolf' }
      }
    }
  },
  {
    name: 'John Deere 5420',
    data: {
      model: '5420',
      brand: 'John Deere',
      serialNumber: 'JD5420-2010001',
      machineId: 'JD5420_001',
      year: '2010',
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
      filters: {
        engine: 'RE59754',
        engineBrand: 'John Deere',
        transmission: 'AL78405',
        transmissionBrand: 'John Deere',
        fuel: 'RE62418',
        fuelBrand: 'John Deere'
      },
      tires: {
        front: { size: '12.4-24', pressure: '18 PSI (124 kPa)', brand: 'Firestone' },
        rear: { size: '18.4-34', pressure: '16 PSI (110 kPa)', brand: 'Firestone' }
      }
    }
  },
  {
    name: 'Deutz Fahr 5100DV',
    data: {
      model: '5100DV',
      brand: 'Deutz Fahr',
      serialNumber: 'DF5100DV-2022001',
      machineId: 'DF5100DV_001',
      year: '2022',
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
      filters: {
        engine: '01174416',
        engineBrand: 'Deutz',
        transmission: '01174421',
        transmissionBrand: 'Deutz',
        fuel: '01030776',
        fuelBrand: 'Deutz'
      },
      tires: {
        front: { size: '14.9-24', pressure: '20 PSI (138 kPa)', brand: 'Michelin' },
        rear: { size: '20.8-38', pressure: '18 PSI (124 kPa)', brand: 'Michelin' }
      }
    }
  },
  {
    name: 'Deutz Fahr 5090DV',
    data: {
      model: '5090DV',
      brand: 'Deutz Fahr',
      serialNumber: 'DF5090DV-2022001',
      machineId: 'DF5090DV_001',
      year: '2022',
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
      filters: {
        engine: '01174416',
        engineBrand: 'Deutz',
        transmission: '01174420',
        transmissionBrand: 'Deutz',
        fuel: '01030776',
        fuelBrand: 'Deutz'
      },
      tires: {
        front: { size: '14.9-24', pressure: '20 PSI (138 kPa)', brand: 'Michelin' },
        rear: { size: '18.4-38', pressure: '18 PSI (124 kPa)', brand: 'Michelin' }
      }
    }
  }
];

async function addAllMachines() {
  console.log('🚜 SCRIPT MAESTRO: Agregando todas las máquinas para Facundo Barbosa');
  console.log('📅 Fecha:', new Date().toLocaleString());
  console.log(''.padEnd(70, '='));
  
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
    console.log(''.padEnd(70, '-'));
    
    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < machines.length; i++) {
      const machine = machines[i];
      console.log(`\n🔄 [${i + 1}/${machines.length}] Procesando: ${machine.name}`);
      
      try {
        // Completar datos básicos
        const machineData = {
          ...machine.data,
          currentHours: '0',
          lastService: '',
          nextService: '',
          prestartTemplateId: '',
          userId: userId,
          createdBy: userId,
          createdAt: new Date()
        };
        
        // Verificar si ya existe
        const existingMachine = await machinesCollection.findOne({
          machineId: machineData.machineId
        });
        
        if (existingMachine) {
          console.log(`⚠️  Ya existe una máquina con ID: ${machineData.machineId}`);
          skippedCount++;
          continue;
        }
        
        // Insertar la máquina
        const result = await machinesCollection.insertOne(machineData);
        
        if (result.insertedId) {
          console.log(`✅ ${machine.name} agregado exitosamente`);
          console.log(`   🆔 MongoDB ID: ${result.insertedId.toString()}`);
          console.log(`   🏷️  Machine ID: ${machineData.machineId}`);
          console.log(`   📅 Año: ${machineData.year}`);
          successCount++;
        } else {
          console.log(`❌ Error: No se pudo insertar ${machine.name}`);
          errorCount++;
        }
        
      } catch (error) {
        console.error(`❌ Error procesando ${machine.name}:`, error.message);
        errorCount++;
      }
    }
    
    // Resumen final
    console.log('\n' + ''.padEnd(70, '='));
    console.log('📊 RESUMEN DE EJECUCIÓN:');
    console.log(`✅ Máquinas agregadas: ${successCount}`);
    console.log(`⚠️  Máquinas omitidas (ya existían): ${skippedCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📋 Total procesadas: ${machines.length}`);
    
    if (successCount > 0) {
      console.log('\n🎉 ¡Máquinas agregadas exitosamente para Facundo Barbosa!');
      console.log(`👤 Usuario: ${user.name} (${user.email})`);
      
      console.log('\n📝 Lista de máquinas agregadas:');
      for (const machine of machines) {
        console.log(`   🚜 ${machine.data.brand} ${machine.data.model} - ID: ${machine.data.machineId}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Conexión cerrada');
  }
}

addAllMachines().catch(console.error);
