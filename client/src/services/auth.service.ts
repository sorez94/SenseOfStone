import type { AuthSession, GoogleAuthInput, PasswordLoginInput, RegisterInput, User } from "@/domain";
import type { ApiClient } from "@/lib/api/client";

export function createAuthService(api: ApiClient) {
  return {
    /** Sign in or sign up with a Google ID token. New users are created automatically. */
    signInWithGoogle: (input: GoogleAuthInput) => api.post<AuthSession>("/auth/google", input),
    login: (input: PasswordLoginInput) => api.post<AuthSession>("/auth/login", input),
    register: (input: RegisterInput) => api.post<AuthSession>("/auth/register", input),
    logout: () => api.post<null>("/auth/logout"),
    me: () => api.get<User>("/auth/me"),
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
