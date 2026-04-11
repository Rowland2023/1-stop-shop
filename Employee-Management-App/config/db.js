const { Sequelize } = require('sequelize');

const connectDB = () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('Missing DATABASE_URL in environment variables');
  }

  // Create the Sequelize instance
  const sequelize = new Sequelize(connectionString, {
    dialect: 'postgres',
    logging: false, // Set to console.log to see SQL queries in Render
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  });

  // Test the connection immediately
  sequelize.authenticate()
    .then(() => {
      console.log('✅ PostgreSQL connected via Sequelize');
    })
    .catch(err => {
      console.error('❌ PostgreSQL connection error:', err.message);
    });

  return sequelize;
};

// We execute the function and export the result (the sequelize instance)
module.exports = connectDB();