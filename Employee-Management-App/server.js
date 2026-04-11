require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');
require('./models'); // Initializes associations

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // connectDB now handles the PostgreSQL connection and .sync()
    await connectDB();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Employee Service active on port ${PORT}`);
      console.log(`📡 Database: PostgreSQL via service "database"`);
    });
  } catch (err) {
    console.error('❌ Database connection failed. Exiting...', err);
    process.exit(1); 
  }
};

startServer();