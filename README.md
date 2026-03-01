# SIWE Auth (EIP-4361) — DDD + TypeORM

NestJS application with JWT authentication via Sign-In with Ethereum (SIWE, EIP-4361).
Uses DDD architecture with TypeORM for persistence.

---

## SIWE overview (EIP-4361)

**Sign-In with Ethereum (SIWE)** is an authentication scheme defined by EIP-4361. The user signs a structured, human-readable message (domain, nonce, issued-at time, etc.) with their Ethereum wallet; the server verifies the message format, the signature, and that the nonce was issued by it and not yet used, then establishes a session. This project implements that flow: the server issues a short-lived nonce, the client builds and signs the SIWE message (including that nonce), and the server validates and verifies before creating a JWT-based session.

---

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/v1/auth/siwe/nonce` | Issues a server-side nonce (challenge) for SIWE. Returns nonce and expiry. |
| `POST` | `/v1/auth/siwe/verify` | Verifies the SIWE message and signature, consumes the nonce, creates a session. Returns access token and sets refresh token in httpOnly cookie. |

---

## SIWE flow (end-to-end)

1. **Server issues nonce** — Client calls `POST /v1/auth/siwe/nonce`. Server creates a nonce, stores it with a TTL (configurable), and returns it. Nonces are single-use and expire.
2. **Client builds and signs** — Client builds the EIP-4361 message (including the received nonce, domain, URI, chainId, issuedAt, etc.) and signs it with the wallet (EOA or contract account).
3. **Server parses and validates** — Client sends `message` + `signature` to `POST /v1/auth/siwe/verify`. Server parses the message (ABNF), validates all required fields (version, domain, URI, chainId, issuedAt window, nonce existence and expiry).
4. **Signature verification** — Server verifies the signature (EOA; ERC-1271 for contract accounts if the verifier has an RPC provider configured).
5. **Nonce consumed atomically** — Server marks the nonce as used in a single atomic step. If the nonce was already used or expired, verification fails.
6. **Session created** — Server creates or finds the user by Ethereum address, creates a session, and returns an access token (JWT) and sets a refresh token in an httpOnly cookie. Access is short-lived; refresh is used to obtain new access tokens without re-signing.

---

## What we validate (server-side)

- **ABNF parsing** — Message must parse as valid EIP-4361 (via the SIWE library).
- **Version** — `version === "1"`.
- **Domain** — Must match configured `APP_DOMAIN`.
- **URI** — Must match configured `APP_ORIGIN` (exact or same origin).
- **Chain ID** — Must be in the configured allowed list (`ALLOWED_CHAIN_IDS`).
- **IssuedAt** — Required, parseable, and within the allowed time window (TTL + clock skew).
- **Nonce** — Must exist, not expired, and not already used; then consumed atomically after signature verification.
- **Signature** — Verified (EOA). For contract accounts, ERC-1271 is supported when the verifier has an RPC provider wired; otherwise it may not work.

---

## Why nonces exist (replay protection)

A **replay attack** is when an attacker reuses a valid signed message to log in again (or on another server). Timestamps alone are insufficient: a message valid for a few minutes can be replayed many times within that window, and clock skew makes strict time bounds unreliable as the only guard.

**Server-issued, single-use nonces** bind each signed message to one login attempt: the client must obtain a fresh nonce from this server, embed it in the message, and the server accepts that message at most once. When the server verifies the signature, it **atomically consumes** the nonce (marks it used). Concurrent replays with the same nonce cannot both succeed; only one request wins.

---

## Caveats / Concerns

- **ERC-1271 provider wiring** — Signature verification for contract (smart contract) accounts uses ERC-1271. That path depends on the verifier having an RPC provider configured. If no provider is wired, ERC-1271 verification may not work; EOA verification does not require a provider.
- **Origin header enforcement** — The server validates the SIWE message’s domain and URI against configuration. It does not necessarily compare them to the HTTP `Origin` or `Referer` headers at runtime. Treat this as a deliberate security-model choice: binding is to the configured domain/URI, not to the request’s origin headers. Ensure deployment and client usage align with that.
- **Checksum validation** — Address format is enforced by the parser/library. Whether EIP-55 checksum is strictly validated depends on the actual library/version in use; we do not claim a specific checksum guarantee here.
- Any other limitations or assumptions of the SIWE library and our usage (e.g. supported fields, parsing strictness) apply as per the implementation and dependency version.

---

## Configuration

SIWE and auth-related environment variables (see `.env.example`):

| Variable | Purpose | Default (if any) |
|----------|---------|------------------|
| `APP_DOMAIN` | Application domain (used for SIWE validation and CORS) | — required |
| `APP_ORIGIN` | Application origin URL (used for SIWE validation and CORS in production) | — required |
| `ALLOWED_CHAIN_IDS` | Comma-separated EVM chain IDs (e.g. `1` for Ethereum) | `1` |
| `SIWE_NONCE_TTL_MS` | Nonce lifetime in ms (server-stored) | `300000` (5 min) |
| `SIWE_ISSUED_AT_TTL_MS` | How old `issuedAt` can be (time window) | `300000` (5 min) |
| `SIWE_CLOCK_SKEW_MS` | Clock skew tolerance (past/future) | `30000` (30 s) |
| `ACCESS_SECRET` / `REFRESH_SECRET` | JWT signing secrets (high level; do not commit) | — required |
| JWT TTLs | Access and refresh token lifetimes are set in app config (not env in current setup). | e.g. 15 min access, 3 days refresh |

---

## Quickstart

1. Create `.env` file from `.env.example` and fill required variables
2. `pnpm install`
3. `pnpm run migration:run`
4. `pnpm run start`

## Environment

Required variables are defined in `.env.example`. Copy it to `.env` and fill in all required values.

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — PostgreSQL connection (no URL parsing)
- `ACCESS_SECRET` / `REFRESH_SECRET` — JWT signing secrets
- `APP_DOMAIN` / `APP_ORIGIN` — Application domain and origin (SIWE validation + CORS)
- `ALLOWED_CHAIN_IDS` — Allowed EVM chain IDs

### How env vars are loaded

This project uses **Node.js native env file loading** (Node 20.6+, `--env-file-if-exists`). There is no `dotenv` dependency and no programmatic env loading in the application code.

All `package.json` scripts are prefixed with `node --env-file-if-exists=.env ...`, which makes Node load `.env` before the process starts. Key points:

- `.env` is **optional** — if absent (e.g. in production where vars are injected by the runtime/orchestrator), startup succeeds without it (`--env-file-if-exists` does not error on a missing file).
- Variables already present in the environment are **not overwritten** by the file.
- This applies to all scripts: `start`, `start:dev`, `start:prod`, and all `migration:*` commands.
- Tests (`jest`) do not use `--env-file-if-exists`; they set env vars programmatically inside the test files where needed.

## Database (TypeORM)

### Migration Commands

- Generate migration: `pnpm run migration:generate -- src/database/migrations/<name>`
- Run migrations: `pnpm run migration:run`
- Revert last migration: `pnpm run migration:revert`

## API Endpoints

SIWE flow, endpoints, and validation are described in the sections above (SIWE overview, Endpoints, Flow, What we validate, Configuration).

### Auth
- `POST /v1/auth/siwe/nonce` — Create nonce challenge
- `POST /v1/auth/siwe/verify` — Verify SIWE message, create session
- `POST /v1/auth/logout` — Logout (requires Bearer token)
- `POST /v1/auth/refresh-tokens` — Refresh tokens (via httpOnly cookie)
- `GET /v1/auth/access` — Test authenticated access

### Ops
- `GET /ops/health` — Returns `OK`

### Swagger
- `GET /swagger`

## Postman and Sign Helper

- Postman collection: `test/postman/postman-collection.json`
- Postman guide: `test/postman/README.md`
- SIWE sign helper scripts: `test/sign/`
- Sign helper guide: `test/sign/README.md`

Quick run for signing:

```bash
cp test/sign/.env.example test/sign/.env
node --env-file=test/sign/.env test/sign/sign-siwe.mjs
```

## Verification

```bash
pnpm run typecheck
pnpm run build
pnpm test -- --runInBand
```

## Architecture

DDD vertical-slice modules under `src/modules/`. Shared infrastructure in `src/shared/`.
Database config and migrations in `src/database/`.
Agent instructions and conventions in `AGENTS.md`.
