import { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/infrastructure/swagger';
import { setupSwagger, SWAGGER_URL } from '@/swagger';

jest.mock('@nestjs/swagger', () => ({
  SwaggerModule: {
    createDocument: jest.fn(() => ({ openapi: '3.0.0', paths: {} })),
    setup: jest.fn(),
  },
  ApiProperty: () => () => undefined,
  ApiPropertyOptional: () => () => undefined,
  DocumentBuilder: class {
    public setTitle(_title: string): this {
      return this;
    }

    public setDescription(_description: string): this {
      return this;
    }

    public setVersion(_version: string): this {
      return this;
    }

    public addBearerAuth(): this {
      return this;
    }

    public build(): Record<string, string> {
      return {};
    }
  },
}));

const setupMock = jest.mocked(SwaggerModule.setup);
const createDocumentMock = jest.mocked(SwaggerModule.createDocument);

describe('setupSwagger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete (globalThis as { location?: unknown }).location;
  });

  it('registers swagger with model extras and keeps document when no forwarded prefix', async () => {
    const app = {} as INestApplication;

    await setupSwagger(app);

    expect(createDocumentMock).toHaveBeenCalledWith(app, expect.any(Object), {
      extraModels: [ErrorResponseDto],
    });
    expect(setupMock).toHaveBeenCalledWith(
      SWAGGER_URL,
      app,
      expect.any(Object),
      expect.objectContaining({
        patchDocumentOnRequest: expect.any(Function),
        swaggerOptions: expect.objectContaining({
          requestInterceptor: expect.any(Function),
        }),
      }),
    );

    const setupCall = setupMock.mock.calls[0];
    if (!setupCall) {
      throw new Error('SwaggerModule.setup was not called');
    }
    const options = setupCall[3] as {
      patchDocumentOnRequest: (
        req: { headers?: Record<string, string | string[] | undefined> },
        res: unknown,
        doc: object,
      ) => object;
    };
    const document = { openapi: '3.0.0' };

    const result = options.patchDocumentOnRequest({ headers: {} }, null, document);
    expect(result).toBe(document);
  });

  it('patches servers from X-Forwarded-Prefix and normalizes values', async () => {
    const app = {} as INestApplication;
    await setupSwagger(app);

    const setupCall = setupMock.mock.calls[0];
    if (!setupCall) {
      throw new Error('SwaggerModule.setup was not called');
    }
    const options = setupCall[3] as {
      patchDocumentOnRequest: (
        req: { headers?: Record<string, string | string[] | undefined> },
        res: unknown,
        doc: object,
      ) => object & { servers?: Array<{ url: string }> };
    };

    const initialDoc = { openapi: '3.0.0', paths: {} };

    const fromBarePrefix = options.patchDocumentOnRequest(
      { headers: { 'x-forwarded-prefix': 'abc' } },
      null,
      initialDoc,
    );
    expect(fromBarePrefix.servers).toEqual([{ url: '/abc' }]);

    const fromTrailingSlash = options.patchDocumentOnRequest(
      { headers: { 'x-forwarded-prefix': ['/abc/'] } },
      null,
      initialDoc,
    );
    expect(fromTrailingSlash.servers).toEqual([{ url: '/abc' }]);

    const fromMultiValue = options.patchDocumentOnRequest(
      { headers: { 'x-forwarded-prefix': '/abc,/ignored' } },
      null,
      initialDoc,
    );
    expect(fromMultiValue.servers).toEqual([{ url: '/abc' }]);

    const fromRoot = options.patchDocumentOnRequest(
      { headers: { 'x-forwarded-prefix': '   ' } },
      null,
      initialDoc,
    );
    expect(fromRoot.servers).toEqual([{ url: '/' }]);
  });

  it('prefixes swagger try-it-out requests when opened via /<key>/swagger', async () => {
    const app = {} as INestApplication;
    await setupSwagger(app);

    const setupCall = setupMock.mock.calls[0];
    if (!setupCall) {
      throw new Error('SwaggerModule.setup was not called');
    }
    const options = setupCall[3] as {
      swaggerOptions: {
        requestInterceptor: (request: { url: string }) => { url: string };
      };
    };
    const interceptor = options.swaggerOptions.requestInterceptor;

    (globalThis as { location?: { origin: string; pathname: string } }).location = {
      origin: 'https://public.example.com',
      pathname: '/my-key/swagger',
    };

    const relative = interceptor({ url: '/v1/auth/siwe/nonce' });
    expect(relative.url).toBe('/my-key/v1/auth/siwe/nonce');

    const absolute = interceptor({ url: 'https://public.example.com/v1/auth/siwe/nonce' });
    expect(absolute.url).toBe('https://public.example.com/my-key/v1/auth/siwe/nonce');

    const alreadyPrefixed = interceptor({ url: '/my-key/v1/auth/siwe/nonce' });
    expect(alreadyPrefixed.url).toBe('/my-key/v1/auth/siwe/nonce');

    (globalThis as { location?: { origin: string; pathname: string } }).location = {
      origin: 'https://public.example.com',
      pathname: '/swagger',
    };

    const noKey = interceptor({ url: '/v1/auth/siwe/nonce' });
    expect(noKey.url).toBe('/v1/auth/siwe/nonce');
  });
});
