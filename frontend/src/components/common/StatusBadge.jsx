import React from 'react';
import './Button.css'; // Reusing Button.css for badge styles

const StatusBadge = ({ status }) => {
  const getStatusClass = () => {
    switch(status) {
      case 'Active': return 'status-active';
      case 'On Leave': return 'status-leave';
      case 'Remote': return 'status-remote';
      case 'Probation': return 'status-probation';
      default: return 'status-inactive';
    }
  };

  return (
    <span className={`status-badge ${getStatusClass()}`}>
      {status}
    </span>
  );
};

export default StatusBadge;