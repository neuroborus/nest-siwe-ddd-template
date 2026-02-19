import { RequestContext, Accessor } from '../request.context';
import type { ClientData } from '../client-data.interface';
import type { Address } from '@/shared/domain/types';

describe('RequestContext', () => {
  let ctx: RequestContext;

  beforeEach(() => {
    ctx = new RequestContext();
  });

  describe('setters with correct accessor', () => {
    it('sets and gets requestId via RequestInterceptor accessor', () => {
      RequestContext.run(() => {
        ctx.setRequestId('req-1', Accessor.RequestInterceptor);
        expect(ctx.requestId).toBe('req-1');
      });
    });

    it('sets and gets userId via JwtAuthGuard accessor', () => {
      RequestContext.run(() => {
        ctx.setUserId('user-1', Accessor.JwtAuthGuard);
        expect(ctx.userId).toBe('user-1');
      });
    });

    it('sets and gets ethAddress via JwtAuthGuard accessor', () => {
      RequestContext.run(() => {
        const addr = '0xabc' as Address;
        ctx.setEthAddress(addr, Accessor.JwtAuthGuard);
        expect(ctx.ethAddress).toBe(addr);
      });
    });

    it('sets and gets sessionId via JwtAuthGuard accessor', () => {
      RequestContext.run(() => {
        ctx.setSessionId('sess-1', Accessor.JwtAuthGuard);
        expect(ctx.sessionId).toBe('sess-1');
      });
    });

    it('sets and gets clientData via RequestInterceptor accessor', () => {
      RequestContext.run(() => {
        const data: ClientData = { ipAddress: '1.2.3.4', userAgent: 'test' };
        ctx.setClientData(data, Accessor.RequestInterceptor);
        expect(ctx.clientData).toEqual(data);
      });
    });
  });

  describe('setters with wrong accessor are ignored', () => {
    it('ignores requestId from JwtAuthGuard', () => {
      RequestContext.run(() => {
        ctx.setRequestId('req-1', Accessor.JwtAuthGuard);
        expect(() => ctx.requestId).toThrow('Not Found');
      });
    });

    it('ignores userId from RequestInterceptor', () => {
      RequestContext.run(() => {
        ctx.setUserId('user-1', Accessor.RequestInterceptor);
        expect(() => ctx.userId).toThrow('Not Found');
      });
    });

    it('ignores ethAddress from RequestInterceptor', () => {
      RequestContext.run(() => {
        ctx.setEthAddress('0xabc' as Address, Accessor.RequestInterceptor);
        expect(() => ctx.ethAddress).toThrow('Not Found');
      });
    });

    it('ignores sessionId from RequestInterceptor', () => {
      RequestContext.run(() => {
        ctx.setSessionId('sess-1', Accessor.RequestInterceptor);
        expect(() => ctx.sessionId).toThrow('Not Found');
      });
    });

    it('ignores clientData from JwtAuthGuard', () => {
      RequestContext.run(() => {
        const data: ClientData = { ipAddress: '1.2.3.4', userAgent: 'test' };
        ctx.setClientData(data, Accessor.JwtAuthGuard);
        expect(() => ctx.clientData).toThrow('Not Found');
      });
    });
  });

  describe('getters throw on missing values', () => {
    it('throws for requestId', () => {
      RequestContext.run(() => {
        expect(() => ctx.requestId).toThrow('Not Found In RequestContext: requestId');
      });
    });

    it('throws for userId', () => {
      RequestContext.run(() => {
        expect(() => ctx.userId).toThrow('Not Found In RequestContext: userId');
      });
    });

    it('throws for ethAddress', () => {
      RequestContext.run(() => {
        expect(() => ctx.ethAddress).toThrow('Not Found In RequestContext: ethAddress');
      });
    });

    it('throws for sessionId', () => {
      RequestContext.run(() => {
        expect(() => ctx.sessionId).toThrow('Not Found In RequestContext: sessionId');
      });
    });

    it('throws for clientData', () => {
      RequestContext.run(() => {
        expect(() => ctx.clientData).toThrow('Not Found In RequestContext: clientData');
      });
    });
  });

  describe('outside of request scope', () => {
    it('throws when accessed without active store', () => {
      expect(() => ctx.requestId).toThrow('outside of request scope');
    });
  });

  describe('isolation between concurrent contexts', () => {
    it('each run() has its own store', async () => {
      const results: string[] = [];

      await Promise.all([
        new Promise<void>((resolve) => {
          RequestContext.run(() => {
            ctx.setRequestId('req-a', Accessor.RequestInterceptor);
            setImmediate(() => {
              results.push(ctx.requestId);
              resolve();
            });
          });
        }),
        new Promise<void>((resolve) => {
          RequestContext.run(() => {
            ctx.setRequestId('req-b', Accessor.RequestInterceptor);
            setImmediate(() => {
              results.push(ctx.requestId);
              resolve();
            });
          });
        }),
      ]);

      expect(results).toHaveLength(2);
      expect(results).toContain('req-a');
      expect(results).toContain('req-b');
    });
  });
});
