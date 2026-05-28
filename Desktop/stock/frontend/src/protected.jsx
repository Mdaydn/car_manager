import React from "react";
import { Navigate } from "react-router-dom";

function Protected({ children }) {
  const token = localStorage.getItem("token");

  if (!token || token === "undefined" || token === "null") {
    return <Navigate to="/signin" replace />;
  }

  return children;
}

export default Protected;