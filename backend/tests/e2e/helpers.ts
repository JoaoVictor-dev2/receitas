import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { inject } from 'vitest';
import { createApp } from '../../src/app.ts';
import { readConfig } from '../../src/config.ts';
import { createDatabasePool } from '../../src/database/pool.ts';

export async function startTestApp() {
  // Configuração explícita: os testes nunca leem DB_* ou JWT_SECRET do ambiente real.
  const config = readConfig({
    JWT_SECRET: 'secret-used-only-by-isolated-e2e-tests-32-bytes',
    COOKIE_SECURE: 'false',
    DB_HOST: '127.0.0.1',
    DB_PORT: String(inject('mysqlPort')),
    DB_NAME: 'teste_receitas_rg_sistemas',
    DB_USER: 'recipes',
    DB_PASSWORD: 'recipes_e2e',
    CORS_ORIGIN: 'http://localhost:5174',
  });
  const pool = createDatabasePool(config.database);
  const app = createApp(config, pool);
  const server = createServer(app.handler);

  try {
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
  } catch (error) {
    await app.close();
    throw error;
  }

  return {
    config,
    pool,
    baseUrl: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    async close() {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
        server.closeAllConnections();
      });
      await app.close();
    },
  };
}
