import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SiweMessage } from 'siwe';
import { type Address, Chain, type Hex } from '@/shared/domain/types';
import type { ValidatedSiweData } from '../../domain/types';
import {
  invalidSiweFormatException,
  invalidSiweVersionException,
  siweDomainMismatchException,
  siweUriMismatchException,
  siweChainIdNotAllowedException,
  siweIssuedAtRequiredException,
  siweIssuedAtInvalidException,
  siweIssuedAtTooOldException,
  siweIssuedAtFutureException,
  invalidOrExpiredNonceException,
  wrongSignatureException,
  nonceAlreadyUsedException,
} from '../../domain/errors';
import { AuthNonceRepository } from '../../infrastructure/persistence';

@Injectable()
export class ValidateSiweUseCase {
  constructor(
    private readonly config: ConfigService,
    private readonly nonceRepository: AuthNonceRepository,
  ) {}

  private validateUri(messageUri: string): boolean {
    const expected = this.config.getOrThrow<string>('auth.appOrigin');
    if (messageUri === expected) return true;

    try {
      const parsed = new URL(messageUri);
      const expectedParsed = new URL(expected);
      return parsed.origin === expectedParsed.origin;
    } catch {
      return false;
    }
  }

  async execute(message: string, signature: Hex): Promise<ValidatedSiweData> {
    let siwe: SiweMessage;
    try {
      siwe = new SiweMessage(message);
    } catch {
      throw invalidSiweFormatException();
    }

    if (siwe.version !== '1') {
      throw invalidSiweVersionException();
    }

    const expectedDomain = this.config.getOrThrow<string>('auth.appDomain');
    if (siwe.domain !== expectedDomain) {
      throw siweDomainMismatchException();
    }

    if (!this.validateUri(siwe.uri)) {
      throw siweUriMismatchException();
    }

    const allowedChains = this.config.getOrThrow<Chain[]>('auth.allowedChains');
    if (!allowedChains.includes(siwe.chainId as Chain)) {
      throw siweChainIdNotAllowedException();
    }

    if (!siwe.issuedAt) {
      throw siweIssuedAtRequiredException();
    }

    const issuedAtMs = Date.parse(siwe.issuedAt);
    if (Number.isNaN(issuedAtMs)) {
      throw siweIssuedAtInvalidException();
    }

    const nowMs = Date.now();
    const issuedAtTtlMs = this.config.getOrThrow<number>('auth.siweIssuedAtTtlMs');
    const clockSkewMs = this.config.getOrThrow<number>('auth.siweClockSkewMs');

    if (issuedAtMs < nowMs - issuedAtTtlMs - clockSkewMs) {
      throw siweIssuedAtTooOldException();
    }
    if (issuedAtMs > nowMs + clockSkewMs) {
      throw siweIssuedAtFutureException();
    }

    const nonce = await this.nonceRepository.findByNonce(siwe.nonce);
    if (!nonce || nonce.expiresAt <= new Date() || nonce.usedAt) {
      throw invalidOrExpiredNonceException();
    }

    const verification = await siwe.verify(
      {
        signature,
        domain: expectedDomain,
        nonce: siwe.nonce,
        time: new Date().toISOString(),
      },
      {
        suppressExceptions: true,
      },
    );
    if (!verification.success) {
      throw wrongSignatureException();
    }

    const address = siwe.address.toLowerCase() as Address;

    const consumed = await this.nonceRepository.consume(siwe.nonce, address);
    if (!consumed) {
      throw nonceAlreadyUsedException();
    }

    return { address, nonce: siwe.nonce, chain: siwe.chainId as Chain };
  }
}
