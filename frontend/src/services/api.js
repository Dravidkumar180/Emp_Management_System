const API_BASE_URL = 'https://jsonplaceholder.typicode.com';

export const fetchEmployees = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) throw new Error('Failed to fetch employees');
    const data = await response.json();
    
    // Transform API data to match our employee structure
    return data.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      phone: user.phone,
      website: user.website,
      company: user.company.name,
      department: getDepartmentByUserId(user.id),
      status: getStatusByUserId(user.id),
      joinDate: getRandomDate(),
      location: getLocationByUserId(user.id)
    }));
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Helper functions for demo data variety
const departments = ['Engineering', 'Human Resources', 'Marketing', 'Sales', 'Finance', 'Operations'];
const statuses = ['Active', 'On Leave', 'Remote', 'Inactive', 'Probation'];
const locations = ['New York', 'London', 'Tokyo', 'Sydney', 'Toronto', 'Berlin'];

const getDepartmentByUserId = (id) => departments[id % departments.length];
const getStatusByUserId = (id) => statuses[id % statuses.length];
const getLocationByUserId = (id) => locations[id % locations.length];

const getRandomDate = () => {
  const start = new Date(2020, 0, 1);
  const end = new Date(2024, 11, 31);
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
};

export const getDepartmentStats = (employees) => {
  const stats = {};
  employees.forEach(emp => {
    stats[emp.department] = (stats[emp.department] || 0) + 1;
  });
  return stats;
};

export const getStatusStats = (employees) => {
  const stats = {};
  employees.forEach(emp => {
    stats[emp.status] = (stats[emp.status] || 0) + 1;
  });
  return stats;
};

export const getLocationStats = (employees) => {
  const stats = {};
  employees.forEach(emp => {
    stats[emp.location] = (stats[emp.location] || 0) + 1;
  });
  return stats;
};