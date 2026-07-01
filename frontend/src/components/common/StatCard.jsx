// Reusable stat card component.
import React from 'react';
import './StatCard.css';

// Shows the stat card component.
const StatCard = ({ title, value, icon, color, trend, trendValue }) => {
  return (
    <div className="stat-card" style={{ borderLeftColor: color }}>
      <div className="stat-card-header">
        <span className="stat-icon">{icon}</span>
        <div className="stat-info">
          <h3>{title}</h3>
          <p className="stat-value">{value}</p>
          {trend && (
            <span className={`stat-trend ${trend}`}>
              {trend === 'up' ? '↑' : '↓'} {trendValue}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;