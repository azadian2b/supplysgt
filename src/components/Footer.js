import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <p>&copy; {new Date().getFullYear()} Supply SGT App</p>
    </footer>
  );
}

export default Footer; 