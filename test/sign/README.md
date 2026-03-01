# SIWE Sign Helper

Utility scripts for generating a valid EIP-4361 SIWE `message` and `signature` for local testing.

## Files

- `.env.example` - template env file for signing inputs.
- `sign-siwe.mjs` - ESM script for local signing.

## Usage

1. Copy env template:

```bash
cp test/sign/.env.example test/sign/.env
```

2. Fill `PRIVATE_KEY` and `NONCE` in `test/sign/.env`.

3. Run:

```bash
node --env-file=test/sign/.env test/sign/sign-siwe.mjs
```

The script prints JSON with:

- `message` - SIWE message string
- `signature` - wallet signature

Paste both into `Auth / 2 - SIWE verify` request body in Postman.
