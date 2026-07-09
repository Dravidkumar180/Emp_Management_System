// Shows employee and admin skills and certifications views.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Award,
  Download,
  Edit3,
  FileText,
  Filter,
  Plus,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  createCertification,
  createSkill,
  deleteCertification,
  deleteSkill,
  exportCompetencyReport,
  fetchAdminCompetencies,
  fetchCompetencyProfile,
  fileToCertificatePayload,
  updateCertification,
  updateSkill,
} from '../services/skillsCertifications';
import './SkillsCertifications.css';

const emptySkill = {
  skill_name: '',
  proficiency_level: 'Intermediate',
  years_experience: 0,
  is_primary: false,
};

const emptyCertification = {
  certification_name: '',
  issuing_organization: '',
  issue_date: '',
  expiry_date: '',
  document_name: '',
  document_type: '',
  document_data: '',
};

const adminFilters = {
  skill: '',
  employee: '',
  skill_level: '',
  min_experience: '',
  certification: '',
  status: '',
};

const levelOptions = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const statusOptions = ['Valid', 'Expiring Soon', 'Expired'];

const statusClass = (status) => status.toLowerCase().replace(/\s+/g, '-');

const SummaryCard = ({ icon: Icon, label, value, tone }) => (
  <div className={`skills-summary-card ${tone}`}>
    <span className="skills-summary-icon"><Icon size={22} /></span>
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  </div>
);

