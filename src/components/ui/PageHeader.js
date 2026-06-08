import React from 'react';
import './PageHeader.css';

export function PageHeader({ title, subtitle, meta, actions = null }) {
  return (
    <div className="page-header">
      <div className="page-header-copy">
        {meta && <div className="page-header-meta">{meta}</div>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}

export function StatusBanner({ tone = 'info', children }) {
  return (
    <div className={`status-banner status-banner-${tone}`}>
      {children}
    </div>
  );
}

export function EmptyState({ title, body, action = null }) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      {body && <p>{body}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
