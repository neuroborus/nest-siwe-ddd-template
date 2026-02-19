export interface LoginData {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly accessExpireMs: number;
  readonly refreshExpireMs: number;
}
