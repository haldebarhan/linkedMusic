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
  zipCode: string;
  country: string;
  city: string;
  profileImage: string;
  phone: string;
  subscriptions: any;
  [key: string]: any;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  source: SessionSource | null;
}
