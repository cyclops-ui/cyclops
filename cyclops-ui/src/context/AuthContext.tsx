import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import Cookies from "js-cookie";

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthentication = () => {
      const isAuthorizationEnabled =
        process.env.REACT_APP_CYCLOPS_AUTHORIZATION === "enabled";
      const isAuthCookieSet = Cookies.get("_isAuthenticated") === "true";

      console.log("Authorization enabled:", isAuthorizationEnabled);
      console.log("Auth cookie set:", isAuthCookieSet);

      if (!isAuthorizationEnabled) {
        setIsAuthenticated(true);
      } else if (isAuthCookieSet) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAuthentication();
  }, []);

  const login = async () => {
    setIsAuthenticated(true);
  };

  const logout = () => {
    Cookies.set("_isAuthenticated", "false");
    setIsAuthenticated(false);
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
