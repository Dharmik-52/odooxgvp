import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]                       = useState(null);
  const [token, setToken]                     = useState(null);
  const [role, setRole]                       = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading]             = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("fleetflow_token");
      const storedRole  = localStorage.getItem("fleetflow_role");
      const storedName  = localStorage.getItem("fleetflow_user");

      if (storedToken && storedRole) {
        setToken(storedToken);
        setRole(storedRole);
        setUser({ full_name: storedName || "User", role: storedRole });
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error("Session restore failed:", err);
      localStorage.removeItem("fleetflow_token");
      localStorage.removeItem("fleetflow_role");
      localStorage.removeItem("fleetflow_user");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (accessToken, userData) => {
    localStorage.setItem("fleetflow_token", accessToken);
    localStorage.setItem("fleetflow_role", userData.role || "");
    localStorage.setItem("fleetflow_user", userData.full_name || "");
    setToken(accessToken);
    setRole(userData.role);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("fleetflow_token");
    localStorage.removeItem("fleetflow_role");
    localStorage.removeItem("fleetflow_user");
    setToken(null);
    setRole(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const hasRole = (allowedRoles) => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    return allowedRoles.includes(role);
  };

  if (isLoading) {
    return (
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
  }

  return (
    <AuthContext.Provider value={{
      user, token, role, isAuthenticated, login, logout, hasRole
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export default AuthContext;
