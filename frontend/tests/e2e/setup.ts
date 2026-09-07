import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createServer, type AddressInfo } from 'node:net';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execute = promisify(execFile);

async function reservePort() {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return { port: (server.address() as AddressInfo).port, close: () => new Promise<void>((resolve) => server.close(() => resolve())) };
}

export default async function setup() {
  const reservations = await Promise.all([reservePort(), reservePort(), reservePort()]);
  const [dbPort, apiPort, webPort] = reservations.map(({ port }) => String(port));
  const apiUrl = `http://localhost:${apiPort}`;
  const webUrl = `http://localhost:${webPort}`;
  const project = `receitas-web-e2e-${process.pid}-${randomUUID().slice(0, 8)}`;
  const compose = fileURLToPath(new URL('../../../compose.yaml', import.meta.url));
  const args = ['compose', '-p', project, '-f', compose];
  const env = {
    ...process.env,
    DB_PORT: dbPort, API_PORT: apiPort, FRONTEND_PORT: webPort,
    DB_PASSWORD: 'web_e2e', MYSQL_ROOT_PASSWORD: 'root_web_e2e',
    JWT_SECRET: 'isolated-browser-test-secret-at-least-32-bytes', COOKIE_SECURE: 'false',
    API_ORIGIN: apiUrl, CORS_ORIGIN: webUrl, VITE_API_URL: apiUrl,
  };
  const cleanup = async () => {
    // Somente o projeto exclusivo desta execução; nunca o volume local.
    await execute('docker', [...args, 'down', '--volumes', '--rmi', 'local'], { env, timeout: 60_000 });
  };
  await Promise.all(reservations.map(({ close }) => close()));
  try {
    console.log('Construindo e iniciando MySQL, API e frontend descartáveis…');
    await execute('docker', [...args, 'up', '--build', '-d', '--wait', '--wait-timeout', '120'], { env, timeout: 600_000, maxBuffer: 8 * 1024 * 1024 });
    process.env.WEB_TEST_URL = webUrl;
    process.env.API_TEST_URL = apiUrl;
  } catch (error) {
    const logs = await execute('docker', [...args, 'logs', '--tail', '40'], { env }).catch(() => null);
    if (logs) console.error(logs.stdout);
    await cleanup();
    throw error;
  }
  return cleanup;
}
