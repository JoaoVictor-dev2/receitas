export interface AuthConfig {
  jwtSecret: string;
  cookieSecure: boolean;
}

export interface AppConfig {
  port: number;
  corsOrigin: string;
  apiOrigin: string;
  auth: AuthConfig;
  database: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
}

export function readConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const jwtSecret = env.JWT_SECRET ?? '';
  if (Buffer.byteLength(jwtSecret, 'utf8') < 32) {
    throw new Error('Configure JWT_SECRET com pelo menos 32 bytes.');
  }

  const port = Number(env.PORT ?? 3000);
  const dbPort = Number(env.DB_PORT ?? 3307);
  if (![port, dbPort].every((value) => Number.isInteger(value) && value >= 1 && value <= 65535)) {
    throw new Error('PORT e DB_PORT devem ser portas válidas.');
  }
  if (env.COOKIE_SECURE !== undefined && !['true', 'false'].includes(env.COOKIE_SECURE)) {
    throw new Error('COOKIE_SECURE deve ser true ou false.');
  }

  return {
    port,
    corsOrigin: env.CORS_ORIGIN ?? 'http://localhost:5174',
    apiOrigin: env.API_ORIGIN ?? `http://localhost:${port}`,
    auth: {
      jwtSecret,
      cookieSecure: env.COOKIE_SECURE === undefined
        ? env.NODE_ENV === 'production'
        : env.COOKIE_SECURE === 'true',
    },
    database: {
      host: env.DB_HOST ?? '127.0.0.1',
      port: dbPort,
      database: env.DB_NAME ?? 'teste_receitas_rg_sistemas',
      user: env.DB_USER ?? 'recipes',
      password: env.DB_PASSWORD ?? 'recipes_local',
    },
  };
}
