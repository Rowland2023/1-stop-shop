const { Pool } = require('pg');

const connectDB = async () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('Missing DATABASE_URL in environment variables');
  }

  // Create a connection pool
  const pool = new Pool({
    connectionString: connectionString,
    // Required for Render's managed PostgreSQL
    ssl: {
      rejectUnauthorized: false 
    }
  });

  try {
    // Test the connection
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected');
    client.release(); // Release client back to the pool
    return pool;
  } catch (err) {
    console.error('❌ PostgreSQL connection error:', err);
    throw err;
  }
};

module.exports = connectDB;