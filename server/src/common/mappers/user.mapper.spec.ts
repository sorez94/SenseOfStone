import { Role, AuthProvider, User } from '@prisma/client';
import { isProfileComplete, toUserDto } from './user.mapper';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'usr_1',
    email: 'test@example.com',
    passwordHash: 'hash',
    role: Role.CUSTOMER,
    authProvider: AuthProvider.PASSWORD,
    googleSub: null,
    avatarUrl: null,
    firstName: null,
    lastName: null,
    phone: null,
    addressCity: null,
    addressLine: null,
    addressPostalCode: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('isProfileComplete', () => {
  it('is false for a brand-new user with no profile data', () => {
    expect(isProfileComplete(makeUser())).toBe(false);
  });

  it('ignores postalCode (docs/API.md §2.1)', () => {
    const user = makeUser({
      firstName: 'Ali',
      lastName: 'Rezaei',
      phone: '09121234567',
      addressCity: 'Tehran',
      addressLine: 'Valiasr St.',
      addressPostalCode: null,
    });
    expect(isProfileComplete(user)).toBe(true);
  });

  it('is false if any required field is blank', () => {
    const user = makeUser({
      firstName: 'Ali',
      lastName: '',
      phone: '09121234567',
      addressCity: 'Tehran',
      addressLine: 'Valiasr St.',
    });
    expect(isProfileComplete(user)).toBe(false);
  });
});

describe('toUserDto', () => {
  it('returns profile: null when no profile data exists', () => {
    const dto = toUserDto(makeUser());
    expect(dto.profile).toBeNull();
    expect(dto.isProfileComplete).toBe(false);
  });

  it('returns a partial profile for a Google-prefilled account (empty lastName kept, address omitted)', () => {
    const dto = toUserDto(
      makeUser({ authProvider: AuthProvider.GOOGLE, firstName: 'Nima', lastName: '' }),
    );
    expect(dto.profile).toEqual({ firstName: 'Nima', lastName: '' });
    expect(dto.authProvider).toBe('google');
  });

  it('maps role and omits the password hash', () => {
    const dto = toUserDto(makeUser({ role: Role.ADMIN }));
    expect(dto.role).toBe('admin');
    expect(dto).not.toHaveProperty('passwordHash');
  });
});
