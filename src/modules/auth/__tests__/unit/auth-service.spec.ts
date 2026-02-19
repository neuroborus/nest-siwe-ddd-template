import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../application/auth.service';
import { RequestContext, Accessor } from '@/infrastructure/request';
import { CreateNonceUseCase } from '../../application/use-cases/create-nonce.use-case';
import { ValidateSiweUseCase } from '../../application/use-cases/validate-siwe.use-case';
import { CreateSessionUseCase } from '../../application/use-cases/create-session.use-case';
import { RefreshSessionUseCase } from '../../application/use-cases/refresh-session.use-case';
import { DeleteSessionUseCase } from '../../application/use-cases/delete-session.use-case';
import type { Address, Hex } from '@/shared/domain/types';

const MOCK_ADDRESS = '0xabc' as Address;

describe('AuthService', () => {
  let service: AuthService;
  let reqCtx: RequestContext;
  let createNonceFn: jest.Mock;
  let validateSiweFn: jest.Mock;
  let createSessionFn: jest.Mock;
  let refreshSessionFn: jest.Mock;
  let deleteSessionFn: jest.Mock;

  beforeEach(async () => {
    reqCtx = new RequestContext();
    createNonceFn = jest.fn();
    validateSiweFn = jest.fn();
    createSessionFn = jest.fn();
    refreshSessionFn = jest.fn();
    deleteSessionFn = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: RequestContext, useValue: reqCtx },
        { provide: CreateNonceUseCase, useValue: { execute: createNonceFn } },
        { provide: ValidateSiweUseCase, useValue: { execute: validateSiweFn } },
        { provide: CreateSessionUseCase, useValue: { execute: createSessionFn } },
        { provide: RefreshSessionUseCase, useValue: { execute: refreshSessionFn } },
        { provide: DeleteSessionUseCase, useValue: { execute: deleteSessionFn } },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('createNonce delegates to CreateNonceUseCase', async () => {
    const nonceData = { nonce: 'abc', expiresAt: new Date() };
    createNonceFn.mockResolvedValue(nonceData);

    const result = await service.createNonce();
    expect(result).toEqual(nonceData);
    expect(createNonceFn).toHaveBeenCalledTimes(1);
  });

  it('createSession validates SIWE then creates session with client data', async () => {
    await RequestContext.run(async () => {
      reqCtx.setClientData(
        { ipAddress: '1.1.1.1', userAgent: 'agent' },
        Accessor.RequestInterceptor,
      );

      const validated = { address: MOCK_ADDRESS, nonce: 'n', chain: 1 };
      validateSiweFn.mockResolvedValue(validated);

      const loginData = {
        accessToken: 'at',
        refreshToken: 'rt',
        accessExpireMs: 900000,
        refreshExpireMs: 259200000,
      };
      createSessionFn.mockResolvedValue(loginData);

      const result = await service.createSession('msg', '0xsig' as Hex);

      expect(validateSiweFn).toHaveBeenCalledWith('msg', '0xsig');
      expect(createSessionFn).toHaveBeenCalledWith(MOCK_ADDRESS, '1.1.1.1', 'agent');
      expect(result).toEqual(loginData);
    });
  });

  it('refreshSession delegates with client data', async () => {
    await RequestContext.run(async () => {
      reqCtx.setClientData({ ipAddress: '2.2.2.2', userAgent: 'bot' }, Accessor.RequestInterceptor);

      refreshSessionFn.mockResolvedValue({
        ethAddress: MOCK_ADDRESS,
        loginData: {
          accessToken: 'at2',
          refreshToken: 'rt2',
          accessExpireMs: 900000,
          refreshExpireMs: 259200000,
        },
      });

      const result = await service.refreshSession('refresh-tok');
      expect(refreshSessionFn).toHaveBeenCalledWith('2.2.2.2', 'bot', 'refresh-tok');
      expect(result.accessToken).toBe('at2');
    });
  });

  it('deleteSession uses sessionId from request context', async () => {
    await RequestContext.run(async () => {
      reqCtx.setSessionId('sess-1', Accessor.JwtAuthGuard);
      reqCtx.setEthAddress(MOCK_ADDRESS, Accessor.JwtAuthGuard);
      deleteSessionFn.mockResolvedValue(undefined);

      await service.deleteSession();
      expect(deleteSessionFn).toHaveBeenCalledWith('sess-1');
    });
  });
});
