import { isProfileComplete, type AuthSession } from "@/domain";
import { newId, now } from "../../db/store";
import type { MockDatabase, StoredUser } from "../../db/types";
import { decodeMockGoogleToken } from "../../google-token";
import { HttpError, created, noContent, ok, parseBody } from "../http";
import type { RouteDefinition } from "../router";
import { googleAuthSchema, loginSchema, registerSchema } from "../schemas";
import { toPublicUser } from "./shared";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function startSession(db: MockDatabase, user: StoredUser): AuthSession {
  const accessToken = `mock_${newId("tok")}`;
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  db.sessions.set(accessToken, { userId: user.id, expiresAt });
  return { accessToken, expiresAt, user: toPublicUser(user) };
}

export const authRoutes: RouteDefinition[] = [
  [
    "POST",
    "/auth/google",
    ({ req, db }) => {
      const { idToken } = parseBody(googleAuthSchema, req.body);
      const claims = decodeMockGoogleToken(idToken);
      if (!claims) throw new HttpError(401, "INVALID_GOOGLE_TOKEN", "Google token is invalid or expired");

      let user = db.users.find((u) => u.email.toLowerCase() === claims.email.toLowerCase());
      const isNew = !user;
      if (!user) {
        const timestamp = now();
        const profile = { firstName: claims.given_name ?? "", lastName: claims.family_name ?? "" };
        user = {
          id: newId("usr"),
          email: claims.email,
          password: null,
          role: "customer",
          authProvider: "google",
          avatarUrl: claims.picture ?? null,
          profile,
          isProfileComplete: isProfileComplete(profile),
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        db.users.push(user);
      }
      const session = startSession(db, user);
      return isNew ? created(session) : ok(session);
    },
  ],
  [
    "POST",
    "/auth/login",
    ({ req, db }) => {
      const { email, password } = parseBody(loginSchema, req.body);
      const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user || user.password === null || user.password !== password) {
        throw new HttpError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
      }
      return ok(startSession(db, user));
    },
  ],
  [
    "POST",
    "/auth/register",
    ({ req, db }) => {
      const { email, password } = parseBody(registerSchema, req.body);
      if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        throw new HttpError(409, "EMAIL_TAKEN", "An account with this email already exists", [
          { field: "email", code: "taken", message: "Email already registered" },
        ]);
      }
      const timestamp = now();
      const user: StoredUser = {
        id: newId("usr"),
        email,
        password,
        role: "customer",
        authProvider: "password",
        avatarUrl: null,
        profile: null,
        isProfileComplete: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      db.users.push(user);
      return created(startSession(db, user));
    },
  ],
  [
    "POST",
    "/auth/logout",
    ({ db, auth }) => {
      const token = auth.token();
      if (token) db.sessions.delete(token);
      return noContent();
    },
  ],
  ["GET", "/auth/me", ({ auth }) => ok(toPublicUser(auth.require()))],
];
