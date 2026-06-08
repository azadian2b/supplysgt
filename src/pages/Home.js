import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBoxes, FaClipboardCheck, FaFileSignature, FaUsers } from 'react-icons/fa';
import { PageHeader } from '../components/ui/PageHeader';
import './Pages.css';

function Home() {
  const navigate = useNavigate();
  const actions = [
    {
      title: 'Manage Equipment',
      description: 'Catalog items, update inventory, and organize equipment groups.',
      icon: <FaBoxes />,
      path: '/manage'
    },
    {
      title: 'Assign Personnel',
      description: 'Maintain the UIC roster and assign equipment to soldiers.',
      icon: <FaUsers />,
      path: '/assign'
    },
    {
      title: 'Issue Equipment',
      description: 'Generate DA Form 2062 hand receipts and manage issued items.',
      icon: <FaFileSignature />,
      path: '/issue'
    },
    {
      title: 'Accountability',
      description: 'Run accountability sessions and support serial-number verification.',
      icon: <FaClipboardCheck />,
      path: '/accountability'
    }
  ];

  return (
    <div className="page-container page-container-wide">
      <PageHeader
        title="Supply SGT Dashboard"
        subtitle="Core supply workflows are organized around inventory, roster ownership, hand receipts, and accountability."
        meta="v0.20250415.2"
      />

      <div className="action-grid">
        {actions.map(action => (
          <button
            key={action.path}
            className="action-card"
            onClick={() => navigate(action.path)}
          >
            <span className="action-card-icon">{action.icon}</span>
            <span className="action-card-copy">
              <strong>{action.title}</strong>
              <span>{action.description}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Home;
