import { createContext, useContext, useState } from "react";
import { CREDENTIALS } from "../config/constants";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(
    () => sessionStorage.getItem("namlo_auth") === "true"
  );

  const login = (email, password) => {
    const ok =
      email === CREDENTIALS.username && password === CREDENTIALS.password;
    if (ok) {
      sessionStorage.setItem("namlo_auth", "true");
      setUser(true);
    }
    return ok;
  };

  const logout = () => {
    sessionStorage.removeItem("namlo_auth");
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);