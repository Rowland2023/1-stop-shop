const { Pool } = require('pg');

const connectDB = async () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('Missing DATABASE_URL in environment variables');
  }

  // A Pool is better for web apps than a single Client connection
  const pool = new Pool({
    connectionString: connectionString,
    // Optional: Render often requires SSL in production
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Testing the connection
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected');
    
    // Release the client back to the pool
    client.release();
    
    return pool; 
  } catch (err) {
    console.error('❌ PostgreSQL connection error:', err.message);
    throw err;
  }
};

module.exports = connectDB;