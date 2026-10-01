import { randomBytes, randomUUID, createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { Configuration } from '../../config/configuration';
import { addDuration } from '../../common/utils/duration.util';
import { Errors } from '../../common/exceptions/app.exception';

export interface AccessTokenPair {
  token: string;
  expiresAt: Date;
}

export interface RefreshTokenPair {
  id: string;
  raw: string;
  expiresAt: Date;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Configuration, true>,
    private readonly prisma: PrismaService,
  ) {}

  async issueAccessToken(user: { id: string; email: string; role: Role }): Promise<AccessTokenPair> {
    const jwtConfig = this.configService.get('jwt', { infer: true });
    const jti = randomUUID();
    const token = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: jwtConfig.accessSecret,
        // jsonwebtoken's `expiresIn` types a specific "5m"/"7d"-style literal union; our value
        // comes from a validated-at-startup env var ("JWT_ACCESS_TTL") that is always one of those.
        expiresIn: jwtConfig.accessTtl as unknown as number,
        jwtid: jti,
      },
    );
    const decoded = this.jwtService.decode(token) as { exp: number };
    return { token, expiresAt: new Date(decoded.exp * 1000) };
  }

  async issueRefreshToken(userId: string): Promise<RefreshTokenPair> {
    const jwtConfig = this.configService.get('jwt', { infer: true });
    const raw = randomBytes(48).toString('hex');
    const tokenHash = this.hash(raw);
    const expiresAt = addDuration(new Date(), jwtConfig.refreshTtl);
    const created = await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
    return { id: created.id, raw, expiresAt };
  }

  /** Rotates a refresh token. Detects reuse of an already-rotated token and revokes the whole family. */
  async rotateRefreshToken(
    rawToken: string,
  ): Promise<{ userId: string; refreshToken: RefreshTokenPair }> {
    const tokenHash = this.hash(rawToken);
    const existing = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!existing) {
      throw Errors.unauthenticated('Invalid refresh token');
    }
    if (existing.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: existing.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw Errors.unauthenticated('Refresh token reuse detected; all sessions revoked');
    }
    if (existing.expiresAt.getTime() < Date.now()) {
      throw Errors.unauthenticated('Refresh token expired');
    }

    const jwtConfig = this.configService.get('jwt', { infer: true });
    const raw = randomBytes(48).toString('hex');
    const newTokenHash = this.hash(raw);
    const expiresAt = addDuration(new Date(), jwtConfig.refreshTtl);

    const [, created] = await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: existing.id },
        data: { revokedAt: new Date() },
      }),
      this.prisma.refreshToken.create({
        data: { userId: existing.userId, tokenHash: newTokenHash, expiresAt },
      }),
    ]);
    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { replacedById: created.id },
    });

    return { userId: existing.userId, refreshToken: { id: created.id, raw, expiresAt } };
  }

  async revokeRefreshToken(rawToken: string): Promise<void> {
    const tokenHash = this.hash(rawToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Best-effort: used by logout, which must always succeed even with a garbled/missing token. */
  async revokeAccessToken(rawAccessToken: string): Promise<void> {
    try {
      const decoded = this.jwtService.decode(rawAccessToken) as
        | { jti?: string; exp?: number }
        | null;
      if (decoded?.jti && decoded.exp) {
        await this.prisma.revokedAccessToken.upsert({
          where: { jti: decoded.jti },
          create: { jti: decoded.jti, expiresAt: new Date(decoded.exp * 1000) },
          update: {},
        });
      }
    } catch {
      // intentionally swallowed: logout always returns 204
    }
    await this.cleanupExpiredRevocations();
  }

  async isAccessTokenRevoked(jti: string): Promise<boolean> {
    const row = await this.prisma.revokedAccessToken.findUnique({ where: { jti } });
    return Boolean(row);
  }

  private async cleanupExpiredRevocations(): Promise<void> {
    await this.prisma.revokedAccessToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
