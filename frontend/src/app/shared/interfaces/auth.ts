export type UserRole = 'ADMIN' | 'USER' | 'PROVIDER';
export type Profile = {
  id: number;
  displayName: string;
  bio: string;
  location: string;
  [key: string]: any;
};

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profileImage: string;
  Profile: Profile;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
}
