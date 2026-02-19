/**
 * Security infrastructure error codes.
 * Block: 10130..10139 (shared with auth for backward-compatible codes).
 */
export const enum SecurityErrorCode {
  MissingBearerToken = 10130,
  InvalidAccessToken = 10131,
}
