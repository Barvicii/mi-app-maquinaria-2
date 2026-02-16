require('dotenv').config();
const { MongoClient } = require('mongodb');

const ATLAS_URI = process.env.MONGODB_URI;
if (!ATLAS_URI) {
  throw new Error('MONGODB_URI environment variable is not set');
}

async function fixChemicalFilters() {
  let client;
  
  try {
    console.log('Conectando a MongoDB Atlas...');
    client = new MongoClient(ATLAS_URI);
    await client.connect();
    
    const db = client.db('orchardservice');
    
    // Buscar la máquina PO_TR03
    console.log('Buscando máquina PO_TR03...');
    const machine = await db.collection('machines').findOne({
      $or: [
        { machineId: 'PO_TR03' },
        { customId: 'PO_TR03' },
        { model: 'PO_TR03' }
      ]
    });
    
    if (!machine) {
      console.log('❌ No se encontró la máquina PO_TR03');
      return;
    }
    
    console.log('✅ Máquina encontrada:', machine._id);
    console.log('Current hours:', machine.currentHours);
    console.log('Carbon filter:', machine.carbon);
    console.log('Chemical filters before:', JSON.stringify(machine.chemicalFilters, null, 2));
    
    // Configurar filtros químicos completos
    const currentHours = machine.currentHours || 3000;
    const installationHours = currentHours; // Asumimos que se instaló ahora
    
    const updateData = {
      chemicalFilters: {
        hasFilters: true,
        expectedLifeHours: 100,
        currentFilters: [
          {
            type: 'carbon',
            partNumber: machine.carbon || 'Carbono',
            brand: machine.carbonBrand || 'Carbon',
            installationDate: new Date(),
            installationHours: installationHours,
            expectedLifeHours: 100,
            isActive: true
          }
        ]
      }
    };
    
    console.log('Actualizando con datos:', JSON.stringify(updateData, null, 2));
    
    const result = await db.collection('machines').updateOne(
      { _id: machine._id },
      { $set: updateData }
    );
    
    console.log('✅ Update result:', result.modifiedCount, 'documents updated');
    
    // Verificar actualización
    const updatedMachine = await db.collection('machines').findOne({ _id: machine._id });
    console.log('Chemical filters after:', JSON.stringify(updatedMachine.chemicalFilters, null, 2));
    
    // Calcular alertas
    const filterData = updatedMachine.chemicalFilters.currentFilters[0];
    const usedHours = currentHours - filterData.installationHours;
    const remainingHours = filterData.expectedLifeHours - usedHours;
    
    console.log('\n📊 Estado del filtro:');
    console.log('- Horas de instalación:', filterData.installationHours);
    console.log('- Horas actuales:', currentHours);
    console.log('- Horas usadas:', usedHours);
    console.log('- Horas restantes:', remainingHours);
    console.log('- Alerta en 40 horas:', remainingHours <= 40 ? '🚨 SÍ' : '✅ NO');
    console.log('- Vencido:', remainingHours <= 0 ? '🚨 SÍ' : '✅ NO');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('Conexión cerrada');
    }
  }
}

fixChemicalFilters();
