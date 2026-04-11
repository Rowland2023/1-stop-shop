const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // We will update your db.js to export this

const Employee = sequelize.define('Employee', {
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dob: {
    type: DataTypes.DATEONLY, // Date without time
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    validate: { isEmail: true }
  },
  phoneNumber: {
    type: DataTypes.STRING,
  },
  // In SQL, we handle relationships via Associations (defined below)
  departmentId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Departments', // Name of the table
      key: 'id'
    }
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

module.exports = Employee;