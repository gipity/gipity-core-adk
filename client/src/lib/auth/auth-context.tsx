import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthContextType, User, LoginResult, RegisterResult } from "./types";
import { authStorage } from "./storage";
import { authApiClient } from "./api-client";
import { secureStorage } from "./secure-storage";
import { debug } from "../debug";

// Create context with undefined default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hook to access the auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider component that wraps the app and provides auth state
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [navigationCallback, setNavigationCallback] = useState<
    (() => void) | null
  >(null);

  // Logout handler (defined before useEffect)
  const logout = () => {
    setUser(null);
    setToken(null);
    authStorage.clearAuth();
  };

  // Token expiration handler
  const handleTokenExpiration = () => {
    debug.log("Token expired - automatically logging out user");
    logout();

    const currentPath = window.location.pathname;
    if (currentPath !== "/login") {
      debug.log("Redirecting to login due to token expiration");
      // Use client-side navigation if available, otherwise fall back to page reload
      if (navigationCallback) {
        navigationCallback();
      } else {
        window.location.href = "/login";
      }
    }
  };

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = authStorage.getToken();
      const savedUser = authStorage.getUser();

      if (savedToken && savedUser) {
        // Trust stored credentials without immediate validation
        // Let actual API calls handle token validation and expiration
        setToken(savedToken);
        setUser(savedUser);
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Login handler
  const login = async (
    email: string,
    password: string,
  ): Promise<LoginResult> => {
    try {
      const response = await authApiClient.login({ email, password });

      if (response.success && response.token && response.user) {
        setToken(response.token);
        setUser(response.user);

        // Save to localStorage
        authStorage.saveToken(response.token);
        authStorage.saveUser(response.user);

        // Save credentials if remember me is enabled
        try {
          await secureStorage.setCredentials(email, password, true);
        } catch (error) {
          debug.error("Failed to save credentials:", error);
        }

        debug.log("Login successful");

        return { success: true };
      } else {
        debug.log("Login failed:", response.error);
        return { success: false, error: response.error || "Login failed" };
      }
    } catch (error) {
      debug.error("Login error:", error);
      return { success: false, error: "Network error" };
    }
  };

  // Register handler
  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<RegisterResult> => {
    try {
      const response = await authApiClient.register({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      });

      if (response.success) {
        // Registration successful - user must confirm email before logging in
        return { success: true };
      } else {
        return {
          success: false,
          error: response.error || "Registration failed",
        };
      }
    } catch (error) {
      return { success: false, error: "Network error" };
    }
  };

  // Refresh user data from API
  const refreshUser = async (): Promise<User | null> => {
    const savedToken = authStorage.getToken();
    if (savedToken) {
      try {
        const response = await authApiClient.getMe(
          savedToken,
          handleTokenExpiration,
        );
        if (response.success && response.user) {
          setUser(response.user);
          authStorage.saveUser(response.user);
          return response.user;
        }
      } catch (error) {
        debug.error("Error refreshing user:", error);
      }
    }
    return null;
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return authStorage.isAuthenticated();
  };

  // Context value with all auth state and actions
  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated,
    handleTokenExpiration,
    setNavigationCallback,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
