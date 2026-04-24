const app = require('./app');
const { Pool } = require('pg');

const PORT = process.env.PORT || 3000;
// Use the DATABASE_URL environment variable we set in Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Necessary for Render Postgres
  }
});

// Test the connection
pool.connect()
  .then(() => {
    console.log('Connected to PostgreSQL database');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Employee Service active on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection failed. Exiting...', err);
    process.exit(1);
  });