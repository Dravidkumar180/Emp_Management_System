// Shows the companies page.
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getAllEmployees } from '../services/api';
import { logAuditAction } from '../services/audit';
import './Companies.css';

const COMPANIES = [
  { id: 'company-a', name: 'Company A' },
  { id: 'company-b', name: 'Company B' },
];

// Shows the companies component.
const Companies = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [customCompanies, setCustomCompanies] = useState([]);
  const currentCompanyId = user?.companyId || 'company-a';
  const [activeCompanyId, setActiveCompanyId] = useState(currentCompanyId);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    access: '',
  });

  // Runs when this screen needs to update data.
  useEffect(() => {
    setActiveCompanyId(currentCompanyId);
  }, [currentCompanyId]);

  // Runs when this screen needs to update data.
  useEffect(() => {
    // Gets employees data.
    const loadEmployees = async () => {
      try {
        setLoading(true);
        const data = await getAllEmployees();
        setEmployees(data);
      } catch (error) {
        toast.error('Failed to fetch company employees');
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, []);

  // Prepares companies.
  const companies = useMemo(() => {
    // Prepares default companies.
    const defaultCompanies = COMPANIES.map((company) => ({
      ...company,
      access: company.id === currentCompanyId ? 'Current company' : 'Isolated tenant',
      employees: employees.filter((employee) => (employee.companyId || 'company-a') === company.id),
    }));

    return [...defaultCompanies, ...customCompanies].map((company) => ({
      ...company,
      access: company.id === currentCompanyId ? 'Current company' : 'Isolated tenant',
      users: company.employees?.length || 0,
    }));
  }, [currentCompanyId, customCompanies, employees]);

  // Prepares active company.
  const activeCompany = companies.find((company) => company.id === activeCompanyId) || companies[0];
  // Prepares current company.
  const currentCompany = companies.find((company) => company.id === currentCompanyId) || activeCompany;
  const isAddCompanyValid = formData.name.trim() && formData.slug.trim() && formData.access;

  // Helps with reset form.
  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      access: '',
    });
  };

  // Helps with close add modal.
  const closeAddModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  // Handles add company actions.
  const handleAddCompany = async (event) => {
    event.preventDefault();

    if (!isAddCompanyValid) return;

    const slug = formData.slug.trim().toLowerCase().replace(/\s+/g, '-');
    // Prepares already exists.
    const alreadyExists = companies.some((company) => company.id === slug);

    if (alreadyExists) {
      toast.error('A company with this slug already exists');
      return;
    }

    const newCompany = {
      id: slug,
      name: formData.name.trim(),
      access: slug === currentCompanyId ? 'Current company' : 'Isolated tenant',
      employees: [],
      users: 0,
    };

    setCustomCompanies((prev) => [...prev, newCompany]);
    setActiveCompanyId(newCompany.id);
    await logAuditAction({
      action: 'Company Created',
      entityType: 'company',
      entityName: newCompany.name,
      details: `Company ${newCompany.name} was created`,
      newValue: newCompany
    });
    toast.success('Company added');
    closeAddModal();
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading companies...</p>
      </div>
    );
  }

  return (
    <div className="companies-page">
      <div className="companies-topbar">
        <div className="company-tabs" aria-label="Company views">
          <button className="company-tab active" type="button">
            Companies
          </button>
          {companies.map((company) => (
            <button
              key={company.id}
              className={`company-tab ${activeCompanyId === company.id ? 'active' : ''}`}
              type="button"
              onClick={() => setActiveCompanyId(company.id)}
            >
              {company.name}
            </button>
          ))}
        </div>
        <button className="add-company-trigger" type="button" onClick={() => setShowAddModal(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Company
        </button>
      </div>

      <div className="companies-intro">
        <p>
          Companies are configured in EEMS. Your workspace: <strong>{currentCompany.name}</strong>
        </p>
      </div>

      <div className="companies-table-container">
        <table className="companies-table">
          <thead>
            <tr>
              <th>Slug</th>
              <th>Employees</th>
              <th>Users</th>
              <th>Your Access</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr
                key={company.id}
                className={activeCompanyId === company.id ? 'current-company' : ''}
                onClick={() => setActiveCompanyId(company.id)}
              >
                <td>{company.id}</td>
                <td>{company.employees.length}</td>
                <td>{company.users}</td>
                <td>
                  <span className={company.access === 'Current company' ? 'access-current' : 'access-muted'}>
                    {company.access}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="company-employees">
        <div className="company-employees-header">
          <h2>{activeCompany.name} Employees</h2>
          <span>{activeCompany.employees.length} employees</span>
        </div>

        <div className="employee-grid">
          {activeCompany.employees.length === 0 ? (
            <div className="empty-employees">No employees assigned to this company yet.</div>
          ) : activeCompany.employees.map((employee) => (
            <article className="employee-card" key={employee.id}>
              <div className="employee-avatar">{employee.name.charAt(0)}</div>
              <div>
                <h3>{employee.name}</h3>
                <p>{employee.email}</p>
                <span>{employee.sourceCompany || employee.company || company.name}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {showAddModal && (
        <div className="modal-overlay" onClick={closeAddModal}>
          <div className="modal-container" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Company</h2>
              <button className="modal-close" type="button" onClick={closeAddModal} aria-label="Close add company form">
                x
              </button>
            </div>

            <form onSubmit={handleAddCompany}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="company-name">
                    Company Name <span className="required-mark">*</span>
                  </label>
                  <input
                    id="company-name"
                    type="text"
                    value={formData.name}
                    onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Enter company name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="company-slug">
                    Slug <span className="required-mark">*</span>
                  </label>
                  <input
                    id="company-slug"
                    type="text"
                    value={formData.slug}
                    onChange={(event) => setFormData((prev) => ({ ...prev, slug: event.target.value }))}
                    placeholder="company-c"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="company-access">
                    Your Access <span className="required-mark">*</span>
                  </label>
                  <select
                    id="company-access"
                    value={formData.access}
                    onChange={(event) => setFormData((prev) => ({ ...prev, access: event.target.value }))}
                    required
                  >
                    <option value="">Select access</option>
                    <option value="Current company">Current company</option>
                    <option value="Isolated tenant">Isolated tenant</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button className="cancel-btn" type="button" onClick={closeAddModal}>
                  Cancel
                </button>
                <button className="submit-btn" type="submit" disabled={!isAddCompanyValid}>
                  Add Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;