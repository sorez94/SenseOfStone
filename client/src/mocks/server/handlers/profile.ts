import { isProfileComplete, type Profile } from "@/domain";
import { newId, now } from "../../db/store";
import { HttpError, ok, parseBody } from "../http";
import type { RouteDefinition } from "../router";
import { profilePatchSchema, profileSchema } from "../schemas";
import { toPublicUser } from "./shared";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export const profileRoutes: RouteDefinition[] = [
  [
    "PUT",
    "/me/profile",
    ({ req, auth }) => {
      const user = auth.require();
      const profile: Profile = parseBody(profileSchema, req.body);
      user.profile = profile;
      user.isProfileComplete = true;
      user.updatedAt = now();
      return ok(toPublicUser(user));
    },
  ],
  [
    "PATCH",
    "/me/profile",
    ({ req, auth }) => {
      const user = auth.require();
      const patch = parseBody(profilePatchSchema, req.body);
      const merged = { ...user.profile, ...patch, address: { ...user.profile?.address, ...patch.address } } as Partial<Profile>;
      user.profile = merged;
      user.isProfileComplete = isProfileComplete(merged);
      user.updatedAt = now();
      return ok(toPublicUser(user));
    },
  ],
  [
    "POST",
    "/me/profile/avatar",
    async ({ req, db, auth }) => {
      const user = auth.require();
      const file = req.body instanceof FormData ? req.body.get("file") : null;
      if (!(file instanceof Blob)) {
        throw new HttpError(422, "VALIDATION_ERROR", "Expected multipart field \"file\"", [
          { field: "file", code: "required", message: "File is required" },
        ]);
      }
      if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
        throw new HttpError(415, "UNSUPPORTED_MEDIA_TYPE", `Allowed types: ${ALLOWED_AVATAR_TYPES.join(", ")}`);
      }
      if (file.size > MAX_AVATAR_BYTES) throw new HttpError(413, "PAYLOAD_TOO_LARGE", "Images must be 5 MB or smaller");

      const id = newId("upl");
      db.uploads.set(id, { contentType: file.type, bytes: new Uint8Array(await file.arrayBuffer()) });
      user.avatarUrl = `/api/v1/uploads/${id}`;
      user.updatedAt = now();
      return ok(toPublicUser(user));
    },
  ],
  [
    "DELETE",
    "/me/profile/avatar",
    ({ auth }) => {
      const user = auth.require();
      user.avatarUrl = null;
      user.updatedAt = now();
      return ok(toPublicUser(user));
    },
  ],
];
