import React from 'react';
import './StatCard.css';

const StatCard = ({ title, value, icon, color, subtitle }) => {
  return (
    <div className="stat-card" style={{ borderLeftColor: color }}>
      <div className="stat-card-header">
        <span className="stat-icon">{icon}</span>
        <div>
          <h3>{title}</h3>
          {subtitle && <p className="stat-subtitle">{subtitle}</p>}
        </div>
      </div>
      <div className="stat-value">{value}</div>
    </div>
  );
};

export default StatCard;