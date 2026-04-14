const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee'); // Ensure this path is correct

// GET all employees from MongoDB
router.get('/', async (req, res) => {
    try {
        const employees = await Employee.find();
        res.status(200).json(employees);
    } catch (error) {
        console.error("DB Fetch Error:", error);
        res.status(500).json({ error: 'Failed to fetch employees from database' });
    }
});

// POST a new employee
router.post('/', async (req, res) => {
    try {
        const { name, role, status } = req.body;
        const newEmployee = new Employee({ name, role, status });
        const savedEmployee = await newEmployee.save();
        res.status(201).json(savedEmployee);
    } catch (error) {
        res.status(400).json({ error: "Validation Error", details: error.message });
    }
});

module.exports = router;