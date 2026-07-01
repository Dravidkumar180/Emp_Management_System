// Connects the frontend to holidays API features.
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

export const HOLIDAYS_STORAGE_KEY = 'companyHolidays';
export const HOLIDAY_TYPES = ['Public Holiday', 'Company Holiday', 'Optional Holiday'];

// Helps with normalize company id.
export const normalizeCompanyId = (companyId) => {
  if (companyId === 1 || companyId === '1') return 'company-a';
  if (companyId === 2 || companyId === '2') return 'company-b';
  return companyId || 'company-a';
};

// Converts to API company ID.
export const toApiCompanyId = (companyId) => {
  if (companyId === 'company-a') return 1;
  if (companyId === 'company-b') return 2;
  return companyId || 1;
};

// Gets company name data.
export const getCompanyName = (companyId) => (
  normalizeCompanyId(companyId) === 'company-b' ? 'Company B' : 'Company A'
);

// Prepares auth headers.
const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Gets holidays data.
const readHolidays = () => {
  try {
    return JSON.parse(localStorage.getItem(HOLIDAYS_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

// Writes holidays.
const writeHolidays = (holidays) => {
  localStorage.setItem(HOLIDAYS_STORAGE_KEY, JSON.stringify(holidays));
  window.dispatchEvent(new CustomEvent('holidaysUpdated'));
};

// Helps with normalize holiday.
const normalizeHoliday = (holiday) => ({
  id: holiday.id,
  companyId: normalizeCompanyId(holiday.companyId || holiday.company_id),
  name: holiday.name,
  date: holiday.date,
  description: holiday.description || '',
  type: holiday.type || holiday.holiday_type,
  recurring: Boolean(holiday.recurring),
  status: holiday.status || 'Active',
  createdAt: holiday.createdAt || holiday.created_at,
  updatedAt: holiday.updatedAt || holiday.updated_at,
});

// Prepares date parts.
const dateParts = (dateValue) => {
  const [year, month, day] = String(dateValue || '').split('-');
  return { year, month, day, monthDay: `${month}-${day}` };
};

// Helps with format holiday date.
export const formatHolidayDate = (dateValue) => {
  if (!dateValue) return '-';
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Prepares refresh company holidays.
export const refreshCompanyHolidays = async (companyId) => {
  const normalizedCompanyId = normalizeCompanyId(companyId);
  const response = await axios.get(`${API_BASE_URL}/holidays`, {
    headers: authHeaders(),
  });
  const apiHolidays = response.data.map(normalizeHoliday);
  // Prepares other company cached.
  const otherCompanyCached = readHolidays().filter((holiday) => normalizeCompanyId(holiday.companyId) !== normalizedCompanyId);
  writeHolidays([...apiHolidays, ...otherCompanyCached]);
  return apiHolidays;
};

// Gets holidays data.
export const getHolidays = () => readHolidays().filter((holiday) => holiday.status !== 'Deleted');

// Gets company holidays data.
export const getCompanyHolidays = (companyId) => {
  const normalizedCompanyId = normalizeCompanyId(companyId);
  return getHolidays()
    .filter((holiday) => normalizeCompanyId(holiday.companyId) === normalizedCompanyId)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
};

// Gets holiday for date data.
export const getHolidayForDate = (companyId, dateValue) => {
  const normalizedCompanyId = normalizeCompanyId(companyId);
  const target = dateParts(dateValue);

  return getCompanyHolidays(normalizedCompanyId).find((holiday) => {
    const holidayDate = dateParts(holiday.date);
    if (holiday.date === dateValue) return true;
    return holiday.recurring && holidayDate.monthDay === target.monthDay;
  }) || null;
};

// Gets holiday for date data.
export const fetchHolidayForDate = async (dateValue) => {
  const response = await axios.get(`${API_BASE_URL}/holidays/date/${dateValue}`, {
    headers: authHeaders(),
  });
  return response.data ? normalizeHoliday(response.data) : null;
};

// Helps with validate holiday.
export const validateHoliday = (holiday, currentId = null) => {
  const errors = {};
  if (!holiday.name?.trim()) errors.name = 'Holiday name is required.';
  if (!holiday.date) errors.date = 'Holiday date is required.';
  if (!holiday.type) errors.type = 'Holiday type is required.';

  if (holiday.date) {
    // Prepares duplicate.
    const duplicate = getCompanyHolidays(holiday.companyId).find((existing) => (
      existing.id !== currentId &&
      existing.date === holiday.date
    ));
    if (duplicate) {
      errors.duplicate = `A holiday already exists on ${formatHolidayDate(holiday.date)} for ${getCompanyName(holiday.companyId)}.`;
    }
  }

  return errors;
};

// Saves holiday data.
export const saveHoliday = async (holiday, user, existingHoliday = null) => {
  const companyId = normalizeCompanyId(holiday.companyId || user?.companyId || user?.company_id);
  const payload = {
    name: holiday.name.trim(),
    date: holiday.date,
    description: holiday.description?.trim() || '',
    holiday_type: holiday.type,
    recurring: Boolean(holiday.recurring),
    status: holiday.status || 'Active',
  };

  const response = existingHoliday
    ? await axios.put(`${API_BASE_URL}/holidays/${existingHoliday.id}`, payload, { headers: authHeaders() })
    : await axios.post(`${API_BASE_URL}/holidays`, payload, { headers: authHeaders() });

  const savedHoliday = normalizeHoliday(response.data);
  const cached = readHolidays();
  const nextHolidays = existingHoliday
    ? cached.map((item) => item.id === savedHoliday.id ? savedHoliday : item)
    : [savedHoliday, ...cached.filter((item) => item.id !== savedHoliday.id)];
  writeHolidays(nextHolidays);
  await refreshCompanyHolidays(companyId);
  return savedHoliday;
};

// Removes holiday data.
export const deleteHoliday = async (holiday) => {
  await axios.delete(`${API_BASE_URL}/holidays/${holiday.id}`, {
    headers: authHeaders(),
  });
  // Prepares next holidays.
  const nextHolidays = readHolidays().filter((item) => item.id !== holiday.id);
  writeHolidays(nextHolidays);
  await refreshCompanyHolidays(holiday.companyId);
};