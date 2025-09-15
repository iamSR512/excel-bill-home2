import React from 'react';

const AdminPanel = ({ bills, onStatusChange }) => {
  // Check if bills is undefined or null
  if (!bills) {
    return (
      <div className="card">
        <h3>বিল ম্যানেজমেন্ট - সম্পূর্ণ ডেটা</h3>
        <div>
          <p>বিল ডেটা লোড হয়নি বা পাওয়া যায়নি</p>
        </div>
      </div>
    );
  }

  // Reverse the bills array to show newest bills first
  const reversedBills = [...bills].reverse();

  return (
    <div className="card">
      <h3>বিল ম্যানেজমেন্ট - সম্পূর্ণ ডেটা</h3>
      
      {reversedBills.length === 0 ? (
        <div>
          <p>কোন বিল পাওয়া যায়নি</p>
          <p>বিল দেখতে হলে প্রথমে ব্যবহারকারীরা বিল সাবমিট করতে হবে।</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>NO</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>SHIPPER</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>CONSIGNEE</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>WT</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>VAL</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>মূল্য</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>ডিসকাউন্ট (%)</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>মোট Amount</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>জমাদানকারী</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>তারিখ</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>স্ট্যাটাস</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {reversedBills.map(bill => (
                <tr key={bill._id}>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{bill.items?.[0]?.id || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{bill.items?.[0]?.shipper || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{bill.customerName}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{bill.items?.[0]?.wt || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{bill.items?.[0]?.val || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{bill.items?.[0]?.price || 0} টাকা</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{bill.items?.[0]?.discount || 0}%</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{bill.finalAmount || bill.billAmount || 0} টাকা</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{bill.submittedBy?.username || bill.submittedBy?.name || 'Unknown'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{new Date(bill.createdAt || bill.submittedAt || Date.now()).toLocaleDateString()}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    <span style={{
                      padding: '5px 10px',
                      borderRadius: '4px',
                      backgroundColor: 
                        bill.status === 'approved' ? '#d4edda' : 
                        bill.status === 'rejected' ? '#f8d7da' : '#fff3cd',
                      color: 
                        bill.status === 'approved' ? '#02370eff' : 
                        bill.status === 'rejected' ? '#93010fff' : '#493702ff'
                    }}>
                      {bill.status || 'pending'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    <select 
                      value={bill.status || 'pending'} 
                      onChange={(e) => onStatusChange(bill._id, e.target.value)}
                      style={{ padding: '5px', width: '100%' }}
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;