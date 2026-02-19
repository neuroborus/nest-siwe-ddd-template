const REQUIRED_ENV_MESSAGE = (name: string) => `Missing required environment variable: ${name}`;

/**
 * Returns the value of the given environment variable if it is present and
 * non-empty (after trim). Otherwise throws an error.
 * Use for required env vars in config modules.
 *
 * @param name - Environment variable name (e.g. 'DB_HOST')
 * @param value - Optional pre-resolved value (e.g. from a fallback chain)
 * @param opts - allowEmpty: if true, only undefined/null throw; empty string is returned
 */
export function requireEnv(name: string, opts?: { allowEmpty?: boolean; value?: string }): string {
  const { allowEmpty, value } = opts || {};
  const v = value !== undefined ? value : process.env[name];
  if (v === undefined || v === null) {
    throw new Error(REQUIRED_ENV_MESSAGE(name));
  }
  if (!allowEmpty && v.trim() === '') {
    throw new Error(REQUIRED_ENV_MESSAGE(name));
  }
  return v;
}
