import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const envFilePathCandidates: readonly string[] = [
  resolve(process.cwd(), '.env.test'),
  resolve(process.cwd(), '.env.test.example'),
];
const envFilePath = envFilePathCandidates.find((path: string): boolean => existsSync(path));

if (envFilePath) {
  const content = readFileSync(envFilePath, 'utf-8');

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;

    const key = trimmed.slice(0, eqIdx).trim();
    const raw = trimmed.slice(eqIdx + 1).trim();
    const value = raw.replace(/^['"]|['"]$/g, '');

    process.env[key] ??= value;
  }
}
