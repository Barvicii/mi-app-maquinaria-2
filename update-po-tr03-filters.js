require('dotenv').config();
const { MongoClient } = require('mongodb');

const ATLAS_URI = process.env.MONGODB_URI;
if (!ATLAS_URI) {
  throw new Error('MONGODB_URI environment variable is not set');
}

async function updatePOTR03Filters() {
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
    console.log('Carbon brand:', machine.carbonBrand);
    console.log('Current chemical filters:', JSON.stringify(machine.chemicalFilters, null, 2));
    
    // Configurar filtros químicos usando las horas actuales de la máquina
    const currentHours = machine.currentHours || 3000;
    
    // Si ya hay currentFilters, no sobrescribir
    let currentFilters = [];
    if (machine.chemicalFilters?.currentFilters?.length > 0) {
      currentFilters = machine.chemicalFilters.currentFilters;
      console.log('✅ La máquina ya tiene filtros activos configurados');
    } else {
      // Crear filtro de carbono basado en los datos existentes
      if (machine.carbon) {
        currentFilters.push({
          type: 'carbon',
          partNumber: machine.carbon,
          brand: machine.carbonBrand || 'Unknown',
          installationDate: new Date(),
          installationHours: currentHours, // Usar las horas actuales como punto de instalación
          expectedLifeHours: 100,
          isActive: true
        });
        console.log('✅ Creando nuevo filtro de carbono');
      }
      
      // Si hay filtro de aire también, agregarlo
      if (machine.air) {
        currentFilters.push({
          type: 'air',
          partNumber: machine.air,
          brand: machine.airBrand || 'Unknown',
          installationDate: new Date(),
          installationHours: currentHours,
          expectedLifeHours: 100,
          isActive: true
        });
        console.log('✅ Creando nuevo filtro de aire');
      }
    }
    
    const updateData = {
      chemicalFilters: {
        hasFilters: true,
        expectedLifeHours: 100,
        currentFilters: currentFilters
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
    console.log('Chemical filters after update:', JSON.stringify(updatedMachine.chemicalFilters, null, 2));
    
    // Calcular y mostrar estado de alertas para cada filtro
    console.log('\n📊 Estado de filtros:');
    if (updatedMachine.chemicalFilters?.currentFilters) {
      updatedMachine.chemicalFilters.currentFilters.forEach((filter, index) => {
        const usedHours = currentHours - filter.installationHours;
        const remainingHours = filter.expectedLifeHours - usedHours;
        
        console.log(`\nFiltro ${index + 1} (${filter.type}):`);
        console.log(`- Parte: ${filter.partNumber}`);
        console.log(`- Marca: ${filter.brand}`);
        console.log(`- Instalado en: ${filter.installationHours} horas`);
        console.log(`- Horas actuales: ${currentHours}`);
        console.log(`- Horas usadas: ${usedHours}`);
        console.log(`- Horas restantes: ${remainingHours}`);
        console.log(`- Estado: ${remainingHours <= 0 ? '🚨 VENCIDO' : remainingHours <= 40 ? '⚠️ PRÓXIMO A VENCER' : '✅ OK'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('Conexión cerrada');
    }
  }
}

updatePOTR03Filters();
