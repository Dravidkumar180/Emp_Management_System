import axios from 'axios';
import toast from 'react-hot-toast';

// Use JSONPlaceholder API
const API_BASE_URL = 'https://jsonplaceholder.typicode.com';

// Create axios instance with interceptors
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`📥 ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please try again.');
    } else if (error.response) {
      toast.error(`Server error: ${error.response.status}`);
    } else if (error.request) {
      toast.error('Network error. Check your connection.');
    } else {
      toast.error('An error occurred. Please try again.');
    }
    return Promise.reject(error);
  }
);

// Transform user data to employee format
const transformToEmployee = (user) => {
  const departments = ['Engineering', 'Human Resources', 'Marketing', 'Sales', 'Finance', 'Operations', 'IT', 'Product'];
  const statuses = ['Active', 'Active', 'Remote', 'On Leave', 'Active', 'Inactive', 'Active', 'Remote'];
  const roles = ['Software Engineer', 'HR Manager', 'Marketing Lead', 'Sales Executive', 'Financial Analyst', 'Operations Manager', 'UI/UX Designer', 'Product Manager'];
  const locations = ['New York', 'London', 'Tokyo', 'Sydney', 'Toronto', 'Berlin', 'Dubai', 'Singapore'];
  
  const index = (user.id - 1) % departments.length;
  
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    phone: user.phone,
    website: user.website,
    company: user.company?.name || 'Unknown',
    department: departments[index],
    status: statuses[index],
    role: roles[index],
    location: locations[index],
    joinDate: `202${user.id % 3}-${String((user.id % 12) + 1).padStart(2, '0')}-15`,
    avatar: user.name.charAt(0).toUpperCase()
  };
};

// Fetch all employees
export const fetchEmployees = async () => {
  try {
    const response = await api.get('/users');
    return response.data.map(transformToEmployee);
  } catch (error) {
    console.error('Fetch employees failed:', error);
    throw error;
  }
};

// Fetch employee by ID
export const fetchEmployeeById = async (id) => {
  try {
    const response = await api.get(`/users/${id}`);
    return transformToEmployee(response.data);
  } catch (error) {
    console.error(`Fetch employee ${id} failed:`, error);
    throw error;
  }
};

// Create new employee (mock POST)
export const createEmployee = async (employeeData) => {
  try {
    const response = await api.post('/users', {
      name: employeeData.name,
      email: employeeData.email,
      username: employeeData.name.toLowerCase().replace(/\s/g, '.'),
      phone: '+1 (555) 000-0000',
      company: { name: 'New Company' }
    });
    
    return {
      id: Date.now(),
      ...employeeData,
      username: employeeData.name.toLowerCase().replace(/\s/g, '.'),
      phone: '+1 (555) 000-0000',
      company: 'New Company',
      joinDate: new Date().toISOString().split('T')[0],
      location: 'New York',
      avatar: employeeData.name.charAt(0).toUpperCase()
    };
  } catch (error) {
    console.error('Create employee failed:', error);
    throw error;
  }
};

// Update employee
export const updateEmployee = async (id, employeeData) => {
  try {
    const response = await api.put(`/users/${id}`, employeeData);
    return transformToEmployee({ ...response.data, id });
  } catch (error) {
    console.error(`Update employee ${id} failed:`, error);
    throw error;
  }
};

// Delete employee
export const deleteEmployee = async (id) => {
  try {
    await api.delete(`/users/${id}`);
    return { success: true };
  } catch (error) {
    console.error(`Delete employee ${id} failed:`, error);
    throw error;
  }
};

// Get department statistics
export const getDepartmentStats = async (employees) => {
  const stats = {};
  employees.forEach(emp => {
    stats[emp.department] = (stats[emp.department] || 0) + 1;
  });
  return stats;
};

// Get status statistics
export const getStatusStats = async (employees) => {
  const stats = { Active: 0, Remote: 0, 'On Leave': 0, Inactive: 0 };
  employees.forEach(emp => {
    stats[emp.status] = (stats[emp.status] || 0) + 1;
  });
  return stats;
};

export default api;