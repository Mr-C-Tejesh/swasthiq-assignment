import React, { useState } from "react";
import Dashboard from "./Dashboard";
import Inventory from "./Inventory";
import "./styles.css";

function App() {

  const [pageView, setPageView] = useState("inventory");

  return (
    <div style={{ display: "flex" }}>

      <div style={{
        width: "80px",
        background: "#f5f5f5",
        height: "100vh",
        paddingTop: "20px"
      }}>
        <button onClick={() => setPageView("dashboard")}>🏠</button>
        <button onClick={() => setPageView("inventory")}>📦</button>
      </div>

      <div style={{ flex: 1, padding: "30px" }}>
        {pageView === "dashboard" && <Dashboard />}
        {pageView === "inventory" && <Inventory />}
      </div>

    </div>
  );
}

export default App;