// db/department.js
const pool = require('./db'); // The file where you exported your 'pool'

const Department = {
  create: async (name) => {
    const query = 'INSERT INTO departments(name) VALUES($1) RETURNING *';
    const values = [name.trim()]; // Equivalent to your trim: true
    try {
      const res = await pool.query(query, values);
      return res.rows[0];
    } catch (err) {
      if (err.code === '23505') { // Unique constraint violation code
        throw new Error('Department name already exists');
      }
      throw err;
    }
  }
};

module.exports = Department;