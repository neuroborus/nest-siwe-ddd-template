# Postman Collection

This folder contains a template-safe Postman collection for SIWE auth and ops endpoints.

- Import `postman-collection.json` in Postman.
- Default `base_url` variable: `http://localhost:3000`.

## Included requests

- `Auth / 1 - SIWE nonce`
- `Auth / 2 - SIWE verify`
- `Auth / refresh tokens`
- `Auth / logout`
- `Auth / test access`
- `Ops / Health`

## Notes

- The collection uses Bearer token `{{access_token}}` for protected auth routes.
- After successful `2 - SIWE verify`, the collection test script stores returned tokens in collection variables.
- `refresh tokens` relies on the HTTP-only refresh cookie set by `2 - SIWE verify`.

## SIWE signing helper

For easier local testing, use scripts in `test/sign`:

1. `cp test/sign/.env.example test/sign/.env`
2. Put nonce from `Auth / 1 - SIWE nonce` into `NONCE`
3. Run `node --env-file=test/sign/.env test/sign/sign-siwe.mjs`
4. Paste generated `message` and `signature` into `Auth / 2 - SIWE verify`

See `test/sign/README.md` for details.
