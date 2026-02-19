import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokenFactory } from '../../infrastructure/jwt';
import type { Address } from '@/shared/domain/types';

const MOCK_ADDRESS = '0xabc' as Address;

describe('TokenFactory', () => {
  let factory: TokenFactory;
  let jwtService: { signAsync: jest.Mock };

  const configMap: Record<string, unknown> = {
    'auth.refreshTokenTtlMs': 259200000,
    'auth.accessTokenTtlMs': 900000,
    'auth.refreshSecret': 'refresh-secret',
  };

  beforeEach(async () => {
    jwtService = {
      signAsync: jest.fn().mockResolvedValueOnce('access-jwt').mockResolvedValueOnce('refresh-jwt'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenFactory,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              const val = configMap[key];
              if (val === undefined) throw new Error(`Missing: ${key}`);
              return val;
            }),
          },
        },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    factory = module.get(TokenFactory);
  });

  it('generates access and refresh tokens', async () => {
    const result = await factory.generate('user-1', MOCK_ADDRESS, 'sess-1');

    expect(result.accessToken).toBe('access-jwt');
    expect(result.refreshToken).toBe('refresh-jwt');
    expect(result.accessExpireMs).toBe(900000);
    expect(result.refreshExpireMs).toBe(259200000);
  });

  it('signs access token with correct payload', async () => {
    await factory.generate('user-1', MOCK_ADDRESS, 'sess-1');

    const accessCall = jwtService.signAsync.mock.calls[0];
    expect(accessCall[0]).toEqual({
      sub: 'user-1',
      ethAddress: MOCK_ADDRESS,
      sessionId: 'sess-1',
    });
  });

  it('signs refresh token with expiry and secret', async () => {
    await factory.generate('user-1', MOCK_ADDRESS, 'sess-1');

    const refreshCall = jwtService.signAsync.mock.calls[1];
    expect(refreshCall[1]).toEqual({
      expiresIn: Math.floor(259200000 / 1000),
      secret: 'refresh-secret',
    });
  });
});
