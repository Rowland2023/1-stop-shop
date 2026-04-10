const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
const dbName = 'employeeDB';

async function testConnection() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection('employees');

    // Insert a test employee
    const result = await collection.insertOne({ name: 'Lucia', role: 'Engineer' });
    console.log('Inserted:', result.insertedId);

    // Find all employees
    const employees = await collection.find({}).toArray();
    console.log('Employees:', employees);
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.close();
  }
}

testConnection();
