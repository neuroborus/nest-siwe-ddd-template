# AGENTS.md

> AI agent instructions for **nest-siwe-template** — a DDD-based NestJS SIWE (EIP-4361) authentication backend.

---

## Tech Stack

| Layer       | Technology                                        |
| ----------- | ------------------------------------------------- |
| Runtime     | Node.js >= 24 (enforced in `engines`)             |
| Framework   | NestJS 11                                         |
| Language    | TypeScript 5 — strict mode, all strict flags on   |
| Database    | PostgreSQL 16+, TypeORM                           |
| Auth        | SIWE (EIP-4361) + JWT (access / refresh tokens)   |
| Validation  | class-validator + class-transformer               |
| Logging     | pino via nestjs-pino (structured JSON, redaction) |
| Docs        | Swagger / OpenAPI                                 |
| Testing     | Jest (unit, integration, e2e)                     |
| Package mgr | pnpm                                              |

---

## Project Structure

```
src/
├── config/                # Static config, env helpers, auth config
├── database/              # DataSource, migrations, DatabaseModule
├── infrastructure/        # Cross-cutting: request lifecycle + security
│   ├── request/           # RequestContext, RequestContextMiddleware, RequestInterceptor, GlobalExceptionFilter
│   └── security/          # JwtAuthGuard, @Public(), AccessTokenVerifier contract
├── modules/
│   ├── auth/              # SIWE authentication (complex module, full DDD)
│   │   ├── api/           # Controller, throttle decorator
│   │   ├── application/   # AuthService, use-cases, DTOs, crons
│   │   ├── domain/        # Entities, error codes, domain types
│   │   └── infrastructure/# Repositories (persistence/), JWT driver (jwt/)
│   └── ops/               # Health endpoint (simple module)
├── shared/                # Shared types (Address, Hex), validators, error utilities
├── app.module.ts          # Composition root
├── main.ts                # Bootstrap
└── pino.ts                # Logger configuration
```

---

## Architecture

### Principles

1. **Vertical slices** — each feature is a self-contained NestJS module with all its concerns.
2. **Complexity-based layering** — start simple (controller + service + module), add `domain/`, `infrastructure/`, `api/` when complexity warrants.
3. **DDD layering** for complex modules: `domain/ → application/ → infrastructure/ → api/`.
4. No circular dependencies between modules.

### Dependency Direction

```
API Layer (Controllers, DTOs)
    ↓
Application Layer (Services, Use Cases)
    ↓
Domain Layer (Entities, Value Objects, Error Codes)
    ↓
Infrastructure Layer (Repositories, External Adapters)
```

- Domain **never** imports from other layers.
- Application can use domain.
- Infrastructure can use domain + external libraries.
- API can use application + DTOs only.

### Infrastructure vs Shared vs Module

**`src/infrastructure/`** — cross-cutting concerns wired at the composition root (`AppModule`):
- Global NestJS providers: `APP_GUARD`, `APP_INTERCEPTOR`, `APP_FILTER`.
- `request/`: `RequestContext`, `RequestInterceptor`, `GlobalExceptionFilter`, request metadata types.
- `security/`: `JwtAuthGuard`, `@Public()`, `AccessTokenVerifier` contract, security error codes.
- `SecurityModule` imports `RequestModule` (guards write to `RequestContext`).

**`src/shared/`** — reusable primitives and utilities:
- Domain types (`Address`, `Hex`), validators, error utilities.
- Pure utilities (validation, formatting).

**`src/modules/`** — feature-specific code:
- Domain models, business rules, module-specific infrastructure.
- Concrete implementations of infrastructure contracts (e.g. `JwtAccessTokenVerifier` binds to `ACCESS_TOKEN_VERIFIER` token).

### Infrastructure Dependency Flow

```
feature modules → infrastructure/security → infrastructure/request
feature modules → infrastructure/request  (optional direct import)
```

Feature modules import `SecurityModule` to get `RequestContext` transitively. Concrete verifier implementations live in the owning module.

### Module Complexity Decision

