import { createContext, useContext, useState, ReactNode } from "react";

type UserRole = "admin" | "recepcionista" | "camareira" | null;

type AuthContextType = {
  isAuthenticated: boolean;
  userRole: UserRole;
  login: (username: string, password: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);

  const login = (username: string, password: string) => {
    if (password !== "1234") return false;

    if (username === "nome@admin") {
      setUserRole("admin");
      setIsAuthenticated(true);
      return true;
    }

    if (username === "nome@recepcionista") {
      setUserRole("recepcionista");
      setIsAuthenticated(true);
      return true;
    }

    if (username === "nome@camareira") {
      setUserRole("camareira");
      setIsAuthenticated(true);
      return true;
    }

    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
};
