export type UserRole = 'ADMIN' | 'USER' | 'PROVIDER';
export type SessionSource = 'password' | 'google';

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  displayName: string;
  location: string;
  profileImage: string;
  [key: string]: any;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  source: SessionSource | null;
}
