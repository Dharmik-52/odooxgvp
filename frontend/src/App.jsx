import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { useAuth } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

const Login        = lazy(() => import("./pages/Login.jsx"));
const Register     = lazy(() => import("./pages/Register.jsx"));
const Dashboard    = lazy(() => import("./pages/Dashboard.jsx"));
const Vehicles     = lazy(() => import("./pages/Vehicles.jsx"));
const TripDispatch = lazy(() => import("./pages/TripDispatch.jsx"));
const Maintenance  = lazy(() => import("./pages/Maintenance.jsx"));
const Expenses     = lazy(() => import("./pages/Expenses.jsx"));
const Drivers      = lazy(() => import("./pages/Drivers.jsx"));
const Analytics    = lazy(() => import("./pages/Analytics.jsx"));
const Unauthorized = lazy(() => import("./pages/Unauthorized.jsx"));
const MainLayout   = lazy(() => import("./components/layout/MainLayout.jsx"));

const Spinner = () => (
  <div style={{
    minHeight: "100vh", background: "#0D1117",
    display: "flex", alignItems: "center", justifyContent: "center"
  }}>
    <div style={{
      width: "36px", height: "36px",
      border: "3px solid #4ade80",
      borderTopColor: "transparent",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite"
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

function AppRoutes() {
  const { isAuthenticated, role } = useAuth();

  const home = {
    manager:        "/dashboard",
    dispatcher:     "/trips",
    safety_officer: "/drivers",
    analyst:        "/analytics"
  }[role] || "/dashboard";

  return (
    <Routes>
      <Route path="/" element={
        <Navigate to={isAuthenticated ? home : "/login"} replace />
      } />

      <Route path="/login" element={
        isAuthenticated ? <Navigate to={home} replace /> : <Login />
      } />
      <Route path="/register" element={
        isAuthenticated ? <Navigate to={home} replace /> : <Register />
      } />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/vehicles" element={
          <ProtectedRoute allowedRoles={["manager"]}>
            <Vehicles />
          </ProtectedRoute>
        } />

        <Route path="/trips" element={
          <ProtectedRoute allowedRoles={["manager", "dispatcher"]}>
            <TripDispatch />
          </ProtectedRoute>
        } />

        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/expenses"    element={<Expenses />} />

        <Route path="/drivers" element={
          <ProtectedRoute allowedRoles={["manager", "safety_officer"]}>
            <Drivers />
          </ProtectedRoute>
        } />

        <Route path="/analytics" element={
          <ProtectedRoute allowedRoles={["manager", "analyst"]}>
            <Analytics />
          </ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={
        <Navigate to={isAuthenticated ? home : "/login"} replace />
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Spinner />}>
        <AppRoutes />
      </Suspense>
    </BrowserRouter>
  );
}
