import React, { useState } from 'react';
import FileUpload from '../components/FileUpload';
import DataTable from '../components/DataTable';

const Home = () => {
  const [tableData, setTableData] = useState(null);
  const [grandTotal, setGrandTotal] = useState(0);

  const handleDataProcessed = (items, total) => {
    setTableData(items);
    setGrandTotal(total);
  };

  return (
    <div className="container">
      <h1>এক্সেল বিল ম্যানেজমেন্ট সিস্টেম</h1>
      <FileUpload onDataProcessed={handleDataProcessed} />
      {tableData && <DataTable items={tableData} grandTotal={grandTotal} />}
    </div>
  );
};

export default Home;