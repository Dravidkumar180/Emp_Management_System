// Shows the audit logs page.
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Toaster, toast } from 'react-hot-toast';
import { fetchAuditLogs as fetchAuditLogsFromApi } from '../services/audit';
import './AuditLogs.css';

// Shows the audit logs component.
const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Runs when this screen needs to update data.
    useEffect(() => {
        fetchAuditLogs();
    }, []);

    // Gets audit logs data.
    const fetchAuditLogs = async () => {
        try {
            setLoading(true);
            const data = await fetchAuditLogsFromApi();
            setLogs(data);
        } catch (error) {
            setLogs([]);
            toast.error('Failed to fetch audit logs');
        } finally {
            setLoading(false);
        }
    };

    // Gets action icon data.
    const getActionIcon = (action) => {
        const safeAction = String(action || '');
        if (safeAction.includes('Created')) return '+';
        if (safeAction.includes('Updated')) return 'Edit';
        if (safeAction.includes('Deleted')) return 'Del';
        if (safeAction.includes('Approved')) return 'OK';
        if (safeAction.includes('Rejected')) return 'No';
        if (safeAction.includes('Requested')) return 'Req';
        if (safeAction.includes('Deactivated')) return 'Off';
        if (safeAction.includes('Activated')) return 'On';
        return 'Log';
    };

    // Gets action class data.
    const getActionClass = (action) => {
        const safeAction = String(action || '');
        if (safeAction.includes('Created')) return 'action-create';
        if (safeAction.includes('Updated')) return 'action-update';
        if (safeAction.includes('Deleted')) return 'action-delete';
        if (safeAction.includes('Approved')) return 'action-approve';
        if (safeAction.includes('Rejected')) return 'action-reject';
        if (safeAction.includes('Requested')) return 'action-request';
        return '';
    };

    // Helps with filtered logs.
    const filteredLogs = logs.filter((log) => {
        const action = String(log.action || '');
        const userName = String(log.user_name || '');
        const entityName = String(log.entity_name || '');
        const search = searchTerm.toLowerCase();
        const matchesSearch = searchTerm === '' ||
            userName.toLowerCase().includes(search) ||
            action.toLowerCase().includes(search) ||
            entityName.toLowerCase().includes(search);

        return matchesSearch;
    });

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const paginatedLogs = filteredLogs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (loading) {
        return (
            <DashboardLayout>
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading audit logs...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="audit-logs-page">
                <Toaster position="top-right" />

                <div className="audit-logs-header">
                    <div>
                        <h1>Audit Logs</h1>
                        <p>Activity history for your company - employee changes and role requests.</p>
                    </div>
                </div>

                <div className="audit-logs-filters">
                    <div className="search-box">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by user, action, or entity..."
                            value={searchTerm}
                            onChange={(event) => {
                                setSearchTerm(event.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>

                <div className="audit-logs-table-container">
                    <table className="audit-logs-table">
                        <thead>
                            <tr>
                                <th>USER</th>
                                <th>ACTION</th>
                                <th>RELATED ENTITY</th>
                                <th>DETAILS</th>
                                <th>TIMESTAMP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="no-data">
                                        <div className="empty-state">
                                            <div className="empty-icon">Log</div>
                                            <p>No audit logs found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedLogs.map((log) => (
                                    <tr key={log.id}>
                                        <td>
                                            <div className="user-cell">
                                                <div className="user-avatar-small">
                                                    {log.user_name?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <div className="user-name">{log.user_name || 'Unknown user'}</div>
                                                    <div className="user-email">{log.user_email || '-'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`action-badge ${getActionClass(log.action)}`}>
                                                <span className="action-icon">{getActionIcon(log.action)}</span>
                                                {log.action || 'Unknown action'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="entity-cell">
                                                <span className="entity-type">{log.entity_type || 'entity'}:</span>
                                                <span className="entity-name">{log.entity_name || log.details || '-'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="details-cell">
                                                {log.details || '-'}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="timestamp-cell">
                                                {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="pagination">
                        <button
                            className="page-btn"
                            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>
                        <span className="page-info">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            className="page-btn"
                            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AuditLogs;