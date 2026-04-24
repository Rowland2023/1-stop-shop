const pool = require('../config/db'); // Your pg Pool instance

const Employee = {
  create: async ({ firstName, lastName, dob, email, phoneNumber, departmentId }) => {
    const query = `
      INSERT INTO employees (first_name, last_name, dob, email, phone_number, department_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [firstName, lastName, dob, email, phoneNumber, departmentId];
    const res = await pool.query(query, values);
    return res.rows[0];
  },

  findById: async (id) => {
    const query = `
      SELECT e.*, d.name as department_name 
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.id = $1;
    `;
    const res = await pool.query(query, [id]);
    return res.rows[0];
  }
};

module.exports = Employee;