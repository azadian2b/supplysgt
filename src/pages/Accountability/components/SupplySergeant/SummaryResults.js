import React from 'react';

/**
 * Summary results component for displaying accountability session outcomes
 */
const SummaryResults = ({ 
  summaryData, 
  onClose 
}) => {
  if (!summaryData) return null;
  
  const { items, total, accountedFor, percentComplete, completedAt } = summaryData;
  const dateCompleted = new Date(completedAt).toLocaleString();
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Accountability Results</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        
        <div className="summary-results">
          <h3>Completed on {dateCompleted}</h3>
          
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${percentComplete}%` }}></div>
          </div>
          
          <p>{accountedFor} of {total} items accounted for ({percentComplete.toFixed(1)}%)</p>
          
          <h3>Results by Item Type</h3>
          
          {items.map((item, index) => (
            <div key={index} className="summary-item">
              <div className="summary-item-name">{item.nomenclature}</div>
              <div className="summary-item-stats">
                {item.accountedFor}/{item.total}
              </div>
            </div>
          ))}
          
          <div className="summary-total">
            <div className="summary-item-name">Total</div>
            <div className="summary-item-stats">
              {accountedFor}/{total}
            </div>
          </div>
          
          <div className="action-buttons">
            <button 
              className="primary-button"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryResults; 