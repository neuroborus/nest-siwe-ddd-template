import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { SiweMessage } from 'siwe';
import { ValidateSiweUseCase } from '../../application/use-cases/validate-siwe.use-case';
import { AuthNonceRepository } from '../../infrastructure/persistence';

const MOCK_DOMAIN = 'localhost:3000';
const MOCK_URI = 'http://localhost:3000';
const MOCK_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const MOCK_CHAIN_ID = 1;

function createMockConfig(): Partial<ConfigService> {
  const configMap: Record<string, unknown> = {
    'auth.appDomain': MOCK_DOMAIN,
    'auth.appOrigin': MOCK_URI,
    'auth.allowedChains': [MOCK_CHAIN_ID],
    'auth.siweIssuedAtTtlMs': 300000,
    'auth.siweClockSkewMs': 30000,
  };
  return {
    getOrThrow: jest.fn((key: string) => {
      const val = configMap[key];
      if (val === undefined) throw new Error(`Config key not found: ${key}`);
      return val;
    }),
    get: jest.fn((key: string) => configMap[key]),
  };
}

function createMockNonceRepo(): Partial<AuthNonceRepository> {
  return {
    findByNonce: jest.fn(),
    consume: jest.fn(),
  };
}

describe('ValidateSiweUseCase', () => {
  let useCase: ValidateSiweUseCase;
  let nonceRepo: Partial<AuthNonceRepository>;

  beforeEach(async () => {
    nonceRepo = createMockNonceRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateSiweUseCase,
        { provide: ConfigService, useValue: createMockConfig() },
        { provide: AuthNonceRepository, useValue: nonceRepo },
      ],
    }).compile();

    useCase = module.get<ValidateSiweUseCase>(ValidateSiweUseCase);
  });

  it('should reject invalid SIWE message format', async () => {
    await expect(useCase.execute('not a valid siwe message', '0xabc')).rejects.toThrow(
      HttpException,
    );
    await expect(useCase.execute('not a valid siwe message', '0xabc')).rejects.toThrow(
      'Invalid SIWE message format',
    );
  });

  it('should reject SIWE with wrong version (caught at parse)', async () => {
    const siwe = new SiweMessage({
      domain: MOCK_DOMAIN,
      address: MOCK_ADDRESS,
      uri: MOCK_URI,
      version: '1',
      chainId: MOCK_CHAIN_ID,
      nonce: 'testnonce12345678',
      issuedAt: new Date().toISOString(),
    });

    const rawMsg = siwe.toMessage();
    const modifiedMsg = rawMsg.replace('Version: 1', 'Version: 2');

    await expect(useCase.execute(modifiedMsg, '0xabc')).rejects.toThrow(HttpException);
  });

  it('should reject SIWE with wrong domain', async () => {
    const siwe = new SiweMessage({
      domain: 'evil.com',
      address: MOCK_ADDRESS,
      uri: 'http://evil.com',
      version: '1',
      chainId: MOCK_CHAIN_ID,
      nonce: 'testnonce12345678',
      issuedAt: new Date().toISOString(),
    });

    await expect(useCase.execute(siwe.toMessage(), '0xabc')).rejects.toThrow(
      'SIWE domain mismatch',
    );
  });

  it('should reject SIWE with disallowed chain id', async () => {
    const siwe = new SiweMessage({
      domain: MOCK_DOMAIN,
      address: MOCK_ADDRESS,
      uri: MOCK_URI,
      version: '1',
      chainId: 999,
      nonce: 'testnonce12345678',
      issuedAt: new Date().toISOString(),
    });

    await expect(useCase.execute(siwe.toMessage(), '0xabc')).rejects.toThrow(
      'SIWE chainId is not allowed',
    );
  });

  it('should reject SIWE with old issuedAt', async () => {
    const oldDate = new Date(Date.now() - 600000).toISOString();
    const siwe = new SiweMessage({
      domain: MOCK_DOMAIN,
      address: MOCK_ADDRESS,
      uri: MOCK_URI,
      version: '1',
      chainId: MOCK_CHAIN_ID,
      nonce: 'testnonce12345678',
      issuedAt: oldDate,
    });

    await expect(useCase.execute(siwe.toMessage(), '0xabc')).rejects.toThrow(
      'SIWE issuedAt is too old',
    );
  });

  it('should reject SIWE with future issuedAt', async () => {
    const futureDate = new Date(Date.now() + 600000).toISOString();
    const siwe = new SiweMessage({
      domain: MOCK_DOMAIN,
      address: MOCK_ADDRESS,
      uri: MOCK_URI,
      version: '1',
      chainId: MOCK_CHAIN_ID,
      nonce: 'testnonce12345678',
      issuedAt: futureDate,
    });

    await expect(useCase.execute(siwe.toMessage(), '0xabc')).rejects.toThrow(
      'SIWE issuedAt is in the future',
    );
  });

  it('should reject when nonce is not found', async () => {
    (nonceRepo.findByNonce as jest.Mock).mockResolvedValue(null);

    const siwe = new SiweMessage({
      domain: MOCK_DOMAIN,
      address: MOCK_ADDRESS,
      uri: MOCK_URI,
      version: '1',
      chainId: MOCK_CHAIN_ID,
      nonce: 'testnonce12345678',
      issuedAt: new Date().toISOString(),
    });

    await expect(useCase.execute(siwe.toMessage(), '0xabc')).rejects.toThrow(
      'Invalid or expired nonce',
    );
  });

  it('should reject when nonce is already used', async () => {
    (nonceRepo.findByNonce as jest.Mock).mockResolvedValue({
      nonce: 'testnonce12345678',
      expiresAt: new Date(Date.now() + 300000),
      usedAt: new Date(),
    });

    const siwe = new SiweMessage({
      domain: MOCK_DOMAIN,
      address: MOCK_ADDRESS,
      uri: MOCK_URI,
      version: '1',
      chainId: MOCK_CHAIN_ID,
      nonce: 'testnonce12345678',
      issuedAt: new Date().toISOString(),
    });

    await expect(useCase.execute(siwe.toMessage(), '0xabc')).rejects.toThrow(
      'Invalid or expired nonce',
    );
  });

  it('should reject when nonce is expired', async () => {
    (nonceRepo.findByNonce as jest.Mock).mockResolvedValue({
      nonce: 'testnonce12345678',
      expiresAt: new Date(Date.now() - 1000),
      usedAt: null,
    });

    const siwe = new SiweMessage({
      domain: MOCK_DOMAIN,
      address: MOCK_ADDRESS,
      uri: MOCK_URI,
      version: '1',
      chainId: MOCK_CHAIN_ID,
      nonce: 'testnonce12345678',
      issuedAt: new Date().toISOString(),
    });

    await expect(useCase.execute(siwe.toMessage(), '0xabc')).rejects.toThrow(
      'Invalid or expired nonce',
    );
  });
});
