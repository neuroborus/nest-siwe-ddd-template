import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/infrastructure/swagger';

export const SWAGGER_URL = '/swagger';
const FORWARDED_PREFIX_HEADER = 'x-forwarded-prefix';

type SwaggerRequest = {
  headers?: Record<string, string | string[] | undefined>;
};
type SwaggerUiRequest = { url: string };
type RuntimeLocation = {
  location?: {
    origin?: string;
    pathname?: string;
  };
};

function normalizeForwardedPrefix(prefix: string): string {
  const trimmedPrefix = prefix.trim();
  if (trimmedPrefix === '') {
    return '/';
  }

  const prefixWithLeadingSlash = trimmedPrefix.startsWith('/')
    ? trimmedPrefix
    : `/${trimmedPrefix}`;
  if (prefixWithLeadingSlash === '/') {
    return '/';
  }

  return prefixWithLeadingSlash.replace(/\/+$/, '');
}

function getForwardedPrefix(req: SwaggerRequest): string | null {
  // cloudflared/caddy can forward multiple values; use the first one.
  const rawHeader = req.headers?.[FORWARDED_PREFIX_HEADER];
  const prefix = (Array.isArray(rawHeader) ? rawHeader[0] : rawHeader)?.split(',')[0];
  if (prefix == null) {
    return null;
  }

  return normalizeForwardedPrefix(prefix);
}

function applySwaggerPathPrefix(request: SwaggerUiRequest): SwaggerUiRequest {
  const runtime = globalThis as RuntimeLocation;
  const pathname = runtime.location?.pathname ?? '';
  // Path mode URL shape: /<key>/swagger; extract <key> once for "Try it out" requests.
  const keyMatch = pathname.match(/^\/([^/]+)\/swagger(?:\/|$)/);
  const pathPrefix = keyMatch ? `/${keyMatch[1]}` : '';
  if (pathPrefix === '') {
    return request;
  }

  if (request.url.startsWith('/') && !request.url.startsWith(`${pathPrefix}/`)) {
    request.url = `${pathPrefix}${request.url}`;
    return request;
  }

  const origin = runtime.location?.origin;
  if (origin && request.url.startsWith(`${origin}/`)) {
    const relativePath = request.url.slice(origin.length);
    if (!relativePath.startsWith(`${pathPrefix}/`)) {
      request.url = `${origin}${pathPrefix}${relativePath}`;
    }
  }

  return request;
}

export async function setupSwagger(app: INestApplication): Promise<void> {
  const config = new DocumentBuilder()
    .setTitle('SIWE Auth API')
    .setDescription('EIP-4361 Sign-In with Ethereum authentication API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [ErrorResponseDto],
  });
  SwaggerModule.setup(SWAGGER_URL, app, document, {
    patchDocumentOnRequest(req, _res, incomingDocument) {
      // Keep OpenAPI servers aligned with reverse-proxy prefix headers.
      const forwardedPrefix = getForwardedPrefix(req as SwaggerRequest);
      if (!forwardedPrefix) {
        return incomingDocument;
      }

      return {
        ...incomingDocument,
        servers: [{ url: forwardedPrefix }],
      };
    },
    swaggerOptions: {
      requestInterceptor: applySwaggerPathPrefix,
    },
  });
}
