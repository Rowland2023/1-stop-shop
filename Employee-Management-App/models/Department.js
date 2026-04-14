const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, // 🚫 Prevents duplicate department names
    trim: true    // ✂️ Removes leading/trailing spaces
  }
});

module.exports = mongoose.model('Department', departmentSchema);
