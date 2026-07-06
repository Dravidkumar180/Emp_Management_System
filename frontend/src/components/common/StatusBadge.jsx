// Reusable status badge component.
import React from 'react';
import './StatusBadge.css';

// Shows the status badge component.
const StatusBadge = ({ status }) => {
  // Finds style class for status.
  const getStatusClass = () => {
    // Checks status text in lowercase.
    switch(status?.toLowerCase()) {
      case 'active': return 'status-active';
      case 'on leave': return 'status-leave';
      case 'remote': return 'status-remote';
      case 'inactive': return 'status-inactive';
      // Uses active style as default.
      default: return 'status-active';
    }
  };

  return (
    // Shows status with correct style.
    <span className={`status-badge ${getStatusClass()}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
