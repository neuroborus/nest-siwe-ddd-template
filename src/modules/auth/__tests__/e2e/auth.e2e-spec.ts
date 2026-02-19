import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from '../../api/auth.controller';
import { AuthService } from '../../application/auth.service';
import { RequestContext } from '@/infrastructure/request';
import { JwtAuthGuard } from '@/infrastructure/security';
import { AuthErrorCode } from '../../domain/errors';
import type { Address, Hex } from '@/shared/domain/types';
import type { LoginData, NonceData } from '../../domain/types';

const MOCK_ADDRESS = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045' as Address;
const MOCK_SIGNATURE: Hex = `0x${'ab'.repeat(65)}` as Hex;

const mockNonceData: NonceData = {
  nonce: 'test-nonce-abc123',
  expiresAt: new Date('2026-12-31T23:59:59Z'),
};

const mockLoginData: LoginData = {
  accessToken: 'mock-access-jwt',
  refreshToken: 'mock-refresh-jwt',
  accessExpireMs: 900000,
  refreshExpireMs: 259200000,
};

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let authService: Partial<AuthService>;
  let requestCtx: Partial<RequestContext>;

  beforeAll(async () => {
    authService = {
      createNonce: jest.fn().mockResolvedValue(mockNonceData),
      createSession: jest.fn().mockResolvedValue(mockLoginData),
      refreshSession: jest.fn().mockResolvedValue(mockLoginData),
      deleteSession: jest.fn().mockResolvedValue(undefined),
    };

    requestCtx = {
      ethAddress: MOCK_ADDRESS,
      sessionId: 'session-1',
      requestId: 'test-request-id',
      setRequestId: jest.fn(),
      setClientData: jest.fn(),
      setUserId: jest.fn(),
      setEthAddress: jest.fn(),
      setSessionId: jest.fn(),
      clientData: { ipAddress: '127.0.0.1', userAgent: 'test' },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: RequestContext, useValue: requestCtx },
        {
          provide: JwtAuthGuard,
          useValue: { canActivate: () => true },
        },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn().mockResolvedValue({
              sub: 'user-1',
              ethAddress: MOCK_ADDRESS,
              sessionId: 'session-1',
            }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('test'),
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/auth/siwe/nonce', () => {
    it('should return 201 with nonce data', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/siwe/nonce')
        .send({})
        .expect(201);

      expect(response.body.nonce).toBe('test-nonce-abc123');
      expect(response.body.expiresAt).toBeDefined();
    });
  });

  describe('POST /v1/auth/siwe/verify', () => {
    it('should return 201 with login data', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/siwe/verify')
        .send({ message: 'test-siwe-message', signature: MOCK_SIGNATURE })
        .expect(201);

      expect(response.body.accessToken).toBe('mock-access-jwt');
      expect(response.body.accessExpireMs).toBe(900000);
      expect(response.body.refreshExpireMs).toBe(259200000);
    });

    it('should set refresh token cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/siwe/verify')
        .send({ message: 'test-siwe-message', signature: MOCK_SIGNATURE })
        .expect(201);

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies;
      expect(cookieStr).toContain('refreshToken');
    });

    it('should reject empty body with NestJS validation error', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/siwe/verify')
        .send({})
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.message).toEqual(expect.arrayContaining([expect.any(String)]));
      expect(response.body.error).toBe('Bad Request');
    });
  });

  describe('POST /v1/auth/logout', () => {
    it('should return 204', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/logout')
        .set('Authorization', 'Bearer mock-token')
        .expect(204);

      expect(authService.deleteSession).toHaveBeenCalled();
    });
  });

  describe('POST /v1/auth/refresh-tokens', () => {
    it('should return structured 401 when no refresh token cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/refresh-tokens')
        .expect(401);

      expect(response.body.code).toBe(AuthErrorCode.NoRefreshToken);
      expect(response.body.statusCode).toBe(401);
      expect(response.body.message).toBe('No refresh token');
      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.details).toEqual({});
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return 201 with valid refresh token cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/refresh-tokens')
        .set('Cookie', 'refreshToken=valid-refresh-jwt')
        .expect(201);

      expect(response.body.accessToken).toBe('mock-access-jwt');
    });
  });

  describe('GET /v1/auth/access', () => {
    it('should return eth address when authenticated', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/auth/access')
        .set('Authorization', 'Bearer mock-token')
        .expect(200);

      expect(response.text).toContain(MOCK_ADDRESS);
    });
  });
});
