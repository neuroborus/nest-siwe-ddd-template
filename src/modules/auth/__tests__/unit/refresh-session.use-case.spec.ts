import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { HttpException } from '@nestjs/common';
import { RefreshSessionUseCase } from '../../application/use-cases/refresh-session.use-case';
import { SessionRepository } from '../../infrastructure/persistence';
import { TokenFactory } from '../../infrastructure/jwt';
import { hash } from '@/shared/utils/security';
import type { Address } from '@/shared/domain/types';

const MOCK_ADDRESS = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045' as Address;
const MOCK_REFRESH_TOKEN = 'valid-refresh-token';

const mockLoginData = {
  accessToken: 'new-access-token',
  refreshToken: 'new-refresh-token',
  accessExpireMs: 900000,
  refreshExpireMs: 259200000,
};

describe('RefreshSessionUseCase', () => {
  let useCase: RefreshSessionUseCase;
  let sessionRepo: Partial<SessionRepository>;
  let jwtService: Partial<JwtService>;
  let tokenFactory: Partial<TokenFactory>;

  const configMap: Record<string, unknown> = {
    'auth.refreshTokenTtlMs': 259200000,
    'auth.accessTokenTtlMs': 900000,
    'auth.refreshSecret': 'test-refresh-secret',
  };

  beforeEach(async () => {
    sessionRepo = {
      findById: jest.fn().mockResolvedValue({
        id: 'session-1',
        expired: new Date(Date.now() + 100000),
        refreshTokenHash: hash(MOCK_REFRESH_TOKEN),
        userId: 'user-1',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      }),
      upsert: jest.fn().mockResolvedValue({}),
      deleteById: jest.fn().mockResolvedValue(undefined),
    };

    jwtService = {
      verifyAsync: jest.fn().mockResolvedValue({
        sub: 'user-1',
        ethAddress: MOCK_ADDRESS,
        sessionId: 'session-1',
      }),
    };

    tokenFactory = {
      generate: jest.fn().mockResolvedValue(mockLoginData),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshSessionUseCase,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              const val = configMap[key];
              if (val === undefined) throw new Error(`Config key: ${key}`);
              return val;
            }),
          },
        },
        { provide: JwtService, useValue: jwtService },
        { provide: TokenFactory, useValue: tokenFactory },
        { provide: SessionRepository, useValue: sessionRepo },
      ],
    }).compile();

    useCase = module.get<RefreshSessionUseCase>(RefreshSessionUseCase);
  });

  it('should refresh session with valid token', async () => {
    const result = await useCase.execute('127.0.0.1', 'test-agent', MOCK_REFRESH_TOKEN);

    expect(result.ethAddress).toBe(MOCK_ADDRESS);
    expect(result.loginData.accessToken).toBe('new-access-token');
    expect(result.loginData.refreshToken).toBe('new-refresh-token');
    expect(sessionRepo.upsert).toHaveBeenCalledTimes(1);
    expect(tokenFactory.generate).toHaveBeenCalledTimes(1);
  });

  it('should reject when JWT verification fails', async () => {
    (jwtService.verifyAsync as jest.Mock).mockRejectedValue(new Error('jwt expired'));

    await expect(useCase.execute('127.0.0.1', 'test-agent', 'invalid-token')).rejects.toThrow(
      HttpException,
    );
    await expect(useCase.execute('127.0.0.1', 'test-agent', 'invalid-token')).rejects.toThrow(
      'Wrong token',
    );
  });

  it('should reject when session not found', async () => {
    (sessionRepo.findById as jest.Mock).mockResolvedValue(null);

    await expect(useCase.execute('127.0.0.1', 'test-agent', MOCK_REFRESH_TOKEN)).rejects.toThrow(
      'Wrong token',
    );
  });

  it('should reject and delete session when expired', async () => {
    (sessionRepo.findById as jest.Mock).mockResolvedValue({
      id: 'session-1',
      expired: new Date(Date.now() - 100000),
      refreshTokenHash: hash(MOCK_REFRESH_TOKEN),
    });

    await expect(useCase.execute('127.0.0.1', 'test-agent', MOCK_REFRESH_TOKEN)).rejects.toThrow(
      'Wrong token',
    );
    expect(sessionRepo.deleteById).toHaveBeenCalledWith('session-1');
  });

  it('should reject and delete session when token hash mismatch', async () => {
    (sessionRepo.findById as jest.Mock).mockResolvedValue({
      id: 'session-1',
      expired: new Date(Date.now() + 100000),
      refreshTokenHash: 'wrong-hash',
    });

    await expect(useCase.execute('127.0.0.1', 'test-agent', MOCK_REFRESH_TOKEN)).rejects.toThrow(
      'Wrong token',
    );
    expect(sessionRepo.deleteById).toHaveBeenCalledWith('session-1');
  });
});
