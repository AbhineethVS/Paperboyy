// Loads and validates environment variables used by the Express server (no secrets logged).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..', '..');

dotenv.config({ path: path.join(repoRoot, '.env') });

const portRaw = process.env.PORT ?? '3000';
const port = Number.parseInt(portRaw, 10);

if (Number.isNaN(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT: "${portRaw}"`);
}

const nodeEnv = process.env.NODE_ENV ?? 'development';

export const env = {
  port,
  nodeEnv,
  isProduction: nodeEnv === 'production',
};
