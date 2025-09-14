import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from '../config'; // config থেকে import করুন

const FileUpload = ({ onDataProcessed }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const [processedData, setProcessedData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedData = localStorage.getItem("processedExcelData");
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setProcessedData(parsedData);
        if (onDataProcessed) {
          onDataProcessed(parsedData.items, parsedData.grandTotal, parsedData.totalDiscount || 0);
        }
      } catch (error) {
        console.error("Error parsing saved data:", error);
        localStorage.removeItem("processedExcelData");
        setError("Failed to load saved data");
      }
    }
  }, [onDataProcessed]);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setError("");
  };

  const fetchClientRate = async (name, address) => {
    try {
      const token = localStorage.getItem("token");
      
      // First try to get client-specific rates
      const res = await fetch(`${API_BASE_URL}/api/clients/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
         credentials: 'include',
        body: JSON.stringify({ name, address }),
      });
      
      if (!res.ok) {
        throw new Error(`Server returned ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      
      // If client exists and has rate configuration, use it
      if (data.success && data.client && (
        data.client.ratePerKg > 0 || 
        data.client.usdSurcharge > 0 || 
        data.client.baseRate > 0 || 
        data.client.extraRatePerKg > 0
      )) {
        return {
          ratePerKg: data.client.ratePerKg ?? 0,
          usdSurcharge: data.client.usdSurcharge ?? 0,
          baseRate: data.client.baseRate ?? 0,
          extraRatePerKg: data.client.extraRatePerKg ?? 0,
          discountType: data.client.discountType ?? 'percentage',
          discountValue: data.client.discountValue ?? 0,
        };
      }
      
      // If client doesn't exist or has no rate config, fetch global rate config
      const globalRes = await fetch(`${API_BASE_URL}/api/rate-config`);;
      const globalData = await globalRes.json();
      
      if (globalData.success && globalData.config) {
        return {
          ratePerKg: globalData.config.ratePerKg ?? 0,
          usdSurcharge: globalData.config.usdSurcharge ?? 0,
          baseRate: globalData.config.baseRate ?? 0,
          extraRatePerKg: globalData.config.extraRatePerKg ?? 0,
          discountType: globalData.config.discountType ?? 'percentage',
          discountValue: globalData.config.discountValue ?? 0,
        };
      }
    } catch (err) {
      console.error("Rate fetch error:", err);
      setError(`Failed to fetch rate: ${err.message}`);
    }
    
    // Fallback to default values
    return {
      ratePerKg: 0,
      usdSurcharge: 0,
      baseRate: 0,
      extraRatePerKg: 0,
      discountType: 'percentage',
      discountValue: 0,
    };
  };

  const applyDiscount = (price, discountType, discountValue) => {
    if (!discountValue || discountValue <= 0) return price;
    
    if (discountType === 'percentage') {
      return price * (1 - discountValue / 100);
    } else if (discountType === 'fixed') {
      return Math.max(0, price - discountValue);
    }
    
    return price;
  };

  const processExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          const items = [];

          if (!jsonData || jsonData.length === 0) {
            throw new Error("Excel file is empty or improperly formatted.");
          }

          let startRow = 0;
          for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row) continue;
            if (
              row.includes("NO") ||
              row.includes("AWB NO") ||
              row.includes("SHIPPER")
            ) {
              startRow = i;
              break;
            }
          }

          if (startRow === 0 && jsonData.length > 0) {
            startRow = -1;
          }

          for (let row = startRow + 1; row < jsonData.length; row++) {
            const rowData = jsonData[row];
            if (!rowData || rowData.length === 0) continue;

            // এক্সেল ফাইলের কলাম ম্যাপিং ঠিক করুন
            const no = rowData[0] || "";
            const awbNo = rowData[1] || "";
            const extra = rowData[2] || "";
            const shipper = rowData[3] || "";
            const shipperAddress = rowData[4] || "";
            const consignee = rowData[5] || "";
            const binVat = rowData[6] || "";
            const dest = rowData[7] || "";
            const cneeAddress = rowData[8] || "";
            const ctc = rowData[9] || "";
            const telNo = rowData[10] || "";
            const nop = rowData[11] || "";
            const wt = parseFloat(rowData[12]) || 0;
            const vol = rowData[13] || "";
            const dsct = rowData[14] || "";
            const cod = rowData[15] || "";
            const val = rowData[16] || "";
            const re = rowData[17] || "";
            const bagNo = rowData[18] || "";

            let originalPrice = 0;
            let finalPrice = 0;
            let discountAmount = 0;
            let rateSource = "default";
            
            if (consignee && wt > 0) {
              const rateConfig = await fetchClientRate(
                consignee.toString().trim(),
                cneeAddress?.toString().trim()
              );

              if (rateConfig) {
                console.log(`Client: ${consignee}, WT: ${wt}, Base Rate: ${rateConfig.baseRate}, Extra Rate: ${rateConfig.extraRatePerKg}, Discount: ${rateConfig.discountValue}${rateConfig.discountType === 'percentage' ? '%' : ''}`);
                
                if (rateConfig.baseRate > 0) {
                  if (wt <= 1) {
                    originalPrice = rateConfig.baseRate;
                  } else {
                    const extraRate = rateConfig.extraRatePerKg > 0 ? rateConfig.extraRatePerKg : rateConfig.baseRate;
                    originalPrice = rateConfig.baseRate + (wt - 1) * extraRate;
                  }
                  console.log(`Using tiered pricing: ${originalPrice} = ${rateConfig.baseRate} + (${wt} - 1) * ${rateConfig.extraRatePerKg > 0 ? rateConfig.extraRatePerKg : rateConfig.baseRate}`);
                }
                else if (rateConfig.ratePerKg > 0 && wt === rateConfig.ratePerKg) {
                  originalPrice = rateConfig.usdSurcharge;
                  console.log(`Using USD Surcharge: ${originalPrice} (WT matches RatePerKG)`);
                } 
                else if (rateConfig.ratePerKg > 0) {
                  originalPrice = wt * rateConfig.ratePerKg;
                  console.log(`Using normal calculation: ${originalPrice} = ${wt} × ${rateConfig.ratePerKg}`);
                }
                else if (rateConfig.usdSurcharge > 0) {
                  originalPrice = rateConfig.usdSurcharge;
                  console.log(`Using USD Surcharge: ${originalPrice} (No RatePerKG configured)`);
                }
                else {
                  originalPrice = wt * 100;
                  console.log(`Using default pricing: ${originalPrice} = ${wt} × 100`);
                }

                finalPrice = applyDiscount(originalPrice, rateConfig.discountType, rateConfig.discountValue);
                discountAmount = originalPrice - finalPrice;
                
                console.log(`Original Price: ${originalPrice}, Discount Applied: ${rateConfig.discountValue}${rateConfig.discountType === 'percentage' ? '%' : ''}, Final Price: ${finalPrice}`);
              }
            }

            items.push({
              id: no || row + 1,
              awbNo: awbNo.toString(),
              extra: extra.toString(),
              shipper: shipper.toString().trim(),
              shipperAddress: shipperAddress.toString().trim(),
              dest: dest.toString().trim(),
              customerName: consignee.toString().trim(),
              cneeAddress: cneeAddress.toString().trim(),
              ctc: ctc.toString(),
              telNo: telNo.toString(),
              nop: nop.toString(),
              wt: wt.toString(),
              vol: vol.toString(),
              product: dsct.toString().trim(),
              cod: cod.toString(),
              val: val.toString(),
              re: re.toString(),
              bagNo: bagNo.toString(),
              binVat: binVat.toString(),
              price: originalPrice,
              quantity: 1,
              discount: discountAmount,
              total: finalPrice,
              rateSource: rateSource
            });
          }

          if (items.length === 0) {
            throw new Error("File processed but no valid data rows found.");
          }

          const grandTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
          const totalDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
          resolve({ items, grandTotal, totalDiscount });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => {
        reject(new Error("Error reading file: " + error.message));
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const result = await processExcelFile(selectedFile);

      if (result.items.length === 0) {
        setError("No valid data found.");
        return;
      }

      setProcessedData(result);
      localStorage.setItem("processedExcelData", JSON.stringify(result));

      onDataProcessed(result.items, result.grandTotal, result.totalDiscount || 0);
      alert(
        `File processed successfully! ${result.items.length} items found. Total Discount: ${(result.totalDiscount || 0).toFixed(2)}`
      );
    } catch (error) {
      console.error("File processing error:", error);
      setError("File processing failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const clearData = () => {
    setProcessedData(null);
    setSelectedFile(null);
    setError("");
    localStorage.removeItem("processedExcelData");
    if (onDataProcessed) {
      onDataProcessed([], 0, 0);
    }
    alert("Data cleared.");
  };

  return (
    <div className="card">
      <h3 style={{ fontWeight: "bold" }}>Upload Excel File</h3>

      {error && (
        <div className="alert alert-error" style={{color: "#721c24", backgroundColor: "#f8d7da", borderColor: "#f5c6cb", padding: "10px", borderRadius: "5px", marginBottom: "15px", fontWeight: "bold"}}>
          {error}
        </div>
      )}

      {processedData && (
        <div
          style={{
            marginBottom: "20px",
            padding: "10px",
            backgroundColor: "#e7f4e4",
            borderRadius: "5px",
            fontWeight: "bold"
          }}
        >
          <h4 style={{ fontWeight: "bold" }}>✅ Processed data saved</h4>
          <p>Total items: {processedData.items.length}</p>
          <p>Total amount: {(processedData.grandTotal || 0).toFixed(2)}</p>
          <p>Total discount: {(processedData.totalDiscount || 0).toFixed(2)}</p>
          <button
            className="btn btn-secondary"
            onClick={clearData}
            style={{ marginTop: "10px", fontWeight: "bold" }}
          >
            Clear Data
          </button>
        </div>
      )}

      <div className="form-group" style={{ fontWeight: "bold" }}>
        <label>Upload Excel File (.xlsx, .xls, .csv):</label>
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>

      {selectedFile && (
        <div style={{ fontWeight: "bold" }}>
          <p>Selected file: {selectedFile.name}</p>
          <p>File size: {(selectedFile.size / 1024).toFixed(2)} KB</p>
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        style={{ marginRight: "10px", fontWeight: "bold" }}
      >
        {uploading ? "Processing..." : "Process File"}
      </button>

      <div
        style={{
          marginTop: "20px",
          padding: "10px",
          backgroundColor: "#f8f9fa",
          borderRadius: "5px",
          fontWeight: "bold"
        }}  
      >
        <h4 style={{ fontWeight: "bold" }}>File format guidelines:</h4>
        <ul>
          <li>Column A: NO</li>
          <li>Column B: AWB NO</li>
          <li>Column C: EXTRA</li>
          <li>Column D: SHIPPER</li>
          <li>Column E: SHIPPER ADDRESS</li>
          <li>Column F: CONSIGNEE (Consignee Name)</li>
          <li>Column G: BIN/VAT</li>
          <li>Column H: DEST</li>
          <li>Column I: CNEE ADDRESS</li>
          <li>Column J: CTC</li>
          <li>Column K: TEL NO.</li>
          <li>Column L: NOP</li>
          <li>Column M: WT</li>
          <li>Column N: VOL</li>
          <li>Column O: DSCT</li>
          <li>Column P: COD</li>
          <li>Column Q: VAL</li>
          <li>Column R: RE</li>
          <li>Column S: BAG NO</li>
          <li>👉 "PRICE" column will be automatically populated based on Config</li>
        </ul>

        <h4 style={{ marginTop: "15px", color: "#007bff", fontWeight: "bold" }}>Pricing Calculation Method:</h4>
        <p style={{ color: "#dc3545", fontWeight: "bold" }}>
          New pricing model: First 1 kg Base Rate, then Extra Rate (if not available, then Base Rate)
        </p>
        <p>✅ Example: WT = 0.5 → Price = Base Rate (500)</p>
        <p>✅ Example: WT = 1 → Price = Base Rate (500)</p>
        <p>✅ Example: WT = 2 → Price = 500 + (2-1) × 400 = 900</p>
        <p>✅ Example: WT = 3 → Price = 500 + (3-1) × 400 = 1300</p>
        <p>✅ Example: WT = 2, if Extra Rate is not available → Price = 500 + (2-1) × 500 = 1000</p>

        <p style={{ color: "#28a745", fontWeight: "bold", marginTop: "15px" }}>
          Discount System:
        </p>
        <p>✅ Percentage Discount: X% will be deducted from the Price</p>
        <p>✅ Fixed Discount: X TK will be deducted from the Price</p>
        <p>✅ Example: Price 800, 50% Discount → Final Price: 400</p>

        <p style={{ color: "#6c757d", fontStyle: "italic", marginTop: "15px", fontWeight: "bold" }}>
          Note: Client-specific rates will be used first. If not available, global rate configuration will be used.
          If no rate is available, the default rate (100 TK/kg) will be used.
        </p>
      </div>
    </div>
  );
};

export default FileUpload;// Last updated: 09/15/2025 02:16:37
