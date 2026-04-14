const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  dob: Date,
  email: String,
  phoneNumber: String,
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' }
});

module.exports = mongoose.model('Employee', employeeSchema);
