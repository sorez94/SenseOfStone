import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthProvider, Role, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from './token.service';
import { GoogleAuthService } from './google-auth.service';
import { Errors } from '../../common/exceptions/app.exception';

export interface AuthResult {
  user: User;
  created: boolean;
  accessToken: string;
  accessExpiresAt: Date;
  refreshToken: string;
  refreshExpiresAt: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly googleAuthService: GoogleAuthService,
  ) {}

  async register(email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      throw Errors.emailTaken();
    }

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash: await argon2.hash(password),
        role: Role.CUSTOMER,
        authProvider: AuthProvider.PASSWORD,
      },
    });

    return this.issueSession(user, true);
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user || !user.passwordHash) {
      throw Errors.invalidCredentials();
    }

    const passwordMatches = await argon2.verify(user.passwordHash, password);
    if (!passwordMatches) {
      throw Errors.invalidCredentials();
    }

    return this.issueSession(user, false);
  }

  async loginWithGoogle(idToken: string): Promise<AuthResult> {
    const profile = await this.googleAuthService.verifyIdToken(idToken);
    const normalizedEmail = profile.email.toLowerCase().trim();

    let user = await this.prisma.user.findFirst({
      where: { OR: [{ googleSub: profile.sub }, { email: normalizedEmail }] },
    });

    let created = false;
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          role: Role.CUSTOMER,
          authProvider: AuthProvider.GOOGLE,
          googleSub: profile.sub,
          avatarUrl: profile.picture,
          firstName: profile.givenName,
          lastName: profile.familyName,
        },
      });
      created = true;
    } else if (!user.googleSub || !user.avatarUrl) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleSub: user.googleSub ?? profile.sub,
          avatarUrl: user.avatarUrl ?? profile.picture,
        },
      });
    }

    return this.issueSession(user, created);
  }

  async refresh(rawRefreshToken: string): Promise<AuthResult> {
    const { userId, refreshToken } = await this.tokenService.rotateRefreshToken(rawRefreshToken);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw Errors.unauthenticated();
    }
    const accessToken = await this.tokenService.issueAccessToken(user);
    return {
      user,
      created: false,
      accessToken: accessToken.token,
      accessExpiresAt: accessToken.expiresAt,
      refreshToken: refreshToken.raw,
      refreshExpiresAt: refreshToken.expiresAt,
    };
  }

  async logout(accessToken?: string, refreshToken?: string): Promise<void> {
    if (accessToken) {
      await this.tokenService.revokeAccessToken(accessToken);
    }
    if (refreshToken) {
      await this.tokenService.revokeRefreshToken(refreshToken);
    }
  }

  async getById(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw Errors.unauthenticated();
    }
    return user;
  }

  private async issueSession(user: User, created: boolean): Promise<AuthResult> {
    const accessToken = await this.tokenService.issueAccessToken(user);
    const refreshToken = await this.tokenService.issueRefreshToken(user.id);
    return {
      user,
      created,
      accessToken: accessToken.token,
      accessExpiresAt: accessToken.expiresAt,
      refreshToken: refreshToken.raw,
      refreshExpiresAt: refreshToken.expiresAt,
    };
  }
}
