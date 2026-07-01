// Shows the holiday calendar page.
import React, { useEffect, useMemo, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  HOLIDAY_TYPES,
  deleteHoliday,
  formatHolidayDate,
  getCompanyHolidays,
  getCompanyName,
  normalizeCompanyId,
  refreshCompanyHolidays,
  saveHoliday,
  validateHoliday,
} from '../services/holidays';
import './HolidayCalendar.css';

const emptyForm = {
  name: '',
  date: '',
  description: '',
  type: '',
  recurring: false,
  status: 'Active',
};

// Gets month value data.
const getMonthValue = (dateValue) => String(dateValue || '').slice(5, 7);
// Gets year value data.
const getYearValue = (dateValue) => String(dateValue || '').slice(0, 4);
// Prepares today key.
const todayKey = () => new Date().toISOString().split('T')[0];
// Prepares month name.
const monthName = (month) => new Date(`2026-${month}-01T00:00:00`).toLocaleString('en-US', { month: 'long' });

// Prepares days between.
const daysBetween = (dateValue) => {
  const start = new Date(`${todayKey()}T00:00:00`);
  const end = new Date(`${dateValue}T00:00:00`);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
};

// Shows the holiday calendar component.
const HolidayCalendar = () => {
  const { user } = useAuth();
  const companyId = normalizeCompanyId(user?.companyId || user?.company_id);
  const companyName = getCompanyName(companyId);
  const [holidays, setHolidays] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [monthFilter, setMonthFilter] = useState('All Months');
  const [yearFilter, setYearFilter] = useState('All Years');
  const [currentPage, setCurrentPage] = useState(1);
  const [calendarMonth, setCalendarMonth] = useState('06');
  const [calendarYear, setCalendarYear] = useState('2026');
  const [listTab, setListTab] = useState('upcoming');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [deletingHoliday, setDeletingHoliday] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});

  // Gets holidays data.
  const loadHolidays = async () => {
    try {
      const apiHolidays = await refreshCompanyHolidays(companyId);
      setHolidays(apiHolidays);
    } catch (error) {
      console.error('Holiday load failed:', error);
      setHolidays(getCompanyHolidays(companyId));
      if (localStorage.getItem('token')) {
        toast.error(error.response?.data?.detail || 'Unable to load holidays from backend.');
      }
    }
  };

  // Runs when this screen needs to update data.
  useEffect(() => {
    loadHolidays();
    // Handles update actions.
    const handleUpdate = () => setHolidays(getCompanyHolidays(companyId));
    window.addEventListener('holidaysUpdated', handleUpdate);
    return () => window.removeEventListener('holidaysUpdated', handleUpdate);
  }, [companyId]);

  // Prepares available years.
  const availableYears = useMemo(() => (
    [...new Set(holidays.map((holiday) => getYearValue(holiday.date)).filter(Boolean))].sort()
  ), [holidays]);

  // Helps with filtered holidays.
  const filteredHolidays = holidays.filter((holiday) => {
    const matchesSearch = holiday.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All Types' || holiday.type === typeFilter;
    const matchesStatus = statusFilter === 'All Status' || holiday.status === statusFilter;
    const matchesMonth = monthFilter === 'All Months' || getMonthValue(holiday.date) === monthFilter;
    const matchesYear = yearFilter === 'All Years' || getYearValue(holiday.date) === yearFilter;
    return matchesSearch && matchesType && matchesStatus && matchesMonth && matchesYear;
  });

  const itemsPerPage = 6;
  const totalPages = Math.max(1, Math.ceil(filteredHolidays.length / itemsPerPage));
  const paginatedHolidays = filteredHolidays.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const showingStart = filteredHolidays.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1;
  const showingEnd = Math.min(currentPage * itemsPerPage, filteredHolidays.length);

  // Prepares upcoming holidays.
  const upcomingHolidays = holidays.filter((holiday) => {
    const nextDate = holiday.recurring
      ? `${new Date().getFullYear()}-${getMonthValue(holiday.date)}-${String(holiday.date).slice(8, 10)}`
      : holiday.date;
    return nextDate >= new Date().toISOString().split('T')[0];
  });
  // Prepares past holidays.
  const pastHolidays = holidays.filter((holiday) => holiday.date < todayKey());
  const listHolidays = (listTab === 'upcoming' ? upcomingHolidays : pastHolidays)
    .filter((holiday) => typeFilter === 'All Types' || holiday.type === typeFilter)
    .slice(0, 5);

  // Prepares recurring count.
  const recurringCount = holidays.filter((holiday) => holiday.recurring).length;
  // Prepares holiday type count.
  const holidayTypeCount = new Set(holidays.map((holiday) => holiday.type)).size;
  const dateRangeLabel = yearFilter === 'All Years'
    ? '01 Jan 2026 - 31 Dec 2026'
    : `01 Jan ${yearFilter} - 31 Dec ${yearFilter}`;
  const recurringPreview = (editingHoliday || { ...formData, date: formData.date || '2026-01-26', name: formData.name || 'Republic Day' });
  // Prepares calendar holidays.
  const calendarHolidays = holidays.filter((holiday) => (
    getYearValue(holiday.date) === calendarYear && getMonthValue(holiday.date) === calendarMonth
  ));
  // Prepares calendar days.
  const calendarDays = useMemo(() => {
    const firstDay = new Date(`${calendarYear}-${calendarMonth}-01T00:00:00`);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(Number(calendarYear), Number(calendarMonth), 0).getDate();
    const previousMonthDays = new Date(Number(calendarYear), Number(calendarMonth) - 1, 0).getDate();
    return Array.from({ length: 42 }, (_, index) => {
      const dayNumber = index - startOffset + 1;
      const currentMonth = dayNumber >= 1 && dayNumber <= daysInMonth;
      const label = currentMonth
        ? dayNumber
        : dayNumber < 1
          ? previousMonthDays + dayNumber
          : dayNumber - daysInMonth;
      const date = currentMonth ? `${calendarYear}-${calendarMonth}-${String(dayNumber).padStart(2, '0')}` : null;
      return {
        label,
        currentMonth,
        date,
        holidays: date ? calendarHolidays.filter((holiday) => holiday.date === date) : [],
      };
    });
  }, [calendarHolidays, calendarMonth, calendarYear]);

  // Helps with open create modal.
  const openCreateModal = () => {
    setEditingHoliday(null);
    setFormData(emptyForm);
    setFormErrors({});
    setShowFormModal(true);
  };

  // Helps with open edit modal.
  const openEditModal = (holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      name: holiday.name,
      date: holiday.date,
      description: holiday.description || '',
      type: holiday.type,
      recurring: Boolean(holiday.recurring),
      status: holiday.status || 'Active',
    });
    setFormErrors({});
    setShowFormModal(true);
  };

  // Helps with close form modal.
  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingHoliday(null);
    setFormData(emptyForm);
    setFormErrors({});
  };

  // Handles save holiday actions.
  const handleSaveHoliday = async () => {
    const holidayPayload = { ...formData, companyId };
    const errors = validateHoliday(holidayPayload, editingHoliday?.id || null);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error(errors.duplicate || 'Please complete the required holiday fields.');
      return;
    }

    try {
      await saveHoliday(holidayPayload, user, editingHoliday);
      await loadHolidays();
      closeFormModal();
      toast.success(editingHoliday ? 'Holiday updated successfully!' : 'Holiday created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save holiday');
    }
  };

  // Handles delete holiday actions.
  const handleDeleteHoliday = async () => {
    if (!deletingHoliday) return;
    try {
      await deleteHoliday(deletingHoliday, user);
      await loadHolidays();
      setDeletingHoliday(null);
      toast.success('Holiday deleted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete holiday');
    }
  };

  return (
    <div className="holiday-page">
      <Toaster position="top-right" />

      <div className="holiday-header">
        <div>
          <h1>Holiday Calendar</h1>
          <p>Manage company holidays and calendar rules for {companyName}.</p>
        </div>
        <button className="holiday-primary-btn" onClick={openCreateModal}>+ Add Holiday</button>
      </div>

      <div className="holiday-stats">
        <div className="holiday-stat-card">
          <span>Total Holidays</span>
          <strong>{holidays.length}</strong>
          <small>All time</small>
        </div>
        <div className="holiday-stat-card">
          <span>Upcoming Holidays</span>
          <strong>{upcomingHolidays.length}</strong>
          <small>Next dates</small>
        </div>
        <div className="holiday-stat-card">
          <span>Recurring Holidays</span>
          <strong>{recurringCount}</strong>
          <small>Auto applies annually</small>
        </div>
        <div className="holiday-stat-card">
          <span>Holiday Types</span>
          <strong>{holidayTypeCount}</strong>
          <small>Public, Company, Optional</small>
        </div>
      </div>

      <section className="holiday-company-card">
        <label>
          <span>Company</span>
          <select value={companyId} disabled>
            <option value={companyId}>{companyName}</option>
          </select>
        </label>
        <p>You can manage holidays only for your own company.</p>
      </section>

      <section className="holiday-table-card">
        <div className="holiday-toolbar">
          <input
            type="text"
            placeholder="Search holiday name..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}>
            <option>All Types</option>
            {HOLIDAY_TYPES.map((type) => <option key={type}>{type}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
            <option>All Status</option>
            <option>Active</option>
          </select>
          <select value={monthFilter} onChange={(e) => { setMonthFilter(e.target.value); setCurrentPage(1); }}>
            <option>All Months</option>
            {Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0')).map((month) => (
              <option key={month} value={month}>{monthName(month)}</option>
            ))}
          </select>
          <select value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setCurrentPage(1); }}>
            <option>All Years</option>
            {availableYears.map((year) => <option key={year}>{year}</option>)}
          </select>
          <span className="holiday-date-range">{dateRangeLabel}</span>
        </div>

        <table className="holiday-table">
          <thead>
            <tr>
              <th>Holiday Name</th>
              <th>Date</th>
              <th>Type</th>
              <th>Recurring</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredHolidays.length === 0 ? (
              <tr><td colSpan="6" className="holiday-empty">No holidays found for {companyName}</td></tr>
            ) : (
              paginatedHolidays.map((holiday) => (
                <tr key={holiday.id}>
                  <td>
                    <strong>{holiday.name}</strong>
                    {holiday.description && <span>{holiday.description}</span>}
                  </td>
                  <td>{formatHolidayDate(holiday.date)}</td>
                  <td><span className={`holiday-type ${holiday.type.toLowerCase().replace(/\s+/g, '-')}`}>{holiday.type}</span></td>
                  <td>{holiday.recurring ? 'Yes (Annual)' : 'No'}</td>
                  <td><span className="holiday-status">Active</span></td>
                  <td>
                    <button className="holiday-icon-btn" onClick={() => openEditModal(holiday)} aria-label={`Edit ${holiday.name}`}>Edit</button>
                    <button className="holiday-icon-btn danger" onClick={() => setDeletingHoliday(holiday)} aria-label={`Delete ${holiday.name}`}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="holiday-table-footer">
          <span>Showing {showingStart} to {showingEnd} of {filteredHolidays.length} holidays</span>
          <div className="holiday-pagination">
            <button onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>‹</button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button key={page} className={page === currentPage ? 'active' : ''} onClick={() => setCurrentPage(page)}>{page}</button>
            ))}
            <button onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>›</button>
          </div>
        </div>
      </section>

      <section className="holiday-calendar-grid">
        <div className="holiday-calendar-card">
          <div className="calendar-toolbar">
            <button onClick={() => setCalendarMonth((month) => String(Math.max(1, Number(month) - 1)).padStart(2, '0'))}>‹</button>
            <strong>{monthName(calendarMonth)} {calendarYear}</strong>
            <button onClick={() => setCalendarMonth((month) => String(Math.min(12, Number(month) + 1)).padStart(2, '0'))}>›</button>
            <button onClick={() => { setCalendarMonth('06'); setCalendarYear('2026'); }}>Today</button>
            <div className="calendar-toggle">
              <button className="active">Month</button>
              <button>Year</button>
            </div>
          </div>
          <div className="calendar-board">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day} className="calendar-day-name">{day}</div>)}
            {calendarDays.map((day, index) => (
              <div key={`${day.date || index}`} className={`calendar-cell ${day.currentMonth ? '' : 'muted'}`}>
                <span>{day.label}</span>
                {day.holidays.map((holiday) => (
                  <i key={holiday.id} className={holiday.type.toLowerCase().replace(/\s+/g, '-')}></i>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="holiday-side-card">
          <h2>Holiday Types</h2>
          {HOLIDAY_TYPES.map((type) => (
            <div key={type} className="holiday-legend-row">
              <i className={type.toLowerCase().replace(/\s+/g, '-')}></i>
              <span>{type}</span>
            </div>
          ))}
          <h2>Upcoming Holidays</h2>
          {upcomingHolidays.slice(0, 4).map((holiday) => (
            <div key={holiday.id} className="compact-holiday">
              <i className={holiday.type.toLowerCase().replace(/\s+/g, '-')}></i>
              <span>{formatHolidayDate(holiday.date)}</span>
              <strong>{holiday.name}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="holiday-list-card">
        <div className="holiday-tabs">
          <button className={listTab === 'upcoming' ? 'active' : ''} onClick={() => setListTab('upcoming')}>Upcoming Holidays</button>
          <button className={listTab === 'past' ? 'active' : ''} onClick={() => setListTab('past')}>Past Holidays</button>
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option>All Types</option>
          {HOLIDAY_TYPES.map((type) => <option key={type}>{type}</option>)}
        </select>
        <div className="holiday-list-items">
          {listHolidays.map((holiday) => (
            <div key={holiday.id} className="holiday-list-item">
              <div>
                <i className={holiday.type.toLowerCase().replace(/\s+/g, '-')}></i>
                <span>{formatHolidayDate(holiday.date)}</span>
                <strong>{holiday.name}</strong>
              </div>
              <span className={`holiday-type ${holiday.type.toLowerCase().replace(/\s+/g, '-')}`}>{holiday.type}</span>
              {listTab === 'upcoming' && <small>In {Math.max(0, daysBetween(holiday.date))} days</small>}
            </div>
          ))}
        </div>
      </section>

      <section className="holiday-insights">
        <div>
          <h2>Duplicate Holiday Validation</h2>
          <div className="holiday-validation-box">
            <strong>Other Validations</strong>
            <span>Holiday name is mandatory.</span>
            <span>Holiday date is mandatory.</span>
            <span>Duplicate holidays on the same date are not allowed for the same company.</span>
            <span>Recurring holidays will be applied automatically every year.</span>
          </div>
        </div>
        <div>
          <h2>Recurring Holiday Setup</h2>
          <div className="recurring-preview">
            <label>Holiday Name<input value={recurringPreview.name || ''} readOnly /></label>
            <label>Date<input value={recurringPreview.date ? formatHolidayDate(recurringPreview.date).replace(/ 2026$/, '') : ''} readOnly /></label>
            <label className="holiday-checkbox"><input type="checkbox" checked={Boolean(recurringPreview.recurring)} readOnly /><span>Yes, repeat every year</span></label>
            <p>This holiday will be automatically applied every year.</p>
          </div>
        </div>
        <div>
          <h2>Auto Applied Years</h2>
          <table className="applied-years-table">
            <tbody>
              {[2026, 2027, 2028, 2029, 2030].map((year) => (
                <tr key={year}>
                  <td>{year}</td>
                  <td>{recurringPreview.date ? formatHolidayDate(`${year}-${getMonthValue(recurringPreview.date)}-${String(recurringPreview.date).slice(8, 10)}`).replace(` ${year}`, ` ${year}`) : '-'}</td>
                  <td><span className="holiday-status">Applied</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showFormModal && (
        <div className="holiday-modal-overlay" onClick={closeFormModal}>
          <div className="holiday-modal" onClick={(e) => e.stopPropagation()}>
            <div className="holiday-modal-header">
              <h2>{editingHoliday ? 'Edit Holiday' : 'Create New Holiday'}</h2>
              <button onClick={closeFormModal}>x</button>
            </div>
            <div className="holiday-form">
              {formErrors.duplicate && <div className="holiday-error-box">{formErrors.duplicate}</div>}
              <label>
                <span>Holiday Name *</span>
                <input className={formErrors.name ? 'error' : ''} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                {formErrors.name && <small>{formErrors.name}</small>}
              </label>
              <label>
                <span>Date *</span>
                <input type="date" className={formErrors.date ? 'error' : ''} value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                {formErrors.date && <small>{formErrors.date}</small>}
              </label>
              <label>
                <span>Holiday Type *</span>
                <select className={formErrors.type ? 'error' : ''} value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                  <option value="">Select type</option>
                  {HOLIDAY_TYPES.map((type) => <option key={type}>{type}</option>)}
                </select>
                {formErrors.type && <small>{formErrors.type}</small>}
              </label>
              <label className="holiday-checkbox">
                <input type="checkbox" checked={formData.recurring} onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })} />
                <span>Yes, repeat every year</span>
              </label>
              <label>
                <span>Description</span>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </label>
              <label>
                <span>Company</span>
                <select value={companyId} disabled>
                  <option>{companyName}</option>
                </select>
              </label>
              {editingHoliday && (
                <label>
                  <span>Status *</span>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                    <option>Active</option>
                  </select>
                </label>
              )}
            </div>
            <div className="holiday-modal-footer">
              <button className="holiday-secondary-btn" onClick={closeFormModal}>Cancel</button>
              <button className="holiday-primary-btn" onClick={handleSaveHoliday}>{editingHoliday ? 'Update Holiday' : 'Create Holiday'}</button>
            </div>
          </div>
        </div>
      )}

      {deletingHoliday && (
        <div className="holiday-modal-overlay" onClick={() => setDeletingHoliday(null)}>
          <div className="holiday-delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="holiday-warning-icon">!</div>
            <h2>Delete Holiday</h2>
            <p>Are you sure you want to delete "{deletingHoliday.name}"?</p>
            <span>This action will immediately remove the holiday and update attendance calculations.</span>
            <div className="holiday-modal-footer">
              <button className="holiday-secondary-btn" onClick={() => setDeletingHoliday(null)}>Cancel</button>
              <button className="holiday-danger-btn" onClick={handleDeleteHoliday}>Delete Holiday</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HolidayCalendar;