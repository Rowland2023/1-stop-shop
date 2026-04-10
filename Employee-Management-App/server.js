const app = require('./app');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 3000;
// Note: 'mongodb' matches the service name in your docker-compose.yml
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/employee';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB via Service: mongodb');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Employee Service active on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection failed. Exiting...', err);
    process.exit(1); // Tell Docker the container failed
  });