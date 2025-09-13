import { getApiUrl } from "../api";
import { User } from "./types";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  isAuthError?: boolean;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

export interface RegisterResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export interface GetMeResponse {
  success: boolean;
  user?: User;
  error?: string;
  isAuthError?: boolean;
}

export interface ConfirmResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export const authApiClient = {
  /**
   * Register a new user
   */
  register: async (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }): Promise<RegisterResponse> => {
    try {
      const response = await fetch(getApiUrl("/api/auth/register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      return await response.json();
    } catch (error) {
      return { success: false, error: "Network error" };
    }
  },

  /**
   * Login with email and password
   */
  login: async (credentials: {
    email: string;
    password: string;
  }): Promise<LoginResponse> => {
    try {
      const response = await fetch(getApiUrl("/api/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      return await response.json();
    } catch (error) {
      return { success: false, error: "Network error" };
    }
  },

  /**
   * Get current user profile
   */
  getMe: async (
    token: string,
    onTokenExpiration?: () => void,
  ): Promise<GetMeResponse> => {
    try {
      // Use the authenticated fetch helper
      const { authenticatedFetch, getAuthenticatedApiResponse } = await import(
        "../authenticated-fetch"
      );

      const response = await authenticatedFetch(
        "/api/auth/me",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          token,
        },
        onTokenExpiration,
      );

      return await getAuthenticatedApiResponse<User>(
        response,
        "Failed to get user",
      );
    } catch (error) {
      return { success: false, error: "Network error" };
    }
  },

  /**
   * Confirm email with token
   */
  confirm: async (confirmData: {
    access_token: string;
    type: string;
  }): Promise<ConfirmResponse> => {
    try {
      const response = await fetch(getApiUrl("/api/auth/confirm"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(confirmData),
      });

      return await response.json();
    } catch (error) {
      return { success: false, error: "Network error" };
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (
    token: string,
    profileData: { first_name: string; last_name: string },
    onTokenExpiration?: () => void,
  ): Promise<ApiResponse<User>> => {
    try {
      const { authenticatedFetch, getAuthenticatedApiResponse } = await import(
        "../authenticated-fetch"
      );

      const response = await authenticatedFetch(
        "/api/auth/update-profile",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(profileData),
          token,
        },
        onTokenExpiration,
      );

      return await getAuthenticatedApiResponse<User>(
        response,
        "Failed to update profile",
      );
    } catch (error) {
      return { success: false, error: "Network error" };
    }
  },
};