- **Simple** (2–3 files): controller + module (e.g. `ops/`).
- **Standard** (4–10 files): add `application/`, `infrastructure/`, `domain/`.
- **Complex** (10+ files): full DDD layers with use cases, value objects, events.

### Module Structure (Complex)

```
modules/[feature]/
├── domain/
│   ├── entities/
│   ├── errors/            # Error codes enum + exception factories
│   └── types/             # Domain interfaces
├── application/
│   ├── use-cases/
│   ├── [feature].service.ts
│   ├── dtos/
│   │   ├── requests/
│   │   └── responses/
│   ├── *-cleanup.cron.ts  # Scheduled tasks (if any)
├── infrastructure/
│   ├── persistence/       # TypeORM repositories
│   └── jwt/               # JWT driver (auth-specific)
├── api/
│   ├── [feature].controller.ts
│   └── [feature]-throttle.decorator.ts
├── __tests__/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── [feature].module.ts
```

---

## File & Directory Naming

Directories: **kebab-case**.

| Type             | Pattern                          | Example                         |
| ---------------- | -------------------------------- | ------------------------------- |
| Controller       | `[feature].controller.ts`        | `auth.controller.ts`            |
| Service          | `[feature].service.ts`           | `auth.service.ts`               |
| Repository       | `[feature].repository.ts`        | `session.repository.ts`         |
| Entity           | `[feature].entity.ts`            | `session.entity.ts`             |
| Use Case         | `[action]-[feature].use-case.ts` | `create-session.use-case.ts`    |
| Module           | `[feature].module.ts`            | `auth.module.ts`                |
| DTO (request)    | `[action].request.ts`            | `login.request.ts`              |
| DTO (response)   | `[feature]-response.dto.ts`      | `login-response.dto.ts`         |
| Interface        | `[name].interface.ts`            | `access-payload.interface.ts`   |
| Type             | `[name].type.ts`                 | `hex.type.ts`                   |
| Enum             | `[name].enum.ts`                 | `auth-error-code.enum.ts`       |
| Guard            | `[name].guard.ts`                | `jwt-auth.guard.ts`             |
| Interceptor      | `[name].interceptor.ts`          | `request.interceptor.ts`        |
| Middleware       | `[name].middleware.ts`           | `request-context.middleware.ts` |
| Filter           | `[name].filter.ts`               | `global-exception.filter.ts`    |
| Decorator        | `[name].decorator.ts`            | `public.decorator.ts`           |
| Config           | `[name].config.ts`               | `auth.config.ts`                |
| Util             | `[name].util.ts`                 | `hash.util.ts`                  |
| Unit test        | `[name].spec.ts`                 | `auth.service.spec.ts`          |
| E2E test         | `[feature].e2e-spec.ts`          | `auth.e2e-spec.ts`              |

Tests live in `__tests__/{unit,integration,e2e}/` inside their module.

Barrel exports via `index.ts`:

```typescript
export { SessionEntity } from './session.entity';
export { AuthNonceEntity } from './auth-nonce.entity';
```

---

## TypeScript Conventions

### Strict Mode

All strict flags are on in `tsconfig.json`: `strict`, `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitReturns`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedIndexedAccess`.

### Types

- Explicit return types on **all** functions.
- No `any` — use `unknown` when the type is truly unknown.
- `readonly` for immutable properties.
- `@/` path alias maps to `src/`.
- Use `type` for unions, intersections, mapped types, tuples. Use `interface` for object shapes and class contracts.

### EVM Primitives

Reuse shared `Address` and `Hex` types from `@/shared/domain/types`. Do not repeat inline `` `0x${string}` `` annotations.

### Enums

- Enum type names: PascalCase (`NodeEnv`, `AuthErrorCode`).
- Enum member names: PascalCase (`Dev`, `InvalidSiweFormat`).
- Enum values: always explicit (no auto-increment).
- Do not re-declare standard framework enums (e.g. NestJS `HttpStatus`).

### Nullability

- Be explicit: `Position | null`.
- Use optional chaining and nullish coalescing.
- Handle null explicitly rather than using non-null assertions.

---

## Import Organization

```typescript
// 1. Node.js built-ins
import { randomUUID } from 'crypto';

