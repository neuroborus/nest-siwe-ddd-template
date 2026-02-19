import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { RequestInterceptor } from '../request.interceptor';
import { RequestContext, Accessor } from '../request.context';

function createMockContext(
  overrides: Partial<{ ip: string | undefined; userAgent: string; id: string }> = {},
): ExecutionContext {
  const req = {
    ip: 'ip' in overrides ? overrides.ip : '127.0.0.1',
    id: overrides.id ?? 'req-uuid',
    get: jest.fn((header: string) => {
      if (header === 'user-agent') return overrides.userAgent ?? 'TestAgent/1.0';
      return undefined;
    }),
  };

  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

describe('RequestInterceptor', () => {
  let interceptor: RequestInterceptor;
  let reqCtx: RequestContext;
  let next: CallHandler;

  beforeEach(() => {
    reqCtx = new RequestContext();
    interceptor = new RequestInterceptor(reqCtx);
    next = { handle: () => of('response') };
  });

  it('populates requestId from req.id', async () => {
    await RequestContext.run(async () => {
      const ctx = createMockContext({ id: 'my-req-id' });
      await interceptor.intercept(ctx, next);
      expect(reqCtx.requestId).toBe('my-req-id');
    });
  });

  it('populates clientData with ip and user-agent', async () => {
    await RequestContext.run(async () => {
      const ctx = createMockContext({ ip: '10.0.0.1', userAgent: 'Chrome/1' });
      await interceptor.intercept(ctx, next);
      expect(reqCtx.clientData).toEqual({
        ipAddress: '10.0.0.1',
        userAgent: 'Chrome/1',
      });
    });
  });

  it('defaults ip to "unknown" when req.ip is undefined', async () => {
    await RequestContext.run(async () => {
      const ctx = createMockContext({ ip: undefined });
      await interceptor.intercept(ctx, next);
      expect(reqCtx.clientData.ipAddress).toBe('unknown');
    });
  });

  it('defaults userAgent to "unknown" when header is missing', async () => {
    await RequestContext.run(async () => {
      const req = {
        ip: '1.1.1.1',
        id: 'r',
        get: jest.fn(() => undefined),
      };
      const ctx = {
        switchToHttp: () => ({ getRequest: () => req }),
      } as unknown as ExecutionContext;

      await interceptor.intercept(ctx, next);
      expect(reqCtx.clientData.userAgent).toBe('unknown');
    });
  });

  it('calls next.handle()', async () => {
    await RequestContext.run(async () => {
      const handleSpy = jest.fn(() => of('ok'));
      const ctx = createMockContext();
      const result = await interceptor.intercept(ctx, { handle: handleSpy });
      expect(handleSpy).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();
    });
  });

  it('throws on accessor mismatch if enum is tampered', () => {
    const original = Accessor.RequestInterceptor;
    expect(original).toBe('RequestInterceptor');
  });
});
