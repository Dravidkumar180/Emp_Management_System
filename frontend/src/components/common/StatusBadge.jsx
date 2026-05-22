import React from 'react';
import './StatusBadge.css';

const StatusBadge = ({ status }) => {
  const getStatusClass = () => {
    switch(status?.toLowerCase()) {
      case 'active': return 'status-active';
      case 'on leave': return 'status-leave';
      case 'remote': return 'status-remote';
      case 'inactive': return 'status-inactive';
      default: return 'status-active';
    }
  };

  return (
    <span className={`status-badge ${getStatusClass()}`}>
      {status}
    </span>
  );
};

export default StatusBadge;