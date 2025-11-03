import React, { createContext, useState, useEffect, useContext } from "react";

type Role = "admin" | "recepcionista" | "camareira";

type AuthContextType = {
  isAuthenticated: boolean;
  userRole: Role | null;
  userName: string | null;
  login: (userData: { name: string; role: Role }) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  userRole: null,
  userName: null,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // Carrega do localStorage ao iniciar
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setIsAuthenticated(true);
        setUserRole(parsed.role);
        setUserName(parsed.name);
      } catch {
        localStorage.removeItem("user");
      }
    }
  }, []);

  const login = (userData: { name: string; role: Role }) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setIsAuthenticated(true);
    setUserRole(userData.role);
    setUserName(userData.name);
  };

  const logout = () => {
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUserRole(null);
    setUserName(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, userName, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
