import React, { useState, useEffect } from "react";

const RateConfigModal = ({ isOpen, onClose }) => {
  const [ratePerKg, setRatePerKg] = useState(0);
  const [usdSurcharge, setUsdSurcharge] = useState(0);

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
      if (data) {
        setRatePerKg(data.ratePerKg ?? 0);
        setUsdSurcharge(data.usdSurcharge ?? 0);
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
        body: JSON.stringify({ ratePerKg, usdSurcharge }),
      });

      if (res.ok) {
        alert("✅ রেট কনফিগারেশন সফলভাবে সংরক্ষণ করা হয়েছে!");
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
          width: "400px",
        }}
      >
        <h3>⚙️ গ্লোবাল রেট কনফিগারেশন</h3>

        <div className="form-group">
          <label>প্রতি কেজি রেট:</label>
          <input
            type="number"
            value={ratePerKg}
            onChange={(e) => setRatePerKg(Number(e.target.value))}
            className="form-control"
          />
        </div>

        <div className="form-group" style={{ marginTop: "10px" }}>
          <label>USD সারচার্জ:</label>
          <input
            type="number"
            value={usdSurcharge}
            onChange={(e) => setUsdSurcharge(Number(e.target.value))}
            className="form-control"
          />
        </div>

        <div style={{ marginTop: "20px", textAlign: "right" }}>
          <button
            className="btn btn-secondary"
            onClick={onClose}
            style={{ marginRight: "10px" }}
          >
            বাতিল
          </button>
          <button className="btn btn-primary" onClick={saveRateConfig}>
            সংরক্ষণ করুন
          </button>
        </div>
      </div>
    </div>
  );
};

export default RateConfigModal;
