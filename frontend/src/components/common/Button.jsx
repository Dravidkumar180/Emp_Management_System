// Reusable button component.
import React from 'react';
import './Button.css';

// Shows the button component.
const Button = ({ children, onClick, variant = 'primary', type = 'button' }) => {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick} type={type}>
      {children}
    </button>
  );
};

export default Button;