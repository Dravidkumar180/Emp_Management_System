const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

const getCompanyId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.companyId || user.company_id || 'company-a';
  } catch {
    return 'company-a';
  }
};

export const fetchAuditLogs = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return [];
  }

  const response = await fetch(`${API_BASE_URL}/audit-logs`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Company-Id': getCompanyId()
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch audit logs');
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
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
    return null;
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
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Audit log error:', error);
    return null;
  }
};
