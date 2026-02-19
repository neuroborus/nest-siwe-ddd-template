import { envOrDefault } from '../envs';

describe('envOrDefault', () => {
  const ENV_KEY = 'TEST_ENV_OR_DEFAULT_KEY';

  afterEach(() => {
    delete process.env[ENV_KEY];
  });

  it('returns env value when present', () => {
    process.env[ENV_KEY] = 'custom';
    expect(envOrDefault(ENV_KEY, 'fallback')).toBe('custom');
  });

  it('returns default when env is undefined', () => {
    expect(envOrDefault(ENV_KEY, 'fallback')).toBe('fallback');
  });

  it('returns default when env is empty string', () => {
    process.env[ENV_KEY] = '  ';
    expect(envOrDefault(ENV_KEY, 'fallback')).toBe('fallback');
  });

  it('returns empty string when allowEmpty is true', () => {
    process.env[ENV_KEY] = '';
    expect(envOrDefault(ENV_KEY, 'fallback', { allowEmpty: true })).toBe('');
  });

  it('uses provided value instead of process.env', () => {
    process.env[ENV_KEY] = 'from-env';
    expect(envOrDefault(ENV_KEY, 'fallback', { value: 'override' })).toBe('override');
  });

  it('returns default and warns when warnOnDefault is true', () => {
    const result = envOrDefault(ENV_KEY, 'def', { warnOnDefault: true });
    expect(result).toBe('def');
  });
});