// 2. External dependencies (alphabetically)
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// 3. Shared / infrastructure (via @/ alias, alphabetically)
import type { Address } from '@/shared/domain/types';
import { RequestContext } from '@/infrastructure/request';

// 4. Module-relative imports (by proximity)
import { SessionEntity } from '../domain/entities';
import { SessionRepository } from '../infrastructure/persistence';
```

Use `@/` for cross-module imports. Use relative imports within the same module. Never use `@/modules/` for intra-module imports.

---

## NestJS Patterns

### Dependency Injection

- **Always** use constructor injection.
- Never use `@Inject()` on properties.
- Use `@Inject('TOKEN')` for custom DI tokens.

### Module Organization

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([...]), SecurityModule],
  providers: [
    // Repositories
    // Use cases
    // Services
    // Concrete implementations bound to DI tokens
    { provide: ACCESS_TOKEN_VERIFIER, useExisting: JwtAccessTokenVerifier },
  ],
  controllers: [AuthController],
  exports: [AuthService, ACCESS_TOKEN_VERIFIER],
})
export class AuthModule {}
```

### Composition Root (`AppModule`)

Cross-cutting providers are wired here:

```typescript
providers: [
  { provide: APP_FILTER,      useClass: GlobalExceptionFilter },
  { provide: APP_GUARD,       useClass: ThrottlerGuard },
  { provide: APP_GUARD,       useClass: JwtAuthGuard },
  { provide: APP_INTERCEPTOR, useClass: RequestInterceptor },
]
```

### Controllers

- Every handler **must** have `@HttpCode(HttpStatus.X)`.
- Swagger decorators (`@ApiOperation`, `@ApiOkResponse`, etc.) on all endpoints.
- `@Public()` to bypass JWT guard.
- `@AuthThrottle()` for per-module rate limits on sensitive endpoints.

### DTOs

- Request DTOs: class-validator decorators + `@ApiProperty`.
- Response DTOs: `@ApiProperty`, with constructor mapping from domain entities.
- `ValidationPipe` with `whitelist: true` and `transform: true` is global.

---

## Error Handling

### Structured Payloads

Every error response follows the shape:

```json
{
  "code": 10101,
  "statusCode": 401,
  "message": "SIWE domain mismatch",
  "error": "Unauthorized",
  "details": {},
  "timestamp": "2026-01-31T12:00:00.000Z",
  "path": "/v1/auth/siwe/verify"
}
```

- `code` — numeric internal error code (stable API contract key). **Not** an HTTP status.
- Base is `10000`. Each domain gets a block of 100: `10000 + domainOffset`.

### Exception Factories

Use `createHttpException()` from `@/shared/errors` and per-domain helpers (e.g. `siweDomainMismatchException()`). Do not throw raw NestJS exceptions with unstructured messages.

### GlobalExceptionFilter

Catches all exceptions, normalizes into the structured shape, and injects `path`. Registered as `APP_FILTER`.

---

## Dependencies & Node.js Native APIs

Runtime floor: Node.js >= 24. Do **not** add a dependency if a native equivalent exists.

| Third-party package            | Native replacement                                   |
| ------------------------------ | ---------------------------------------------------- |
| `axios`, `node-fetch`, `got`   | Global `fetch()`                                     |
| `uuid`                         | `crypto.randomUUID()`                                |
| `dotenv`                       | `--env-file-if-exists` CLI flag                      |
| `bcrypt` (simple hashing)      | `crypto.createHash()`, `crypto.subtle`               |
| `ms`                           | Explicit numeric constants (`TTL_MS = 900_000`)      |
| `lodash` / `underscore`        | Native JS methods, `structuredClone()`, `Object.groupBy()` |

If a native replacement exists, adding a third-party dependency requires explicit justification. Allowed exceptions: functionality that does not exist in Node.js (e.g. `siwe`, `typeorm`, `class-validator`).

---

## Configuration

Environment variables are loaded via Node.js native `--env-file-if-exists=.env` (no dotenv). See `.env.example` for the full list.

