import type { Profile, ProfileInput, User } from "@/domain";
import type { ApiClient } from "@/lib/api/client";

export function createProfileService(api: ApiClient) {
  return {
    /** Sets all required profile fields (used by the "complete profile" step). */
    complete: (input: ProfileInput) => api.put<User>("/me/profile", input),
    /** Partial update of an existing profile. */
    update: (input: Partial<Profile>) => api.patch<User>("/me/profile", input),
    /** Sets (or replaces) the user's profile picture. */
    uploadAvatar: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return api.post<User>("/me/profile/avatar", form);
    },
    /** Clears the user's profile picture. */
    removeAvatar: () => api.delete<User>("/me/profile/avatar"),
  };
}

export type ProfileService = ReturnType<typeof createProfileService>;
