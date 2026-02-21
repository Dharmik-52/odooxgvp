import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import NotificationPanel from "../NotificationPanel.jsx";

const TITLES = {
  "/dashboard": "Command Center",
  "/vehicles": "Vehicle Registry",
  "/trips": "Trip Dispatch",
  "/maintenance": "Maintenance Logs",
  "/expenses": "Expenses & Fuel",
  "/drivers": "Driver Profiles",
  "/analytics": "Analytics & Reports",
};

export default function Topbar({ isMobile }) {
  const { pathname } = useLocation();
  const { user } = useAuth();

  return (
    <header style={{
      height: "64px", background: "#161B22",
      borderBottom: "1px solid #30363D",
      display: "flex", alignItems: "center",
      justifyContent: "space-between",
      padding: isMobile ? "0 16px 0 56px" : "0 24px",
      position: "sticky", top: 0, zIndex: 40
    }}>
      <h1 style={{
        color: "white", fontWeight: 600,
        fontSize: isMobile ? "15px" : "18px",
        whiteSpace: "nowrap", overflow: "hidden",
        textOverflow: "ellipsis"
      }}>
        {TITLES[pathname] || "FleetFlow"}
      </h1>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <NotificationPanel />

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "30px", height: "30px", borderRadius: "50%",
            background: "rgba(74,222,128,0.15)",
            border: "1px solid rgba(74,222,128,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#4ade80", fontWeight: 700, fontSize: "13px"
          }}>
            {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          {!isMobile && (
            <span style={{ color: "#d1d5db", fontSize: "14px", fontWeight: 500 }}>
              {user?.full_name || "User"}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
