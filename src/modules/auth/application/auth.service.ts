import { Injectable, Logger } from '@nestjs/common';
import type { Hex } from '@/shared/domain/types';
import { RequestContext } from '@/infrastructure/request';
import type { NonceData, LoginData } from '../domain/types';
import { CreateNonceUseCase } from './use-cases/create-nonce.use-case';
import { ValidateSiweUseCase } from './use-cases/validate-siwe.use-case';
import { CreateSessionUseCase } from './use-cases/create-session.use-case';
import { RefreshSessionUseCase } from './use-cases/refresh-session.use-case';
import { DeleteSessionUseCase } from './use-cases/delete-session.use-case';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly request: RequestContext,
    private readonly createNonceUseCase: CreateNonceUseCase,
    private readonly validateSiweUseCase: ValidateSiweUseCase,
    private readonly createSessionUseCase: CreateSessionUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly deleteSessionUseCase: DeleteSessionUseCase,
  ) {}

  async createNonce(): Promise<NonceData> {
    const nonce = await this.createNonceUseCase.execute();
    this.logger.debug({ nonce: nonce.nonce }, 'Nonce created');
    return nonce;
  }

  async createSession(message: string, signature: Hex): Promise<LoginData> {
    const validated = await this.validateSiweUseCase.execute(message, signature);

    const clientData = this.request.clientData;
    const loginData = await this.createSessionUseCase.execute(
      validated.address,
      clientData.ipAddress,
      clientData.userAgent,
    );

    this.logger.debug(
      {
        ethAddress: validated.address,
        nonce: validated.nonce,
        chain: validated.chain,
      },
      'Session created',
    );

    return loginData;
  }

  async refreshSession(refreshToken: string): Promise<LoginData> {
    const clientData = this.request.clientData;
    const refreshData = await this.refreshSessionUseCase.execute(
      clientData.ipAddress,
      clientData.userAgent,
      refreshToken,
    );

    this.logger.debug({ ethAddress: refreshData.ethAddress }, 'Session refreshed');

    return refreshData.loginData;
  }

  async deleteSession(): Promise<void> {
    const sessionId = this.request.sessionId;
    await this.deleteSessionUseCase.execute(sessionId);
    this.logger.debug({ ethAddress: this.request.ethAddress }, 'Session deleted');
  }
}
