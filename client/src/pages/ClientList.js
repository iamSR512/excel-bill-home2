import { useEffect, useState } from "react";
import axios from "axios";
import RateConfigModal from "../components/RateConfigModal";

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [globalModal, setGlobalModal] = useState(false);
  const [duplicateClients, setDuplicateClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingEmail, setEditingEmail] = useState(null);
  const [emailValue, setEmailValue] = useState("");

  // Rate config form state
  const [ratePerKg, setRatePerKg] = useState("");
  const [baseRate, setBaseRate] = useState("");
  const [extraRatePerKg, setExtraRatePerKg] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [clientType, setClientType] = useState("REGULAR");

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/clients");
      if (res.data.success) {
        const clientsData = res.data.clients;
        setClients(clientsData);
        
        // ডুপ্লিকেট ক্লায়েন্ট খুঁজে বের করুন
        findDuplicateClients(clientsData);
        
        setError("");
      } else {
        setError("Failed to fetch clients");
      }
    } catch (err) {
      console.error("Client fetch error:", err);
      setError("Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  };

  // সার্চ ফিল্টার - নিরাপদ ভার্সন
  const filteredClients = clients.filter(client => {
    if (!searchTerm) return true;
    
    const searchTermLower = searchTerm.toLowerCase();
    
    // সব ফিল্ডকে স্ট্রিংয়ে কনভার্ট করুন এবং null/undefined হ্যান্ডেল করুন
    const fieldsToSearch = [
      client.name || '',
      client.address || '',
      client.clientId || '',
      client.email || '',
      client.phone || '',
      client.registeredBy?.name || '',
      client.registeredBy?.email || ''
    ];
    
    return fieldsToSearch.some(field => 
      field.toLowerCase().includes(searchTermLower)
    );
  });

  // ডুপ্লিকেট ক্লায়েন্ট খুঁজে বের করার ফাংশন
  const findDuplicateClients = (clientsData) => {
    const nameMap = {};
    const duplicates = [];
    
    clientsData.forEach(client => {
      const key = `${client.name || ''}-${client.address || ''}`.toLowerCase().trim();
      
      if (nameMap[key]) {
        duplicates.push(client);
      } else {
        nameMap[key] = true;
      }
    });
    
    setDuplicateClients(duplicates);
  };

  // ডুপ্লিকেট ক্লায়েন্ট মুছে ফেলার ফাংশন
  const handleDeleteDuplicate = async (clientId) => {
    try {
      const res = await axios.delete(`/api/clients/${clientId}`);
      if (res.data.success) {
        alert("ডুপ্লিকেট ক্লায়েন্ট মুছে ফেলা হয়েছে!");
        fetchClients(); // তালিকা রিফ্রেশ করুন
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("ডুপ্লিকেট ক্লায়েন্ট মুছতে সমস্যা হয়েছে");
    }
  };

  // ইমেইল এডিট মোড চালু করুন
  const handleEditEmail = (client) => {
    setEditingEmail(client._id);
    setEmailValue(client.email);
  };

  // ইমেইল সেভ করুন
  const handleSaveEmail = async (clientId) => {
    try {
      const res = await axios.put(`/api/clients/${clientId}`, {
        email: emailValue
      });
      
      if (res.data.success) {
        alert("ইমেইল সফলভাবে আপডেট করা হয়েছে!");
        setEditingEmail(null);
        fetchClients();
      }
    } catch (err) {
      console.error("Email update error:", err);
      alert("ইমেইল আপডেট করতে সমস্যা হয়েছে");
    }
  };

  // ক্লায়েন্ট টাইপ আপডেট করুন
  const handleClientTypeChange = async (clientId, newType) => {
    try {
      const res = await axios.put(`/api/clients/${clientId}`, {
        clientType: newType
      });
      
      if (res.data.success) {
        alert("ক্লায়েন্ট টাইপ সফলভাবে আপডেট করা হয়েছে!");
        fetchClients();
      }
    } catch (err) {
      console.error("Client type update error:", err);
      alert("ক্লায়েন্ট টাইপ আপডেট করতে সমস্যা হয়েছে");
    }
  };

  const handleSaveRates = async () => {
    if (!selectedClient) return;
    try {
      const res = await axios.put(`/api/clients/${selectedClient._id}`, {
        baseRate: baseRate === "" ? null : Number(baseRate),
        extraRatePerKg: extraRatePerKg === "" ? null : Number(extraRatePerKg),
        discountType: discountType,
        discountValue: discountValue === "" ? 0 : Number(discountValue),
        clientType: clientType
      });
      if (res.data.success) {
        alert("Rate configuration updated!");
        setShowProfileModal(false);
        fetchClients();
      }
    } catch (err) {
      console.error("Rate save error:", err);
      alert("Failed to update rates");
    }
  };

 if (loading) return <p>Loading clients...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Client Profile List</h2>

      {/* সার্চ বার */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Search by name, address, client ID, email or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
        />
      </div>

      {/* ডুপ্লিকেট ক্লায়েন্ট সেকশন */}
      {duplicateClients.length > 0 && (
        <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#fff3cd", border: "1px solid #ffeaa7" }}>
          <h3 style={{ color: "#856404" }}>DUPLICATE CLIENTS FOUND</h3>
          <p>WRITTEN BELOW {duplicateClients.length} DUPLICATE CLIENTS FOUND:</p>
          <ul>
            {duplicateClients.map(client => (
              <li key={client._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span>{client.name} - {client.address}</span>
                <button 
                  onClick={() => handleDeleteDuplicate(client._id)}
                  style={{ padding: "5px 10px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px" }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() => setGlobalModal(true)}
        style={{ marginBottom: "20px" }}
      >
        ⚙️ Global Rate Config
      </button>

      <table
        border="1"
        cellPadding="8"
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>Client ID</th>
            <th>Name</th>
            <th>Address</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Registered By</th>
            <th>Date & Time</th>
            <th>Base Rate</th>
            <th>Extra Rate/Kg</th>
            <th>Discount</th>
            <th>Client Type</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredClients.map((client) => (
            <tr key={client._id}>
              <td>{client.clientId}</td>
              <td>{client.name}</td>
              <td>{client.address}</td>
              <td>
                {editingEmail === client._id ? (
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <input
                      type="email"
                      value={emailValue}
                      onChange={(e) => setEmailValue(e.target.value)}
                      style={{ width: "150px", marginRight: "5px" }}
                    />
                    <button 
                      onClick={() => handleSaveEmail(client._id)}
                      style={{ marginRight: "5px" }}
                    >
                      Save
                    </button>
                    <button onClick={() => setEditingEmail(null)}>Cancel</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{client.email}</span>
                    <button 
                      onClick={() => handleEditEmail(client)}
                      style={{ marginLeft: "10px" }}
                    >
                      Edit
                    </button>
                  </div>
                )}
              </td>
              <td>{client.phone}</td>
              <td>
                {client.registeredBy?.name} ({client.registeredBy?.email})
              </td>
              <td>{new Date(client.registrationDate).toLocaleString()}</td>
              <td>{client.baseRate ?? "-"}</td>
              <td>{client.extraRatePerKg ?? "-"}</td>
              <td>
                {client.discountValue > 0 
                  ? `${client.discountValue}${client.discountType === 'percentage' ? '%' : '৳'}` 
                  : "-"
                }
              </td>
              <td>
                <select
                  value={client.clientType || "REGULAR"}
                  onChange={(e) => handleClientTypeChange(client._id, e.target.value)}
                >
                  <option value="VIP">VIP</option>
                  <option value="NEW">NEW</option>
                  <option value="REGULAR">REGULAR</option>
                </select>
              </td>
              <td>
                <button
                  onClick={() => {
                    setSelectedClient(client);
                    setBaseRate(client.baseRate ?? "");
                    setExtraRatePerKg(client.extraRatePerKg ?? "");
                    setDiscountType(client.discountType ?? "percentage");
                    setDiscountValue(client.discountValue ?? "");
                    setClientType(client.clientType ?? "REGULAR");
                    setShowProfileModal(true);
                  }}
                >
                  View Profile
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showProfileModal && selectedClient && (
        <div
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowProfileModal(false)}
        >
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "8px",
              width: "500px",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{selectedClient.name} - Profile</h3>
            <p>
              <strong>Client ID:</strong> {selectedClient.clientId}
            </p>
            <p>
              <strong>Address:</strong> {selectedClient.address}
            </p>
            <p>
              <strong>Email:</strong> {selectedClient.email}
            </p>
            <p>
              <strong>Phone:</strong> {selectedClient.phone}
            </p>
            <p>
              <strong>Registered By:</strong>{" "}
              {selectedClient.registeredBy?.name} (
              {selectedClient.registeredBy?.email})
            </p>
            <p>
              <strong>Registration Date:</strong>{" "}
              {new Date(selectedClient.registrationDate).toLocaleString()}
            </p>

            <h4>Rate Configuration</h4>
            
            {/* নতুন টায়ার্ড প্রাইসিং কনফিগারেশন */}
            <div style={{ marginBottom: "10px" }}>
              <label>Base Rate (For 1st KG): </label>
              <input
                type="number"
                value={baseRate}
                onChange={(e) => setBaseRate(e.target.value)}
                placeholder="Enter base rate"
              />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label>Extra Rate per Kg (For Over 1 KG): </label>
              <input
                type="number"
                value={extraRatePerKg}
                onChange={(e) => setExtraRatePerKg(e.target.value)}
                placeholder="Enter extra rate per kg"
              />
            </div>

            {/* ডিসকাউন্ট কনফিগারেশন */}
            <h4 style={{ marginTop: "20px" }}>Discount Configuration</h4>
            <div style={{ marginBottom: "10px" }}>
              <label>Discount Type: </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label>Discount Value: </label>
              <input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="Enter discount value"
              />
            </div>

            {/* ক্লায়েন্ট টাইপ কনফিগারেশন */}
            <h4 style={{ marginTop: "20px" }}>Client Type</h4>
            <div style={{ marginBottom: "20px" }}>
              <select
                value={clientType}
                onChange={(e) => setClientType(e.target.value)}
              >
                <option value="VIP">VIP</option>
                <option value="NEW">NEW</option>
                <option value="REGULAR">REGULAR</option>
              </select>
            </div>

            <button onClick={handleSaveRates} style={{ marginRight: "10px", marginTop: "20px" }}>
              Save
            </button>
            <button onClick={() => setShowProfileModal(false)}>Close</button>
          </div>
        </div>
      )}

      <RateConfigModal
        isOpen={globalModal}
        onClose={() => {
          setGlobalModal(false);
          fetchClients();
        }}
      />
    </div>
  );
};

export default ClientList;