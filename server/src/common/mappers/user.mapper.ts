import { User as PrismaUser } from '@prisma/client';

export interface ProfileAddressDto {
  city?: string;
  line?: string;
  postalCode?: string;
}

export interface ProfileDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: ProfileAddressDto;
}

export interface UserDto {
  id: string;
  email: string;
  role: 'customer' | 'admin';
  authProvider: 'google' | 'password';
  avatarUrl: string | null;
  profile: ProfileDto | null;
  isProfileComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

/** docs/API.md §2.1: `isProfileComplete` ignores postalCode on purpose. */
export function isProfileComplete(user: PrismaUser): boolean {
  return Boolean(
    nonBlank(user.firstName) &&
      nonBlank(user.lastName) &&
      nonBlank(user.phone) &&
      nonBlank(user.addressCity) &&
      nonBlank(user.addressLine),
  );
}

function nonBlank(value: string | null): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function toProfile(user: PrismaUser): ProfileDto | null {
  const hasAnyProfileData =
    user.firstName !== null ||
    user.lastName !== null ||
    user.phone !== null ||
    user.addressCity !== null ||
    user.addressLine !== null ||
    user.addressPostalCode !== null;

  if (!hasAnyProfileData) return null;

  const profile: ProfileDto = {};
  if (user.firstName !== null) profile.firstName = user.firstName;
  if (user.lastName !== null) profile.lastName = user.lastName;
  if (user.phone !== null) profile.phone = user.phone;

  if (user.addressCity !== null || user.addressLine !== null || user.addressPostalCode !== null) {
    const address: ProfileAddressDto = {};
    if (user.addressCity !== null) address.city = user.addressCity;
    if (user.addressLine !== null) address.line = user.addressLine;
    if (user.addressPostalCode !== null) address.postalCode = user.addressPostalCode;
    profile.address = address;
  }

  return profile;
}

export function toUserDto(user: PrismaUser): UserDto {
  return {
    id: user.id,
    email: user.email,
    role: user.role === 'ADMIN' ? 'admin' : 'customer',
    authProvider: user.authProvider === 'GOOGLE' ? 'google' : 'password',
    avatarUrl: user.avatarUrl,
    profile: toProfile(user),
    isProfileComplete: isProfileComplete(user),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
