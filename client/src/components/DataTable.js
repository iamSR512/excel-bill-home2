import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const DataTable = ({ items: initialItems, grandTotal: initialGrandTotal }) => {
  const [items, setItems] = useState(initialItems || []);
  const [grandTotal, setGrandTotal] = useState(initialGrandTotal || 0);
  const [submittingSingle, setSubmittingSingle] = useState({});
  const [registering, setRegistering] = useState({});
  const [registeredClients, setRegisteredClients] = useState({});
  const { user } = useAuth();

  const handleDiscountChange = (index, discount) => {
    const newItems = [...items];
    newItems[index].discount = Math.max(0, Math.min(100, discount));
    newItems[index].total = newItems[index].price * newItems[index].quantity * (1 - newItems[index].discount / 100);
    
    setItems(newItems);
    setGrandTotal(newItems.reduce((sum, item) => sum + item.total, 0));
  };

  const handleQuantityChange = (index, quantity) => {
    const newItems = [...items];
    newItems[index].quantity = Math.max(1, parseInt(quantity) || 1);
    newItems[index].total = newItems[index].price * newItems[index].quantity * (1 - newItems[index].discount / 100);
    
    setItems(newItems);
    setGrandTotal(newItems.reduce((sum, item) => sum + item.total, 0));
  };

  // Check registration status for all items on component mount
  useEffect(() => {
    const checkAllClients = async () => {
      if (!user || items.length === 0) return;
      
      const token = localStorage.getItem('token');
      const newRegisteredClients = { ...registeredClients };
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.customerName && item.cneeAddress) {
          try {
            const response = await fetch('http://localhost:5000/api/clients/check', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                name: item.customerName,
                address: item.cneeAddress
              })
            });
            
            const data = await response.json();
            if (data.success && data.isRegistered) {
              newRegisteredClients[`${item.customerName}-${item.cneeAddress}`] = true;
            }
          } catch (error) {
            console.error('Error checking client:', error);
          }
        }
      }
      
      setRegisteredClients(newRegisteredClients);
    };
    
    checkAllClients();
  }, [items, user]);

  // একটি মাত্র বিল সাবমিট - Real Database Submission
  const handleSubmitSingle = async (item, index) => {
    console.log('Submitting single bill:', item);
    
    if (!user) {
      alert('দয়া করে প্রথমে লগইন করুন');
      return;
    }

    setSubmittingSingle(prev => ({ ...prev, [index]: true }));
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Authentication token not found. Please login again.');
        return;
      }

      // Prepare the item data
      const itemData = {
        id: item.id || '',
        awbNo: item.awbNo || '',
        extra: item.extra || '',
        shipper: item.shipper || '',
        shipperAddress: item.shipperAddress || '',
        consignee: item.customerName || '',
        binVat: item.binVat || '',
        dest: item.dest || '',
        cneeAddress: item.cneeAddress || '',
        ctc: item.ctc || '',
        telNo: item.telNo || '',
        nop: item.nop || '',
        wt: item.wt || '',
        vol: item.vol || '',
        dsct: item.product || '',
        cod: item.cod || '',
        val: item.val || '',
        re: item.re || '',
        bagNo: item.bagNo || '',
        price: parseFloat(item.price) || 0,
        quantity: parseInt(item.quantity) || 1,
        discount: parseInt(item.discount) || 0,
        total: parseFloat(item.total) || 0
      };

      const response = await fetch('http://localhost:5000/api/submit-bill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customerName: item.customerName,
          customerEmail: `${item.customerName.toLowerCase().replace(/\s+/g, '')}@example.com`,
          customerPhone: item.phone || '0000000000',
          items: [itemData],
          grandTotal: item.total
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(`${item.customerName}-এর বিল সফলভাবে জমা দেওয়া হয়েছে!`);
        
        // Remove the submitted item
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
        setGrandTotal(newItems.reduce((sum, item) => sum + item.total, 0));
      } else {
        alert(data.message || 'বিল জমা দেওয়া ব্যর্থ হয়েছে');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('বিল জমা দেওয়া ব্যর্থ হয়েছে: ' + error.message);
    } finally {
      setSubmittingSingle(prev => ({ ...prev, [index]: false }));
    }
  };

  // সম্পূর্ণ বিল সাবমিট
  const handleSubmitAll = async () => {
    if (items.length === 0) {
      alert('কোনো ডেটা পাওয়া যায়নি');
      return;
    }

    if (!user) {
      alert('দয়া করে প্রথমে লগইন করুন');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Authentication token not found. Please login again.');
        return;
      }

      // Prepare all items
      const allItemsData = items.map(item => ({
        id: item.id || '',
        awbNo: item.awbNo || '',
        extra: item.extra || '',
        shipper: item.shipper || '',
        shipperAddress: item.shipperAddress || '',
        consignee: item.customerName || '',
        binVat: item.binVat || '',
        dest: item.dest || '',
        cneeAddress: item.cneeAddress || '',
        ctc: item.ctc || '',
        telNo: item.telNo || '',
        nop: item.nop || '',
        wt: item.wt || '',
        vol: item.vol || '',
        dsct: item.product || '',
        cod: item.cod || '',
        val: item.val || '',
        re: item.re || '',
        bagNo: item.bagNo || '',
        price: parseFloat(item.price) || 0,
        quantity: parseInt(item.quantity) || 1,
        discount: parseInt(item.discount) || 0,
        total: parseFloat(item.total) || 0
      }));

      const response = await fetch('http://localhost:5000/api/submit-bill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customerName: "বহু গ্রাহক",
          customerEmail: "multiple@example.com",
          customerPhone: "0000000000",
          items: allItemsData,
          grandTotal: grandTotal
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('সমস্ত বিল সফলভাবে জমা দেওয়া হয়েছে!');
        setItems([]);
        setGrandTotal(0);
      } else {
        alert(data.message || 'বিল জমা দেওয়া ব্যর্থ হয়েছে');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('বিল জমা দেওয়া ব্যর্থ হয়েছে: ' + error.message);
    }
  };

  // Register client function with duplicate check
  const handleRegisterClient = async (item, index) => {
    if (!user) {
      alert('দয়া করে প্রথমে লগইন করুন');
      return;
    }

    const clientKey = `${item.customerName}-${item.cneeAddress}`;
    
    // প্রথমে চেক করুন ক্লায়েন্ট ইতিমধ্যে রেজিস্টার্ড কি না
    if (registeredClients[clientKey]) {
      alert('এই ক্লায়েন্ট ইতিমধ্যে রেজিস্টার্ড আছে');
      return;
    }

    setRegistering(prev => ({ ...prev, [index]: true }));
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Authentication token not found. Please login again.');
        return;
      }

      // সার্ভারে ডুপ্লিকেট চেক করুন
      const duplicateCheck = await fetch('http://localhost:5000/api/clients/check-duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: item.customerName,
          address: item.cneeAddress
        })
      });
      
      const duplicateResult = await duplicateCheck.json();
      
      if (duplicateResult.isDuplicate) {
        alert('এই নাম এবং ঠিকানা সহ একটি ক্লায়েন্ট ইতিমধ্যে存在 আছে!');
        return;
      }

      const response = await fetch('http://localhost:5000/api/clients/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: item.customerName,
          address: item.cneeAddress,
          email: `${item.customerName.toLowerCase().replace(/\s+/g, '')}@example.com`,
          phone: item.phone || '0000000000',
          registeredBy: user.id
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(`${item.customerName}-কে সফলভাবে রেজিস্টার করা হয়েছে!`);
        setRegisteredClients(prev => ({
          ...prev,
          [clientKey]: true
        }));
      } else {
        alert(data.message || 'ক্লায়েন্ট রেজিস্ট্রেশন ব্যর্থ হয়েছে');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('ক্লায়েন্ট রেজিস্ট্রেশন ব্যর্থ হয়েছে: ' + error.message);
    } finally {
      setRegistering(prev => ({ ...prev, [index]: false }));
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="card">
        <h3>বিল ডেটা</h3>
        <p>কোন ডেটা পাওয়া যায়নি। দয়া করে একটি এক্সেল ফাইল আপلোড করুন।</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>BILL DATA INDIVIDUAL SUBMISSION</h3>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>NO</th>
              <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>AWB NO</th>
              <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>EXTRA</th>
              <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>SHIPPER</th>
              <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>SHIPPER ADDRESS</th>
              <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>CONSIGNEE</th>
              <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>BIN/VAT</th>
              <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>DEST</th>
              <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>CNEE ADDRESS</th>
              <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>CTC</th>
              <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>TEL NO.</th>
              <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>NOP</th>
              <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>WT</th>
              <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>VOL</th>
              <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>DSCT</th>
              <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>COD</th>
              <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>VAL</th>
              <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>RE</th>
              <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>BAG NO</th>
              <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>PRICE</th>
              <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>DISCOUNT  (%)</th>
              <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>TOTAL</th>
              <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>REGISTRATION</th>
              <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const clientKey = `${item.customerName}-${item.cneeAddress}`;
              const isRegistered = registeredClients[clientKey];
              
              return (
                <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{item.id}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{item.awbNo || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{item.extra || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{item.shipper || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{item.shipperAddress || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{item.customerName}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{item.binVat || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{item.dest || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{item.cneeAddress || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{item.ctc || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{item.telNo || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{item.nop || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{item.wt || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{item.vol || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{item.product}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{item.cod || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{item.val || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{item.re || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{item.bagNo || 'N/A'}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{item.price} TK</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.discount}
                      onChange={(e) => handleDiscountChange(index, parseInt(e.target.value))}
                      style={{ width: '60px', padding: '5px' }}
                    />
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{item.total.toFixed(2)} TK</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    {isRegistered ? (
                      <span style={{ color: 'green', fontWeight: 'bold' }}>REGISTERED</span>
                    ) : (
                      <button 
                        className="btn btn-info" 
                        onClick={() => handleRegisterClient(item, index)}
                        disabled={registering[index] || !user}
                        style={{ 
                          padding: '8px 12px', 
                          fontSize: '12px',
                          minWidth: '100px'
                        }}
                      >
                        {registering[index] ? 'রেজিস্টার হচ্ছে...' : 'REGISTER'}
                      </button>
                    )}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    <button 
                      className="btn btn-success" 
                      onClick={() => handleSubmitSingle(item, index)}
                      disabled={submittingSingle[index] || !user}
                      style={{ 
                        padding: '8px 12px', 
                        fontSize: '12px',
                          minWidth: '80px'
                        }}
                      >
                      {submittingSingle[index] ? 'জমা হচ্ছে...' : 'SUBMIT'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <td colSpan="21" style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right', fontWeight: 'bold' }}>মোট:</td>
              <td style={{ padding: '12px', border: '1px solid #dee2e6', fontWeight: 'bold' }}>{grandTotal.toFixed(2)} TK</td>
              <td style={{ padding: '12px', border: '1px solid #dee2e6' }}></td>
              <td style={{ padding: '12px', border: '1px solid #dee2e6' }}></td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button 
          className="btn btn-primary" 
          onClick={handleSubmitAll}
          disabled={!user || items.length === 0}
          style={{ padding: '10px 20px' }}
        >
          SUBMIT ALL BILLS
        </button>
        
        {!user && (
          <p style={{ color: 'red' }}>বিল জমা দিতে লগইন প্রয়োজন</p>
        )}
      </div>
    </div>
  );
};

export default DataTable;