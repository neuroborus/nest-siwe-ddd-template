#!/usr/bin/env node
/**
 * Builds EIP-4361 SIWE message and signs it with PRIVATE_KEY from env.
 * Run: node --env-file=test/sign/.env test/sign/sign-siwe.mjs
 *
 * Requires: PRIVATE_KEY, NONCE. Optional: DOMAIN, URI, CHAIN_ID (defaults for localhost).
 * Outputs JSON with "message" and "signature" to paste into Postman "2 - SIWE verify" body.
 */

import { SiweMessage } from 'siwe';
import { Wallet } from 'ethers';

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const NONCE = process.env.NONCE;
const DOMAIN = process.env.DOMAIN || 'localhost:3000';
const URI = process.env.URI || 'http://localhost:3000';
const CHAIN_ID = parseInt(process.env.CHAIN_ID || '1', 10);

if (!PRIVATE_KEY || !PRIVATE_KEY.startsWith('0x')) {
  console.error('Missing or invalid PRIVATE_KEY in env (must start with 0x).');
  process.exit(1);
}
if (!NONCE || NONCE.trim() === '') {
  console.error('Missing NONCE in env. Get it from Postman "1 - SIWE nonce" and set in test/sign/.env');
  process.exit(1);
}

const wallet = new Wallet(PRIVATE_KEY);
const issuedAt = new Date().toISOString();

const siwe = new SiweMessage({
  domain: DOMAIN,
  address: wallet.address,
  statement: 'Sign in with Ethereum',
  uri: URI,
  version: '1',
  chainId: CHAIN_ID,
  nonce: NONCE.trim(),
  issuedAt,
});

const message = siwe.toMessage();

try {
  const signature = await wallet.signMessage(message);
  console.log(JSON.stringify({ message, signature }, null, 2));
} catch (err) {
  console.error('Sign failed:', err.message);
  process.exit(1);
}
