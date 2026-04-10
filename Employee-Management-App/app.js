const express = require('express');
const cors = require('cors');
const path = require('path');
const employeeRoutes = require('./routes/employeeRoutes');
const departmentRoutes = require('./routes/departmentRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure this is in app.js before your routes
app.use(express.json());

// API Routes
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((req, res) => {
  res.status(404).json({ 
    error: "Not Found",
    message: "the requested endpoint does not exist" 
  });
});


module.exports = app;