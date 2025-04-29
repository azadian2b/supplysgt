import React, { useEffect, useState } from 'react';
import '../styles/ThemeToggle.css';

const ThemeToggle = () => {
  // Get the initial theme from localStorage or default to 'light'
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  // Apply the theme when component mounts or theme changes
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="theme-toggle">
      <div className="toggle-label">
        {theme === 'light' ? 'Day Mode' : 'Night Mode'}
      </div>
      <label className="switch">
        <input 
          type="checkbox" 
          checked={theme === 'dark'}
          onChange={toggleTheme}
        />
        <span className="slider round"></span>
      </label>
    </div>
  );
};

export default ThemeToggle; 