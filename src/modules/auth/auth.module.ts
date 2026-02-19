import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecurityModule, ACCESS_TOKEN_VERIFIER } from '@/infrastructure/security';
import { UserEntity, SessionEntity, AuthNonceEntity } from './domain/entities';
import {
  AuthNonceRepository,
  UserRepository,
  SessionRepository,
} from './infrastructure/persistence';
import { JwtDriverModule, JwtAccessTokenVerifier, TokenFactory } from './infrastructure/jwt';
import {
  CreateNonceUseCase,
  ValidateSiweUseCase,
  CreateSessionUseCase,
  RefreshSessionUseCase,
  DeleteSessionUseCase,
} from './application/use-cases';
import { AuthService } from './application/auth.service';
import { NonceCleanupCron } from './application/nonce-cleanup.cron';
import { SessionCleanupCron } from './application/session-cleanup.cron';
import { AuthController } from './api/auth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, SessionEntity, AuthNonceEntity]),
    JwtDriverModule,
    SecurityModule,
  ],
  providers: [
    AuthNonceRepository,
    UserRepository,
    SessionRepository,
    CreateNonceUseCase,
    ValidateSiweUseCase,
    CreateSessionUseCase,
    RefreshSessionUseCase,
    DeleteSessionUseCase,
    AuthService,
    NonceCleanupCron,
    SessionCleanupCron,
    TokenFactory,
    JwtAccessTokenVerifier,
    {
      provide: ACCESS_TOKEN_VERIFIER,
      useExisting: JwtAccessTokenVerifier,
    },
  ],
  controllers: [AuthController],
  exports: [AuthService, ACCESS_TOKEN_VERIFIER],
})
export class AuthModule {}
