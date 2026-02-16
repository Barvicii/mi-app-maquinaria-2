require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI environment variable is not set');
}

async function updateMachineFilters() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    
    const db = client.db('judcoapp');
    const collection = db.collection('machines');
    
    // Buscar la máquina PO_TR03
    const machine = await collection.findOne({ machineId: 'PO_TR03' });
    
    if (!machine) {
      console.log('Machine PO_TR03 not found');
      return;
    }
    
    console.log('Current machine data:');
    console.log('Machine ID:', machine.machineId);
    console.log('Current Hours:', machine.currentHours);
    console.log('Carbon Filter:', machine.carbon);
    console.log('Carbon Brand:', machine.carbonBrand);
    console.log('Current chemicalFilters:', machine.chemicalFilters);
    
    // Crear la estructura de filtros químicos con filtro activo
    const updatedChemicalFilters = {
      hasFilters: true,
      filterType: 'carbon',
      expectedLifeHours: 100,
      currentFilters: [{
        id: `filter_${Date.now()}`,
        type: 'carbon',
        partNumber: machine.carbon || 'Carbono',
        brand: machine.carbonBrand || 'Carbon',
        installationDate: new Date().toISOString(),
        installationHours: parseInt(machine.currentHours) || 0,
        expectedLifeHours: 100,
        isActive: true,
        notes: 'Filter configured automatically - test'
      }]
    };
    
    // Actualizar la máquina
    const result = await collection.updateOne(
      { machineId: 'PO_TR03' },
      { 
        $set: { 
          chemicalFilters: updatedChemicalFilters
        }
      }
    );
    
    console.log('\nUpdate result:', result);
    
    if (result.modifiedCount > 0) {
      console.log('\n✅ Machine PO_TR03 updated successfully!');
      console.log('New chemicalFilters structure:');
      console.log(JSON.stringify(updatedChemicalFilters, null, 2));
      
      // Calcular horas restantes para verificar
      const currentHours = parseInt(machine.currentHours) || 0;
      const installationHours = updatedChemicalFilters.currentFilters[0].installationHours;
      const expectedLife = updatedChemicalFilters.currentFilters[0].expectedLifeHours;
      const hoursUsed = currentHours - installationHours;
      const remainingHours = expectedLife - hoursUsed;
      
      console.log('\n📊 Filter Status:');
      console.log(`Installation Hours: ${installationHours}`);
      console.log(`Current Hours: ${currentHours}`);
      console.log(`Hours Used: ${hoursUsed}`);
      console.log(`Expected Life: ${expectedLife}`);
      console.log(`Remaining Hours: ${remainingHours}`);
      
      if (remainingHours <= 40) {
        console.log('🚨 ALERT: Filter needs attention soon!');
      }
    } else {
      console.log('❌ No changes made');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

updateMachineFilters();
