import {
  Controller,
  Body,
  Get,
  Post,
  Req,
  Res,
  SerializeOptions,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CookieOptions, Request, Response } from 'express';
import { staticConfig, NodeEnv } from '@/config';
import { RequestContext } from '@/infrastructure/request';
import { AuthEndpoint, Public } from '@/infrastructure/security';
import { AuthService } from '../application/auth.service';
import { NonceResponseDto, LoginResponseDto } from '../application/dtos/responses';
import { LoginRequestDto } from '../application/dtos/requests';
import { noRefreshTokenException } from '../domain/errors';
import type { LoginData } from '../domain/types';
import { AuthThrottle } from './auth-throttle.decorator';

const REFRESH_TOKEN_COOKIE = 'refreshToken';

@ApiTags('Auth')
@Controller('v1/auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly requestStorage: RequestContext,
  ) {}

  private updateRefreshToken(res: Response, loginData: LoginData): void {
    const devOptions: CookieOptions = {
      httpOnly: true,
      secure: false,
      maxAge: loginData.refreshExpireMs,
    };
    const prodOptions: CookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: loginData.refreshExpireMs,
    };

    const options = staticConfig.nodeEnv === NodeEnv.Prod ? prodOptions : devOptions;

    res.cookie(REFRESH_TOKEN_COOKIE, loginData.refreshToken, options);
  }

  private deleteRefreshToken(res: Response): void {
    res.clearCookie(REFRESH_TOKEN_COOKIE, {
      httpOnly: true,
      secure: staticConfig.nodeEnv === NodeEnv.Prod,
      sameSite: staticConfig.nodeEnv === NodeEnv.Prod ? 'strict' : undefined,
    });
  }

  @Post('/siwe/nonce')
  @Public()
  @AuthThrottle()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create SIWE nonce challenge' })
  @ApiResponse({ status: HttpStatus.CREATED, type: NonceResponseDto })
  @SerializeOptions({ type: NonceResponseDto })
  createSiweNonce(): Promise<NonceResponseDto> {
    return this.auth.createNonce();
  }

  @Post('/siwe/verify')
  @Public()
  @AuthThrottle()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Verify SIWE message and create session' })
  @ApiResponse({ status: HttpStatus.CREATED, type: LoginResponseDto })
  @SerializeOptions({ type: LoginResponseDto })
  async verifySiwe(
    @Body() body: LoginRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const loginData = await this.auth.createSession(body.message, body.signature);
    this.updateRefreshToken(res, loginData);
    return loginData;
  }

  @Post('/logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuthEndpoint()
  @ApiOperation({ summary: 'Logout and destroy session' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async logout(@Res({ passthrough: true }) res: Response): Promise<void> {
    await this.auth.deleteSession();
    this.deleteRefreshToken(res);
  }

  @Post('/refresh-tokens')
  @Public()
  @AuthThrottle()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  @ApiResponse({ status: HttpStatus.CREATED, type: LoginResponseDto })
  @SerializeOptions({ type: LoginResponseDto })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const refreshToken: string | undefined = req.cookies?.refreshToken;
    if (!refreshToken) throw noRefreshTokenException();

    const loginData = await this.auth.refreshSession(refreshToken);
    this.updateRefreshToken(res, loginData);
    return loginData;
  }

  @Get('/access')
  @HttpCode(HttpStatus.OK)
  @AuthEndpoint()
  @ApiOperation({ summary: 'Test authenticated access' })
  @ApiResponse({ status: HttpStatus.OK, type: String })
  testAccess(): string {
    return this.requestStorage.ethAddress;
  }
}
