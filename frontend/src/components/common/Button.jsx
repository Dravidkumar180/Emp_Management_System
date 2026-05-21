import React from 'react';
import './Button.css';

const Button = ({ 
  children, 
  type = 'button', 
  variant = 'primary', 
  fullWidth = false,
  disabled = false,
  onClick 
}) => {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${fullWidth ? 'full-width' : ''}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;