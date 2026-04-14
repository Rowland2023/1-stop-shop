const Employee = require('./Employee');
const Department = require('./Department');

// --- Associations ---
// One Department can have many Employees
Department.hasMany(Employee, { 
  foreignKey: 'departmentId', 
  as: 'staff' 
});

// Each Employee belongs to one Department
Employee.belongsTo(Department, { 
  foreignKey: 'departmentId', 
  as: 'department' 
});

module.exports = { 
  Employee, 
  Department 
};