import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { databaseConfig } from '@/config';
import { UserEntity, SessionEntity, AuthNonceEntity } from '../../domain/entities';
import {
  UserRepository,
  SessionRepository,
  AuthNonceRepository,
} from '../../infrastructure/persistence';

describe('Repositories (integration)', () => {
  let module: TestingModule;
  let userRepo: UserRepository;
  let sessionRepo: SessionRepository;
  let nonceRepo: AuthNonceRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: databaseConfig.host,
          port: databaseConfig.port,
          username: databaseConfig.username,
          password: databaseConfig.password,
          database: databaseConfig.database,
          entities: [UserEntity, SessionEntity, AuthNonceEntity],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([UserEntity, SessionEntity, AuthNonceEntity]),
      ],
      providers: [UserRepository, SessionRepository, AuthNonceRepository],
    }).compile();

    userRepo = module.get(UserRepository);
    sessionRepo = module.get(SessionRepository);
    nonceRepo = module.get(AuthNonceRepository);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('UserRepository', () => {
    it('creates a user and finds by ethAddress', async () => {
      const user = await userRepo.create('0xABCDEF1234567890abcdef1234567890ABCDEF12');
      expect(user.id).toBeDefined();
      expect(user.ethAddress).toBe('0xabcdef1234567890abcdef1234567890abcdef12');

      const found = await userRepo.findByEthAddress('0xABCDEF1234567890abcdef1234567890ABCDEF12');
      expect(found).not.toBeNull();
      expect(found!.id).toBe(user.id);
    });

    it('returns null for unknown address', async () => {
      const found = await userRepo.findByEthAddress('0x0000000000000000000000000000000000000000');
      expect(found).toBeNull();
    });
  });

  describe('SessionRepository', () => {
    let userId: string;
    let sessId1: string;
    let sessId2: string;
    let sessAliveId: string;

    beforeAll(async () => {
      const user = await userRepo.create('0x1111111111111111111111111111111111111111');
      userId = user.id;
      sessId1 = randomUUID();
      sessId2 = randomUUID();
      sessAliveId = randomUUID();
    });

    it('upsert creates a new session', async () => {
      await sessionRepo.upsert(
        sessId1,
        { userId, ipAddress: '1.2.3.4', userAgent: 'test-agent' },
        'hash-1',
        new Date(Date.now() + 86_400_000),
      );

      const found = await sessionRepo.findById(sessId1);
      expect(found).not.toBeNull();
      expect(found!.userId).toBe(userId);
      expect(found!.refreshTokenHash).toBe('hash-1');
    });

    it('upsert replaces existing session for same target', async () => {
      await sessionRepo.upsert(
        sessId2,
        { userId, ipAddress: '1.2.3.4', userAgent: 'test-agent' },
        'hash-2',
        new Date(Date.now() + 86_400_000),
      );

      const old = await sessionRepo.findById(sessId1);
      expect(old).toBeNull();

      const found = await sessionRepo.findById(sessId2);
      expect(found).not.toBeNull();
      expect(found!.refreshTokenHash).toBe('hash-2');
    });

    it('deleteById removes session', async () => {
      await sessionRepo.deleteById(sessId2);
      const found = await sessionRepo.findById(sessId2);
      expect(found).toBeNull();
    });

    it('deleteExpired removes only expired sessions', async () => {
      await sessionRepo.upsert(
        randomUUID(),
        { userId, ipAddress: '5.5.5.5', userAgent: 'a' },
        'h',
        new Date(Date.now() - 1000),
      );
      await sessionRepo.upsert(
        sessAliveId,
        { userId, ipAddress: '6.6.6.6', userAgent: 'b' },
        'h',
        new Date(Date.now() + 86_400_000),
      );

      const deleted = await sessionRepo.deleteExpired(new Date());
      expect(deleted).toBe(1);

      const alive = await sessionRepo.findById(sessAliveId);
      expect(alive).not.toBeNull();
    });
  });

  describe('AuthNonceRepository', () => {
    it('creates a nonce with expiration', async () => {
      const expiresAt = new Date(Date.now() + 300_000);
      const nonce = await nonceRepo.create(expiresAt);
      expect(nonce.id).toBeDefined();
      expect(nonce.nonce).toBeDefined();
      expect(nonce.nonce.length).toBeGreaterThan(0);
    });

    it('findByNonce returns existing nonce', async () => {
      const created = await nonceRepo.create(new Date(Date.now() + 300_000));
      const found = await nonceRepo.findByNonce(created.nonce);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
    });

    it('findByNonce returns null for unknown', async () => {
      const found = await nonceRepo.findByNonce('nonexistent-nonce-value');
      expect(found).toBeNull();
    });

    it('consume marks nonce as used and returns true', async () => {
      const created = await nonceRepo.create(new Date(Date.now() + 300_000));
      const result = await nonceRepo.consume(created.nonce, '0xABCD');
      expect(result).toBe(true);

      const found = await nonceRepo.findByNonce(created.nonce);
      expect(found!.usedAt).not.toBeNull();
      expect(found!.usedByAddress).toBe('0xabcd');
    });

    it('consume returns false for already-used nonce', async () => {
      const created = await nonceRepo.create(new Date(Date.now() + 300_000));
      await nonceRepo.consume(created.nonce, '0x1111');
      const second = await nonceRepo.consume(created.nonce, '0x2222');
      expect(second).toBe(false);
    });

    it('consume returns false for expired nonce', async () => {
      const created = await nonceRepo.create(new Date(Date.now() - 1000));
      const result = await nonceRepo.consume(created.nonce, '0xABCD');
      expect(result).toBe(false);
    });

    it('deleteExpired removes only expired nonces', async () => {
      await nonceRepo.create(new Date(Date.now() - 1000));
      const alive = await nonceRepo.create(new Date(Date.now() + 300_000));

      const deleted = await nonceRepo.deleteExpired(new Date());
      expect(deleted).toBeGreaterThanOrEqual(1);

      const found = await nonceRepo.findByNonce(alive.nonce);
      expect(found).not.toBeNull();
    });

    it('concurrent consume() — only one succeeds (T-3)', async () => {
      const created = await nonceRepo.create(new Date(Date.now() + 300_000));

      const results = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          nonceRepo.consume(created.nonce, `0x${i.toString().padStart(4, '0')}`),
        ),
      );

      const successes = results.filter(Boolean);
      expect(successes).toHaveLength(1);
    });
  });
});