| Variable               | Purpose                                              | Required |
| ---------------------- | ---------------------------------------------------- | -------- |
| `NODE_ENV`             | `development` / `stage` / `production`               | Yes      |
| `DB_HOST` … `DB_NAME`  | PostgreSQL connection                                | Yes      |
| `ACCESS_SECRET`        | JWT access token signing secret                      | Yes      |
| `REFRESH_SECRET`       | JWT refresh token signing secret                     | Yes      |
| `APP_DOMAIN`           | Application domain (SIWE validation + CORS)          | Yes      |
| `APP_ORIGIN`           | Application origin URL (SIWE validation + prod CORS) | Yes      |
| `ALLOWED_CHAIN_IDS`    | Comma-separated EVM chain IDs (e.g. `1`)              | Yes      |
| `SIWE_NONCE_TTL_MS`    | Nonce lifetime in ms                                 | No       |
| `SIWE_ISSUED_AT_TTL_MS`| issuedAt time window                                 | No       |
| `SIWE_CLOCK_SKEW_MS`   | Clock skew tolerance                                 | No       |
| `PORT`                 | Server port (default `3000`)                         | No       |
| `LOG_LEVEL`            | Pino log level                                       | No       |

Config is read eagerly at startup via `requireEnv()` / `envOrDefault()` and exposed as frozen `staticConfig`.

---

## Request Lifecycle

```
HTTP request
  → RequestContextMiddleware (wraps request in RequestContext.run(), establishes ALS store)
  → pino middleware (assigns req.id = randomUUID())
  → ThrottlerGuard (global 60 req/min; auth endpoints 5 req/min via @AuthThrottle)
  → JwtAuthGuard (skipped for @Public() routes; populates userId, ethAddress, sessionId)
  → RequestInterceptor (populates RequestContext: requestId, clientData)
  → Controller handler
  → GlobalExceptionFilter (normalizes errors, injects path)
```

### RequestContext

Singleton backed by `AsyncLocalStorage` (`node:async_hooks`). **Not** `Scope.REQUEST` — no scope bubble; all providers remain singletons.

- `RequestContextMiddleware` wraps every request in `RequestContext.run()`, establishing the per-request ALS store.
- `RequestInterceptor` and `JwtAuthGuard` are singletons that write into the ALS store via `Accessor`-gated setters.
- Setters are guarded by the `Accessor` enum — only the designated class can write each field:
  - `RequestInterceptor` → `requestId`, `clientData`.
  - `JwtAuthGuard` → `userId`, `ethAddress`, `sessionId`.
- Each accessor stores its `Accessor` enum value in a private readonly field and validates it against the class name at construction time.

### Request ID Correlation

- UUID v4 is assigned at pino middleware layer, stored on `req.id`.
- `RequestInterceptor` reads `req.id` → `RequestContext.requestId`.
- Application code must read from `RequestContext.requestId`, never generate a second ID.

---

## Logging

### Levels

- `error` — failures requiring attention.
- `warn` — degraded state, fallbacks.
- `log` (info) — key operations (request handled, session created).
- `debug` — detailed flow (cache hits, query results).

### Redaction

Sensitive fields are redacted in pino config (censor: `***`):

| Category              | Paths                                                                          |
| --------------------- | ------------------------------------------------------------------------------ |
| Auth headers          | `req.headers.authorization`, `req.headers.cookie`, `res.headers["set-cookie"]` |
| Request body secrets  | `req.body.signature`                                                           |
| Response body secrets | `res.body.accessToken`, `res.body.refreshToken`                                |

When adding a new DTO field that contains a secret, add the corresponding path to redact config in the same change.

### Rules

- Never use `console.log` — always use the NestJS/pino `Logger`.
- Do not log full tokens, secrets, or private keys.

---

## Database Conventions

### Primary Keys

- Always meaningless UUID (`@PrimaryGeneratedColumn('uuid')`).
- No auto-increment, addresses, or business values as PKs.
- Meaningful identifiers are unique indexed columns, not primary keys.

### Naming

- Table names: plural, lowercase, snake_case (`users`, `sessions`, `auth_nonces`).
- Column names: snake_case via TypeORM `@Column({ name: 'column_name' })`.
- TypeScript properties: camelCase.

