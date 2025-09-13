import React from 'react';

const AdminPanel = ({ bills, onStatusChange }) => {
  // বিলগুলিকে উল্টো ক্রমে সাজান (নতুন থেকে পুরানো)
  const reversedBills = [...bills].reverse();
  
  // মোট Amount গণনা করুন
  const totalAmount = reversedBills.reduce((sum, bill) => sum + (bill.grandTotal || 0), 0);

  return (
    <div className="card">
      <h3>BILLS MANAGEMENT</h3>
      
      {reversedBills.length === 0 ? (
        <div>
          <p>No bills found</p>
          <p>To view bills, users must first submit bills.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>NO</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>AWB NO</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>SHIPPER</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>SHIPPER ADDRESS</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>CONSIGNEE</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>DEST</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>CNEE ADDRESS</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>NOP</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>WT</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>DSCT</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>COD</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>VAL</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>BIN/VAT</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>PRICE</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>QTY</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>DISCOUNT (%)</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>TOTAL AMOUNT</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>SUBMITTED BY</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>DATE</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>STATUS</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {reversedBills.map(bill => (
                <tr key={bill._id}>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{bill.items[0]?.id || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{bill.items[0]?.awbNo || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{bill.items[0]?.shipper || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{bill.items[0]?.shipperAddress || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{bill.customerName}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{bill.items[0]?.dest || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{bill.items[0]?.cneeAddress || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{bill.items[0]?.nop || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{bill.items[0]?.wt || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{bill.items[0]?.product || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{bill.items[0]?.cod || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{bill.items[0]?.val || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{bill.items[0]?.binVat || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{bill.items[0]?.price || 0} TK</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{bill.items[0]?.quantity || 1}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{bill.items[0]?.discount || 0}%</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{bill.grandTotal} TK</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{bill.submittedBy?.name || 'Unknown'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{new Date(bill.submissionDate).toLocaleDateString()}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    <span style={{
                      padding: '5px 10px',
                      borderRadius: '4px',
                      backgroundColor: 
                        bill.status === 'Approved' ? '#d4edda' : 
                        bill.status === 'Rejected' ? '#f8d7da' : '#fff3cd',
                      color: 
                        bill.status === 'Approved' ? '#02370eff' : 
                        bill.status === 'Rejected' ? '#93010fff' : '#493702ff'
                    }}>
                      {bill.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    <select 
                      value={bill.status} 
                      onChange={(e) => onStatusChange(bill._id, e.target.value)}
                      style={{ padding: '5px', width: '100%' }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#e9ecef', fontWeight: 'bold' }}>
                <td colSpan="15" style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right' }}>
                  Total Balance:
                </td>
                <td style={{ padding: '12px', border: '1px solid #30cbe6ff' }}>
                  {totalAmount.toFixed(2)} TK
                </td>
                <td colSpan="4" style={{ padding: '12px', border: '1px solid #dee2e6' }}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;