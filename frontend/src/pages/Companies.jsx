import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Toaster, toast } from 'react-hot-toast';
import './Companies.css';

const Companies = () => {
    const [companies, setCompanies] = useState([]);
    const [currentCompany, setCurrentCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        subscription_plan: 'basic'
    });

    useEffect(() => {
        fetchCompanies();
        fetchCurrentCompany();
    }, []);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/v1/companies', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setCompanies(data);
                // Fetch stats for each company
                data.forEach(company => {
                    fetchCompanyStats(company.id);
                });
            }
        } catch (error) {
            toast.error('Failed to fetch companies');
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanyStats = async (companyId) => {
        try {
            const response = await fetch(`/api/v1/companies/${companyId}/stats`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setCompanies(prev => prev.map(c => 
                    c.id === companyId ? { ...c, stats: data } : c
                ));
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchCurrentCompany = async () => {
        try {
            const response = await fetch('/api/v1/companies/my-company', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setCurrentCompany(data);
            }
        } catch (error) {
            console.error('Error fetching current company:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingCompany 
                ? `/api/v1/companies/${editingCompany.id}`
                : '/api/v1/companies';
            const method = editingCompany ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                toast.success(editingCompany ? 'Company updated!' : 'Company created!');
                fetchCompanies();
                setShowAddModal(false);
                setEditingCompany(null);
                resetForm();
            } else {
                const error = await response.json();
                toast.error(error.detail || 'Operation failed');
            }
        } catch (error) {
            toast.error('Network error');
        }
    };

    const handleSwitchCompany = async (companyId) => {
        try {
            const response = await fetch(`/api/v1/companies/switch/${companyId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.access_token);
                toast.success(data.message);
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        } catch (error) {
            toast.error('Failed to switch company');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            address: '',
            website: '',
            subscription_plan: 'basic'
        });
    };

    const editCompany = (company) => {
        setEditingCompany(company);
        setFormData({
            name: company.name,
            email: company.email || '',
            phone: company.phone || '',
            address: company.address || '',
            website: company.website || '',
            subscription_plan: company.subscription_plan
        });
        setShowAddModal(true);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading companies...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="companies-page">
                <Toaster position="top-right" />
                
                {/* Header */}
                <div className="companies-header">
                    <div>
                        <h1>Companies</h1>
                        <p>Manage all companies in the system</p>
                    </div>
                    <button className="add-company-btn" onClick={() => setShowAddModal(true)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        Add Company
                    </button>
                </div>

                {/* Companies Table */}
                <div className="companies-table-container">
                    <table className="companies-table">
                        <thead>
                            <tr>
                                <th>Company</th>
                                <th>Employees</th>
                                <th>Users</th>
                                <th>Plan</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.map(company => {
                                const stats = company.stats || {};
                                const isCurrentCompany = currentCompany?.id === company.id;
                                
                                return (
                                    <tr key={company.id} className={isCurrentCompany ? 'current-company' : ''}>
                                        <td>
                                            <div className="company-info">
                                                <div className="company-avatar">
                                                    {company.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="company-name">{company.name}</div>
                                                    <div className="company-slug">{company.slug || company.name.toLowerCase().replace(/\s/g, '-')}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="stats-cell">
                                            <span className="stat-number">{stats.total_employees || 0}</span>
                                        </td>
                                        <td className="stats-cell">
                                            <span className="stat-number">{stats.total_users || 0}</span>
                                        </td>
                                        <td>
                                            <span className={`plan-badge ${company.subscription_plan}`}>
                                                {company.subscription_plan}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${company.is_active ? 'active' : 'inactive'}`}>
                                                {company.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="actions-cell">
                                            {!isCurrentCompany && company.is_active && (
                                                <button 
                                                    className="switch-btn"
                                                    onClick={() => handleSwitchCompany(company.id)}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                                        <polyline points="16 17 21 12 16 7" />
                                                        <line x1="21" y1="12" x2="9" y2="12" />
                                                    </svg>
                                                    Switch
                                                </button>
                                            )}
                                            <button 
                                                className="edit-btn-small"
                                                onClick={() => editCompany(company)}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M17 3l4 4-7 7H10v-4l7-7z" />
                                                    <path d="M4 20h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Add/Edit Modal */}
                {showAddModal && (
                    <div className="modal-overlay" onClick={() => { setShowAddModal(false); setEditingCompany(null); resetForm(); }}>
                        <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{editingCompany ? 'Edit Company' : 'Add New Company'}</h2>
                                <button className="modal-close" onClick={() => { setShowAddModal(false); setEditingCompany(null); resetForm(); }}>×</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Company Name *</label>
                                        <input 
                                            type="text" 
                                            value={formData.name} 
                                            onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                            required 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Phone</label>
                                            <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                                        </div>
                                        <div className="form-group">
                                            <label>Website</label>
                                            <input type="text" value={formData.website} onChange={(e) => setFormData({...formData, website: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Address</label>
                                        <textarea rows="2" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Subscription Plan</label>
                                        <select value={formData.subscription_plan} onChange={(e) => setFormData({...formData, subscription_plan: e.target.value})}>
                                            <option value="basic">Basic</option>
                                            <option value="premium">Premium</option>
                                            <option value="enterprise">Enterprise</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="cancel-btn" onClick={() => { setShowAddModal(false); setEditingCompany(null); resetForm(); }}>Cancel</button>
                                    <button type="submit" className="submit-btn">{editingCompany ? 'Update' : 'Create'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Companies;