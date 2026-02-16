// Script to create specific tractor templates for BarviciiCorp user
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '../apps/frontend/.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = 'orchardservice';

async function createTractorTemplates() {
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
    
    // Find BarviciiCorp user
    const user = await db.collection('users').findOne({ 
      email: "barviciigame@gmail.com" 
    });
    
    if (!user) {
      console.error('❌ User not found');
      return;
    }
    
    console.log('👤 User found:', user.name);
    console.log('🏢 Organization:', user.organization);
    
    // Tractor templates with different configurations
    const tractorTemplates = [
      {
        name: "Standard Tractor Inspection",
        description: "Basic inspection template for standard tractors",
        isDefault: false,
        isGlobal: true,
        checkItems: [
          { id: "1", name: "engineOil", label: "Engine Oil Level", required: true },
          { id: "2", name: "coolant", label: "Coolant Level", required: true },
          { id: "3", name: "tires", label: "Tire Condition", required: true },
          { id: "4", name: "fuelLevel", label: "Fuel Level", required: true },
          { id: "5", name: "lights", label: "Lights and Signals", required: true },
          { id: "6", name: "brakes", label: "Brake System", required: true },
          { id: "7", name: "seatBelt", label: "Safety Belt", required: false },
          { id: "8", name: "hydraulics", label: "Hydraulic System", required: true },
          { id: "9", name: "pto", label: "PTO Operation", required: false },
          { id: "10", name: "steering", label: "Steering System", required: true }
        ],
        createdAt: new Date(),
        organizationId: user.organizationId
      },
      {
        name: "Heavy Duty Tractor Inspection",
        description: "Comprehensive inspection for heavy duty tractors",
        isDefault: false,
        isGlobal: true,
        checkItems: [
          { id: "1", name: "engineOil", label: "Engine Oil Level", required: true },
          { id: "2", name: "coolant", label: "Coolant Level", required: true },
          { id: "3", name: "tires", label: "Tire Condition", required: true },
          { id: "4", name: "fuelLevel", label: "Fuel Level", required: true },
          { id: "5", name: "lights", label: "Lights and Signals", required: true },
          { id: "6", name: "brakes", label: "Brake System", required: true },
          { id: "7", name: "seatBelt", label: "Safety Belt", required: true },
          { id: "8", name: "hydraulics", label: "Hydraulic System", required: true },
          { id: "9", name: "pto", label: "PTO Operation", required: true },
          { id: "10", name: "steering", label: "Steering System", required: true },
          { id: "11", name: "airFilter", label: "Air Filter Condition", required: true },
          { id: "12", name: "transmission", label: "Transmission Oil", required: true },
          { id: "13", name: "exhaust", label: "Exhaust System", required: true },
          { id: "14", name: "fireExtinguisher", label: "Fire Extinguisher", required: false },
          { id: "15", name: "firstAid", label: "First Aid Kit", required: false }
        ],
        createdAt: new Date(),
        organizationId: user.organizationId
      },
      {
        name: "Compact Tractor Inspection",
        description: "Inspection template for compact/utility tractors",
        isDefault: false,
        isGlobal: true,
        checkItems: [
          { id: "1", name: "engineOil", label: "Engine Oil Level", required: true },
          { id: "2", name: "coolant", label: "Coolant Level", required: true },
          { id: "3", name: "tires", label: "Tire Condition", required: true },
          { id: "4", name: "fuelLevel", label: "Fuel Level", required: true },
          { id: "5", name: "lights", label: "Lights and Signals", required: false },
          { id: "6", name: "brakes", label: "Brake System", required: true },
          { id: "7", name: "seatBelt", label: "Safety Belt", required: false },
          { id: "8", name: "hydraulics", label: "Hydraulic System", required: true },
          { id: "9", name: "loader", label: "Front Loader Operation", required: false },
          { id: "10", name: "mower", label: "Mower Deck (if equipped)", required: false }
        ],
        createdAt: new Date(),
        organizationId: user.organizationId
      },
      {
        name: "Specialized Tractor Inspection",
        description: "Template for specialized tractors with specific equipment",
        isDefault: false,
        isGlobal: true,
        checkItems: [
          { id: "1", name: "engineOil", label: "Engine Oil Level", required: true },
          { id: "2", name: "coolant", label: "Coolant Level", required: true },
          { id: "3", name: "tires", label: "Tire Condition", required: true },
          { id: "4", name: "fuelLevel", label: "Fuel Level", required: true },
          { id: "5", name: "lights", label: "Lights and Signals", required: true },
          { id: "6", name: "brakes", label: "Brake System", required: true },
          { id: "7", name: "seatBelt", label: "Safety Belt", required: true },
          { id: "8", name: "hydraulics", label: "Hydraulic System", required: true },
          { id: "9", name: "pto", label: "PTO Operation", required: true },
          { id: "10", name: "steering", label: "Steering System", required: true },
          { id: "11", name: "gps", label: "GPS System", required: false },
          { id: "12", name: "sprayer", label: "Sprayer System (if equipped)", required: false },
          { id: "13", name: "planter", label: "Planter System (if equipped)", required: false },
          { id: "14", name: "harvester", label: "Harvester Attachment (if equipped)", required: false },
          { id: "15", name: "computerSystem", label: "Computer/Display System", required: false }
        ],
        createdAt: new Date(),
        organizationId: user.organizationId
      }
    ];

    // Insert templates
    for (const template of tractorTemplates) {
      // Check if template already exists
      const existing = await db.collection('prestartTemplates').findOne({ 
        name: template.name 
      });
      
      if (!existing) {
        const result = await db.collection('prestartTemplates').insertOne(template);
        console.log(`✅ Template created: ${template.name} (ID: ${result.insertedId})`);
      } else {
        console.log(`⚠️ Template already exists: ${template.name}`);
        // Update to make sure it's global
        await db.collection('prestartTemplates').updateOne(
          { _id: existing._id },
          { $set: { isGlobal: true } }
        );
        console.log(`🔄 Updated template to global: ${template.name}`);
      }
    }
    
    // Show final count
    const totalTemplates = await db.collection('prestartTemplates').countDocuments({});
    const globalTemplates = await db.collection('prestartTemplates').countDocuments({ isGlobal: true });
    
    console.log(`📊 Total templates: ${totalTemplates}`);
    console.log(`🌍 Global templates: ${globalTemplates}`);
    
    // List all templates for this organization
    const orgTemplates = await db.collection('prestartTemplates').find({
      $or: [
        { isGlobal: true },
        { organizationId: user.organizationId }
      ]
    }).toArray();
    
    console.log(`\n📋 Available templates for ${user.organization}:`);
    orgTemplates.forEach(template => {
      console.log(`  - ${template.name} (Items: ${template.checkItems?.length || 0}, Global: ${template.isGlobal || false})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.close();
    console.log('🔒 Connection closed');
  }
}

createTractorTemplates().catch(console.error);
