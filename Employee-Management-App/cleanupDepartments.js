const { Pool } = require('pg');

// Configure the pool using your Render DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const cleanupDepartments = async () => {
  try {
    console.log('🧹 Starting cleanup...');

    // SQL query: Delete all but the lowest ID for each duplicate name
    const query = `
      DELETE FROM departments
      WHERE id NOT IN (
        SELECT MIN(id)
        FROM departments
        GROUP BY name
      );
    `;

    const res = await pool.query(query);
    console.log(`✅ Cleanup complete. Removed ${res.rowCount} duplicates.`);
    
  } catch (err) {
    console.error('❌ Error during cleanup:', err);
  } finally {
    await pool.end(); // Always close the connection
  }
};

cleanupDepartments();