import React from "react";
import { useNavigate } from "react-router-dom";


function Dashboard() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-screen">

      {/* 🔥 SIDEBAR (3 colors style) */}
      <div className="w-64 bg-gray-900 text-white p-5 flex flex-col gap-4">

        <h1 className="text-xl font-bold mb-4 text-blue-400">
          📦 Stock System
        </h1>

        {/* NAV BUTTONS (BLUE PRIMARY) */}
        <button
          onClick={() => navigate("/sparepart")}
          className="bg-blue-600 hover:bg-blue-500 p-2 rounded transition"
        >
          Spare Parts
        </button>

        <button
          onClick={() => navigate("/stockin")}
          className="bg-blue-600 hover:bg-blue-500 p-2 rounded transition"
        >
          Stock In
        </button>

        <button
          onClick={() => navigate("/stockout")}
          className="bg-blue-600 hover:bg-blue-500 p-2 rounded transition"
        >
          Stock Out
        </button>
        
        <button
          onClick={() => navigate("/InvoicePDF")}
          className="bg-blue-600 hover:bg-blue-500 p-2 rounded transition"
        >
          invoice
        </button>

        <button
          onClick={() => navigate("/StockReport")}
          className="bg-blue-600 hover:bg-blue-500 p-2 rounded transition"
        >
          Stock Report
        </button>

        {/* LOGOUT (RED) */}
        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-500 p-2 rounded mt-5 transition"
        >
          🚪 Logout
        </button>
      </div>

      {/* 🔥 MAIN CONTENT (LIGHT BACKGROUND) */}
      <div className="flex-1 bg-gray-100 p-10">
        <h2 className="text-2xl font-bold text-gray-800">
          Welcome to Dashboard
        </h2>

        <p className="mt-2 text-gray-600">
          Select a menu item from the sidebar.
        </p>
      </div>

    </div>
  );
}

export default Dashboard;