import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Input from '../components/common/Input';
import { fetchEmployees, getDepartmentStats } from '../services/api';
import './Departments.css';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const data = await fetchEmployees();
      const stats = getDepartmentStats(data);
      const deptList = Object.entries(stats).map(([name, count]) => ({
        name,
        count,
        employees: data.filter(emp => emp.department === name)
      }));
      setDepartments(deptList);
    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading departments...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="departments-page">
        <div className="page-header">
          <div>
            <h1>Departments</h1>
            <p>Organize employees by department</p>
          </div>
        </div>

        <div className="filters-section">
          <Input
            type="text"
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon="🔍"
          />
        </div>

        <div className="departments-grid">
          {filteredDepartments.map(dept => (
            <div key={dept.name} className="department-card">
              <div className="department-header">
                <span className="department-icon">🏢</span>
                <h3>{dept.name}</h3>
              </div>
              <div className="department-stats">
                <div className="stat">
                  <span className="stat-label">Employees</span>
                  <span className="stat-value">{dept.count}</span>
                </div>
              </div>
              <div className="department-employees">
                <h4>Team Members</h4>
                <div className="employee-list">
                  {dept.employees.slice(0, 3).map(emp => (
                    <div key={emp.id} className="employee-chip">
                      {emp.name}
                    </div>
                  ))}
                  {dept.count > 3 && (
                    <div className="employee-chip more">+{dept.count - 3} more</div>
                  )}
                </div>
              </div>
              <button className="view-btn">View Details →</button>
            </div>
          ))}
        </div>

        {filteredDepartments.length === 0 && (
          <div className="no-results">
            <p>No departments found</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Departments;