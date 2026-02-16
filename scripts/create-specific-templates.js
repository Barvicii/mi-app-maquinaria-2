// Script to create specific prestart templates for different machine types
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '../apps/frontend/.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = 'orchardservice';

const userId = '689ab5f78021e1578ee351c9';
const organizationId = '689ab5f88021e1578ee351cb';

// Templates for different machine types
const templates = [
  {
    name: "Tractor - Standard Inspection",
    description: "Standard prestart inspection for tractors (John Deere, Deutz-Fahr, Landini)",
    isDefault: false,
    isGlobal: true,
    machineType: "tractor",
    applicableModels: ["5420", "5425N", "5090 GS Cab", "5100 GS Cab", "Rex 4 120s"],
    checkItems: [
      { id: "1", name: "engineOil", label: "Engine Oil Level", required: true },
      { id: "2", name: "coolant", label: "Coolant Level", required: true },
      { id: "3", name: "hydraulicOil", label: "Hydraulic Oil Level", required: true },
      { id: "4", name: "transmissionOil", label: "Transmission Oil Level", required: true },
      { id: "5", name: "fuel", label: "Fuel Level", required: true },
      { id: "6", name: "tires", label: "Tire Condition and Pressure", required: true },
      { id: "7", name: "lights", label: "Lights and Warning Systems", required: true },
      { id: "8", name: "brakes", label: "Brake System Operation", required: true },
      { id: "9", name: "hydraulics", label: "Hydraulic System Operation", required: true },
      { id: "10", name: "pto", label: "PTO Operation", required: false },
      { id: "11", name: "cabin", label: "Cabin and Controls", required: true },
      { id: "12", name: "safety", label: "Safety Equipment (Extinguisher, First Aid)", required: false },
      { id: "13", name: "seatbelt", label: "Seat Belt and ROPS", required: true },
      { id: "14", name: "mirrors", label: "Mirrors and Visibility", required: true },
      { id: "15", name: "airFilter", label: "Air Filter Condition", required: false }
    ]
  },
  {
    name: "Sprayer - Chemical Application Equipment",
    description: "Prestart inspection for spray equipment (Munkhof, FMR)",
    isDefault: false,
    isGlobal: true,
    machineType: "sprayer",
    applicableModels: ["3000L Spray", "Spray 3000L Track", "Spray 3000L Wheels"],
    checkItems: [
      { id: "1", name: "engineOil", label: "Engine Oil Level", required: true },
      { id: "2", name: "coolant", label: "Coolant Level", required: true },
      { id: "3", name: "hydraulicOil", label: "Hydraulic Oil Level", required: true },
      { id: "4", name: "fuel", label: "Fuel Level", required: true },
      { id: "5", name: "tires", label: "Tire/Track Condition", required: true },
      { id: "6", name: "sprayTank", label: "Spray Tank Condition and Cleanliness", required: true },
      { id: "7", name: "nozzles", label: "Spray Nozzles and Tips", required: true },
      { id: "8", name: "hoses", label: "Hoses and Connections", required: true },
      { id: "9", name: "pump", label: "Pump Operation and Pressure", required: true },
      { id: "10", name: "agitation", label: "Tank Agitation System", required: true },
      { id: "11", name: "booms", label: "Boom Operation and Alignment", required: true },
      { id: "12", name: "calibration", label: "Calibration and Flow Rate", required: true },
      { id: "13", name: "safetyEquip", label: "PPE and Emergency Equipment", required: true },
      { id: "14", name: "cleanWater", label: "Clean Water Tank Level", required: true },
      { id: "15", name: "chemicalHandling", label: "Chemical Handling Equipment", required: true }
    ]
  },
  {
    name: "Harvesting Equipment - Fruit Collection",
    description: "Prestart inspection for harvesting systems (Tecnofruit CF105)",
    isDefault: false,
    isGlobal: true,
    machineType: "harvester",
    applicableModels: ["Harvesting System CF105"],
    checkItems: [
      { id: "1", name: "engineOil", label: "Engine Oil Level", required: true },
      { id: "2", name: "coolant", label: "Coolant Level", required: true },
      { id: "3", name: "hydraulicOil", label: "Hydraulic Oil Level", required: true },
      { id: "4", name: "fuel", label: "Fuel Level", required: true },
      { id: "5", name: "tires", label: "Tire Condition", required: true },
      { id: "6", name: "conveyors", label: "Conveyor Belts and Rollers", required: true },
      { id: "7", name: "pickingHeads", label: "Picking Heads and Mechanisms", required: true },
      { id: "8", name: "sortingSystems", label: "Sorting and Grading Systems", required: true },
      { id: "9", name: "bins", label: "Collection Bins and Containers", required: true },
      { id: "10", name: "hydraulics", label: "Hydraulic System Operation", required: true },
      { id: "11", name: "safety", label: "Safety Guards and Emergency Stops", required: true },
      { id: "12", name: "cleaning", label: "Equipment Cleanliness", required: true },
      { id: "13", name: "lubrication", label: "Lubrication Points", required: false },
      { id: "14", name: "electrical", label: "Electrical Systems and Sensors", required: true }
    ]
  },
  {
    name: "Utility Vehicle - Side by Side",
    description: "Prestart inspection for utility vehicles (Kawasaki Mule)",
    isDefault: false,
    isGlobal: true,
    machineType: "utility",
    applicableModels: ["Mule KAF400"],
    checkItems: [
      { id: "1", name: "engineOil", label: "Engine Oil Level", required: true },
      { id: "2", name: "coolant", label: "Coolant Level", required: true },
      { id: "3", name: "fuel", label: "Fuel Level", required: true },
      { id: "4", name: "tires", label: "Tire Condition and Pressure", required: true },
      { id: "5", name: "brakes", label: "Brake System", required: true },
      { id: "6", name: "steering", label: "Steering Operation", required: true },
      { id: "7", name: "lights", label: "Lights and Indicators", required: true },
      { id: "8", name: "seatbelts", label: "Seat Belts", required: true },
      { id: "9", name: "cargo", label: "Cargo Bed Condition", required: false },
      { id: "10", name: "battery", label: "Battery and Electrical", required: true },
      { id: "11", name: "airFilter", label: "Air Filter", required: false },
      { id: "12", name: "safety", label: "Safety Equipment", required: false }
    ]
  },
  {
    name: "Hydraulic Equipment - Lifting Systems",
    description: "Prestart inspection for hydraulic lifting equipment (Hydralada)",
    isDefault: false,
    isGlobal: true,
    machineType: "hydraulic",
    applicableModels: ["Compact 300"],
    checkItems: [
      { id: "1", name: "engineOil", label: "Engine Oil Level", required: true },
      { id: "2", name: "hydraulicOil", label: "Hydraulic Oil Level", required: true },
      { id: "3", name: "fuel", label: "Fuel Level", required: true },
      { id: "4", name: "tires", label: "Tire Condition", required: true },
      { id: "5", name: "hydraulicCylinders", label: "Hydraulic Cylinders", required: true },
      { id: "6", name: "hoses", label: "Hydraulic Hoses and Fittings", required: true },
      { id: "7", name: "platform", label: "Work Platform Condition", required: true },
      { id: "8", name: "controls", label: "Control Systems", required: true },
      { id: "9", name: "safetyDevices", label: "Safety Devices and Lockouts", required: true },
      { id: "10", name: "stabilizers", label: "Outriggers/Stabilizers", required: true },
      { id: "11", name: "emergency", label: "Emergency Lowering System", required: true },
      { id: "12", name: "inspection", label: "Load Chart and Certification", required: true }
    ]
  }
];

