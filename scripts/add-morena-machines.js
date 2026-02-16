// Script para agregar máquinas al usuario Morena
// Usuario ID: 689ab7b28021e1578ee3522e
// Organización: BarviciiCorp
// Workplace: Patutahi Orchard

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not set');
}

const userId = '689ab7b28021e1578ee3522e';
const organization = 'BarviciiCorp';
const workplace = 'Patutahi Orchard';

const machines = [
  {
    model: 'Rex 4 120s',
    brand: 'Landini',
    serialNumber: 'LND2023120S' + Math.floor(Math.random() * 1000),
    machineId: 'PO_TR03',
    year: '2023',
    currentHours: '',
    lastService: '',
    nextService: '',
    workplace: workplace,
    engineOil: {
      type: '15W-40',
      capacity: '12.5L',
      brand: 'Shell Rimula R4 X'
    },
    hydraulicOil: {
      type: 'ISO 46',
      capacity: '55L',
      brand: 'Shell Tellus S2 M46'
    },
    transmissionOil: {
      type: '80W-90',
      capacity: '18L',
      brand: 'Shell Spirax S3 G 80W-90'
    },
    filters: {
      engine: '84475542',
      engineBrand: 'CNH',
      transmission: '84257511',
      transmissionBrand: 'CNH',
      fuel: '84477352',
      fuelBrand: 'CNH'
    },
    tires: {
      front: {
        size: '420/85R28',
        brand: 'Michelin',
        model: 'MachXBib'
      },
      rear: {
        size: '520/85R38',
        brand: 'Michelin',
        model: 'MachXBib'
      }
    },
    prestartTemplateId: '',
    userId: userId,
    createdBy: userId,
    organization: organization,
    createdAt: new Date()
  },
  {
    model: '5420',
    brand: 'John Deere',
    serialNumber: 'JD1993420' + Math.floor(Math.random() * 1000),
    machineId: 'PO_TR01',
    year: '1993',
    currentHours: '',
    lastService: '',
    nextService: '',
    workplace: workplace,
    engineOil: {
      type: '15W-40',
      capacity: '18L',
      brand: 'John Deere Plus-50 15W-40'
    },
    hydraulicOil: {
      type: 'Low Viscosity Hy-Gard',
      capacity: '75L',
      brand: 'John Deere Low Viscosity Hy-Gard'
    },
    transmissionOil: {
      type: 'Hy-Gard',
      capacity: '60L',
      brand: 'John Deere Hy-Gard J20C'
    },
    filters: {
      engine: 'RE59754',
      engineBrand: 'John Deere',
      transmission: 'AL156624',
      transmissionBrand: 'John Deere',
      fuel: 'RE62418',
      fuelBrand: 'John Deere'
    },
    tires: {
      front: {
        size: '12.4-24',
        brand: 'Firestone',
        model: 'Super All Traction 23°'
      },
      rear: {
        size: '18.4-34',
        brand: 'Firestone',
        model: 'Super All Traction 23°'
      }
    },
    prestartTemplateId: '',
    userId: userId,
    createdBy: userId,
    organization: organization,
    createdAt: new Date()
  },
  {
    model: '5100 GS Cab',
    brand: 'Deutz-Fahr',
    serialNumber: 'DF2022100' + Math.floor(Math.random() * 1000),
    machineId: 'PO_TR02',
    year: '2022',
    currentHours: '',
    lastService: '',
    nextService: '',
    workplace: workplace,
    engineOil: {
      type: '15W-40',
      capacity: '13L',
      brand: 'Deutz DQC III-10 LA'
    },
    hydraulicOil: {
      type: 'ISO VG 46',
      capacity: '50L',
      brand: 'Deutz PowerFluid Plus'
    },
    transmissionOil: {
      type: 'Transmission Fluid',
      capacity: '25L',
      brand: 'Deutz PowerFluid Plus'
    },
    filters: {
      engine: '02937799',
      engineBrand: 'Deutz',
      transmission: '04152236',
      transmissionBrand: 'Deutz',
      fuel: '02937401',
      fuelBrand: 'Deutz'
    },
    tires: {
      front: {
        size: '380/85R24',
        brand: 'Continental',
        model: 'Tractor 85'
      },
      rear: {
        size: '480/80R34',
        brand: 'Continental',
        model: 'Tractor 85'
      }
    },
    prestartTemplateId: '',
    userId: userId,
    createdBy: userId,
    organization: organization,
    createdAt: new Date()
  },
  {
    model: '5090 GS Cab',
    brand: 'Deutz-Fahr',
    serialNumber: 'DF2019090' + Math.floor(Math.random() * 1000),
    machineId: 'JDC389',
    year: '2019',
    currentHours: '',
    lastService: '',
    nextService: '',
    workplace: workplace,
    engineOil: {
      type: '15W-40',
      capacity: '12L',
      brand: 'Deutz DQC III-10 LA'
    },
    hydraulicOil: {
      type: 'ISO VG 46',
      capacity: '45L',
      brand: 'Deutz PowerFluid Plus'
    },
    transmissionOil: {
      type: 'Transmission Fluid',
      capacity: '22L',
      brand: 'Deutz PowerFluid Plus'
    },
    filters: {
      engine: '02937799',
      engineBrand: 'Deutz',
      transmission: '04152236',
      transmissionBrand: 'Deutz',
      fuel: '02937401',
      fuelBrand: 'Deutz'
    },
    tires: {
      front: {
        size: '360/70R24',
        brand: 'Continental',
        model: 'Tractor 85'
      },
      rear: {
        size: '460/85R34',
        brand: 'Continental',
        model: 'Tractor 85'
      }
    },
    prestartTemplateId: '',
    userId: userId,
    createdBy: userId,
    organization: organization,
    createdAt: new Date()
  },
  {
    model: 'Harvesting System CF105 ',
    brand: 'Tecnofruit (Galaxy Group)',
    serialNumber: 'TF105001' + Math.floor(Math.random() * 1000),
    machineId: 'PO_TF01',
    year: '',
    currentHours: '',
    lastService: '',
    nextService: '',
    workplace: workplace,
    engineOil: {
      type: '15W-40',
      capacity: '8L',
      brand: 'Castrol GTX Magnatec'
    },
    hydraulicOil: {
      type: 'ISO 46',
      capacity: '35L',
      brand: 'Shell Tellus S2 M46'
    },
    transmissionOil: {
      type: '80W-90',
      capacity: '12L',
      brand: 'Castrol EPX 80W-90'
    },
    filters: {
      engine: 'LF3000',
      engineBrand: 'Fleetguard',
      transmission: 'HF6327',
      transmissionBrand: 'Fleetguard',
      fuel: 'FF5320',
      fuelBrand: 'Fleetguard'
    },
    tires: {
      front: {
        size: '385/65R22.5',
        brand: 'Michelin',
        model: 'XZE2+'
      },
      rear: {
        size: '385/65R22.5',
        brand: 'Michelin',
        model: 'XZE2+'
      }
    },
    prestartTemplateId: '',
    userId: userId,
    createdBy: userId,
    organization: organization,
    createdAt: new Date()
  },
  {
    model: 'Harvesting System CF105 ',
    brand: 'Tecnofruit (Galaxy Group)',
    serialNumber: 'TF105002' + Math.floor(Math.random() * 1000),
    machineId: 'POTF_02',
    year: '',
    currentHours: '',
    lastService: '',
    nextService: '',
    workplace: workplace,
    engineOil: {
      type: '15W-40',
      capacity: '8L',
      brand: 'Castrol GTX Magnatec'
    },
    hydraulicOil: {
      type: 'ISO 46',
      capacity: '35L',
      brand: 'Shell Tellus S2 M46'
    },
    transmissionOil: {
      type: '80W-90',
      capacity: '12L',
      brand: 'Castrol EPX 80W-90'
    },
    filters: {
      engine: 'LF3000',
      engineBrand: 'Fleetguard',
      transmission: 'HF6327',
      transmissionBrand: 'Fleetguard',
      fuel: 'FF5320',
      fuelBrand: 'Fleetguard'
    },
    tires: {
      front: {
        size: '385/65R22.5',
        brand: 'Michelin',
        model: 'XZE2+'
      },
      rear: {
        size: '385/65R22.5',
        brand: 'Michelin',
        model: 'XZE2+'
      }
    },
    prestartTemplateId: '',
    userId: userId,
    createdBy: userId,
    organization: organization,
    createdAt: new Date()
  },
  {
    model: 'Harvesting System CF105 ',
    brand: 'Tecnofruit (Galaxy Group)',
    serialNumber: 'TF105003' + Math.floor(Math.random() * 1000),
    machineId: 'JDC388',
    year: '',
    currentHours: '',
    lastService: '',
    nextService: '',
    workplace: workplace,
    engineOil: {
      type: '15W-40',
      capacity: '8L',
      brand: 'Castrol GTX Magnatec'
    },
    hydraulicOil: {
      type: 'ISO 46',
      capacity: '35L',
      brand: 'Shell Tellus S2 M46'
    },
    transmissionOil: {
      type: '80W-90',
      capacity: '12L',
      brand: 'Castrol EPX 80W-90'
    },
    filters: {
      engine: 'LF3000',
      engineBrand: 'Fleetguard',
      transmission: 'HF6327',
      transmissionBrand: 'Fleetguard',
      fuel: 'FF5320',
      fuelBrand: 'Fleetguard'
    },
    tires: {
      front: {
        size: '385/65R22.5',
        brand: 'Michelin',
        model: 'XZE2+'
      },
      rear: {
        size: '385/65R22.5',
        brand: 'Michelin',
        model: 'XZE2+'
      }
    },
    prestartTemplateId: '',
    userId: userId,
    createdBy: userId,
    organization: organization,
    createdAt: new Date()
  },
  {
    model: 'Mule KAF400',
    brand: 'Kawasaki',
    serialNumber: 'KW2019400' + Math.floor(Math.random() * 1000),
    machineId: 'PO_SXS01',
    year: '2019',
    currentHours: '',
    lastService: '',
    nextService: '',
    workplace: workplace,
    engineOil: {
      type: '10W-40',
      capacity: '2.8L',
      brand: 'Kawasaki 4-Stroke Engine Oil'
    },
    hydraulicOil: {
      type: 'N/A',
      capacity: 'N/A',
      brand: 'N/A'
    },
    transmissionOil: {
      type: '80W-90',
      capacity: '1.2L',
      brand: 'Kawasaki Gear Oil'
    },
    filters: {
      engine: '11013-0726',
      engineBrand: 'Kawasaki',
      transmission: 'N/A',
      transmissionBrand: 'N/A',
      fuel: '49019-0027',
      fuelBrand: 'Kawasaki'
    },
    tires: {
      front: {
        size: '25x8-12',
        brand: 'Carlisle',
        model: 'AT489'
      },
      rear: {
        size: '25x10-12',
        brand: 'Carlisle',
        model: 'AT489'
      }
    },
    prestartTemplateId: '',
    userId: userId,
    createdBy: userId,
    organization: organization,
    createdAt: new Date()
  },
  {
    model: '3000L Spray',
    brand: 'Munkhof',
    serialNumber: 'MK2023300' + Math.floor(Math.random() * 1000),
    machineId: 'PO_SP03',
    year: '2023',
    currentHours: '',
    lastService: '',
    nextService: '',
    workplace: workplace,
    engineOil: {
      type: '15W-40',
      capacity: '10L',
      brand: 'Shell Rimula R4 X'
    },
    hydraulicOil: {
      type: 'ISO 46',
      capacity: '40L',
      brand: 'Shell Tellus S2 M46'
    },
    transmissionOil: {
      type: '80W-90',
      capacity: '8L',
      brand: 'Shell Spirax S3 G 80W-90'
    },
    filters: {
      engine: 'LF3000',
      engineBrand: 'Fleetguard',
      transmission: 'HF6327',
      transmissionBrand: 'Fleetguard',
      fuel: 'FF5320',
      fuelBrand: 'Fleetguard'
    },
    tires: {
      front: {
        size: '380/90R46',
        brand: 'Trelleborg',
        model: 'TM600'
      },
      rear: {
        size: '380/90R46',
        brand: 'Trelleborg',
        model: 'TM600'
      }
    },
    prestartTemplateId: '',
    userId: userId,
    createdBy: userId,
    organization: organization,
    createdAt: new Date()
  },
  {
    model: 'Spray 3000L Track',
    brand: 'FMR',
    serialNumber: 'FMR3000T' + Math.floor(Math.random() * 1000),
    machineId: 'PO_SP02',
    year: '',
    currentHours: '',
    lastService: '',
    nextService: '',
    workplace: workplace,
    engineOil: {
      type: '15W-40',
      capacity: '12L',
      brand: 'Shell Rimula R4 X'
    },
    hydraulicOil: {
      type: 'ISO 46',
      capacity: '45L',
      brand: 'Shell Tellus S2 M46'
    },
    transmissionOil: {
      type: '80W-90',
      capacity: '10L',
      brand: 'Shell Spirax S3 G 80W-90'
    },
    filters: {
      engine: 'LF3000',
      engineBrand: 'Fleetguard',
      transmission: 'HF6327',
      transmissionBrand: 'Fleetguard',
      fuel: 'FF5320',
      fuelBrand: 'Fleetguard'
    },
    tires: {
      front: {
        size: 'Track System',
        brand: 'Camso',
        model: 'HXD Track'
      },
      rear: {
        size: 'Track System',
        brand: 'Camso',
        model: 'HXD Track'
      }
    },
    prestartTemplateId: '',
    userId: userId,
    createdBy: userId,
    organization: organization,
    createdAt: new Date()
  },
  {
    model: 'Spray 3000L Wheels',
    brand: 'FMR',
    serialNumber: 'FMR3000W' + Math.floor(Math.random() * 1000),
    machineId: 'JDC000',
    year: '',
    currentHours: '',
    lastService: '',
    nextService: '',
    workplace: workplace,
    engineOil: {
      type: '15W-40',
      capacity: '12L',
      brand: 'Shell Rimula R4 X'
    },
    hydraulicOil: {
      type: 'ISO 46',
      capacity: '45L',
      brand: 'Shell Tellus S2 M46'
    },
    transmissionOil: {
      type: '80W-90',
      capacity: '10L',
      brand: 'Shell Spirax S3 G 80W-90'
    },
    filters: {
      engine: 'LF3000',
      engineBrand: 'Fleetguard',
      transmission: 'HF6327',
      transmissionBrand: 'Fleetguard',
      fuel: 'FF5320',
      fuelBrand: 'Fleetguard'
    },
    tires: {
      front: {
        size: '380/90R46',
        brand: 'Trelleborg',
        model: 'TM1000'
      },
      rear: {
        size: '380/90R46',
        brand: 'Trelleborg',
        model: 'TM1000'
      }
    },
    prestartTemplateId: '',
    userId: userId,
    createdBy: userId,
    organization: organization,
    createdAt: new Date()
  },
  {
    model: '5425N',
    brand: 'John Deere',
    serialNumber: 'JD2017425' + Math.floor(Math.random() * 1000),
    machineId: 'JDC135',
    year: '2017',
    currentHours: '',
    lastService: '',
    nextService: '',
    workplace: workplace,
    engineOil: {
      type: '15W-40',
      capacity: '18L',
      brand: 'John Deere Plus-50 15W-40'
    },
    hydraulicOil: {
      type: 'Low Viscosity Hy-Gard',
      capacity: '80L',
      brand: 'John Deere Low Viscosity Hy-Gard'
    },
    transmissionOil: {
      type: 'Hy-Gard',
      capacity: '65L',
      brand: 'John Deere Hy-Gard J20C'
    },
    filters: {
      engine: 'RE59754',
      engineBrand: 'John Deere',
      transmission: 'AL156624',
      transmissionBrand: 'John Deere',
      fuel: 'RE62418',
      fuelBrand: 'John Deere'
    },
    tires: {
      front: {
        size: '380/85R24',
        brand: 'Firestone',
        model: 'VF380/85R24'
      },
      rear: {
        size: '480/80R42',
        brand: 'Firestone',
        model: 'VF480/80R42'
      }
    },
    prestartTemplateId: '',
    userId: userId,
    createdBy: userId,
    organization: organization,
    createdAt: new Date()
  },
  {
    model: 'Compact 300',
    brand: 'Hydralada',
    serialNumber: 'HYD300' + Math.floor(Math.random() * 1000),
    machineId: 'PO_HY01',
    year: '',
    currentHours: '',
    lastService: '',
    nextService: '',
    workplace: workplace,
    engineOil: {
      type: '15W-40',
      capacity: '6L',
      brand: 'Shell Rimula R4 X'
    },
    hydraulicOil: {
      type: 'ISO 46',
      capacity: '25L',
      brand: 'Shell Tellus S2 M46'
    },
    transmissionOil: {
      type: '80W-90',
      capacity: '4L',
      brand: 'Shell Spirax S3 G 80W-90'
    },
    filters: {
      engine: 'LF3000',
      engineBrand: 'Fleetguard',
      transmission: 'HF6327',
      transmissionBrand: 'Fleetguard',
      fuel: 'FF5320',
      fuelBrand: 'Fleetguard'
    },
    tires: {
      front: {
        size: '12.5/80-18',
        brand: 'Bridgestone',
        model: 'Industrial Tyre'
      },
      rear: {
        size: '12.5/80-18',
        brand: 'Bridgestone',
        model: 'Industrial Tyre'
      }
    },
    prestartTemplateId: '',
    userId: userId,
    createdBy: userId,
    organization: organization,
    createdAt: new Date()
  }
];

