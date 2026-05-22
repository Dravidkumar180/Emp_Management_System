const API_BASE_URL = 'https://jsonplaceholder.typicode.com';

export const fetchEmployees = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`);
    const data = await response.json();
    
    const roles = [
      'Data Scientist', 'Product Manager', 'HR Manager', 'UI/UX Designer',
      'Frontend Developer', 'Backend Developer', 'QA Engineer', 'DevOps Engineer'
    ];
    
    const departments = [
      'Data', 'Product', 'Human Resources', 'Design', 'Engineering', 'Marketing', 'Sales'
    ];
    
    const statuses = ['Active', 'On Leave', 'Inactive', 'Remote'];
    
    return data.map((user, index) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      phone: user.phone,
      company: user.company.name,
      role: roles[index % roles.length],
      department: departments[index % departments.length],
      status: statuses[index % statuses.length],
      joinDate: `202${index % 3}-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 28) + 1).padStart(2, '0')}`,
      location: 'Roscoeview, 33263'
    }));
  } catch (error) {
    console.error('API Error:', error);
    return [];
  }
};