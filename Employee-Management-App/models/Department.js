const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // IMPORT DIRECTLY, NO CURLY BRACES

const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    set(val) {
      this.setDataValue('name', val ? val.trim() : val);
    }
  }
}, {
  tableName: 'Departments',
  timestamps: true
});

module.exports = Department;