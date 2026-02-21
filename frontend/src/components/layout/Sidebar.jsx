import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  LayoutDashboard, Truck, MapPin, Wrench,
  Receipt, Users, BarChart2, LogOut,
  Shield, Menu, X
} from "lucide-react";

const NAV = [
  {
    label: "Dashboard", path: "/dashboard", icon: LayoutDashboard,
    roles: ["manager", "dispatcher"]
  },
  {
    label: "Vehicle Registry", path: "/vehicles", icon: Truck,
    roles: ["manager"]
  },
  {
    label: "Trip Dispatch", path: "/trips", icon: MapPin,
    roles: ["manager", "dispatcher"]
  },
  {
    label: "Maintenance", path: "/maintenance", icon: Wrench,
    roles: ["manager"]
  },
  {
    label: "Expenses", path: "/expenses", icon: Receipt,
    roles: ["manager"]
  },
  {
    label: "Drivers", path: "/drivers", icon: Users,
    roles: ["manager"]
  },
  {
    label: "Analytics", path: "/analytics", icon: BarChart2,
    roles: ["manager"]
  },
];

export default function Sidebar() {
  const { role, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 1024);
    handle();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  useEffect(() => {
    if (isMobile) setIsOpen(false);
  }, [location.pathname]);

  const visible = NAV.filter(n => n.roles.includes(role));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const SidebarContent = () => (
    <aside style={{
      width: "256px", height: "100%",
      background: "#161B22",
      borderRight: "1px solid #30363D",
      display: "flex", flexDirection: "column"
    }}>
      <div style={{
        padding: "20px 24px",
        borderBottom: "1px solid #30363D",
        display: "flex", alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Truck size={22} color="#4ade80" />
          <span style={{ color: "white", fontWeight: 700, fontSize: "18px" }}>
            Fleet<span style={{ color: "#4ade80" }}>Flow</span>
          </span>
        </div>
        {isMobile && (
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: "none", border: "none",
              cursor: "pointer", color: "#9ca3af"
            }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
        {visible.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap: "12px",
              padding: "10px 12px", borderRadius: "8px",
              marginBottom: "4px", textDecoration: "none",
              fontSize: "14px", fontWeight: 500,
              transition: "all 0.15s",
              color: isActive ? "#4ade80" : "#9ca3af",
              background: isActive ? "rgba(74,222,128,0.1)" : "transparent",
              borderLeft: isActive ? "2px solid #4ade80" : "2px solid transparent",
            })}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: "16px 12px", borderTop: "1px solid #30363D" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          padding: "0 12px", marginBottom: "10px"
        }}>
          <Shield size={13} color="#4ade80" />
          <span style={{
            color: "#4ade80", fontSize: "11px",
            fontWeight: 600, textTransform: "uppercase"
          }}>
            {role?.replace(/_/g, " ") || "User"}
          </span>
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "0 12px", marginBottom: "12px"
        }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "50%",
            background: "rgba(74,222,128,0.15)",
            border: "1px solid rgba(74,222,128,0.3)",
            display: "flex", alignItems: "center",
            justifyContent: "center",
            color: "#4ade80", fontWeight: 700,
            fontSize: "14px", flexShrink: 0
          }}>
            {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div style={{ overflow: "hidden" }}>
            <p style={{
              color: "white", fontSize: "13px", fontWeight: 500,
              whiteSpace: "nowrap", overflow: "hidden",
              textOverflow: "ellipsis", maxWidth: "160px"
            }}>
              {user?.full_name || "User"}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            display: "flex", alignItems: "center", gap: "10px",
            width: "100%", padding: "10px 12px",
            borderRadius: "8px", border: "none",
            background: "transparent", cursor: "pointer",
            color: "#9ca3af", fontSize: "14px", fontWeight: 500
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(248,113,113,0.1)";
            e.currentTarget.style.color = "#f87171";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#9ca3af";
          }}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: "fixed", top: "16px", left: "16px",
            zIndex: 60, background: "#161B22",
            border: "1px solid #30363D",
            borderRadius: "8px", padding: "8px",
            cursor: "pointer", color: "#9ca3af",
            display: "flex", alignItems: "center"
          }}
        >
          <Menu size={20} />
        </button>

        {isOpen && (
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.6)",
              zIndex: 55
            }}
          />
        )}

        <div style={{
          position: "fixed", top: 0, left: 0,
          height: "100vh", zIndex: 60,
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s ease"
        }}>
          <SidebarContent />
        </div>
      </>
    );
  }

  return (
    <div style={{ position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 50 }}>
      <SidebarContent />
    </div>
  );
}
