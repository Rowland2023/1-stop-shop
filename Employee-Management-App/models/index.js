const sequelize = require('../config/db');
const Employee = require('./Employee');
const Department = require('./Department');

// --- Associations ---

// One Department can have many Employees
Department.hasMany(Employee, { 
  foreignKey: 'departmentId', 
  as: 'staff',
  onDelete: 'SET NULL', // Prevents deleting employees if a department is removed
  onUpdate: 'CASCADE'
});

// Each Employee belongs to one Department
Employee.belongsTo(Department, { 
  foreignKey: 'departmentId', 
  as: 'department' 
});

// --- Exporting Models and Connection ---
module.exports = { 
  sequelize,
  Employee, 
  Department 
};