import { requireEnv } from '../envs';

describe('requireEnv', () => {
  const ENV_KEY = 'TEST_REQUIRE_ENV_KEY';

  afterEach(() => {
    delete process.env[ENV_KEY];
  });

  it('returns env value when present', () => {
    process.env[ENV_KEY] = 'hello';
    expect(requireEnv(ENV_KEY)).toBe('hello');
  });

  it('throws when env is undefined', () => {
    expect(() => requireEnv(ENV_KEY)).toThrow('Missing required environment variable');
  });

  it('throws when env is empty string', () => {
    process.env[ENV_KEY] = '  ';
    expect(() => requireEnv(ENV_KEY)).toThrow('Missing required environment variable');
  });

  it('returns empty string when allowEmpty is true', () => {
    process.env[ENV_KEY] = '';
    expect(requireEnv(ENV_KEY, { allowEmpty: true })).toBe('');
  });

  it('uses provided value instead of process.env', () => {
    process.env[ENV_KEY] = 'from-env';
    expect(requireEnv(ENV_KEY, { value: 'override' })).toBe('override');
  });

  it('throws when provided value is undefined', () => {
    expect(() => requireEnv(ENV_KEY, { value: undefined })).toThrow();
  });
});
