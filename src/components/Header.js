import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import ThemeToggle from './ThemeToggle';
import ConnectivityToggle from './ConnectivityToggle';
import DataStoreUtil from '../utils/DataStoreSync';
import './Header.css';

function Header({ signOut, user }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Handle connectivity mode changes
  const handleConnectivityChange = async (isOnline) => {
    try {
      setIsToggling(true);
      console.log('Connectivity mode changing to:', isOnline ? 'online' : 'offline');
      
      // Use our utility to handle all the necessary DataStore operations
      await DataStoreUtil.setConnectivityMode(isOnline);
      
      console.log('Connectivity mode changed successfully');
    } catch (error) {
      console.error('Error changing connectivity mode:', error);
      // If there's an error, show a notification to the user
      alert(`Failed to switch to ${isOnline ? 'online' : 'offline'} mode: ${error.message}`);
    } finally {
      setIsToggling(false);
    }
  };

  // Get user display name - handle different user object formats
  const getUserDisplayName = () => {
    if (!user) return 'Guest';
    if (user.username) return user.username;
    if (user.attributes && user.attributes.email) return user.attributes.email;
    if (user.attributes && user.attributes.name) return user.attributes.name;
    return 'User';
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="header-title">Supply SGT</Link>
        
        <button className="menu-button" onClick={toggleMenu}>
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      <div className={`side-menu ${menuOpen ? 'open' : ''}`}>
        <div className="menu-header">
          <button className="close-menu" onClick={toggleMenu}>
            <FaTimes />
          </button>
        </div>
        
        <div className="user-info">
          <p>Welcome, {getUserDisplayName()}</p>
        </div>
        
        <nav className="menu-nav">
          <Link to="/" onClick={toggleMenu}>Home</Link>
          <Link to="/manage" onClick={toggleMenu}>Manage Equipment</Link>
          <Link to="/assign" onClick={toggleMenu}>Assign Personnel</Link>
          <Link to="/issue" onClick={toggleMenu}>Issue Equipment</Link>
          <Link to="/accountability" onClick={toggleMenu}>Accountability</Link>
          <Link to="/profile" onClick={toggleMenu}>Update Profile</Link>
        </nav>
        
        <button className="sign-out-button" onClick={signOut}>Sign Out</button>
      </div>
      
      {menuOpen && <div className="overlay" onClick={toggleMenu}></div>}

      <div className="header-actions">
        <ConnectivityToggle onConnectivityChange={handleConnectivityChange} />
        <ThemeToggle />
      </div>
    </header>
  );
}

export default Header; 