import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { useAuth } from "../context/AuthContext";

const FileUpload = ({ onDataProcessed }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const [processedData, setProcessedData] = useState(null);

  useEffect(() => {
    const savedData = localStorage.getItem("processedExcelData");
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setProcessedData(parsedData);
        if (onDataProcessed) {
          onDataProcessed(parsedData.items, parsedData.grandTotal);
        }
      } catch (error) {
        console.error("Error parsing saved data:", error);
        localStorage.removeItem("processedExcelData");
      }
    }
  }, [onDataProcessed]);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const fetchClientRate = async (name, address) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/clients/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ name, address }),
      });
      const data = await res.json();
      if (data.success && data.client) {
        return {
          ratePerKg: data.client.ratePerKg ?? 0,
          usdSurcharge: data.client.usdSurcharge ?? 0,
          baseRate: data.client.baseRate ?? 0,
          extraRatePerKg: data.client.extraRatePerKg ?? 0,
          discountType: data.client.discountType ?? 'percentage',
          discountValue: data.client.discountValue ?? 0,
        };
      }
    } catch (err) {
      console.error("Rate fetch error:", err);
    }
    return null;
  };

  const applyDiscount = (price, discountType, discountValue) => {
    if (discountValue <= 0) return price;
    
    if (discountType === 'percentage') {
      return price - (price * discountValue / 100);
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
            throw new Error("Excel ফাইল খালি।");
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

          for (let row = startRow + 1; row < jsonData.length; row++) {
            const rowData = jsonData[row];
            if (!rowData || rowData.length === 0) continue;

            const no = rowData[0] || "";
            const awbNo = rowData[1] || "";
            const shipper = rowData[2] || "";
            const shipperAddress = rowData[3] || "";
            const consignee = rowData[4] || "";
            const dest = rowData[5] || "";
            const cneeAddress = rowData[6] || "";
            const nop = rowData[7] || "";
            const wt = parseFloat(rowData[8]) || 0;
            const dsct = rowData[9] || "";
            const cod = rowData[10] || "";
            const binVat = rowData[11] || "";

            let finalPrice = 0;
            let discountAmount = 0;
            if (consignee && wt > 0) {
              const rateConfig = await fetchClientRate(
                consignee.toString().trim(),
                cneeAddress?.toString().trim()
              );

              if (rateConfig) {
                console.log(`Client: ${consignee}, WT: ${wt}, Base Rate: ${rateConfig.baseRate}, Extra Rate: ${rateConfig.extraRatePerKg}, Discount: ${rateConfig.discountValue}${rateConfig.discountType === 'percentage' ? '%' : ''}`);
                
                // নতুন প্রাইসিং মডেল: প্রথম ১ কেজি Base Rate, তারপর Extra Rate
                if (rateConfig.baseRate > 0 && rateConfig.extraRatePerKg > 0) {
                  if (wt <= 1) {
                    finalPrice = rateConfig.baseRate;
                  } else {
                    finalPrice = rateConfig.baseRate + (wt - 1) * rateConfig.extraRatePerKg;
                  }
                  console.log(`Using tiered pricing: ${finalPrice} = ${rateConfig.baseRate} + (${wt} - 1) * ${rateConfig.extraRatePerKg}`);
                }
                // পুরানো লজিক (ব্যাকওয়ার্ড কম্প্যাটিবিলিটির জন্য)
                else if (rateConfig.ratePerKg > 0 && wt === rateConfig.ratePerKg) {
                  finalPrice = rateConfig.usdSurcharge;
                  console.log(`Using USD Surcharge: ${finalPrice} (WT matches RatePerKG)`);
                } 
                else if (rateConfig.ratePerKg > 0) {
                  finalPrice = wt * rateConfig.ratePerKg;
                  console.log(`Using normal calculation: ${finalPrice} = ${wt} × ${rateConfig.ratePerKg}`);
                }
                else if (rateConfig.usdSurcharge > 0) {
                  finalPrice = rateConfig.usdSurcharge;
                  console.log(`Using USD Surcharge: ${finalPrice} (No RatePerKG configured)`);
                }

                // ডিসকাউন্ট অ্যাপ্লাই করুন
                const priceBeforeDiscount = finalPrice;
                finalPrice = applyDiscount(finalPrice, rateConfig.discountType, rateConfig.discountValue);
                discountAmount = priceBeforeDiscount - finalPrice;
                
                if (discountAmount > 0) {
                  console.log(`Applied discount: ${discountAmount} (${rateConfig.discountValue}${rateConfig.discountType === 'percentage' ? '%' : ''})`);
                }
              } else {
                console.warn(`কোনো ক্লাইন্ট পাওয়া যায়নি: ${consignee}`);
              }
            }

            items.push({
              id: no || row + 1,
              awbNo: awbNo.toString(),
              shipper: shipper.toString().trim(),
              shipperAddress: shipperAddress.toString().trim(),
              dest: dest.toString().trim(),
              customerName: consignee.toString().trim(),
              cneeAddress: cneeAddress.toString().trim(),
              nop: nop.toString(),
              wt: wt.toString(),
              product: dsct.toString().trim(),
              cod: cod.toString(),
              binVat: binVat.toString(),
              price: finalPrice,
              quantity: 1,
              discount: discountAmount,
              total: finalPrice,
            });
          }

          if (items.length === 0) {
            throw new Error("ফাইলে কোনো valid ডেটা পাওয়া যায়নি।");
          }

          const grandTotal = items.reduce((sum, item) => sum + item.total, 0);
          const totalDiscount = items.reduce((sum, item) => sum + item.discount, 0);
          resolve({ items, grandTotal, totalDiscount });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("দয়া করে একটি ফাইল নির্বাচন করুন");
      return;
    }

    setUploading(true);

    try {
      const result = await processExcelFile(selectedFile);

      if (result.items.length === 0) {
        alert("কোনো valid ডেটা পাওয়া যায়নি।");
        return;
      }

      setProcessedData(result);
      localStorage.setItem("processedExcelData", JSON.stringify(result));

      onDataProcessed(result.items, result.grandTotal, result.totalDiscount);
      alert(
        `ফাইল সফলভাবে প্রসেস হয়েছে! ${result.items.length} টি আইটেম পাওয়া গেছে। মোট ডিসকাউন্ট: ${result.totalDiscount.toFixed(2)}`
      );
    } catch (error) {
      console.error("File processing error:", error);
      alert("ফাইল প্রসেসিং ব্যর্থ: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const clearData = () => {
    setProcessedData(null);
    setSelectedFile(null);
    localStorage.removeItem("processedExcelData");
    if (onDataProcessed) {
      onDataProcessed([], 0, 0);
    }
    alert("ডেটা সাফ করা হয়েছে।");
  };

  return (
    <div className="card">
      <h3>এক্সেল ফাইল আপলোড</h3>

  {processedData && (
  <div
    style={{
      marginBottom: "20px",
      padding: "10px",
      backgroundColor: "#e7f4e4",
      borderRadius: "5px",
    }}
  >
    <h4>✅ প্রসেস করা ডেটা সংরক্ষিত আছে</h4>
    <p>মোট আইটেম: {processedData.items.length}টি</p>
    <p>মোট মূল্য: {processedData.grandTotal?.toFixed(2)}</p>
    <p>মোট ডিসকাউন্ট: {(processedData.totalDiscount || 0).toFixed(2)}</p>
    <button
      className="btn btn-secondary"
      onClick={clearData}
      style={{ marginTop: "10px" }}
    >
      ডেটা সাফ করুন
    </button>
  </div>
)}

      <div className="form-group">
        <label>এক্সেল ফাইল নির্বাচন করুন (.xlsx, .xls, .csv):</label>
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileChange}
        />
      </div>

      {selectedFile && (
        <div>
          <p>নির্বাচিত ফাইল: {selectedFile.name}</p>
          <p>फाइলের সাইজ: {(selectedFile.size / 1024).toFixed(2)} KB</p>
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        style={{ marginRight: "10px" }}
      >
        {uploading ? "প্রসেস হচ্ছে..." : "ফাইল প্রসেস করুন"}
      </button>

      <div
        style={{
          marginTop: "20px",
          padding: "10px",
          backgroundColor: "#f8f9fa",
          borderRadius: "5px",
        }}
      >
        <h4>ফাইল format নির্দেশিকা:</h4>
        <ul>
          <li>কলাম A: NO</li>
          <li>কলাম B: AWB NO</li>
          <li>কলাম C: SHIPPER</li>
          <li>কলাম D: SHIPPER ADDRESS</li>
          <li>কলাম E: CONSIGNEE (গ্রাহকের নাম)</li>
          <li>কলাম F: DEST</li>
          <li>কলাম G: CNEE ADDRESS</li>
          <li>কলাম H: NOP</li>
          <li>কলাম I: WT</li>
          <li>কলাম J: DSCT</li>
          <li>কলাম K: COD</li>
          <li>কলাম L: BIN/VAT</li>
          <li>👉 "মূল্য" কলাম Config অনুযায়ী স্বয়ংক্রিয়ভাবে যুক্ত হবে</li>
        </ul>

        <h4 style={{ marginTop: "15px", color: "#007bff" }}>মূল্য হিসাব পদ্ধতি:</h4>
        <p style={{ color: "#dc3545", fontWeight: "bold" }}>
          নতুন প্রাইসিং মডেল: প্রথম ১ কেজি Base Rate, তারপর Extra Rate
        </p>
        <p>✅ উদাহরণ: WT = 0.5 → মূল্য = Base Rate (500)</p>
        <p>✅ উদাহরণ: WT = 1 → মূল্য = Base Rate (500)</p>
        <p>✅ উদাহরণ: WT = 2 → মূল্য = 500 + (2-1) × 400 = 900</p>
        <p>✅ উদাহরণ: WT = 3 → মূল্য = 500 + (3-1) × 400 = 1300</p>
        
        <p style={{ color: "#28a745", fontWeight: "bold", marginTop: "15px" }}>
          ডিসকাউন্ট সিস্টেম:
        </p>
        <p>✅ শতকরা ডিসকাউন্ট: মূল্য থেকে X% কাটা হবে</p>
        <p>✅ ফিক্সড ডিসকাউন্ট: মূল্য থেকে X টাকা কাটা হবে</p>
        
        <p style={{ color: "#6c757d", fontStyle: "italic", marginTop: "15px" }}>
          Note: ক্লাইন্ট কনফিগারেশনে Base Rate, Extra Rate per Kg এবং ডিসকাউন্ট সেট করতে হবে।
          যদি না থাকে, তাহলে পুরানো লজিক ব্যবহার করা হবে।
        </p>
      </div>
    </div>
  );
};

export default FileUpload;