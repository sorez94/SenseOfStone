/** docs/API.md §2.2/§2.3: kebab-case slugs. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** docs/API.md §2.1 Profile.phone. */
export const PHONE_PATTERN = /^\+?[0-9]{10,14}$/;

/** docs/API.md §2.1 Profile.address.postalCode: exactly 10 digits. */
export const POSTAL_CODE_PATTERN = /^[0-9]{10}$/;