### Migrations

- Naming: `[timestamp]-[description].ts`.
- Always reversible (implement both `up` and `down`).
- Generate with `pnpm migration:generate`, run with `pnpm migration:run`.

### Transactions

- Simple repositories use `@InjectRepository(Entity)`.
- Multi-table atomic operations use `EntityManager.transaction()`.

---

## API Conventions

### Versioning

All controllers must include an API version prefix: `@Controller('v1/auth')`.

### Endpoints

- Resource nouns (not verbs), plural names.
- Nested paths for relationships.
- Query params for filtering.
- kebab-case for multi-word segments.
- Operational endpoints under `/ops/` prefix.

### HTTP Status Codes

```
200 OK             — Successful GET
201 Created        — Successful POST
204 No Content     — Successful DELETE
400 Bad Request    — Invalid input
401 Unauthorized   — Missing/invalid auth
403 Forbidden      — Valid auth, insufficient permissions
404 Not Found      — Resource doesn't exist
409 Conflict       — Duplicate resource
429 Too Many Req.  — Rate limited
500 Internal Error — Server error
```

### CORS

- Production: restricted to `APP_ORIGIN`.
- Development: all origins allowed.

---

## Testing

```bash
pnpm test              # All tests
pnpm test:cov          # With coverage
pnpm test:e2e          # E2E only
```

### Test Types

- **Unit tests**: mock all dependencies, test one class. Pattern: `describe` → `beforeEach` (TestingModule with mocks) → `it` blocks.
- **Integration tests**: real PostgreSQL, test repositories and queries. Includes concurrency tests for atomic operations.
- **E2E tests**: full app via `supertest`, real HTTP requests.

### Coverage Thresholds

| Metric     | Threshold |
| ---------- | --------- |
| Branches   | 70%       |
| Functions  | 75%       |
| Lines      | 80%       |
| Statements | 80%       |

### Test Naming

- Descriptive: `it('should reject SIWE with wrong domain')`.
- Never vague: no `it('works')` or `it('test1')`.

---

## Scripts

| Script                     | Description                    |
| -------------------------- | ------------------------------ |
| `pnpm start:dev`           | Dev server with watch          |
| `pnpm build`               | Production build               |
| `pnpm start:prod`          | Run production build           |
| `pnpm test`                | Run all tests                  |
| `pnpm test:cov`            | Run tests with coverage        |
| `pnpm test:e2e`            | E2E tests only                 |
| `pnpm lint`                | ESLint (auto-fix)              |
| `pnpm typecheck`           | TypeScript type checking       |
| `pnpm migration:run`       | Run TypeORM migrations         |
| `pnpm migration:generate`  | Generate migration from entities |
| `pnpm migration:revert`    | Revert last migration          |

---

## Git Conventions

### Commits

Format: `<type>(<scope>): <subject>`.

Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`, `style`, `ci`.

Scopes: module names (`auth`, `ops`), infrastructure (`database`, `security`), config (`docker`, `ci`, `deps`).

### Branches

```
feat/siwe-chain-validation
fix/nonce-expiry-race
refactor/extract-token-factory
```

### Rules

- Do **not** commit `.env` secrets.
- Agents must **not** create commits automatically — prepare a diff and summary for human review.

---

## Comments & Documentation

- JSDoc on public APIs: describe purpose, `@param`, `@returns`.
- Inline comments explain **why**, not **what**.
- No obvious comments (`// increment counter`, `// return result`).
- TODOs: `// TODO(author): description` or `// TODO: description`.

---

## Agent Quality Checklist

Before handing off for review:

- [ ] No commit created without explicit human approval
- [ ] Follow existing project conventions (structure, naming, formatting)
- [ ] No new dependencies without justification; verify no Node.js native equivalent
- [ ] After changes, run relevant tests and report results
- [ ] No `any` types
- [ ] Addresses stored in lowercase
- [ ] Tests written and passing
- [ ] No `console.log` statements
- [ ] Swagger documentation updated
- [ ] Conventional commit message prepared
