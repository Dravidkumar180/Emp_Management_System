// Connects the frontend to backend API features.
import axios from 'axios';
import toast from 'react-hot-toast';
import { logAuditAction } from './audit';

const JSONPLACEHOLDER_URL = 'https://jsonplaceholder.typicode.com';

// Converts API user to employee.
const transformUserToEmployee = (user) => {
  // Demo department options.
  const departments = ['Marketing', 'Data', 'Product', 'Human Resources', 'Design', 'Engineering', 'Sales', 'Finance'];
  // Demo status options.
  const statuses = ['Inactive', 'On Leave', 'Active', 'Inactive', 'Active', 'Active', 'Remote', 'Active'];
  // Demo role options.
  const roles = ['Marketing Specialist', 'Data Scientist', 'Product Manager', 'HR Manager', 'UI/UX Designer', 'Frontend Developer', 'Sales Executive', 'Financial Analyst'];
  
  // Picks demo values.
  const index = (user.id - 1) % departments.length;
  // Splits users by company.
  const companyId = user.id <= 5 ? 'company-a' : 'company-b';
  
  // Builds employee object.
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

// Fetches demo employees.
export const fetchEmployees = async () => {
  try {
    // Gets users from API.
    const response = await axios.get(`${JSONPLACEHOLDER_URL}/users`);
    const users = response.data;
    // Converts users to employees.
    return users.map(transformUserToEmployee);
  } catch (error) {
    // Returns empty list on error.
    console.error('Fetch error:', error);
    return [];
  }
};

// Gets API and saved employees.
export const getAllEmployees = async () => {
  try {
    // Gets demo employees.
    const apiEmployees = await fetchEmployees();
    // Gets saved local employees.
    const savedEmployees = JSON.parse(localStorage.getItem('employees') || '[]');
    // Maps saved employees by ID.
    const savedById = savedEmployees.reduce((acc, emp) => {
      acc[emp.id] = emp;
      return acc;
    }, {});
    // Maps API employees by ID.
    const apiById = apiEmployees.reduce((acc, emp) => {
      acc[emp.id] = emp;
      return acc;
    }, {});

    // Uses saved edits first.
    const mergedEmployees = apiEmployees.map((emp) => savedById[emp.id] || emp);
    // Keeps new local employees.
    const savedOnly = savedEmployees.filter((emp) => !apiById[emp.id]);
    return [...mergedEmployees, ...savedOnly];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
};

// Creates new employee.
export const createEmployee = async (employeeData) => {
  try {
    // Gets saved employees.
    const savedEmployees = JSON.parse(localStorage.getItem('employees') || '[]');
    // Gets current user.
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    // Gets employee company.
    const companyId = employeeData.companyId || currentUser.companyId || 'company-a';
    // Creates unique ID.
    const newId = Date.now();
    
    // Builds new employee.
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
      joinDate: employeeData.joinDate || new Date().toISOString().split('T')[0],
      location: employeeData.location || 'New York',
      avatar: employeeData.avatar || employeeData.name.charAt(0).toUpperCase()
    };
    
    // Saves employee locally.
    savedEmployees.push(newEmployee);
    localStorage.setItem('employees', JSON.stringify(savedEmployees));
    // Records create action.
    await logAuditAction({
      action: 'Employee Created',
      entityType: 'employee',
      entityId: newEmployee.id,
      entityName: newEmployee.name,
      details: `Employee ${newEmployee.name} was created`,
      newValue: newEmployee
    });
    
    // Shows success message.
    toast.success('Employee added successfully!');
    return newEmployee;
  } catch (error) {
    // Shows create error.
    console.error('Create error:', error);
    toast.error('Failed to add employee');
    throw error;
  }
};

// Updates employee.
export const updateEmployee = async (id, employeeData) => {
  try {
    // Gets saved employees.
    const savedEmployees = JSON.parse(localStorage.getItem('employees') || '[]');
    // Finds employee index.
    const index = savedEmployees.findIndex(emp => emp.id === id);
    // Keeps old employee data.
    const oldEmployee = index !== -1 ? savedEmployees[index] : null;

    // Updates existing employee.
    if (index !== -1) {
      savedEmployees[index] = { ...savedEmployees[index], ...employeeData };
      localStorage.setItem('employees', JSON.stringify(savedEmployees));
      // Records update action.
      await logAuditAction({
        action: 'Employee Updated',
        entityType: 'employee',
        entityId: id,
        entityName: savedEmployees[index].name,
        details: `Employee ${savedEmployees[index].name} was updated`,
        oldValue: oldEmployee,
        newValue: savedEmployees[index]
      });
      toast.success('Employee updated successfully!');
      return savedEmployees[index];
    }

    // Creates missing local employee.
    const updatedEmployee = {
      id,
      ...employeeData,
      avatar: employeeData.name ? employeeData.name.charAt(0).toUpperCase() : employeeData.avatar,
    };
    // Saves created update locally.
    savedEmployees.push(updatedEmployee);
    localStorage.setItem('employees', JSON.stringify(savedEmployees));
    // Records update action.
    await logAuditAction({
      action: 'Employee Updated',
      entityType: 'employee',
      entityId: id,
      entityName: updatedEmployee.name,
      details: `Employee ${updatedEmployee.name || id} was updated`,
      newValue: updatedEmployee
    });

    toast.success('Employee updated successfully!');
    return updatedEmployee;
  } catch (error) {
    // Shows update error.
    console.error('Update error:', error);
    toast.error('Failed to update employee');
    throw error;
  }
};

// Deletes employee.
export const deleteEmployee = async (id) => {
  try {
    // Gets saved employees.
    const savedEmployees = JSON.parse(localStorage.getItem('employees') || '[]');
    // Finds deleted employee.
    const deletedEmployee = savedEmployees.find(emp => emp.id === id);
    // Removes employee from list.
    const filtered = savedEmployees.filter(emp => emp.id !== id);
    localStorage.setItem('employees', JSON.stringify(filtered));
    // Records delete action.
    await logAuditAction({
      action: 'Employee Deleted',
      entityType: 'employee',
      entityId: id,
      entityName: deletedEmployee?.name || `Employee ${id}`,
      details: `${deletedEmployee?.name || `Employee ${id}`} was deleted`,
      oldValue: deletedEmployee
    });
    
    // Shows success message.
    toast.success('Employee deleted successfully!');
    return { success: true };
  } catch (error) {
    // Shows delete error.
    console.error('Delete error:', error);
    toast.error('Failed to delete employee');
    throw error;
  }
};

export default { getAllEmployees, createEmployee, updateEmployee, deleteEmployee };
