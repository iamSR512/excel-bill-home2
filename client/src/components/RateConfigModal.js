import React, { useState, useEffect } from "react";

const RateConfigModal = ({ isOpen, onClose }) => {
  const [ratePerKg, setRatePerKg] = useState(0);
  const [usdSurcharge, setUsdSurcharge] = useState(0);
  const [baseRate, setBaseRate] = useState(0);
  const [extraRatePerKg, setExtraRatePerKg] = useState(0);
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState(0);
  const [updateAllClients, setUpdateAllClients] = useState(false);

  // ✅ Load current config when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchRateConfig();
    }
  }, [isOpen]);

  const fetchRateConfig = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/rate-config");
      const data = await res.json();
      if (data && data.config) {
        setRatePerKg(data.config.ratePerKg ?? 0);
        setUsdSurcharge(data.config.usdSurcharge ?? 0);
        setBaseRate(data.config.baseRate ?? 0);
        setExtraRatePerKg(data.config.extraRatePerKg ?? 0);
        setDiscountType(data.config.discountType ?? "percentage");
        setDiscountValue(data.config.discountValue ?? 0);
      }
    } catch (err) {
      console.error("Failed to load rate config:", err);
    }
  };

  const saveRateConfig = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/rate-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ratePerKg, 
          usdSurcharge, 
          baseRate, 
          extraRatePerKg, 
          discountType, 
          discountValue,
          updateAllClients
        }),
      });

      if (res.ok) {
        alert("✅ গ্লোবাল রেট কনফিগারেশন সফলভাবে সংরক্ষণ করা হয়েছে!");
        onClose();
      } else {
        alert("❌ সংরক্ষণ ব্যর্থ হয়েছে");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("❌ সার্ভারের সাথে যোগাযোগ ব্যর্থ হয়েছে");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "8px",
          width: "500px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h3>⚙️ গ্লোবাল রেট কনফিগারেশন</h3>

        <div style={{ marginBottom: "15px" }}>
          <label>প্রতি কেজি রেট:</label>
          <input
            type="number"
            value={ratePerKg}
            onChange={(e) => setRatePerKg(Number(e.target.value))}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>USD সারচার্জ:</label>
          <input
            type="number"
            value={usdSurcharge}
            onChange={(e) => setUsdSurcharge(Number(e.target.value))}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        <h4 style={{ marginTop: "20px", marginBottom: "10px" }}>টায়ার্ড প্রাইসিং কনফিগারেশন</h4>
        
        <div style={{ marginBottom: "15px" }}>
          <label>বেস রেট (প্রথম ১ কেজির জন্য):</label>
          <input
            type="number"
            value={baseRate}
            onChange={(e) => setBaseRate(Number(e.target.value))}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>অতিরিক্ত রেট (১ কেজির পরের জন্য):</label>
          <input
            type="number"
            value={extraRatePerKg}
            onChange={(e) => setExtraRatePerKg(Number(e.target.value))}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        <h4 style={{ marginTop: "20px", marginBottom: "10px" }}>গ্লোবাল ডিসকাউন্ট কনফিগারেশন</h4>
        
        <div style={{ marginBottom: "15px" }}>
          <label>ডিসকাউন্ট ধরণ:</label>
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          >
            <option value="percentage">শতকরা (%)</option>
            <option value="fixed">নির্দিষ্ট Amount</option>
          </select>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label>ডিসকাউন্ট মান:</label>
          <input
            type="number"
            value={discountValue}
            onChange={(e) => setDiscountValue(Number(e.target.value))}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label>
            <input
              type="checkbox"
              checked={updateAllClients}
              onChange={(e) => setUpdateAllClients(e.target.checked)}
              style={{ marginRight: "10px" }}
            />
            সব ক্লাইন্ট আপডেট করুন (Existing সব ক্লাইন্টের রেট পরিবর্তন হবে)
          </label>
        </div>

        <div style={{ marginTop: "20px", textAlign: "right" }}>
          <button
            style={{ 
              padding: "8px 16px", 
              marginRight: "10px", 
              backgroundColor: "#6c757d", 
              color: "white", 
              border: "none", 
              borderRadius: "4px",
              cursor: "pointer"
            }}
            onClick={onClose}
          >
            বাতিল
          </button>
          <button 
            style={{ 
              padding: "8px 16px", 
              backgroundColor: "#007bff", 
              color: "white", 
              border: "none", 
              borderRadius: "4px",
              cursor: "pointer"
            }}
            onClick={saveRateConfig}
          >
            সংরক্ষণ করুন
          </button>
        </div>
      </div>
    </div>
  );
};

export default RateConfigModal;