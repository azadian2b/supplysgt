import React, { useState } from 'react';
import './Components.css';

/**
 * Component for displaying and managing active hand receipts
 */
const ActiveHandReceipts = ({ 
  activeHandReceipts, 
  onViewPdf, 
  onReturnItems,
  onReturnSingleItem,
  processingAction 
}) => {
  const [expandedReceipts, setExpandedReceipts] = useState({});
  
  // Toggle receipt expansion
  const toggleReceipt = (receiptNumber) => {
    setExpandedReceipts(prev => ({
      ...prev,
      [receiptNumber]: !prev[receiptNumber]
    }));
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!activeHandReceipts || activeHandReceipts.length === 0) {
    return (
      <div className="active-receipts">
        <h2>Active Hand Receipts</h2>
        <p className="no-data-message">No active hand receipts found.</p>
      </div>
    );
  }

  return (
    <div className="active-receipts">
      <h2>Active Hand Receipts</h2>
      
      <div className="receipts-list">
        {activeHandReceipts.map(receipt => {
          const isExpanded = expandedReceipts[receipt.receiptNumber];
          const soldier = receipt.soldier;
          
          return (
            <div key={receipt.receiptNumber} className="receipt-item">
              <div 
                className="receipt-header" 
                onClick={() => toggleReceipt(receipt.receiptNumber)}
              >
                <div className="expand-icon">{isExpanded ? '▼' : '►'}</div>
                <div className="receipt-number">{receipt.receiptNumber}</div>
                <div className="receipt-soldier">
                  {soldier ? `${soldier.rank} ${soldier.lastName}, ${soldier.firstName}` : 'Unknown'}
                </div>
                <div className="receipt-date">
                  {formatDate(receipt.issuedOn)}
                </div>
                <div className="receipt-count">
                  {receipt.items.length} items
                </div>
              </div>
              
              {isExpanded && (
                <div className="receipt-details">
                  <div className="receipt-actions">
                    <button 
                      className="view-pdf-button"
                      onClick={() => onViewPdf(receipt)}
                    >
                      View PDF
                    </button>
                    <button 
                      className="return-all-button"
                      onClick={() => onReturnItems(receipt)}
                      disabled={processingAction}
                    >
                      Return All Items
                    </button>
                  </div>
                  
                  <div className="receipt-items">
                    <div className="items-table-header">
                      <div className="item-name">Item</div>
                      <div className="item-nsn">NSN</div>
                      <div className="item-serial">Serial #</div>
                      <div className="item-stock">Stock #</div>
                      <div className="item-actions">Actions</div>
                    </div>
                    
                    {receipt.items.map(item => (
                      <div key={item.id} className="receipt-item-row">
                        <div className="item-name">{item.name}</div>
                        <div className="item-nsn">{item.nsn}</div>
                        <div className="item-serial">{item.serialNumber || '-'}</div>
                        <div className="item-stock">{item.stockNumber || '-'}</div>
                        <div className="item-actions">
                          <button 
                            className="return-item-button"
                            onClick={() => onReturnSingleItem(receipt.receiptNumber, item)}
                            disabled={processingAction}
                          >
                            Return Item
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActiveHandReceipts; 