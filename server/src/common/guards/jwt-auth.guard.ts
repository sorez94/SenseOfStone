import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Protects every "Customer" (= any authenticated user) endpoint per
 * docs/API.md §1.7. Missing/invalid/expired/revoked tokens all surface as a
 * passport UnauthorizedException, which the global filter maps to
 * `401 UNAUTHENTICATED`.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
