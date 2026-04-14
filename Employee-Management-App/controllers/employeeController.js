const { Employee, Department } = require('../models');

// GET all employees
exports.getAllEmployees = async (req, res) => {
  try {
    // include: [{ model: Department, as: 'department' }] is the SQL version of .populate()
    const employees = await Employee.findAll({
      include: [{ model: Department, as: 'department' }]
    });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

// GET one employee by ID
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      include: [{ model: Department, as: 'department' }]
    });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching employee' });
  }
};

// CREATE new employee
exports.createEmployee = async (req, res) => {
  try {
    // In Sequelize, we use .create() directly on the model
    const savedEmployee = await Employee.create(req.body);
    res.status(201).json(savedEmployee);
  } catch (err) {
    console.error('❌ Backend error:', err);
    res.status(400).json({ error: 'Failed to create employee' });
  }
};

// UPDATE employee
exports.updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    
    const updated = await employee.update(req.body);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update employee' });
  }
};

// DELETE employee
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    
    await employee.destroy();
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete employee' });
  }
};