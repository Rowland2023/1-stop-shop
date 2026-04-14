require('dotenv').config();
const app = require('./app');
// Import the sequelize instance directly, matching our db.js export
const sequelize = require('./config/db'); 
require('./models'); // Initializes associations

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Verify the connection to PostgreSQL
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection verified successfully.');

    // Sync models to the database (creates tables if they don't exist)
    // Using 'alter' allows safe updates to the schema
    await sequelize.sync({ alter: true });
    console.log('✅ Database & tables synced');
    
    // Start the Express server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Employee Service active on port ${PORT}`);
      // Note: On Render, this uses the DATABASE_URL environment variable
      console.log(`📡 Deployment Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('❌ Database connection or sync failed. Exiting...', err.message);
    process.exit(1); 
  }
};

startServer();