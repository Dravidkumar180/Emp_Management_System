import React from 'react';
import './LoadingSkeleton.css';

const LoadingSkeleton = () => {
  return (
    <div className="skeleton-container">
      <div className="skeleton-header">
        <div className="skeleton-title"></div>
        <div className="skeleton-button"></div>
      </div>
      <div className="skeleton-filters">
        <div className="skeleton-search"></div>
        <div className="skeleton-select"></div>
      </div>
      <div className="skeleton-table">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="skeleton-row">
            <div className="skeleton-cell"></div>
            <div className="skeleton-cell"></div>
            <div className="skeleton-cell"></div>
            <div className="skeleton-cell"></div>
            <div className="skeleton-cell"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingSkeleton;