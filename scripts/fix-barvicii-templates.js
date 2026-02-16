// Script to verify and assign templates to BarviciiCorp user
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '../apps/frontend/.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = 'orchardservice';

async function fixBarviciiTemplates() {
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
    
    // 1. Find BarviciiCorp user
    const user = await db.collection('users').findOne({ 
      email: "barviciigame@gmail.com" 
    });
    
    if (!user) {
      console.error('❌ User not found');
      return;
    }
    
    console.log('👤 User found:', user.name);
    console.log('🏢 Organization:', user.organization);
    console.log('🆔 OrganizationId:', user.organizationId);
    
    // 2. Find existing templates
    const allTemplates = await db.collection('prestartTemplates').find({}).toArray();
    console.log(`📋 Total templates in DB: ${allTemplates.length}`);
    
    // 3. Show existing templates
    for (const template of allTemplates) {
      console.log(`  - ${template.name} (ID: ${template._id}) - Global: ${template.isGlobal || false} - CredentialId: ${template.credentialId || 'null'}`);
    }
    
    // 4. Make all templates global
    const globalResult = await db.collection('prestartTemplates')
      .updateMany(
        {},
        { $set: { isGlobal: true } }
      );
    
    console.log(`✅ ${globalResult.modifiedCount} templates marked as global`);
    
    // 5. Create basic templates if they don't exist
    const basicTemplates = [
      {
        name: "Tractor - Basic Inspection",
        description: "Basic template for tractor inspection",
        isGlobal: true,
        machineType: "tractor",
        sections: [
          {
            title: "External Inspection",
            items: [
              { text: "Check tire condition", type: "checkbox", required: true },
              { text: "Check lights and signaling", type: "checkbox", required: true },
              { text: "Inspect body and structure", type: "checkbox", required: true }
            ]
          },
          {
            title: "Mechanical Inspection",
            items: [
              { text: "Check engine oil level", type: "checkbox", required: true },
              { text: "Check coolant level", type: "checkbox", required: true },
              { text: "Check hydraulic pressure", type: "checkbox", required: true }
            ]
          },
          {
            title: "Safety",
            items: [
              { text: "Check brake operation", type: "checkbox", required: true },
              { text: "Test reverse alarm", type: "checkbox", required: true },
              { text: "Check safety belt", type: "checkbox", required: true }
            ]
          }
        ]
      },
      {
        name: "Agricultural Equipment - General Inspection",
        description: "General template for agricultural equipment",
        isGlobal: true,
        machineType: "agricultural",
        sections: [
          {
            title: "Visual Inspection",
            items: [
              { text: "Check general equipment condition", type: "checkbox", required: true },
              { text: "Check connections and hoses", type: "checkbox", required: true },
              { text: "Inspect work tools", type: "checkbox", required: true }
            ]
          },
          {
            title: "Operating Systems",
            items: [
              { text: "Check hydraulic systems", type: "checkbox", required: true },
              { text: "Test operation controls", type: "checkbox", required: true },
              { text: "Check safety systems", type: "checkbox", required: true }
            ]
          }
        ]
      }
    ];
    
    // 6. Insert basic templates if they don't exist
    for (const template of basicTemplates) {
      const existing = await db.collection('prestartTemplates').findOne({ 
        name: template.name 
      });
      
      if (!existing) {
        await db.collection('prestartTemplates').insertOne({
          ...template,
          credentialId: user.organizationId, // Assign to user's organization
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`✅ Template created: ${template.name}`);
      } else {
        // Update to make it global
        await db.collection('prestartTemplates').updateOne(
          { _id: existing._id },
          { $set: { isGlobal: true } }
        );
        console.log(`🔄 Template updated: ${template.name}`);
      }
    }
    
    // 7. Verify final templates
    const finalTemplates = await db.collection('prestartTemplates').find({}).toArray();
    console.log(`📋 Final templates: ${finalTemplates.length}`);
    
    const globalTemplates = await db.collection('prestartTemplates').find({ isGlobal: true }).toArray();
    console.log(`🌍 Global templates: ${globalTemplates.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.close();
    console.log('🔒 Connection closed');
  }
}

fixBarviciiTemplates().catch(console.error);
