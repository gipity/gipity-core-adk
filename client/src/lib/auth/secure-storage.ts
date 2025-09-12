import { Capacitor } from "@capacitor/core";
import { debug } from "../debug";
import { CredentialsStorage } from "./types";

interface PasswordCredential extends Credential {
  readonly password: string | null;
  readonly id: string;
  readonly name?: string;
}

/**
 * SecureStorageService handles saving credentials securely across platforms
 * It selects the appropriate storage method based on the platform
 */
class SecureStorageService {
  private isNative: boolean;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  /**
   * Store credentials securely
   */
  async setCredentials(
    email: string,
    password: string,
    rememberMe: boolean = false,
  ): Promise<void> {
    if (!rememberMe) {
      // If not remembering, clear any existing credentials
      await this.clearCredentials();
      return;
    }

    if (this.isNative) {
      await this.setNativeCredentials(email, password);
    } else {
      await this.setWebCredentials(email, password);
    }
  }

  /**
   * Retrieve stored credentials
   */
  async getCredentials(): Promise<CredentialsStorage> {
    if (this.isNative) {
      return await this.getNativeCredentials();
    } else {
      return await this.getWebCredentials();
    }
  }

  /**
   * Clear stored credentials
   */
  async clearCredentials(): Promise<void> {
    if (this.isNative) {
      await this.clearNativeCredentials();
    } else {
      await this.clearWebCredentials();
    }
  }

  /**
   * Check if credentials are remembered
   */
  async hasRememberedCredentials(): Promise<boolean> {
    const credentials = await this.getCredentials();
    return credentials.email !== null;
  }

  // Private implementation methods for native platforms

  private async setNativeCredentials(
    email: string,
    password: string,
  ): Promise<void> {
    try {
      const { SecureStorage } = await import(
        "@aparajita/capacitor-secure-storage"
      );
      await SecureStorage.set("user_email", email);
      await SecureStorage.set("user_password", password);
      await SecureStorage.set("remember_credentials", "true");
      debug.log(
        "[SecureStorage] Credentials stored securely in native storage",
      );
    } catch (error) {
      debug.error(
        "[SecureStorage] Failed to store credentials in native storage:",
        error,
      );
      // Fallback to preferences for email only (not password)
      const { Preferences } = await import("@capacitor/preferences");
      await Preferences.set({ key: "user_email", value: email });
      await Preferences.set({
        key: "remember_credentials",
        value: "email_only",
      });
    }
  }

  private async getNativeCredentials(): Promise<CredentialsStorage> {
    try {
      const { SecureStorage } = await import(
        "@aparajita/capacitor-secure-storage"
      );
      const rememberFlag = await SecureStorage.get("remember_credentials");

      if (rememberFlag === "true") {
        const email = await SecureStorage.get("user_email");
        const password = await SecureStorage.get("user_password");
        return {
          email: typeof email === "string" ? email : null,
          password: typeof password === "string" ? password : null,
          rememberMe: true,
        };
      }
    } catch (error) {
      debug.log(
        "[SecureStorage] No credentials found in native storage or error occurred",
      );
    }

    // Fallback to preferences for email only
    try {
      const { Preferences } = await import("@capacitor/preferences");
      const { value: rememberFlag } = await Preferences.get({
        key: "remember_credentials",
      });

      if (rememberFlag === "email_only") {
        const { value: email } = await Preferences.get({ key: "user_email" });
        return {
          email: email || null,
          password: null,
          rememberMe: false,
        };
      }
    } catch (error) {
      debug.log("[SecureStorage] No credentials found in preferences");
    }

    return { email: null, password: null, rememberMe: false };
  }

  private async clearNativeCredentials(): Promise<void> {
    // Clear from secure storage
    try {
      const { SecureStorage } = await import(
        "@aparajita/capacitor-secure-storage"
      );
      await SecureStorage.remove("user_email");
      await SecureStorage.remove("user_password");
      await SecureStorage.remove("remember_credentials");
      debug.log("[SecureStorage] Credentials cleared from native storage");
    } catch (error) {
      debug.log(
        "[SecureStorage] Error clearing native storage (may not exist):",
        error,
      );
    }

    // Also clear from preferences fallback
    try {
      const { Preferences } = await import("@capacitor/preferences");
      await Preferences.remove({ key: "user_email" });
      await Preferences.remove({ key: "remember_credentials" });
    } catch (error) {
      debug.log("[SecureStorage] Error clearing preferences fallback:", error);
    }
  }

  // Private implementation methods for web platforms

  private async setWebCredentials(
    email: string,
    password: string,
  ): Promise<void> {
    try {
      if ("credentials" in navigator && "PasswordCredential" in window) {
        const credential = new window.PasswordCredential({
          id: email,
          password: password,
          name: email,
        });
        await navigator.credentials.store(credential);
        debug.log(
          "[SecureStorage] Credentials stored in browser credential manager",
        );
      } else {
        // Fallback: Store email only in sessionStorage, let browser handle password
        sessionStorage.setItem("user_email", email);
        sessionStorage.setItem("remember_credentials", "email_only");
        debug.log(
          "[SecureStorage] Email stored in sessionStorage for web platform",
        );
      }
    } catch (error) {
      // Only log in production - Replit dev environment always fails due to sandbox restrictions
      if (import.meta.env.PROD) {
        debug.error(
          "[SecureStorage] Failed to store credentials in browser:",
          error,
        );
      }
      // Final fallback: Store email only
      sessionStorage.setItem("user_email", email);
      sessionStorage.setItem("remember_credentials", "email_only");
    }
  }

  private async getWebCredentials(): Promise<CredentialsStorage> {
    try {
      if ("credentials" in navigator) {
        const credential = await navigator.credentials.get({
          password: true,
          mediation: "silent",
        } as CredentialRequestOptions);

        if (credential && credential.type === "password") {
          const passwordCredential = credential as PasswordCredential;
          return {
            email: passwordCredential.id,
            password: passwordCredential.password || null,
            rememberMe: true,
          };
        }
      }
    } catch (error) {
      debug.log(
        "[SecureStorage] No credentials found in browser credential manager:",
        error,
      );
    }

    // Fallback: Get email from sessionStorage
    const email = sessionStorage.getItem("user_email");
    const rememberFlag = sessionStorage.getItem("remember_credentials");

    return {
      email: email || null,
      password: null, // Never store passwords in sessionStorage
      rememberMe: rememberFlag === "email_only",
    };
  }

  private async clearWebCredentials(): Promise<void> {
    // Clear from sessionStorage
    sessionStorage.removeItem("user_email");
    sessionStorage.removeItem("remember_credentials");
    debug.log("[SecureStorage] Credentials cleared from web storage");
  }
}

// Export singleton instance
export const secureStorage = new SecureStorageService();
