import React from 'react';
import './Input.css';

// Gets input details from parent.
const Input = ({ 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  label, 
  icon,
  error,
  required = false,
  disabled = false 
}) => {
  return (
    <div className="input-container">
      {/* Shows label when given. */}
      {label && (
        <label className="input-label">
          {label}
          {/* Shows star for required field. */}
          {required && <span className="required">*</span>}
        </label>
      )}
      <div className="input-wrapper">
        {/* Shows icon when given. */}
        {icon && <span className="input-icon">{icon}</span>}
        {/* Main input field for typing. */}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`input-field ${icon ? 'with-icon' : ''} ${error ? 'error' : ''}`}
        />
      </div>
      {/* Shows error message when needed. */}
      {error && <span className="input-error">{error}</span>}
    </div>
  );
};

// Sends Input component to other files.
export default Input;
