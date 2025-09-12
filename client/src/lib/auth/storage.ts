import { User } from "./types";
import { debug } from "../debug";

export const authStorage = {
  saveToken: (token: string): void => {
    localStorage.setItem("app_token", token);
  },

  getToken: (): string | null => {
    return localStorage.getItem("app_token");
  },

  saveUser: (user: User): void => {
    localStorage.setItem("app_user", JSON.stringify(user));
  },

  getUser: (): User | null => {
    const userData = localStorage.getItem("app_user");
    if (!userData) return null;
    try {
      return JSON.parse(userData);
    } catch (error) {
      debug.error("Error parsing stored user data:", error);
      // Clear corrupted data
      localStorage.removeItem("app_user");
      return null;
    }
  },

  clearAuth: (): void => {
    localStorage.removeItem("app_token");
    localStorage.removeItem("app_user");
  },

  /**
   * Check if the user is authenticated based on storage
   * This is the single source of truth for authentication status
   */
  isAuthenticated: (): boolean => {
    // Check localStorage as single source of truth
    const storageToken = localStorage.getItem("app_token");
    const storageUser = localStorage.getItem("app_user");
    return !!(storageToken && storageUser);
  },
};
