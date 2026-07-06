// Reusable theme toggle component.
import React from 'react';
import { useTheme } from '../../context/ThemeContext';

// Shows the theme toggle component.
const ThemeToggle = () => {
  // Gets theme and toggle function.
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <button 
      // Changes theme on button click.
      onClick={toggleDarkMode} 
      // Adds simple button styling.
      style={{
        background: 'none',
        border: 'none',
        fontSize: '1.25rem',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '8px',
        transition: 'all 0.2s'
      }}
      // Shows correct tooltip text.
      title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {/* Shows icon for current theme. */}
      {darkMode ? '☀️' : '🌙'}
    </button>
  );
};

// Sends ThemeToggle to other files.
export default ThemeToggle;
