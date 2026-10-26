import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: "#161b22",
          color: "#e2e8f0",
          border: "1px solid #30363d",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "14px",
        },
        success: { iconTheme: { primary: "#10b981", secondary: "#080c0e" } },
        error:   { iconTheme: { primary: "#ef4444", secondary: "#080c0e" } },
      }}
    />
  </React.StrictMode>
);
