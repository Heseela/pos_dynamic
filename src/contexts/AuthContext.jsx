"use client";

import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        setLoggedIn(false);
        setUser(null);
        return;
      }

      const data = await res.json();

      setLoggedIn(data.loggedIn || false);
      setUser(data.user || null);
    } catch (error) {
      console.error("Auth Error:", error);

      setLoggedIn(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout Error:", error);
    } finally {
      setLoggedIn(false);
      setUser(null);

      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        loggedIn,
        user,
        loading,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);