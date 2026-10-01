import * as argon2 from 'argon2';
import { AuthProvider, Role, User } from '@prisma/client';
import { AuthService } from './auth.service';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/constants/error-code.enum';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'usr_1',
    email: 'test@example.com',
    passwordHash: null,
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
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('AuthService', () => {
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock; findFirst: jest.Mock; update: jest.Mock } };
  let tokenService: {
    issueAccessToken: jest.Mock;
    issueRefreshToken: jest.Mock;
    rotateRefreshToken: jest.Mock;
    revokeAccessToken: jest.Mock;
    revokeRefreshToken: jest.Mock;
  };
  let googleAuthService: { verifyIdToken: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn(), create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    };
    tokenService = {
      issueAccessToken: jest.fn().mockResolvedValue({ token: 'access-token', expiresAt: new Date() }),
      issueRefreshToken: jest.fn().mockResolvedValue({ id: 'rt_1', raw: 'refresh-token', expiresAt: new Date() }),
      rotateRefreshToken: jest.fn(),
      revokeAccessToken: jest.fn(),
      revokeRefreshToken: jest.fn(),
    };
    googleAuthService = { verifyIdToken: jest.fn() };

    service = new AuthService(prisma as never, tokenService as never, googleAuthService as never);
  });

  describe('register', () => {
    it('creates a new user with a hashed password and issues a session', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }) => Promise.resolve(makeUser(data)));

      const result = await service.register('new@example.com', 'supersecret123');

      expect(result.created).toBe(true);
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      const createdData = prisma.user.create.mock.calls[0][0].data;
      expect(createdData.passwordHash).not.toBe('supersecret123');
      expect(await argon2.verify(createdData.passwordHash, 'supersecret123')).toBe(true);
    });

    it('throws EMAIL_TAKEN (409) when the email is already registered', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());

      await expect(service.register('test@example.com', 'supersecret123')).rejects.toMatchObject({
        status: 409,
        response: expect.objectContaining({ code: ErrorCode.EMAIL_TAKEN }),
      } as Partial<AppException>);
    });

    it('normalizes email to lowercase before checking/storing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }) => Promise.resolve(makeUser(data)));

      await service.register('Test@Example.com', 'supersecret123');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(prisma.user.create.mock.calls[0][0].data.email).toBe('test@example.com');
    });
  });

  describe('login', () => {
    it('logs in with correct credentials', async () => {
      const passwordHash = await argon2.hash('correct-password');
      prisma.user.findUnique.mockResolvedValue(makeUser({ passwordHash }));

      const result = await service.login('test@example.com', 'correct-password');
      expect(result.accessToken).toBe('access-token');
    });

    it('rejects an unknown email with INVALID_CREDENTIALS (not a different error)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login('nobody@example.com', 'whatever')).rejects.toMatchObject({
        status: 401,
        response: expect.objectContaining({ code: ErrorCode.INVALID_CREDENTIALS }),
      } as Partial<AppException>);
    });

    it('rejects the wrong password with the same INVALID_CREDENTIALS code', async () => {
      const passwordHash = await argon2.hash('correct-password');
      prisma.user.findUnique.mockResolvedValue(makeUser({ passwordHash }));

      await expect(service.login('test@example.com', 'wrong-password')).rejects.toMatchObject({
        status: 401,
        response: expect.objectContaining({ code: ErrorCode.INVALID_CREDENTIALS }),
      } as Partial<AppException>);
    });

    it('rejects a Google-only account (no passwordHash) with INVALID_CREDENTIALS', async () => {
      prisma.user.findUnique.mockResolvedValue(
        makeUser({ authProvider: AuthProvider.GOOGLE, passwordHash: null }),
      );

      await expect(service.login('test@example.com', 'anything')).rejects.toMatchObject({
        status: 401,
        response: expect.objectContaining({ code: ErrorCode.INVALID_CREDENTIALS }),
      } as Partial<AppException>);
    });
  });
});
