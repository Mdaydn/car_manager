import React from "react";
import {  Routes, Route, Navigate } from "react-router-dom";

import Protected from "./Protected";

import SparePart from "./stock/SpareParts";
import StockIn from "./stock/stockIn";
import StockOut from "./stock/stockOut";
import StockReport from "./stock/StockReport";
import Dashboard from "./stock/Dashboard";
import InvoicePDF from "./stock/invoice";
// 👉 make sure these files exist
import Auth from "./Auth";

function App() {
  return (
    
      <Routes>

        {/* 🔓 Public routes */}
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth />} />

        {/* 🔐 Default route */}
        <Route
          path="/"
          element={
            localStorage.getItem("token")
              ? <Navigate to="/dashboard" />
              : <Navigate to="/login" />
          }
        />

        {/* 🔐 Protected routes */}
        <Route
          path="/dashboard"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />

        <Route
          path="/sparepart"
          element={
            <Protected>
              <SparePart />
            </Protected>
          }
        />

        <Route
          path="/stockin"
          element={
            <Protected>
              <StockIn />
            </Protected>
          }
        />

        <Route
          path="/stockout"
          element={
            <Protected>
              <StockOut />
            </Protected>
          }
        />

        <Route
          path="/stockreport"
          element={
            <Protected>
              <StockReport />
            </Protected>
          }
        />
        <Route
          path="/InvoicePDF"
          element={
            <Protected>
              <InvoicePDF />
            </Protected>
          }
        />

      </Routes>
    
  );
}

export default App;