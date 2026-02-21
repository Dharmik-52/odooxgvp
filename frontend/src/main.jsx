import "./sentry.js"; // Must be first import
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import Sentry from "./sentry.js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,       // 30 seconds
      gcTime: 5 * 60 * 1000,      // 5 minutes
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

const SentryFallback = () => (
  <div style={{
    minHeight: "100vh", background: "#0D1117",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexDirection: "column", color: "#fff", fontFamily: "sans-serif"
  }}>
    <h2 style={{ marginBottom: "8px" }}>Something went wrong</h2>
    <p style={{ color: "#9ca3af" }}>An unexpected error occurred. Please refresh the page.</p>
    <button
      onClick={() => window.location.reload()}
      style={{
        marginTop: "16px", padding: "10px 24px",
        background: "#4ade80", color: "#000", border: "none",
        borderRadius: "8px", fontWeight: 600, cursor: "pointer"
      }}
    >
      Refresh Page
    </button>
  </div>
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={SentryFallback}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
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
                error: { iconTheme: { primary: "#f87171", secondary: "#000" } }
              }}
            />
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
