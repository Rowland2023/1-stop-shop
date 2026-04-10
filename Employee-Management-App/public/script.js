async function loadDepartments() {
  const res = await fetch('/api/departments');
  const departments = await res.json();
  const select = document.getElementById('department');
  select.innerHTML = '';
  departments.forEach(dep => {
    const option = document.createElement('option');
    option.value = dep._id;
    option.textContent = dep.name;
    select.appendChild(option);
  });
}

async function loadEmployees() {
  const res = await fetch('/api/employees');
  const employees = await res.json();
  const table = document.getElementById('employeeTable');
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
}

document.getElementById('employeeForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('employeeId').value;
  const data = {
    firstName: document.getElementById('firstName').value,
    lastName: document.getElementById('lastName').value,
    birthDate: document.getElementById('birthDate').value,
    email: document.getElementById('email').value,
    phoneNumber: document.getElementById('phoneNumber').value,
    department: document.getElementById('department').value
  };

  const method = id ? 'PUT' : 'POST';
  const url = id ? `/api/employees/${id}` : '/api/employees';
  await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  e.target.reset();
  document.getElementById('employeeId').value = '';
  loadEmployees();
});

async function editEmployee(id) {
  const res = await fetch(`/api/employees`);
  const employees = await res.json();
  const emp = employees.find(e => e._id === id);
  document.getElementById('employeeId').value = emp._id;
  document.getElementById('firstName').value = emp.firstName;
  document.getElementById('lastName').value = emp.lastName;
  document.getElementById('birthDate').value = emp.birthDate.split('T')[0];
  document.getElementById('email').value = emp.email;
  document.getElementById('phoneNumber').value = emp.phoneNumber;
  document.getElementById('department').value = emp.department._id;
}

async function deleteEmployee(id) {
  await fetch(`/api/employees/${id}`, { method: 'DELETE' });
  loadEmployees();
}

// Initial load
loadDepartments();
loadEmployees();
