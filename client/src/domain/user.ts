import type { IsoDateTime } from "./common";

export type UserRole = "customer" | "admin";
export type AuthProvider = "google" | "password";

export interface Address {
  city: string;
  line: string;
  postalCode?: string;
}

/** Contact details required before a user can submit pre-orders. */
export interface Profile {
  firstName: string;
  lastName: string;
  phone: string;
  address: Address;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  authProvider: AuthProvider;
  avatarUrl: string | null;
  /** Null until the user starts their profile. Fields may be partially pre-filled from Google. */
  profile: Partial<Profile> | null;
  isProfileComplete: boolean;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

/** An admin is a user with role "admin". */
export type Admin = User & { role: "admin" };

export interface AuthSession {
  accessToken: string;
  expiresAt: IsoDateTime;
  user: User;
}

export interface GoogleAuthInput {
  /** Google ID token (JWT) obtained from Google Identity Services. */
  idToken: string;
}

export interface PasswordLoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
}

export type ProfileInput = Profile;

export function isProfileComplete(profile: Partial<Profile> | null | undefined): profile is Profile {
  return Boolean(
    profile?.firstName?.trim() &&
      profile.lastName?.trim() &&
      profile.phone?.trim() &&
      profile.address?.city?.trim() &&
      profile.address.line?.trim(),
  );
}

export function isAdmin(user: User | null | undefined): user is Admin {
  return user?.role === "admin";
}

export function displayName(user: Pick<User, "email" | "profile">): string {
  const name = [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(" ");
  return name || user.email;
}
