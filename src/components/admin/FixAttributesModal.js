import React, { useState } from 'react';
import FixMissingAttributes from '../../utils/FixMissingAttributes';
import './AdminModals.css';

function FixAttributesModal({ onClose }) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [forceFixAll, setForceFixAll] = useState(false);

  const handleRunFix = async () => {
    setIsRunning(true);
    setProgress(0);
    setMessage('Starting attribute fix...');
    setResults(null);
    setError(null);

    try {
      await FixMissingAttributes.run({
        forceFixAll,
        onProgress: (percent, msg) => {
          setProgress(percent);
          setMessage(msg);
        },
        onComplete: (success, successItems, errorItems) => {
          setIsRunning(false);
          setResults({
            success,
            successItems,
            errorItems
          });
        },
        onError: (err) => {
          setIsRunning(false);
          setError(err.message || 'An unknown error occurred');
        }
      });
    } catch (err) {
      setIsRunning(false);
      setError(err.message || 'An unknown error occurred');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content fix-attributes-modal">
        <div className="modal-header">
          <h2>Fix Missing Attributes</h2>
          <button 
            className="close-button" 
            onClick={onClose}
            disabled={isRunning}
          >×</button>
        </div>

        <div className="modal-body">
          <p>
            This utility will check your equipment inventory for items with missing <code>assignedToID</code> attributes
            and fix them. This helps ensure compatibility between your local data and the cloud database.
          </p>
          
          <div className="warning-box">
            <strong>Important:</strong> This process will modify your database records. It's recommended to run this
            once to fix the attribute structure. This should only be needed if items were created without the proper attribute.
          </div>

          {!isRunning && !results && !error && (
            <>
              <div className="checkbox-option">
                <label>
                  <input
                    type="checkbox"
                    checked={forceFixAll}
                    onChange={() => setForceFixAll(!forceFixAll)}
                  />
                  Force update all items including required fields (more thorough fix)
                </label>
                {forceFixAll && (
                  <div className="force-warning">
                    ⚠️ This will update <strong>ALL</strong> equipment items with a complete set of required fields. Use this option if the regular fix doesn't resolve database validation errors.
                  </div>
                )}
              </div>
              <div className="action-buttons">
                <button
                  className="primary-button"
                  onClick={handleRunFix}
                >
                  Run Fix
                </button>
                <button
                  className="secondary-button"
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {isRunning && (
            <div className="progress-section">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="progress-message">{message}</div>
            </div>
          )}

          {error && (
            <div className="error-message">
              <h3>Error</h3>
              <p>{error}</p>
              <button
                className="secondary-button"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          )}

          {results && (
            <div className="results-section">
              <h3>Fix Complete</h3>
              
              {results.success ? (
                <div className="success-message">
                  <p>Successfully updated {results.successItems.length} items.</p>
                  {results.successItems.length > 0 && (
                    <details>
                      <summary>View Details</summary>
                      <ul className="results-list">
                        {results.successItems.map(item => (
                          <li key={item.id}>
                            {item.nsn} {item.serialNumber ? `(SN: ${item.serialNumber})` : ''}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              ) : (
                <div className="error-message">
                  <p>
                    Fixed {results.successItems.length} items, but encountered {results.errorItems.length} errors.
                  </p>
                  {results.errorItems.length > 0 && (
                    <details>
                      <summary>View Errors</summary>
                      <ul className="error-list">
                        {results.errorItems.map(item => (
                          <li key={item.id}>
                            {item.nsn} {item.serialNumber ? `(SN: ${item.serialNumber})` : ''}: {item.error}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}
              
              <div className="action-buttons">
                <button
                  className="primary-button"
                  onClick={onClose}
                >
                  Close
                </button>
                <button
                  className="secondary-button"
                  onClick={handleRunFix}
                  disabled={isRunning}
                >
                  Run Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FixAttributesModal; 