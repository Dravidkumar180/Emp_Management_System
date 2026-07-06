// Connects the frontend to audit API features.
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';
const LOCAL_AUDIT_LOGS_KEY = 'localAuditLogs';

// Gets company id data.
const getCompanyId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.companyId || user.company_id || 'company-a';
  } catch {
    return 'company-a';
  }
};

// Gets current user data.
const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

// Reads local audit logs data from storage.
const readLocalAuditLogs = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_AUDIT_LOGS_KEY) || '[]');
  } catch {
    return [];
  }
};

// Writes local audit logs.
const writeLocalAuditLogs = (logs) => {
  localStorage.setItem(LOCAL_AUDIT_LOGS_KEY, JSON.stringify(logs));
};

const createLocalAuditLog = ({
  action,
  entityType,
  entityId,
  entityName,
  details,
  oldValue,
  newValue
}) => {
  // Gets user for audit entry.
  const user = getCurrentUser();
  // Builds local audit entry.
  const entry = {
    id: `local-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    action,
    entity_type: entityType,
    entity_id: Number.isInteger(entityId) ? entityId : null,
    entity_name: entityName || null,
    details: details || null,
    old_value: oldValue ? JSON.stringify(oldValue) : null,
    new_value: newValue ? JSON.stringify(newValue) : null,
    user_name: user.name || user.email?.split('@')[0] || entityName || 'System',
    user_email: user.email || null,
    company_id: getCompanyId(),
    created_at: new Date().toISOString(),
    source: 'local',
  };
  // Keeps latest local logs.
  const logs = readLocalAuditLogs();
  writeLocalAuditLogs([entry, ...logs].slice(0, 500));
  return entry;
};

// Gets audit logs data.
export const fetchAuditLogs = async () => {
  // Gets saved login token.
  const token = localStorage.getItem('token');
  // Uses local logs without token.
  if (!token) {
    return readLocalAuditLogs().filter((log) => (log.company_id || 'company-a') === getCompanyId());
  }

  // Gets local company logs.
  const localLogs = readLocalAuditLogs().filter((log) => (log.company_id || 'company-a') === getCompanyId());

  try {
    // Requests audit logs from API.
    const response = await fetch(`${API_BASE_URL}/audit-logs`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Company-Id': getCompanyId()
      }
    });

    // Uses local logs on API failure.
    if (!response.ok) {
      return localLogs;
    }

    // Combines local and API logs.
    const data = await response.json();
    const apiLogs = Array.isArray(data) ? data : [];
    return [...localLogs, ...apiLogs].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  } catch {
    // Uses local logs on error.
    return localLogs;
  }
};

export const logAuditAction = async ({
  action,
  entityType,
  entityId,
  entityName,
  details,
  oldValue,
  newValue
}) => {
  // Gets saved login token.
  const token = localStorage.getItem('token');
  // Saves locally without token.
  if (!token) {
    return createLocalAuditLog({
      action,
      entityType,
      entityId,
      entityName,
      details,
      oldValue,
      newValue
    });
  }

  try {
    // Sends audit log to API.
    const response = await fetch(`${API_BASE_URL}/audit-logs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Company-Id': getCompanyId(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action,
        entity_type: entityType,
        entity_id: Number.isInteger(entityId) ? entityId : null,
        entity_name: entityName || null,
        details: details || null,
        old_value: oldValue ? JSON.stringify(oldValue) : null,
        new_value: newValue ? JSON.stringify(newValue) : null
      })
    });

    // Saves locally if API fails.
    if (!response.ok) {
      return createLocalAuditLog({
        action,
        entityType,
        entityId,
        entityName,
        details,
        oldValue,
        newValue
      });
    }

    // Returns saved API log.
    return await response.json();
  } catch (error) {
    // Saves locally on error.
    console.error('Audit log error:', error);
    return createLocalAuditLog({
      action,
      entityType,
      entityId,
      entityName,
      details,
      oldValue,
      newValue
    });
  }
};
