import React, { useEffect, useState } from "react";

function Dashboard() {
  const [summary, setSummary] = useState({});
  const [lowStock, setLowStock] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/dashboard/summary")
      .then((res) => res.json())
      .then((data) => setSummary(data));

    fetch("http://127.0.0.1:8000/dashboard/low-stock")
      .then((res) => res.json())
      .then((data) => setLowStock(data));
  }, []);

  return (
    <div style={{ padding: "40px" }}>
      <h1>Dashboard</h1>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "20px",
        marginBottom: "30px"
      }}>

        <div className="card">
          <h4>Today's Sales</h4>
          <h2>₹1,24,580</h2>
        </div>

        <div className="card">
          <h4>Items Sold Today</h4>
          <h2>156</h2>
        </div>

        <div className="card">
          <h4>Low Stock Items</h4>
          <h2>{summary.low_stock}</h2>
        </div>

        <div className="card">
          <h4>Purchase Orders</h4>
          <h2>₹96,250</h2>
        </div>

      </div>

      <h2>Low Stock Medicines</h2>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Name</th>
            <th>Quantity</th>
          </tr>
        </thead>

        <tbody>
          {lowStock.map((med) => (
            <tr key={med.id}>
              <td>{med.name}</td>
              <td>{med.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Dashboard;