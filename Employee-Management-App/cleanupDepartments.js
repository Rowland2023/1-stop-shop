const mongoose = require('mongoose');
const Department = require('./models/Department');

mongoose.connect('mongodb://localhost:27017/employees', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  const departments = await Department.find({});
  const seen = new Set();

  for (const dept of departments) {
    if (seen.has(dept.name)) {
      await Department.findByIdAndDelete(dept._id);
      console.log(`🗑️ Removed duplicate: ${dept.name}`);
    } else {
      seen.add(dept.name);
    }
  }

  console.log('✅ Cleanup complete');
  mongoose.disconnect();
});