async function addMachines() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔗 Conectando a MongoDB...');
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db('orchardservice');
    
    // Verificar que el usuario existe
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      console.error('❌ Usuario no encontrado');
      return;
    }
    
    console.log(`👤 Usuario encontrado: ${user.name} (${user.email})`);
    console.log(`🏢 Organización: ${user.company || user.organization}`);
    console.log(`🏭 Workplace: ${user.workplace}`);
    
    // Insertar las máquinas
    console.log(`\n📦 Insertando ${machines.length} máquinas...`);
    
    for (let i = 0; i < machines.length; i++) {
      const machine = machines[i];
      try {
        const result = await db.collection('machines').insertOne(machine);
        console.log(`✅ ${i + 1}/${machines.length} - ${machine.brand} ${machine.model} (${machine.machineId}) - ID: ${result.insertedId}`);
      } catch (error) {
        console.error(`❌ ${i + 1}/${machines.length} - Error insertando ${machine.brand} ${machine.model}:`, error.message);
      }
    }
    
    // Verificar el total de máquinas del usuario
    const totalMachines = await db.collection('machines').countDocuments({ userId: userId });
    console.log(`\n📊 Total de máquinas para el usuario ${user.name}: ${totalMachines}`);
    
    console.log('\n🎉 Script completado exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante la ejecución:', error);
  } finally {
    await client.close();
    console.log('🔌 Conexión cerrada');
  }
}

// Ejecutar el script
addMachines().catch(console.error);
