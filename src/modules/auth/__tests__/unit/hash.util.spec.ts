import { hash } from '@/shared/utils/security';

describe('hash utility', () => {
  it('should produce consistent SHA-256 hex digest', () => {
    const input = 'test-refresh-token';
    const result1 = hash(input);
    const result2 = hash(input);

    expect(result1).toBe(result2);
    expect(result1).toHaveLength(64);
    expect(result1).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should produce different hashes for different inputs', () => {
    expect(hash('token-a')).not.toBe(hash('token-b'));
  });
});
