import axios from 'axios';
import toast from 'react-hot-toast';

const JSONPLACEHOLDER_URL = 'https://jsonplaceholder.typicode.com';

// Transform user data to employee format
const transformUserToEmployee = (user) => {
  const departments = ['Marketing', 'Data', 'Product', 'Human Resources', 'Design', 'Engineering', 'Sales', 'Finance'];
  const statuses = ['Inactive', 'On Leave', 'Active', 'Inactive', 'Active', 'Active', 'Remote', 'Active'];
  const roles = ['Marketing Specialist', 'Data Scientist', 'Product Manager', 'HR Manager', 'UI/UX Designer', 'Frontend Developer', 'Sales Executive', 'Financial Analyst'];
  
  const index = (user.id - 1) % departments.length;
  const companyId = user.id <= 5 ? 'company-a' : 'company-b';
  
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    phone: user.phone,
    website: user.website,
    company: companyId === 'company-a' ? 'Company A' : 'Company B',
    companyId,
    sourceCompany: user.company?.name || 'Unknown',
    department: departments[index],
    status: statuses[index],
    role: roles[index],
    joinDate: `202${user.id % 3}-${String((user.id % 12) + 1).padStart(2, '0')}-${String((user.id % 28) + 1).padStart(2, '0')}`,
    avatar: user.name.charAt(0).toUpperCase()
  };
};

// Fetch employees from JSONPlaceholder
export const fetchEmployees = async () => {
  try {
    const response = await axios.get(`${JSONPLACEHOLDER_URL}/users`);
    const users = response.data;
    return users.map(transformUserToEmployee);
  } catch (error) {
    console.error('Fetch error:', error);
    return [];
  }
};

// Get all employees (API + localStorage)
export const getAllEmployees = async () => {
  try {
    const apiEmployees = await fetchEmployees();
    const savedEmployees = JSON.parse(localStorage.getItem('employees') || '[]');
    const savedById = savedEmployees.reduce((acc, emp) => {
      acc[emp.id] = emp;
      return acc;
    }, {});
    const apiById = apiEmployees.reduce((acc, emp) => {
      acc[emp.id] = emp;
      return acc;
    }, {});

    const mergedEmployees = apiEmployees.map((emp) => savedById[emp.id] || emp);
    const savedOnly = savedEmployees.filter((emp) => !apiById[emp.id]);
    return [...mergedEmployees, ...savedOnly];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
};

// Create new employee (save to localStorage)
export const createEmployee = async (employeeData) => {
  try {
    const savedEmployees = JSON.parse(localStorage.getItem('employees') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const companyId = employeeData.companyId || currentUser.companyId || 'company-a';
    const newId = Date.now(); // Unique ID
    
    const newEmployee = {
      id: newId,
      name: employeeData.name,
      email: employeeData.email,
      username: employeeData.name.toLowerCase().replace(/\s/g, '.'),
      phone: employeeData.phone || '+1 (555) 000-0000',
      company: companyId === 'company-a' ? 'Company A' : 'Company B',
      companyId,
      department: employeeData.department,
      status: employeeData.status,
      role: employeeData.role,
      joinDate: new Date().toISOString().split('T')[0],
      location: employeeData.location || 'New York',
      avatar: employeeData.name.charAt(0).toUpperCase()
    };
    
    savedEmployees.push(newEmployee);
    localStorage.setItem('employees', JSON.stringify(savedEmployees));
    
    toast.success('Employee added successfully!');
    return newEmployee;
  } catch (error) {
    console.error('Create error:', error);
    toast.error('Failed to add employee');
    throw error;
  }
};

// Update employee
export const updateEmployee = async (id, employeeData) => {
  try {
    const savedEmployees = JSON.parse(localStorage.getItem('employees') || '[]');
    const index = savedEmployees.findIndex(emp => emp.id === id);

    if (index !== -1) {
      savedEmployees[index] = { ...savedEmployees[index], ...employeeData };
      localStorage.setItem('employees', JSON.stringify(savedEmployees));
      toast.success('Employee updated successfully!');
      return savedEmployees[index];
    }

    const updatedEmployee = {
      id,
      ...employeeData,
      avatar: employeeData.name ? employeeData.name.charAt(0).toUpperCase() : employeeData.avatar,
    };
    savedEmployees.push(updatedEmployee);
    localStorage.setItem('employees', JSON.stringify(savedEmployees));

    toast.success('Employee updated successfully!');
    return updatedEmployee;
  } catch (error) {
    console.error('Update error:', error);
    toast.error('Failed to update employee');
    throw error;
  }
};

// Delete employee
export const deleteEmployee = async (id) => {
  try {
    const savedEmployees = JSON.parse(localStorage.getItem('employees') || '[]');
    const filtered = savedEmployees.filter(emp => emp.id !== id);
    localStorage.setItem('employees', JSON.stringify(filtered));
    
    toast.success('Employee deleted successfully!');
    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    toast.error('Failed to delete employee');
    throw error;
  }
};

export default { getAllEmployees, createEmployee, updateEmployee, deleteEmployee };
