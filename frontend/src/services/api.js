// Using JSONPlaceholder API
const API_BASE_URL = 'https://jsonplaceholder.typicode.com';

// Transform the API data to match our employee structure
const transformEmployeeData = (user) => {
  const departments = ['Engineering', 'Human Resources', 'Marketing', 'Sales', 'Finance', 'Operations', 'IT', 'Product'];
  const statuses = ['Active', 'Active', 'Remote', 'On Leave', 'Active', 'Inactive', 'Active', 'Remote'];
  const roles = ['Software Engineer', 'HR Manager', 'Marketing Lead', 'Sales Executive', 'Financial Analyst', 'Operations Manager', 'UI/UX Designer', 'Product Manager'];
  const locations = ['New York', 'London', 'Tokyo', 'Sydney', 'Toronto', 'Berlin', 'Dubai', 'Singapore'];
  
  const index = user.id % departments.length;
  
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    phone: user.phone,
    website: user.website,
    company: user.company.name,
    department: departments[index],
    status: statuses[index],
    role: roles[index],
    location: locations[index],
    joinDate: `202${user.id % 3}-${String((user.id % 12) + 1).padStart(2, '0')}-${String((user.id % 28) + 1).padStart(2, '0')}`,
    avatar: user.name.charAt(0).toUpperCase()
  };
};

// Fetch all employees from JSONPlaceholder
export const fetchEmployees = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) throw new Error('Failed to fetch employees');
    const data = await response.json();
    // Transform the data to match our employee structure
    return data.map(transformEmployeeData);
  } catch (error) {
    console.error('API Error:', error);
    return [];
  }
};

// Fetch employee by ID
export const fetchEmployeeById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}`);
    if (!response.ok) throw new Error('Failed to fetch employee');
    const data = await response.json();
    return transformEmployeeData(data);
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
};

// Create new employee (POST to JSONPlaceholder - mock)
export const createEmployee = async (employeeData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employeeData)
    });
    if (!response.ok) throw new Error('Failed to create employee');
    const data = await response.json();
    // Transform and return the new employee with a mock ID
    return {
      ...transformEmployeeData({ ...data, id: Date.now() }),
      ...employeeData
    };
  } catch (error) {
    console.error('API Error:', error);
    // Return mock response for demo
    return {
      id: Date.now(),
      ...employeeData,
      avatar: employeeData.name?.charAt(0).toUpperCase() || 'N'
    };
  }
};

// Update employee (PUT to JSONPlaceholder - mock)
export const updateEmployee = async (id, employeeData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employeeData)
    });
    if (!response.ok) throw new Error('Failed to update employee');
    const data = await response.json();
    return transformEmployeeData(data);
  } catch (error) {
    console.error('API Error:', error);
    return { id, ...employeeData };
  }
};

// Delete employee (DELETE to JSONPlaceholder - mock)
export const deleteEmployee = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete employee');
    return { success: true, message: 'Employee deleted successfully' };
  } catch (error) {
    console.error('API Error:', error);
    return { success: true, message: 'Employee deleted (mock)' };
  }
};

// Get department statistics from employee data
export const getDepartmentStats = async (employees) => {
  // If employees array is passed, calculate from it
  if (employees && employees.length > 0) {
    const stats = {};
    employees.forEach(emp => {
      stats[emp.department] = (stats[emp.department] || 0) + 1;
    });
    return stats;
  }
  
  // Otherwise fetch and calculate
  try {
    const employees = await fetchEmployees();
    const stats = {};
    employees.forEach(emp => {
      stats[emp.department] = (stats[emp.department] || 0) + 1;
    });
    return stats;
  } catch (error) {
    console.error('API Error:', error);
    return {};
  }
};

// Get status statistics
export const getStatusStats = async (employees) => {
  if (employees && employees.length > 0) {
    const stats = { Active: 0, 'On Leave': 0, Remote: 0, Inactive: 0 };
    employees.forEach(emp => {
      stats[emp.status] = (stats[emp.status] || 0) + 1;
    });
    return stats;
  }
  
  try {
    const employees = await fetchEmployees();
    const stats = { Active: 0, 'On Leave': 0, Remote: 0, Inactive: 0 };
    employees.forEach(emp => {
      stats[emp.status] = (stats[emp.status] || 0) + 1;
    });
    return stats;
  } catch (error) {
    console.error('API Error:', error);
    return {};
  }
};

// Get all departments (unique)
export const getDepartments = async () => {
  const employees = await fetchEmployees();
  return [...new Set(employees.map(emp => emp.department))];
};

// Get employees by department
export const getEmployeesByDepartment = async (department) => {
  const employees = await fetchEmployees();
  return employees.filter(emp => emp.department === department);
};

// Search employees
export const searchEmployees = async (query) => {
  const employees = await fetchEmployees();
  const lowerQuery = query.toLowerCase();
  return employees.filter(emp => 
    emp.name.toLowerCase().includes(lowerQuery) ||
    emp.email.toLowerCase().includes(lowerQuery) ||
    emp.department.toLowerCase().includes(lowerQuery) ||
    emp.role.toLowerCase().includes(lowerQuery)
  );
};