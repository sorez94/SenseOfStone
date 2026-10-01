import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { toUserDto, UserDto } from '../../common/mappers/user.mapper';
import { Configuration } from '../../config/configuration';
import { AUTH_THROTTLE } from '../../common/constants/throttle';
import { AuthResult } from './auth.service';
import { Errors } from '../../common/exceptions/app.exception';

interface AuthSessionDto {
  accessToken: string;
  expiresAt: string;
  user: UserDto;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService<Configuration, true>,
  ) {}

  @Post('google')
  @Throttle(AUTH_THROTTLE)
  async google(
    @Body() dto: GoogleLoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthSessionDto> {
    const result = await this.authService.loginWithGoogle(dto.idToken);
    res.status(result.created ? HttpStatus.CREATED : HttpStatus.OK);
    return this.respondWithSession(result, res);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle(AUTH_THROTTLE)
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthSessionDto> {
    const result = await this.authService.register(dto.email, dto.password);
    return this.respondWithSession(result, res);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle(AUTH_THROTTLE)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthSessionDto> {
    const result = await this.authService.login(dto.email, dto.password);
    return this.respondWithSession(result, res);
  }

  /**
   * Not part of docs/API.md - additive hardening hook mentioned in ARCHITECTURE.md §5
   * ("the frontend's ApiClient.onUnauthenticated hook is the place to add refresh-and-retry").
   * Rotates the httpOnly refresh cookie and issues a new access token.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthSessionDto> {
    const cookieName = this.configService.get('jwt', { infer: true }).refreshCookieName;
    const rawRefreshToken = req.cookies?.[cookieName] as string | undefined;
    if (!rawRefreshToken) {
      throw Errors.unauthenticated('No refresh token present');
    }
    const result = await this.authService.refresh(rawRefreshToken);
    return this.respondWithSession(result, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const cookieName = this.configService.get('jwt', { infer: true }).refreshCookieName;
    const refreshToken = req.cookies?.[cookieName] as string | undefined;

    try {
      await this.authService.logout(accessToken, refreshToken);
    } catch {
      // docs/API.md §3.4: logout always succeeds
    }
    this.clearRefreshCookie(res);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async me(@CurrentUser() currentUser: AuthenticatedUser): Promise<UserDto> {
    const user = await this.authService.getById(currentUser.id);
    return toUserDto(user);
  }

  private respondWithSession(result: AuthResult, res: Response): AuthSessionDto {
    this.setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
    return {
      accessToken: result.accessToken,
      expiresAt: result.accessExpiresAt.toISOString(),
      user: toUserDto(result.user),
    };
  }

  private setRefreshCookie(res: Response, token: string, expiresAt: Date): void {
    const jwtConfig = this.configService.get('jwt', { infer: true });
    res.cookie(jwtConfig.refreshCookieName, token, {
      httpOnly: true,
      secure: jwtConfig.cookieSecure,
      sameSite: 'lax',
      domain: jwtConfig.cookieDomain,
      path: '/',
      expires: expiresAt,
    });
  }

  private clearRefreshCookie(res: Response): void {
    const jwtConfig = this.configService.get('jwt', { infer: true });
    res.clearCookie(jwtConfig.refreshCookieName, {
      httpOnly: true,
      secure: jwtConfig.cookieSecure,
      sameSite: 'lax',
      domain: jwtConfig.cookieDomain,
      path: '/',
    });
  }
}
