import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

interface AuthContextType {
  isAuthenticated: boolean;
  userName: string | null;
  userRole: string | null;
  login: (userName: string, userRole: string) => void;
  logout: () => void;
}

interface DecodedToken {
  sub: string;
  exp: number;
  iat: number;
}

interface RoleResponse {
  roles: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setuserName] = useState<string | null>(null);
  const [userRole, setuserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthentication = () => {
      const isAuthorizationEnabled =
        process.env.REACT_APP_CYCLOPS_AUTHORIZATION === "enabled";
      const token = Cookies.get("token");

      if (!isAuthorizationEnabled) {
        setIsAuthenticated(true);
      } else if (token) {
        try {
          const decodedToken = jwtDecode<DecodedToken>(token);
          if (decodedToken.exp * 1000 > Date.now()) {
            setIsAuthenticated(true);
            setuserName(decodedToken.sub);
            const getuserRole = async () => {
              try {
                const roleResponse = await axios.get<RoleResponse>(
                  "/api/getrole",
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  },
                );
                setuserRole(roleResponse.data.roles[0]);
              } catch (err) {
                console.log(err);
              }
            };
            getuserRole();
          } else {
            // Token expired
            logout();
          }
        } catch (error) {
          console.error("Error decoding token:", error);
          logout();
        }
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAuthentication();
  }, []);

  const login = (newuserName: string, newuserRole: string) => {
    setIsAuthenticated(true);
    setuserName(newuserName);
    setuserRole(newuserRole);
  };

  const logout = () => {
    Cookies.remove("token");
    Cookies.set("_isAuthenticated", "false");
    setIsAuthenticated(false);
    setuserName(null);
    window.location.reload();
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, userName, userRole, login, logout }}
    >
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
