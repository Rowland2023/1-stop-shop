const express = require('express');
const cors = require('cors');
const path = require('path');
const employeeRoutes = require('./routes/employeeRoutes');
const departmentRoutes = require('./routes/departmentRoutes');

const app = express();

// Standard Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);

// Static Files (Nginx usually handles this in prod, but good for local)
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    error: "Not Found",
    message: "the requested endpoint does not exist" 
  });
});

module.exports = app;