async function createSpecificTemplates() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found');
    return;
  }

  console.log('🔗 Connecting to MongoDB...');
  
  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000
  });

  try {
    await client.connect();
    console.log('✅ Successfully connected');

    const db = client.db(DATABASE_NAME);
    
    // Find the user
    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(userId)
    });
    
    if (!user) {
      console.error('❌ User not found');
      return;
    }
    
    console.log('👤 User found:', user.name);
    console.log('🏢 Organization:', user.organization);
    
    // Create each template
    console.log('\n📋 Creating specific templates...');
    
    for (const template of templates) {
      try {
        // Check if template already exists
        const existing = await db.collection('prestartTemplates').findOne({ 
          name: template.name 
        });
        
        if (existing) {
          console.log(`🔄 Template "${template.name}" already exists, updating...`);
          await db.collection('prestartTemplates').updateOne(
            { _id: existing._id },
            { 
              $set: { 
                ...template,
                updatedAt: new Date()
              } 
            }
          );
        } else {
          console.log(`✅ Creating template: "${template.name}"`);
          await db.collection('prestartTemplates').insertOne({
            ...template,
            credentialId: user.organizationId,
            userId: userId,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        
        console.log(`   📝 Template for: ${template.applicableModels.join(', ')}`);
        console.log(`   ✔️  ${template.checkItems.length} check items`);
        
      } catch (error) {
        console.error(`❌ Error creating template "${template.name}":`, error.message);
      }
    }
    
    // Show final summary
    const allTemplates = await db.collection('prestartTemplates').find({}).toArray();
    console.log(`\n📊 Total templates in database: ${allTemplates.length}`);
    
    const userTemplates = await db.collection('prestartTemplates').find({
      $or: [
        { isGlobal: true },
        { credentialId: user.organizationId }
      ]
    }).toArray();
    console.log(`🌍 Templates available to user: ${userTemplates.length}`);
    
    console.log('\n🎉 Template creation completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.close();
    console.log('🔒 Connection closed');
  }
}

createSpecificTemplates().catch(console.error);
