import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

export default function MainLayout() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 1024);
    handle();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0D1117" }}>
      <Sidebar />
      <div style={{
        display: "flex", flexDirection: "column", flex: 1,
        marginLeft: isMobile ? "0" : "256px",
        minHeight: "100vh"
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
