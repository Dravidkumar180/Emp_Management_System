const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';
const LOCAL_AUDIT_LOGS_KEY = 'localAuditLogs';

const getCompanyId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.companyId || user.company_id || 'company-a';
  } catch {
    return 'company-a';
  }
};

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

const readLocalAuditLogs = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_AUDIT_LOGS_KEY) || '[]');
  } catch {
    return [];
  }
};

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
  const user = getCurrentUser();
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
  const logs = readLocalAuditLogs();
  writeLocalAuditLogs([entry, ...logs].slice(0, 500));
  return entry;
};

export const fetchAuditLogs = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return readLocalAuditLogs().filter((log) => (log.company_id || 'company-a') === getCompanyId());
  }

  const localLogs = readLocalAuditLogs().filter((log) => (log.company_id || 'company-a') === getCompanyId());

  try {
    const response = await fetch(`${API_BASE_URL}/audit-logs`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Company-Id': getCompanyId()
      }
    });

    if (!response.ok) {
      return localLogs;
    }

    const data = await response.json();
    const apiLogs = Array.isArray(data) ? data : [];
    return [...localLogs, ...apiLogs].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  } catch {
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
  const token = localStorage.getItem('token');
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

    return await response.json();
  } catch (error) {
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
