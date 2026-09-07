import { createPool } from 'mysql2/promise';
import type { AppConfig } from '../config.ts';

export function createDatabasePool(config: AppConfig['database']) {
  return createPool({
    ...config,
    timezone: 'Z',
    charset: 'utf8mb4',
    connectionLimit: 5,
    waitForConnections: true,
    multipleStatements: false,
  });
}
