const { MongoClient, ObjectId } = require('mongodb');

// Configuration
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://barviciigame:Apple123@cluster0.wkwfk.mongodb.net/orchardservice?retryWrites=true&w=majority&appName=Cluster0';

async function listUsers() {
  let client;
  
  try {
    console.log('🔄 Connecting to MongoDB...');
    client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('orchardservice');
    
    // Get all users
    console.log('📋 Listing all users:');
    const users = await db.collection('users').find({}).sort({ createdAt: -1 }).toArray();
    
    console.log(`\nFound ${users.length} users:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user._id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   Role: ${user.role || 'N/A'}`);
      console.log(`   Created: ${user.createdAt || 'N/A'}`);
      console.log('');
    });
    
    // Also check what machines exist and their user IDs
    console.log('🔧 Checking machines and their user IDs:');
    const machines = await db.collection('machines').find({}).sort({ createdAt: -1 }).limit(10).toArray();
    
    const uniqueUserIds = [...new Set(machines.map(m => m.userId).filter(id => id))];
    console.log(`\nFound machines with these user IDs:`);
    uniqueUserIds.forEach(userId => {
      const machineCount = machines.filter(m => m.userId === userId).length;
      console.log(`- ${userId} (${machineCount} machines)`);
    });
    
    // Check diesel tanks user IDs
    console.log('\n⛽ Checking diesel tanks and their user IDs:');
    const dieselTanks = await db.collection('dieseltanks').find({}).sort({ createdAt: -1 }).toArray();
    
    const tankUserIds = [...new Set(dieselTanks.map(t => t.userId).filter(id => id))];
    console.log(`\nFound diesel tanks with these user IDs:`);
    tankUserIds.forEach(userId => {
      const tankCount = dieselTanks.filter(t => t.userId === userId).length;
      console.log(`- ${userId} (${tankCount} tanks)`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Database connection closed');
    }
  }
}

listUsers();
