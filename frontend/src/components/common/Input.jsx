import React from 'react';
import './Input.css';

const Input = ({ 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  label, 
  icon,
  error,
  disabled = false 
}) => {
  return (
    <div className="input-container">
      {label && <label className="input-label">{label}</label>}
      <div className="input-wrapper">
        {icon && <span className="input-icon">{icon}</span>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`input-field ${icon ? 'with-icon' : ''} ${error ? 'error' : ''}`}
        />
      </div>
      {error && <span className="input-error">{error}</span>}
    </div>
  );
};

export default Input;