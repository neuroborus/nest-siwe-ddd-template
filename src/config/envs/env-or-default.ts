import { Logger } from '@nestjs/common';

const logger = new Logger('config');

const OPTIONAL_ENV_MESSAGE = (name: string, def: string) =>
  `Environment variable ${name} is missing/empty; using default: ${def}`;

/**
 * Returns the env var value if present (and non-empty after trim unless allowEmpty),
 * otherwise returns defaultValue. Optionally emits a warning when falling back.
 *
 * @param name - Environment variable name (e.g. 'PORT')
 * @param defaultValue - Default value to use when missing/empty
 * @param opts.value - Optional pre-resolved value (e.g. from a fallback chain)
 * @param opts.allowEmpty - If true, empty string is treated as a valid value
 * @param opts.warnOnDefault - If true, emits a warning when defaultValue is used
 * @param opts.logger - Optional logger (defaults to console.warn)
 */
export function envOrDefault(
  name: string,
  defaultValue: string,
  opts?: {
    value?: string;
    allowEmpty?: boolean;
    warnOnDefault?: boolean;
  },
): string {
  const { value, allowEmpty, warnOnDefault } = opts || {};
  const v = value !== undefined ? value : process.env[name];

  const isMissing = v === undefined || v === null;
  const isEmptyString = !isMissing && v.trim() === '';

  const shouldUseDefault = isMissing || (!allowEmpty && isEmptyString);
  if (!shouldUseDefault) return v as string;

  if (warnOnDefault) {
    logger.warn(OPTIONAL_ENV_MESSAGE(name, defaultValue));
  }

  return defaultValue;
}
