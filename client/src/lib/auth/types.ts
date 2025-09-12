import { User as SchemaUser } from "../../../../shared/schema";
export type User = SchemaUser;

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

export interface LoginResult {
  success: boolean;
  error?: string;
}

export interface RegisterResult {
  success: boolean;
  error?: string;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<RegisterResult>;
  refreshUser: () => Promise<User | null>;
  isAuthenticated: () => boolean;
  handleTokenExpiration: () => void;
}

export interface AuthContextType extends AuthState, AuthActions {
  setNavigationCallback: (callback: (() => void) | null) => void;
}

export interface CredentialsStorage {
  email: string | null;
  password: string | null;
  rememberMe: boolean;
}
