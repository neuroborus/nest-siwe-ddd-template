import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CreateNonceUseCase } from '../../application/use-cases/create-nonce.use-case';
import { AuthNonceRepository } from '../../infrastructure/persistence';

describe('CreateNonceUseCase', () => {
  let useCase: CreateNonceUseCase;
  let nonceRepo: Partial<AuthNonceRepository>;

  beforeEach(async () => {
    nonceRepo = {
      create: jest.fn().mockResolvedValue({
        id: 'test-id',
        nonce: 'testnonce123',
        expiresAt: new Date('2026-12-31T23:59:59Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
        usedAt: null,
        usedByAddress: null,
      }),
    };

    const configMap: Record<string, unknown> = {
      'auth.authNonceTtlMs': 300000,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateNonceUseCase,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              const val = configMap[key];
              if (val === undefined) throw new Error(`Config key not found: ${key}`);
              return val;
            }),
          },
        },
        { provide: AuthNonceRepository, useValue: nonceRepo },
      ],
    }).compile();

    useCase = module.get<CreateNonceUseCase>(CreateNonceUseCase);
  });

  it('should create a nonce with correct expiration', async () => {
    const before = Date.now();
    const result = await useCase.execute();
    const after = Date.now();

    expect(result.nonce).toBe('testnonce123');
    expect(result.expiresAt).toBeDefined();
    expect(nonceRepo.create).toHaveBeenCalledTimes(1);

    const callArg = (nonceRepo.create as jest.Mock).mock.calls[0][0] as Date;
    expect(callArg.getTime()).toBeGreaterThanOrEqual(before + 300000 - 100);
    expect(callArg.getTime()).toBeLessThanOrEqual(after + 300000 + 100);
  });

  it('should return nonce and expiresAt from the created entity', async () => {
    const result = await useCase.execute();

    expect(result).toEqual({
      nonce: 'testnonce123',
      expiresAt: new Date('2026-12-31T23:59:59Z'),
    });
  });
});
