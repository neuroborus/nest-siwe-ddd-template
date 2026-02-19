import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RequestContext, Accessor } from '@/infrastructure/request';
import type { AccessTokenVerifier, AccessPayload } from '../index';

const PAYLOAD: AccessPayload = {
  sub: 'user-1',
  ethAddress: '0xabc' as any,
  sessionId: 'sess-1',
};

function createContext(authorization?: string): ExecutionContext {
  const req = { headers: { authorization } };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;
  let verifier: jest.Mocked<AccessTokenVerifier>;
  let reqCtx: RequestContext;

  beforeEach(() => {
    reflector = new Reflector();
    verifier = { verify: jest.fn() };
    reqCtx = new RequestContext();

    guard = new (JwtAuthGuard as any)(verifier, reqCtx, reflector);
  });

  it('returns true for public routes', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const result = await guard.canActivate(createContext());
    expect(result).toBe(true);
  });

  it('throws 401 when authorization header is missing', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    await expect(guard.canActivate(createContext())).rejects.toThrow(HttpException);
    await expect(guard.canActivate(createContext())).rejects.toMatchObject({
      response: expect.objectContaining({ statusCode: HttpStatus.UNAUTHORIZED }),
    });
  });

  it('throws 401 when authorization header does not start with Bearer', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    await expect(guard.canActivate(createContext('Basic abc'))).rejects.toThrow(HttpException);
  });

  it('throws 401 when token is empty after Bearer', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    await expect(guard.canActivate(createContext('Bearer '))).rejects.toThrow(HttpException);
  });

  it('verifies token and saves request data on success', async () => {
    await RequestContext.run(async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      verifier.verify.mockResolvedValue(PAYLOAD);

      const result = await guard.canActivate(createContext('Bearer valid-token'));

      expect(result).toBe(true);
      expect(verifier.verify).toHaveBeenCalledWith('valid-token');
      expect(reqCtx.userId).toBe('user-1');
      expect(reqCtx.sessionId).toBe('sess-1');
    });
  });

  it('throws 401 when token verification fails', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    verifier.verify.mockRejectedValue(new Error('invalid'));

    await expect(guard.canActivate(createContext('Bearer bad'))).rejects.toThrow(HttpException);
  });

  it('accessor matches class name', () => {
    expect(Accessor.JwtAuthGuard).toBe(JwtAuthGuard.name);
  });
});
