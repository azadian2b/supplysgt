import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Pages.css';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <h1>Supply SGT Dashboard v0.20250415.2</h1>
      <div className="button-container">
        <button 
          className="nav-button" 
          onClick={() => navigate('/manage')}
        >
          Manage Equipment
        </button>
        <button 
          className="nav-button" 
          onClick={() => navigate('/assign')}
        >
          Assign Personnel
        </button>
        <button 
          className="nav-button" 
          onClick={() => navigate('/issue')}
        >
          Issue Equipment
        </button>
        <button 
          className="nav-button" 
          onClick={() => navigate('/accountability')}
        >
          Accountability
        </button>
      </div>
    </div>
  );
}

export default Home; 