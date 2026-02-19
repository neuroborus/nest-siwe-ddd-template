import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CreateSessionUseCase } from '../../application/use-cases/create-session.use-case';
import { UserRepository, SessionRepository } from '../../infrastructure/persistence';
import { TokenFactory } from '../../infrastructure/jwt';
import type { Address } from '@/shared/domain/types';

const MOCK_ADDRESS = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045' as Address;

const mockLoginData = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  accessExpireMs: 900000,
  refreshExpireMs: 259200000,
};

describe('CreateSessionUseCase', () => {
  let useCase: CreateSessionUseCase;
  let userRepo: Partial<UserRepository>;
  let sessionRepo: Partial<SessionRepository>;
  let tokenFactory: Partial<TokenFactory>;

  const configMap: Record<string, unknown> = {
    'auth.refreshTokenTtlMs': 259200000,
    'auth.accessTokenTtlMs': 900000,
    'auth.refreshSecret': 'test-refresh-secret',
  };

  beforeEach(async () => {
    userRepo = {
      findByEthAddress: jest.fn().mockResolvedValue({
        id: 'user-uuid-1',
        ethAddress: MOCK_ADDRESS,
      }),
      create: jest.fn().mockResolvedValue({
        id: 'user-uuid-new',
        ethAddress: MOCK_ADDRESS,
      }),
    };

    sessionRepo = {
      upsert: jest.fn().mockResolvedValue({}),
    };

    tokenFactory = {
      generate: jest.fn().mockResolvedValue(mockLoginData),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateSessionUseCase,
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
        { provide: TokenFactory, useValue: tokenFactory },
        { provide: UserRepository, useValue: userRepo },
        { provide: SessionRepository, useValue: sessionRepo },
      ],
    }).compile();

    useCase = module.get<CreateSessionUseCase>(CreateSessionUseCase);
  });

  it('should create session for existing user', async () => {
    const result = await useCase.execute(MOCK_ADDRESS, '127.0.0.1', 'test-agent');

    expect(result.accessToken).toBe('mock-access-token');
    expect(result.refreshToken).toBe('mock-refresh-token');
    expect(result.accessExpireMs).toBe(900000);
    expect(result.refreshExpireMs).toBe(259200000);

    expect(userRepo.findByEthAddress).toHaveBeenCalledWith(MOCK_ADDRESS);
    expect(userRepo.create).not.toHaveBeenCalled();
    expect(sessionRepo.upsert).toHaveBeenCalledTimes(1);
    expect(tokenFactory.generate).toHaveBeenCalledTimes(1);
  });

  it('should create new user when not found', async () => {
    (userRepo.findByEthAddress as jest.Mock).mockResolvedValue(null);

    await useCase.execute(MOCK_ADDRESS, '127.0.0.1', 'agent');

    expect(userRepo.create).toHaveBeenCalledWith(MOCK_ADDRESS);
    expect(tokenFactory.generate).toHaveBeenCalledTimes(1);
  });
});
