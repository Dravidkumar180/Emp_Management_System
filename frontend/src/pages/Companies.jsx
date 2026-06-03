import React, { useState, useEffect } from 'react';
import { getAllEmployees } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import './Companies.css';

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentCompany, setCurrentCompany] = useState('');
  const { addNotification } = useNotifications();
  const { selectedCompany, setSelectedCompany } = useAuth();

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      setCurrentCompany(selectedCompany);
    }
  }, [selectedCompany]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const employees = await getAllEmployees();
      const companyMap = {};

      employees.forEach((emp) => {
        const company = emp.company || 'Unknown';
        if (!companyMap[company]) {
          companyMap[company] = 0;
        }
        companyMap[company] += 1;
      });

      const companyList = Object.entries(companyMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setCompanies(companyList);
    } catch (error) {
      console.error('Error loading companies:', error);
      addNotification({ type: 'error', title: 'Load Failed', message: 'Unable to load companies.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCompany = (company) => {
    setCurrentCompany(company);
    setSelectedCompany(company);
    localStorage.setItem('selectedCompany', company);
  };

  return (
    <div className="companies-page">
      <div className="companies-header">
        <div>
          <h1>Companies</h1>
          <p>Choose a company to filter employees in the app.</p>
        </div>
        <div className="companies-selected">
          <span>Current company</span>
          <strong>{currentCompany || 'Not selected'}</strong>
        </div>
      </div>

      {loading ? (
        <div className="companies-loading">
          <div className="spinner" />
          <p>Loading companies...</p>
        </div>
      ) : (
        <>
          <div className="companies-tabs">
            {companies.map((company) => (
              <button
                key={company.name}
                className={`company-filter-button ${company.name === currentCompany ? 'active' : ''}`}
                onClick={() => handleSelectCompany(company.name)}
              >
                {company.name}
              </button>
            ))}
          </div>

          <div className="companies-grid">
            {companies.map((company) => (
              <div
                key={company.name}
                className={`company-card ${company.name === currentCompany ? 'active' : ''}`}
              >
                <div className="company-card-header">
                  <h3>{company.name}</h3>
                </div>
                <div className="company-card-body">
                  <span>{company.count}</span>
                  <p>{company.count === 1 ? 'employee' : 'employees'}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Companies;
