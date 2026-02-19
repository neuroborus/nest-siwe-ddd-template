import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';
import type { Address } from '@/shared/domain/types';
import type { ClientData } from './client-data.interface';

interface RequestStore {
  requestId?: string;
  userId?: string;
  ethAddress?: Address;
  sessionId?: string;
  clientData?: ClientData;
}

const notFoundErr = (valueName: string): Error =>
  new Error(`Not Found In RequestContext: ${valueName}`);

export enum Accessor {
  JwtAuthGuard = 'JwtAuthGuard',
  RequestInterceptor = 'RequestInterceptor',
}

/**
 * Per-request context backed by AsyncLocalStorage.
 * All providers that inject this remain singletons — no scope bubble.
 * A middleware must call {@link RequestContext.run} to establish the store
 * before guards/interceptors write into it.
 */
@Injectable()
export class RequestContext {
  private static readonly als = new AsyncLocalStorage<RequestStore>();

  static run<T>(fn: () => T): T {
    return this.als.run({}, fn);
  }

  private get store(): RequestStore {
    const store = RequestContext.als.getStore();
    if (!store) {
      throw new Error(
        'RequestContext accessed outside of request scope. ' +
          'Ensure RequestContextMiddleware is applied.',
      );
    }
    return store;
  }

  setRequestId(requestId: string, accessor: Accessor): void {
    if (accessor === Accessor.RequestInterceptor) this.store.requestId = requestId;
  }

  setUserId(userId: string, accessor: Accessor): void {
    if (accessor === Accessor.JwtAuthGuard) this.store.userId = userId;
  }

  setEthAddress(ethAddress: Address, accessor: Accessor): void {
    if (accessor === Accessor.JwtAuthGuard) this.store.ethAddress = ethAddress;
  }

  setSessionId(sessionId: string, accessor: Accessor): void {
    if (accessor === Accessor.JwtAuthGuard) this.store.sessionId = sessionId;
  }

  setClientData(clientData: ClientData, accessor: Accessor): void {
    if (accessor === Accessor.RequestInterceptor) this.store.clientData = clientData;
  }

  get requestId(): string {
    const val = this.store.requestId;
    if (!val) throw notFoundErr('requestId');
    return val;
  }

  get ethAddress(): Address {
    const val = this.store.ethAddress;
    if (!val) throw notFoundErr('ethAddress');
    return val;
  }

  get userId(): string {
    const val = this.store.userId;
    if (!val) throw notFoundErr('userId');
    return val;
  }

  get sessionId(): string {
    const val = this.store.sessionId;
    if (!val) throw notFoundErr('sessionId');
    return val;
  }

  get clientData(): ClientData {
    const val = this.store.clientData;
    if (!val) throw notFoundErr('clientData');
    return val;
  }
}
