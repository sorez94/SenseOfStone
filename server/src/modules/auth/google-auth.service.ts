import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { Configuration } from '../../config/configuration';
import { Errors } from '../../common/exceptions/app.exception';

export interface GoogleProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  givenName: string;
  familyName: string;
  picture: string | null;
}

/**
 * docs/API.md §3.1: verify the Google ID token's signature via Google's JWKS,
 * `aud == GOOGLE_CLIENT_ID`, `iss` in the accepted set, `exp` in the future,
 * and `email_verified == true`. google-auth-library's verifyIdToken already
 * checks signature/aud/iss/exp; we only need to additionally check email_verified.
 */
@Injectable()
export class GoogleAuthService {
  private readonly client: OAuth2Client;
  private readonly clientId?: string;

  constructor(private readonly configService: ConfigService<Configuration, true>) {
    this.clientId = this.configService.get('google.clientId', { infer: true });
    this.client = new OAuth2Client(this.clientId);
  }

  async verifyIdToken(idToken: string): Promise<GoogleProfile> {
    if (!this.clientId) {
      throw Errors.invalidGoogleToken(
        'Google sign-in is not configured on this server (missing GOOGLE_CLIENT_ID)',
      );
    }

    // Mock-mode tokens from the frontend's fake backend are prefixed "mockgoogle." and must
    // always be rejected by the real backend (docs/API.md §3.1).
    if (idToken.startsWith('mockgoogle.')) {
      throw Errors.invalidGoogleToken();
    }

    let payload;
    try {
      const ticket = await this.client.verifyIdToken({ idToken, audience: this.clientId });
      payload = ticket.getPayload();
    } catch {
      throw Errors.invalidGoogleToken();
    }

    if (!payload || !payload.email || !payload.email_verified) {
      throw Errors.invalidGoogleToken();
    }

    return {
      sub: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified,
      givenName: payload.given_name ?? '',
      familyName: payload.family_name ?? '',
      picture: payload.picture ?? null,
    };
  }
}
