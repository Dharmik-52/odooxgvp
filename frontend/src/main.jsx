import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#161B22",
              color: "#fff",
              border: "1px solid #30363D"
            },
            success: { iconTheme: { primary: "#4ade80", secondary: "#000" } },
            error:   { iconTheme: { primary: "#f87171", secondary: "#000" } }
          }}
        />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
