import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuthTokenGetter, customFetch } from "@workspace/api-client-react";

interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  token: string | null;
  login: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
}

const AUTH_TOKEN_KEY = "oracle_auth_token";
const AUTH_USER_KEY = "oracle_auth_user";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    setAuthTokenGetter(() => tokenRef.current);
    return () => setAuthTokenGetter(null);
  }, []);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const [savedToken, savedUser] = await Promise.all([
          AsyncStorage.getItem(AUTH_TOKEN_KEY),
          AsyncStorage.getItem(AUTH_USER_KEY),
        ]);
        if (savedToken && savedUser) {
          tokenRef.current = savedToken;
          try {
            const result = await customFetch<{ user: AuthUser }>("/api/auth/me", {
              method: "GET",
              headers: { "Authorization": `Bearer ${savedToken}` },
            });
            setToken(savedToken);
            setUser(result.user);
          } catch {
            tokenRef.current = null;
            await Promise.all([
              AsyncStorage.removeItem(AUTH_TOKEN_KEY),
              AsyncStorage.removeItem(AUTH_USER_KEY),
            ]);
          }
        }
      } catch (e) {
        console.error("Failed to load auth state:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadAuth();
  }, []);

  const login = useCallback(async (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    tokenRef.current = newToken;
    setUser(newUser);
    await Promise.all([
      AsyncStorage.setItem(AUTH_TOKEN_KEY, newToken),
      AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser)),
    ]);
  }, []);

  const logout = useCallback(async () => {
    setToken(null);
    tokenRef.current = null;
    setUser(null);
    await Promise.all([
      AsyncStorage.removeItem(AUTH_TOKEN_KEY),
      AsyncStorage.removeItem(AUTH_USER_KEY),
    ]);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isLoading,
        token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
