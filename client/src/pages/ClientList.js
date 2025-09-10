import { useEffect, useState } from "react";
import axios from "axios";

import RateConfigModal from "../components/RateConfigModal"; // Global Rate Config Modal

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [globalModal, setGlobalModal] = useState(false);

  // Rate config form state
  const [ratePerKg, setRatePerKg] = useState("");
  const [usdSurcharge, setUsdSurcharge] = useState("");

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/clients");
      if (res.data.success) {
        setClients(res.data.clients);
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

  const handleSaveRates = async () => {
    if (!selectedClient) return;
    try {
      const res = await axios.put(`/api/clients/${selectedClient._id}`, {
        ratePerKg: ratePerKg === "" ? null : Number(ratePerKg),
        usdSurcharge: usdSurcharge === "" ? null : Number(usdSurcharge),
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
      <h2>Client List</h2>

      {/* Global Rate Config */}
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
            <th>Name</th>
            <th>Address</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Registered By</th>
            <th>Rate Per KG</th>
            <th>USD Surcharge</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client._id}>
              <td>{client.name}</td>
              <td>{client.address}</td>
              <td>{client.email}</td>
              <td>{client.phone}</td>
              <td>
                {client.registeredBy?.name} ({client.registeredBy?.email})
              </td>
              <td>{client.ratePerKg ?? "-"}</td>
              <td>{client.usdSurcharge ?? "-"}</td>
              <td>
                <button
                  onClick={() => {
                    setSelectedClient(client);
                    setRatePerKg(client.ratePerKg ?? "");
                    setUsdSurcharge(client.usdSurcharge ?? "");
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

      {/* Profile Modal */}
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
              width: "400px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{selectedClient.name} - Profile</h3>
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

            <h4>Rate Configuration</h4>
            <div>
              <label>Rate per KG: </label>
              <input
                type="number"
                value={ratePerKg}
                onChange={(e) => setRatePerKg(e.target.value)}
                placeholder="Enter rate"
              />
            </div>
            <div>
              <label>USD Surcharge: </label>
              <input
                type="number"
                value={usdSurcharge}
                onChange={(e) => setUsdSurcharge(e.target.value)}
                placeholder="Enter surcharge"
              />
            </div>

            <button onClick={handleSaveRates} style={{ marginRight: "10px" }}>
              Save
            </button>
            <button onClick={() => setShowProfileModal(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Global Rate Config Modal */}
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