const EmployeeSkillsView = () => {
  const [profile, setProfile] = useState(null);
  const [skillForm, setSkillForm] = useState(emptySkill);
  const [certForm, setCertForm] = useState(emptyCertification);
  const [editingSkillId, setEditingSkillId] = useState(null);
  const [editingCertId, setEditingCertId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      setProfile(await fetchCompetencyProfile());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const summary = profile?.summary || {};
  const skills = profile?.skills || [];
  const certifications = profile?.certifications || [];
  const expiringCertifications = certifications.filter((item) => item.status === 'Expiring Soon' || item.status === 'Expired');

  const saveSkill = async (event) => {
    event.preventDefault();
    const payload = {
      ...skillForm,
      years_experience: Number(skillForm.years_experience || 0),
    };
    if (editingSkillId) {
      await updateSkill(editingSkillId, payload);
    } else {
      await createSkill(payload);
    }
    setSkillForm(emptySkill);
    setEditingSkillId(null);
    loadProfile();
  };

  const editSkill = (skill) => {
    setSkillForm({
      skill_name: skill.skill_name,
      proficiency_level: skill.proficiency_level,
      years_experience: skill.years_experience,
      is_primary: skill.is_primary,
    });
    setEditingSkillId(skill.id);
  };

  const removeSkill = async (id) => {
    await deleteSkill(id);
    loadProfile();
  };

  const saveCertification = async (event) => {
    event.preventDefault();
    const payload = { ...certForm };
    if (!payload.expiry_date) payload.expiry_date = null;
    if (editingCertId) {
      await updateCertification(editingCertId, payload);
    } else {
      await createCertification(payload);
    }
    setCertForm(emptyCertification);
    setEditingCertId(null);
    loadProfile();
  };

  const editCertification = (certification) => {
    setCertForm({
      certification_name: certification.certification_name,
      issuing_organization: certification.issuing_organization,
      issue_date: certification.issue_date || '',
      expiry_date: certification.expiry_date || '',
      document_name: certification.document_name || '',
      document_type: certification.document_type || '',
      document_data: certification.document_data || '',
    });
    setEditingCertId(certification.id);
  };

  const removeCertification = async (id) => {
    await deleteCertification(id);
    loadProfile();
  };

  const handleFileChange = async (event) => {
    const filePayload = await fileToCertificatePayload(event.target.files?.[0]);
    setCertForm((current) => ({ ...current, ...filePayload }));
  };

  if (loading) {
    return <div className="skills-loading">Loading skills and certifications...</div>;
  }

  return (
    <div className="skills-page">
      <div className="skills-page-header">
        <div>
          <h1>Skills & Certifications</h1>
          <p>Manage your competencies, certificates, and profile completion.</p>
        </div>
      </div>

      <div className="skills-summary-grid">
        <SummaryCard icon={Award} label="Total Skills" value={summary.total_skills || 0} tone="blue" />
        <SummaryCard icon={Star} label="Primary Skills" value={summary.primary_skills || 0} tone="amber" />
        <SummaryCard icon={ShieldCheck} label="Active Certifications" value={summary.active_certifications || 0} tone="green" />
        <SummaryCard icon={FileText} label="Expired Certifications" value={summary.expired_certifications || 0} tone="red" />
        <div className="skills-summary-card completion">
          <span className="skills-summary-icon"><Users size={22} /></span>
          <div>
            <strong>{summary.profile_completion || 0}%</strong>
            <span>Profile Completion</span>
            <div className="completion-track"><span style={{ width: `${summary.profile_completion || 0}%` }} /></div>
          </div>
        </div>
      </div>

      {expiringCertifications.length > 0 && (
        <div className="expiry-strip">
          {expiringCertifications.map((item) => (
            <span key={item.id}>{item.certification_name} is {item.status.toLowerCase()}</span>
          ))}
        </div>
      )}

      <div className="skills-workspace">
        <form className="skills-panel" onSubmit={saveSkill}>
          <div className="panel-title">
            <h2><Plus size={18} /> {editingSkillId ? 'Edit Skill' : 'Add Skill'}</h2>
            {editingSkillId && <button type="button" onClick={() => { setEditingSkillId(null); setSkillForm(emptySkill); }}>Cancel</button>}
          </div>
          <label>Skill Name<input value={skillForm.skill_name} onChange={(event) => setSkillForm({ ...skillForm, skill_name: event.target.value })} required /></label>
          <label>Level<select value={skillForm.proficiency_level} onChange={(event) => setSkillForm({ ...skillForm, proficiency_level: event.target.value })}>{levelOptions.map((level) => <option key={level}>{level}</option>)}</select></label>
          <label>Experience<input type="number" min="0" step="0.5" value={skillForm.years_experience} onChange={(event) => setSkillForm({ ...skillForm, years_experience: event.target.value })} /></label>
          <label className="inline-check"><input type="checkbox" checked={skillForm.is_primary} onChange={(event) => setSkillForm({ ...skillForm, is_primary: event.target.checked })} /> Primary Skill</label>
          <button className="primary-action" type="submit">Save</button>
        </form>

        <form className="skills-panel" onSubmit={saveCertification}>
          <div className="panel-title">
            <h2><Plus size={18} /> {editingCertId ? 'Edit Certification' : 'Add Certification'}</h2>
            {editingCertId && <button type="button" onClick={() => { setEditingCertId(null); setCertForm(emptyCertification); }}>Cancel</button>}
          </div>
          <label>Certification Name<input value={certForm.certification_name} onChange={(event) => setCertForm({ ...certForm, certification_name: event.target.value })} required /></label>
          <label>Organization<input value={certForm.issuing_organization} onChange={(event) => setCertForm({ ...certForm, issuing_organization: event.target.value })} required /></label>
          <div className="date-row">
            <label>Issue Date<input type="date" value={certForm.issue_date} onChange={(event) => setCertForm({ ...certForm, issue_date: event.target.value })} required /></label>
            <label>Expiry Date<input type="date" value={certForm.expiry_date || ''} onChange={(event) => setCertForm({ ...certForm, expiry_date: event.target.value })} /></label>
          </div>
          <label className="file-input"><Upload size={16} /> Upload Certificate<input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} /></label>
          {certForm.document_name && <span className="document-name">{certForm.document_name}</span>}
          <button className="primary-action" type="submit">Save</button>
        </form>
      </div>

      <div className="skills-tables">
        <div className="skills-table-card">
          <h2>My Skills</h2>
          <table>
            <thead><tr><th>Skill</th><th>Level</th><th>Experience</th><th>Primary</th><th>Actions</th></tr></thead>
            <tbody>
              {skills.map((skill) => (
                <tr key={skill.id}>
                  <td>{skill.skill_name}</td>
                  <td><span className="level-pill">{skill.proficiency_level}</span></td>
                  <td>{skill.years_experience} Years</td>
                  <td>{skill.is_primary ? <Star className="star-on" size={17} fill="currentColor" /> : '-'}</td>
                  <td className="row-actions">
                    <button onClick={() => editSkill(skill)} aria-label="Edit skill"><Edit3 size={16} /></button>
                    <button onClick={() => removeSkill(skill.id)} aria-label="Delete skill"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {skills.length === 0 && <tr><td colSpan="5">No skills added yet.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="skills-table-card">
          <h2>My Certifications</h2>
          <table>
            <thead><tr><th>Certification</th><th>Organization</th><th>Issue</th><th>Expiry</th><th>Status</th><th>Document</th><th>Actions</th></tr></thead>
            <tbody>
              {certifications.map((certification) => (
                <tr key={certification.id}>
                  <td>{certification.certification_name}</td>
                  <td>{certification.issuing_organization}</td>
                  <td>{certification.issue_date}</td>
                  <td>{certification.expiry_date || 'No expiry'}</td>
                  <td><span className={`cert-status ${statusClass(certification.status)}`}>{certification.status}</span></td>
                  <td>{certification.document_name ? <FileText size={16} /> : '-'}</td>
                  <td className="row-actions">
                    <button onClick={() => editCertification(certification)} aria-label="Edit certification"><Edit3 size={16} /></button>
                    <button onClick={() => removeCertification(certification.id)} aria-label="Delete certification"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {certifications.length === 0 && <tr><td colSpan="7">No certifications added yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AdminSkillsView = () => {
  const [filters, setFilters] = useState(adminFilters);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const queryFilters = useMemo(() => Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== '')
  ), [filters]);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await fetchAdminCompetencies(queryFilters));
    } finally {
      setLoading(false);
    }
  }, [queryFilters]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const totals = {
    employees: rows.length,
    withSkills: rows.filter((row) => row.skills.length > 0).length,
    withCertifications: rows.filter((row) => row.certifications.length > 0).length,
  };

  const updateFilter = (name, value) => setFilters((current) => ({ ...current, [name]: value }));
  const exportReport = (format) => exportCompetencyReport({ ...queryFilters, format });

  return (
    <div className="skills-page">
      <div className="skills-page-header admin-header">
        <div>
          <h1>Employee Skills & Certifications</h1>
          <p>Search competencies and monitor certification status for your company.</p>
        </div>
        <div className="export-actions">
          <button onClick={() => exportReport('excel')}><Download size={16} /> Excel</button>
          <button onClick={() => exportReport('pdf')}><Download size={16} /> PDF</button>
          <button onClick={() => exportReport('csv')}><Download size={16} /> CSV</button>
        </div>
      </div>

      <div className="skills-summary-grid admin-summary">
        <SummaryCard icon={Users} label="Filtered Employees" value={totals.employees} tone="blue" />
        <SummaryCard icon={Star} label="With Skills" value={totals.withSkills} tone="green" />
        <SummaryCard icon={Award} label="With Certifications" value={totals.withCertifications} tone="amber" />
      </div>

      <div className="admin-filter-bar">
        <label><Search size={16} /> <input placeholder="Search employee" value={filters.employee} onChange={(event) => updateFilter('employee', event.target.value)} /></label>
        <label><Search size={16} /> <input placeholder="Search skill" value={filters.skill} onChange={(event) => updateFilter('skill', event.target.value)} /></label>
        <select value={filters.skill_level} onChange={(event) => updateFilter('skill_level', event.target.value)}>
          <option value="">All Skill Levels</option>
          {levelOptions.map((level) => <option key={level}>{level}</option>)}
        </select>
        <input type="number" min="0" placeholder="Experience 5+" value={filters.min_experience} onChange={(event) => updateFilter('min_experience', event.target.value)} />
        <input placeholder="Certification" value={filters.certification} onChange={(event) => updateFilter('certification', event.target.value)} />
        <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
          <option value="">All Status</option>
          {statusOptions.map((status) => <option key={status}>{status}</option>)}
        </select>
        <button onClick={loadRows}><Filter size={16} /> Apply</button>
      </div>

      <div className="skills-table-card admin-table-card">
        <h2>Employee Directory</h2>
        <div className="admin-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Top Skills</th>
                <th>Primary</th>
                <th>Total Skills</th>
                <th>Avg Experience</th>
                <th>Certifications</th>
                <th>Valid</th>
                <th>Expiring</th>
                <th>Expired</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="10">Loading competency profiles...</td></tr>}
              {!loading && rows.map((row) => {
                const valid = row.certifications.filter((item) => item.status === 'Valid').length;
                const expiring = row.certifications.filter((item) => item.status === 'Expiring Soon').length;
                const expired = row.certifications.filter((item) => item.status === 'Expired').length;
                const averageExperience = row.skills.length
                  ? (row.skills.reduce((total, item) => total + Number(item.years_experience || 0), 0) / row.skills.length).toFixed(1)
                  : '0.0';
                return (
                  <tr key={row.employee.user_id}>
                    <td><strong>{row.employee.name}</strong><span>{row.employee.email}</span></td>
                    <td>{row.employee.department || '-'}</td>
                    <td className="skill-chip-cell">{row.skills.slice(0, 3).map((skill) => <span key={skill.id}>{skill.skill_name}<small>{skill.proficiency_level}</small></span>)}</td>
                    <td>{row.summary.primary_skills}</td>
                    <td>{row.summary.total_skills}</td>
                    <td>{averageExperience}</td>
                    <td>{row.certifications.length}</td>
                    <td className="valid-count">{valid}</td>
                    <td className="expiring-count">{expiring}</td>
                    <td className="expired-count">{expired}</td>
                  </tr>
                );
              })}
              {!loading && rows.length === 0 && <tr><td colSpan="10">No employees match the selected filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SkillsCertifications = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  return isAdmin ? <AdminSkillsView /> : <EmployeeSkillsView />;
};

export default SkillsCertifications;
