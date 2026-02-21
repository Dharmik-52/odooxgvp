import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

export default function MainLayout() {
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 1024);
    handle();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  const sidebarWidth = isMobile ? "0" : (isCollapsed ? "68px" : "256px");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0D1117" }}>
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(prev => !prev)}
      />
      <div style={{
        display: "flex", flexDirection: "column", flex: 1,
        marginLeft: sidebarWidth,
        minHeight: "100vh",
        transition: "margin-left 0.25s ease"
      }}>
        <Topbar isMobile={isMobile} />
        <main style={{
          flex: 1,
          padding: isMobile ? "16px" : "24px",
          overflowY: "auto"
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
