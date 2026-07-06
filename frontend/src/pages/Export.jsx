// Shows the export page.
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { getAllEmployees } from '../services/api';
import { fetchAuditLogs, logAuditAction } from '../services/audit';
import './Export.css';

const EXPORT_HISTORY_PREFIX = 'dataExportHistory';
const USER_ATTENDANCE_KEY = 'userAttendanceRecords';
const LEAVE_REQUESTS_KEY = 'userLeaveRequests';

const DATASETS = [
  { id: 'employees', label: 'Employees', icon: 'users' },
  { id: 'attendance', label: 'Attendance', icon: 'calendar' },
  { id: 'leaveRequests', label: 'Leave Requests', icon: 'plane' },
  { id: 'auditLogs', label: 'Audit Logs', icon: 'document' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
  { id: 'analytics', label: 'Analytics', icon: 'chart' },
];

const FORMAT_OPTIONS = [
  { id: 'csv', label: 'CSV' },
  { id: 'excel', label: 'Excel (.xlsx)' },
  { id: 'pdf', label: 'PDF' },
];

// Helps with normalize company id.
const normalizeCompanyId = (companyId) => companyId || 'company-a';

// Prepares company name from ID.
const companyNameFromId = (companyId) => {
  if (companyId === 'company-b' || companyId === 2 || companyId === '2') return 'Company B';
  return 'Company A';
};

// Reads saved data.
const readStorage = (key, fallback = []) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

// Writes storage.
const writeStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Formats only date.
const formatDate = (value) => {
  // Handles empty date.
  if (!value) return '-';
  const date = new Date(value);
  // Handles invalid date.
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Formats date and time.
const formatDateTime = (value) => {
  // Handles empty time.
  if (!value) return '-';
  const date = new Date(value);
  // Handles invalid time.
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Helps with sanitize file name.
const sanitizeFileName = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Helps with escape CSV.
const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

// Helps with escape html.
const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

// Helps with escape PDF text.
const escapePdfText = (value) => String(value ?? '')
  .replace(/\\/g, '\\\\')
  .replace(/\(/g, '\\(')
  .replace(/\)/g, '\\)');

// Builds CSV content.
const buildCsv = (rows) => {
  // Stops when no rows.
  if (!rows.length) return '';
  // Gets table headers.
  const headers = Object.keys(rows[0]);
  return [headers.join(',')]
    .concat(rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(',')))
    .join('\n');
};

// Builds Excel HTML.
const buildExcelHtml = (rows, title) => {
  // Gets table headers.
  const headers = rows.length ? Object.keys(rows[0]) : ['No Data'];
  // Builds table rows.
  const body = rows.length
    ? rows.map((row) => `<tr>${headers.map((header) => `<td>${escapeHtml(row[header])}</td>`).join('')}</tr>`).join('')
    : '<tr><td>No records found</td></tr>';

  return `
    <html>
      <head><meta charset="utf-8" /></head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <table border="1">
          <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </body>
    </html>
  `;
};

// Builds PDF content.
const buildPdf = (rows, title) => {
  // Adds PDF title lines.
  const lines = [title, `Generated: ${formatDateTime(new Date().toISOString())}`, ''];
  const headers = rows.length ? Object.keys(rows[0]) : [];
  // Adds limited preview rows.
  rows.slice(0, 22).forEach((row) => {
    lines.push(headers.map((header) => `${header}: ${row[header] ?? '-'}`).join(' | ').slice(0, 105));
  });
  // Shows omitted row count.
  if (rows.length > 22) lines.push(`... ${rows.length - 22} more records omitted in PDF preview`);
  // Shows empty PDF message.
  if (!rows.length) lines.push('No records found');

  // Prepares text commands.
  const textCommands = lines.map((line, index) => `BT /F1 9 Tf 40 ${760 - (index * 22)} Td (${escapePdfText(line)}) Tj ET`).join('\n');
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${textCommands.length} >> stream\n${textCommands}\nendstream endobj`,
  ];
  let offset = '%PDF-1.4\n'.length;
  const xref = ['0000000000 65535 f '];
  // Builds PDF body.
  const body = objects.map((object) => {
    xref.push(String(offset).padStart(10, '0') + ' 00000 n ');
    offset += object.length + 1;
    return object;
  }).join('\n');
  const startXref = offset;
  return `%PDF-1.4\n${body}\nxref\n0 ${objects.length + 1}\n${xref.join('\n')}\ntrailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`;
};

// Downloads generated file.
const downloadFile = ({ content, fileName, mimeType }) => {
  // Creates file blob.
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  // Creates download link.
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  // Starts file download.
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Clears temporary URL.
  URL.revokeObjectURL(url);
};

// Converts to date value.
const toDateValue = (date) => date.toISOString().split('T')[0];

// Shows the icon component.
const Icon = ({ name, size = 22 }) => {
  const commonProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': 'true',
  };

  const paths = {
    plus: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2" />
        <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    history: (
      <>
        <path d="M3 12C3 7.6 6.6 4 11 4C15.4 4 19 7.6 19 12C19 16.4 15.4 20 11 20C7.9 20 5.2 18.2 3.9 15.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M3 16V12H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11 8V12L14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    users: (
      <>
        <path d="M16 20V18C16 15.8 14.2 14 12 14H6C3.8 14 2 15.8 2 18V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
        <path d="M22 20V18C22 16.1 20.7 14.5 18.9 14.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 3.1C17.7 3.5 19 5.1 19 7C19 8.9 17.7 10.5 16 10.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M16 3V7M8 3V7M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 15L11 18L16 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    plane: (
      <>
        <path d="M3 11L21 3L13 21L10 14L3 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    document: (
      <>
        <path d="M6 3H14L19 8V21H6V3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M14 3V8H19M9 13H16M9 17H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 21C13.5 21.6 12.8 22 12 22C11.2 22 10.5 21.6 10 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    chart: (
      <>
        <path d="M5 19V12M12 19V5M19 19V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <rect x="3" y="12" width="4" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="10" y="5" width="4" height="14" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="17" y="9" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="2" />
      </>
    ),
    download: (
      <>
        <path d="M12 4V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 10L12 14L16 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 19H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12S5.5 5 12 5S22 12 22 12S18.5 19 12 19S2 12 2 12Z" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      </>
    ),
    cancel: (
      <>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M9 9L15 15M15 9L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
  };

  return <svg {...commonProps}>{paths[name]}</svg>;
};

// Shows the export component.
const Export = () => {
  // Gets current user.
  const { user } = useAuth();
  // Gets notifications.
  const { addNotification, notifications } = useNotifications();
  // Gets current company.
  const companyId = normalizeCompanyId(user?.companyId || user?.company_id);
  const companyName = companyNameFromId(companyId);
  const historyKey = `${EXPORT_HISTORY_PREFIX}:${companyId}`;
  // Stores selected data.
  const [selectedData, setSelectedData] = useState(['employees', 'attendance', 'leaveRequests']);
  // Stores export format.
  const [format, setFormat] = useState('csv');
  // Stores start date.
  const [dateFrom, setDateFrom] = useState(toDateValue(new Date(Date.now() - 18 * 24 * 60 * 60 * 1000)));
  // Stores end date.
  const [dateTo, setDateTo] = useState(toDateValue(new Date()));
  // Stores department filter.
  const [department, setDepartment] = useState('all');
  // Stores status filter.
  const [employeeStatus, setEmployeeStatus] = useState('all');
  // Stores employees.
  const [employees, setEmployees] = useState([]);
  // Stores audit logs.
  const [auditLogs, setAuditLogs] = useState([]);
  // Stores export history.
  const [history, setHistory] = useState(() => readStorage(historyKey));
  // Stores preview rows.
  const [previewRows, setPreviewRows] = useState([]);
  // Stores preview title.
  const [previewTitle, setPreviewTitle] = useState('');

  // Runs when this screen needs to update data.
  useEffect(() => {
    let active = true;

    // Gets data.
    const loadData = async () => {
      const [employeeData, auditData] = await Promise.all([
        getAllEmployees(),
        fetchAuditLogs(),
      ]);
      if (!active) return;
      setEmployees(employeeData);
      setAuditLogs(auditData);
    };

    loadData();
    return () => {
      active = false;
    };
  }, []);

  // Runs when this screen needs to update data.
  useEffect(() => {
    const nextHistory = readStorage(historyKey);
    setHistory(nextHistory);
  }, [historyKey]);

  // Prepares company employees.
  const companyEmployees = useMemo(() => (
    employees.filter((employee) => normalizeCompanyId(employee.companyId || employee.company_id) === companyId)
  ), [companyId, employees]);

  // Prepares department options.
  const departmentOptions = useMemo(() => (
    [...new Set(companyEmployees.map((employee) => employee.department).filter(Boolean))].sort()
  ), [companyEmployees]);

  // Filters company employees.
  const filteredEmployees = useMemo(() => companyEmployees.filter((employee) => {
    // Checks department filter.
    const matchesDepartment = department === 'all' || employee.department === department;
    // Checks status filter.
    const matchesStatus = employeeStatus === 'all' || employee.status === employeeStatus;
    return matchesDepartment && matchesStatus;
  }), [companyEmployees, department, employeeStatus]);

  // Prepares leave requests.
  const leaveRequests = useMemo(() => (
    readStorage(LEAVE_REQUESTS_KEY).filter((request) => normalizeCompanyId(request.companyId) === companyId)
  ), [companyId]);

  // Prepares attendance records.
  const attendanceRecords = useMemo(() => (
    readStorage(USER_ATTENDANCE_KEY).filter((record) => normalizeCompanyId(record.companyId) === companyId)
  ), [companyId]);

  // Prepares company audit logs.
  const companyAuditLogs = useMemo(() => (
    auditLogs.filter((log) => normalizeCompanyId(log.company_id || log.companyId) === companyId)
  ), [auditLogs, companyId]);

  // Prepares current notifications.
  const currentNotifications = useMemo(() => notifications.map((notification) => ({
    title: notification.title,
    message: notification.message,
    type: notification.type,
    time: notification.time,
  })), [notifications]);

  // Checks date range.
  const dateInRange = (value) => {
    // Allows missing dates.
    if (!value) return true;
    const time = new Date(value).getTime();
    // Builds range start.
    const start = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
    // Builds range end.
    const end = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : Number.POSITIVE_INFINITY;
    return time >= start && time <= end;
  };

  // Prepares dataset rows.
  const datasetRows = useMemo(() => {
    // Prepares attendance.
    const attendance = attendanceRecords.filter((record) => dateInRange(record.date || record.checkIn)).map((record) => ({
      Name: record.name || record.employee || record.email,
      Email: record.email,
      Department: record.department || 'General Department',
      Date: record.date || '-',
      Status: record.status || 'Present',
      'Check In': record.checkIn ? formatDateTime(record.checkIn) : '-',
      'Check Out': record.checkOut ? formatDateTime(record.checkOut) : '-',
    }));

    // Prepares leave.
    const leave = leaveRequests.filter((request) => dateInRange(request.submittedAt || request.startDate)).map((request) => ({
      Name: request.name || request.email,
      Email: request.email,
      Type: request.type,
      Dates: `${request.startDate || '-'} to ${request.endDate || '-'}`,
      Status: request.status,
      Reason: request.reason || '-',
      Submitted: formatDateTime(request.submittedAt),
    }));

    // Prepares logs.
    const logs = companyAuditLogs.filter((log) => dateInRange(log.created_at || log.createdAt)).map((log) => ({
      User: log.user_name || log.user_email || 'System',
      Email: log.user_email || '-',
      Action: log.action,
      Entity: log.entity_name || log.entity_type || '-',
      Details: log.details || '-',
      Time: formatDateTime(log.created_at || log.createdAt),
    }));

    // Prepares notification rows.
    const notificationRows = currentNotifications.filter((notification) => dateInRange(notification.time)).map((notification) => ({
      Title: notification.title,
      Message: notification.message,
      Type: notification.type,
      Time: formatDateTime(notification.time),
    }));

    const analytics = [
      { Metric: 'Employees', Value: filteredEmployees.length, Company: companyName },
      { Metric: 'Attendance Records', Value: attendance.length, Company: companyName },
      { Metric: 'Leave Requests', Value: leave.length, Company: companyName },
      { Metric: 'Audit Logs', Value: logs.length, Company: companyName },
      { Metric: 'Notifications', Value: notificationRows.length, Company: companyName },
    ];

    return {
      employees: filteredEmployees.map((employee) => ({
        Name: employee.name,
        Email: employee.email,
        Role: employee.role,
        Department: employee.department,
        Status: employee.status,
        Phone: employee.phone || '-',
        'Join Date': employee.joinDate || '-',
        Company: companyName,
      })),
      attendance,
      leaveRequests: leave,
      auditLogs: logs,
      notifications: notificationRows,
      analytics,
    };
  }, [attendanceRecords, companyAuditLogs, companyName, currentNotifications, dateFrom, dateTo, filteredEmployees, leaveRequests]);

  // Prepares selected datasets.
  const selectedDatasets = DATASETS.filter((dataset) => selectedData.includes(dataset.id));
  // Prepares total records.
  const totalRecords = selectedDatasets.reduce((total, dataset) => total + (datasetRows[dataset.id]?.length || 0), 0);

  // Updates export history.
  const updateHistory = (entries) => {
    // Keeps latest exports.
    const nextHistory = [...entries, ...readStorage(historyKey)].slice(0, 25);
    writeStorage(historyKey, nextHistory);
    setHistory(nextHistory);
  };

  // Builds selected export file.
  const buildExportFile = (dataset, rows, exportFormat) => {
    // Builds safe file name.
    const exportedOn = new Date().toISOString();
    const safeTitle = sanitizeFileName(dataset.label);
    const fileBase = `${safeTitle}-${companyId}-${toDateValue(new Date(exportedOn))}`;

    // Builds Excel file.
    if (exportFormat === 'excel') {
      return {
        content: buildExcelHtml(rows, `${dataset.label} Export`),
        fileName: `${fileBase}.xls`,
        mimeType: 'application/vnd.ms-excel;charset=utf-8;',
      };
    }

    // Builds PDF file.
    if (exportFormat === 'pdf') {
      return {
        content: buildPdf(rows, `${dataset.label} Export - ${companyName}`),
        fileName: `${fileBase}.pdf`,
        mimeType: 'application/pdf',
      };
    }

    // Builds CSV file.
    return {
      content: buildCsv(rows),
      fileName: `${fileBase}.csv`,
      mimeType: 'text/csv;charset=utf-8;',
    };
  };

  // Toggles selected dataset.
  const handleToggleDataset = (datasetId) => {
    setSelectedData((current) => (
      current.includes(datasetId)
        ? current.filter((item) => item !== datasetId)
        : [...current, datasetId]
    ));
  };

  // Opens export preview.
  const handlePreview = async () => {
    const dataset = selectedDatasets[0];
    // Requires selected dataset.
    if (!dataset) {
      addNotification({ type: 'warning', title: 'Export Preview', message: 'Select at least one data type to preview.' });
      return;
    }

    // Shows first preview rows.
    const rows = datasetRows[dataset.id] || [];
    setPreviewRows(rows.slice(0, 8));
    setPreviewTitle(`${dataset.label} Preview`);
    // Shows preview notification.
    addNotification({ type: 'info', title: 'Export Previewed', message: `${dataset.label} preview opened for ${companyName}.` });
    // Records preview in audit.
    await logAuditAction({
      action: 'Export Previewed',
      entityType: 'data_export',
      entityName: dataset.label,
      details: `${dataset.label} export previewed for ${companyName}`,
      newValue: { dataset: dataset.id, records: rows.length, companyId },
    });
  };

  // Generates export files.
  const handleGenerateExport = async () => {
    // Requires selected data.
    if (selectedDatasets.length === 0) {
      addNotification({ type: 'warning', title: 'Export Required', message: 'Select at least one data type to export.' });
      return;
    }

    // Stores export details.
    const exportedOn = new Date().toISOString();
    const exportedBy = user?.name || user?.email?.split('@')[0] || 'Admin';
    const entries = [];

    // Downloads each dataset file.
    selectedDatasets.forEach((dataset) => {
      const rows = datasetRows[dataset.id] || [];
      const file = buildExportFile(dataset, rows, format);
      downloadFile(file);
      // Saves export history entry.
      entries.push({
        id: `${Date.now()}-${dataset.id}`,
        exportedBy,
        exportedByEmail: user?.email || '',
        dataType: dataset.label,
        datasetId: dataset.id,
        format,
        records: rows.length,
        exportedOn,
        status: 'Success',
        companyId,
        fileName: file.fileName,
        content: file.content,
        mimeType: file.mimeType,
      });
    });

    updateHistory(entries);
    addNotification({
      type: 'success',
      title: 'Export Generated',
      message: `${selectedDatasets.length} export file${selectedDatasets.length > 1 ? 's' : ''} generated for ${companyName}.`,
    });

    await logAuditAction({
      action: 'Data Export Generated',
      entityType: 'data_export',
      entityName: selectedDatasets.map((dataset) => dataset.label).join(', '),
      details: `${exportedBy} exported ${selectedDatasets.map((dataset) => dataset.label).join(', ')} as ${format.toUpperCase()}`,
      newValue: {
        companyId,
        format,
        dateFrom,
        dateTo,
        dataTypes: selectedDatasets.map((dataset) => dataset.id),
        records: totalRecords,
      },
    });
  };

  // Handles cancel actions.
  const handleCancel = async () => {
    setSelectedData([]);
    setPreviewRows([]);
    setPreviewTitle('');
    addNotification({ type: 'info', title: 'Export Cancelled', message: 'The export selection was cleared.' });
    await logAuditAction({
      action: 'Data Export Cancelled',
      entityType: 'data_export',
      entityName: 'Data Export Center',
      details: `${user?.name || user?.email || 'Admin'} cancelled a data export`,
      newValue: { companyId },
    });
  };

  // Handles history download actions.
  const handleHistoryDownload = async (entry) => {
    downloadFile({ content: entry.content || '', fileName: entry.fileName, mimeType: entry.mimeType || 'text/plain' });
    addNotification({ type: 'success', title: 'Export Downloaded', message: `${entry.fileName} downloaded again.` });
    await logAuditAction({
      action: 'Export History Downloaded',
      entityType: 'data_export',
      entityName: entry.dataType,
      details: `${entry.fileName} downloaded from export history`,
      newValue: { companyId, historyId: entry.id, fileName: entry.fileName },
    });
  };

  if (user?.role !== 'admin') {
    return (
      <div className="export-page">
        <section className="export-panel export-denied">
          <h1>Data Export Center</h1>
          <p>This page is available to admins only.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="export-page">
      <div className="export-header">
        <div>
          <h1>Data Export Center</h1>
          <p>Export company-scoped records for {companyName}.</p>
        </div>
        <span className="export-scope">Admin Only</span>
      </div>

      <div className="export-grid">
        <section className="export-panel create-export-panel">
          <div className="export-panel-title">
            <span className="title-glyph"><Icon name="plus" size={16} /></span>
            <h2>Create Export</h2>
          </div>

          <div className="export-step">
            <h3>1. Select Data to Export</h3>
            <div className="export-data-grid">
              {DATASETS.map((dataset) => (
                <label key={dataset.id} className={`export-data-card ${selectedData.includes(dataset.id) ? 'selected' : ''}`}>
                  <span className="data-icon"><Icon name={dataset.icon} size={28} /></span>
                  <span className="data-card-label">
                    <input
                      type="checkbox"
                      checked={selectedData.includes(dataset.id)}
                      onChange={() => handleToggleDataset(dataset.id)}
                    />
                    <span>{dataset.label}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="export-step">
            <h3>2. Choose Export Format</h3>
            <div className="format-options">
              {FORMAT_OPTIONS.map((option) => (
                <label key={option.id} className="format-option">
                  <input
                    type="radio"
                    name="exportFormat"
                    value={option.id}
                    checked={format === option.id}
                    onChange={(event) => setFormat(event.target.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="export-step">
            <h3>3. Apply Filters (Optional)</h3>
            <div className="export-filters">
              <label>
                <span>Date Range</span>
                <div className="date-range">
                  <span className="date-range-text">{formatDate(dateFrom)} - {formatDate(dateTo)}</span>
                  <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
                  <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
                </div>
              </label>
              <label>
                <span>Department</span>
                <select value={department} onChange={(event) => setDepartment(event.target.value)}>
                  <option value="all">All Departments</option>
                  {departmentOptions.map((dept) => <option key={dept} value={dept}>{dept}</option>)}
                </select>
              </label>
              <label>
                <span>Employee Status</span>
                <select value={employeeStatus} onChange={(event) => setEmployeeStatus(event.target.value)}>
                  <option value="all">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Remote">Remote</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>
              <label>
                <span>Company</span>
                <select value={companyId} disabled>
                  <option value={companyId}>{companyName}</option>
                </select>
              </label>
            </div>
          </div>

          <div className="export-actions">
            <button className="primary-export-btn" onClick={handleGenerateExport}>
              <Icon name="download" size={15} />
              Generate Export
            </button>
            <button className="secondary-export-btn" onClick={handlePreview}>
              <Icon name="eye" size={15} />
              Preview Data
            </button>
            <button className="danger-export-btn" onClick={handleCancel}>
              <Icon name="cancel" size={15} />
              Cancel
            </button>
          </div>
        </section>

        <section className="export-panel export-history-panel">
          <div className="history-header">
            <div className="export-panel-title">
              <span className="title-glyph"><Icon name="history" size={16} /></span>
              <h2>Export History</h2>
            </div>
            <button className="view-history-btn" onClick={() => setHistory(readStorage(historyKey))}>View All History</button>
          </div>

          <div className="export-history-table-wrap">
            <table className="export-history-table">
              <thead>
                <tr>
                  <th>Who Exported</th>
                  <th>What Data</th>
                  <th>Format</th>
                  <th>Records</th>
                  <th>When</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="export-empty">No exports created yet.</td>
                  </tr>
                ) : history.slice(0, 5).map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <div className="export-user-cell">
                        <span>{entry.exportedBy?.charAt(0).toUpperCase() || 'A'}</span>
                        <div>
                          <strong>{entry.exportedBy}</strong>
                          <small>{entry.exportedByEmail || 'Admin'}</small>
                        </div>
                      </div>
                    </td>
                    <td>{entry.dataType}</td>
                    <td><span className={`format-badge ${entry.format}`}>{entry.format.toUpperCase()}</span></td>
                    <td>{entry.records}</td>
                    <td>{formatDateTime(entry.exportedOn)}</td>
                    <td><span className="success-badge">Success</span></td>
                    <td>
                      <button className="download-history-btn" onClick={() => handleHistoryDownload(entry)} aria-label={`Download ${entry.fileName}`}>
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="history-footer">
            <span>Showing 1 to {Math.min(history.length, 5)} of {history.length} exports</span>
            <span>{totalRecords} selected records</span>
          </div>
        </section>
      </div>

      {previewTitle && (
        <section className="export-panel preview-panel">
          <div className="history-header">
            <div className="export-panel-title">
              <span className="title-glyph"><Icon name="document" size={16} /></span>
              <h2>{previewTitle}</h2>
            </div>
            <button className="view-history-btn" onClick={() => setPreviewTitle('')}>Close Preview</button>
          </div>
          <div className="preview-table-wrap">
            {previewRows.length === 0 ? (
              <div className="export-empty">No preview records match the current filters.</div>
            ) : (
              <table className="preview-table">
                <thead>
                  <tr>{Object.keys(previewRows[0]).map((header) => <th key={header}>{header}</th>)}</tr>
                </thead>
                <tbody>
                  {previewRows.map((row, rowIndex) => (
                    <tr key={`${previewTitle}-${rowIndex}`}>
                      {Object.keys(previewRows[0]).map((header) => <td key={header}>{row[header]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default Export;
