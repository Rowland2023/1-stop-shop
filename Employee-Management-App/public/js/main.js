let editingId = null;

// Load departments into dropdown
async function loadDepartments() {
  try {
    const res = await fetch('http://localhost:3000/api/departments');
    const departments = await res.json();
    console.log('Fetched departments:', departments);

    const select = document.getElementById('department-select');
    if (!select) {
      console.error('Dropdown element not found');
      return;
    }

    select.innerHTML = '<option value="">Select a department</option>';

    departments.forEach(dep => {
      if (dep && dep.name) {
        const option = document.createElement('option');
        option.value = dep._id || dep.id || '';
        option.textContent = dep.name;
        select.appendChild(option);
      }
    });
  } catch (err) {
    console.error('Error loading departments:', err);
  }
}

// Load all employees into table
async function loadEmployees() {
  try {
    const res = await fetch('http://localhost:3000/api/employees'); // ✅ Correct endpoint
    const employees = await res.json();
    const table = document.getElementById('employee-table');
    if (!table) {
      console.error('Employee table element not found');
      return;
    }

    table.innerHTML = '';

    employees.forEach(emp => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${emp.firstName} ${emp.lastName}</td>
        <td>${emp.email}</td>
        <td>${emp.phoneNumber}</td>
        <td>${emp.department?.name || 'N/A'}</td>
        <td>
          <button onclick="editEmployee('${emp._id}')">✏️ Edit</button>
          <button onclick="deleteEmployee('${emp._id}')">🗑️ Delete</button>
        </td>
      `;
      table.appendChild(row);
    });
  } catch (err) {
    console.error('Error loading employees:', err);
  }
}

// Populate form for editing
async function editEmployee(id) {
  try {
    const res = await fetch(`http://localhost:3000/api/employees/${id}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch employee. Status: ${res.status}`);
    }

    const emp = await res.json();
    if (!emp) return;

    document.getElementById('employeeId').value = emp._id;
    document.getElementById('firstName').value = emp.firstName;
    document.getElementById('lastName').value = emp.lastName;
    document.getElementById('birthDate').value = emp.birthDate?.split('T')[0] || '';
    document.getElementById('email').value = emp.email;
    document.getElementById('phoneNumber').value = emp.phoneNumber;
    document.getElementById('department-select').value = emp.department?._id || emp.department?.id || '';
    editingId = emp._id;
  } catch (err) {
    console.error('Error editing employee:', err);
  }
}


// Delete employee
async function deleteEmployee(id) {
  try {
    await fetch(`/api/employees/${id}`, { method: 'DELETE' });
    console.log(`Deleted employee ${id}`);
    loadEmployees();
  } catch (err) {
    console.error('Error deleting employee:', err);
  }
}

// Handle form submission
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('employee-form');
  if (!form) {
    console.error('Employee form not found');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      birthDate: document.getElementById('birthDate').value,
      email: document.getElementById('email').value.trim(),
      phoneNumber: document.getElementById('phoneNumber').value.trim(),
      department: document.getElementById('department-select').value
    };

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/employees/${editingId}` : '/api/employees';

    try {
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      editingId = null;
      form.reset();
      document.getElementById('employeeId').value = '';
      loadEmployees();
    } catch (err) {
      console.error('Error saving employee:', err);
    }
  });

  // Initial load
  loadDepartments();
  loadEmployees();
});
