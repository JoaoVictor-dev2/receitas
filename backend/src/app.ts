import type { RequestListener } from 'node:http';
import { URL } from 'node:url';
import { readConfig } from './config.ts';
import { createDatabasePool } from './database/pool.ts';
import { AppError } from './errors/app-error.ts';
import { handleError } from './errors/handle-error.ts';
import { matchRoute, type Route } from './http/router.ts';
import { sendJson, sendNoContent } from './http/response.ts';
import { UserRepository } from './repositories/user-repository.ts';
import { userRoutes } from './routes/user-routes.ts';
import { UserService } from './services/user-service.ts';

export function createApp(config = readConfig(), pool = createDatabasePool(config.database)) {
  const userService = new UserService(new UserRepository(pool));
  const routes: Route[] = [
    { method: 'GET', pathname: '/health', handler: (_request, response) => sendJson(response, 200, { status: 'ok' }) },
    ...userRoutes(userService, config.auth),
  ];

  const handler: RequestListener = async (request, response) => {
    response.setHeader('Vary', 'Origin');
    response.setHeader('Cache-Control', 'no-store');
    if (request.headers.origin === config.corsOrigin) {
      response.setHeader('Access-Control-Allow-Origin', request.headers.origin);
      response.setHeader('Access-Control-Allow-Credentials', 'true');
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }

    try {
      if (request.method === 'OPTIONS') return sendNoContent(response);
      // CORS sozinho não impede uma escrita enviada por outra origem.
      if (!['GET', 'HEAD'].includes(request.method ?? '') && request.headers.origin
        && ![config.corsOrigin, config.apiOrigin].includes(request.headers.origin)) {
        throw new AppError('Origem não permitida.', 403);
      }
      const { pathname } = new URL(request.url ?? '/', 'http://localhost');
      const route = matchRoute(routes, request.method ?? 'GET', pathname);
      if (!route) throw new AppError('Rota não encontrada.', 404);
      await route.handler(request, response, route.params);
    } catch (error) {
      handleError(error, response);
    }
  };
  return { handler, port: config.port, close: () => pool.end() };
}
