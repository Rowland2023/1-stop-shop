const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Department = sequelize.define('Department', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    set(val) {
      // Logic for 'trim'
      this.setDataValue('name', val ? val.trim() : val);
    }
  }
}, {
  timestamps: true
});

module.exports = Department;