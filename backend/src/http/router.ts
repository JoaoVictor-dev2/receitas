import type { IncomingMessage, ServerResponse } from 'node:http';
import { AppError } from '../errors/app-error.ts';

export type Handler = (
  request: IncomingMessage,
  response: ServerResponse,
  params: Record<string, string>,
) => void | Promise<void>;

export type Route = { method: string; pathname: string; handler: Handler };

export function matchRoute(routes: Route[], method: string, pathname: string) {
  const segments = pathname.split('/');

  for (const route of routes) {
    const pattern = route.pathname.split('/');
    if (route.method !== method || pattern.length !== segments.length) continue;

    const params: Record<string, string> = {};
    const matches = pattern.every((segment, index) => {
      const value = segments[index]!;
      if (!segment.startsWith(':')) return segment === value;
      if (!value) return false;
      try {
        params[segment.slice(1)] = decodeURIComponent(value);
      } catch {
        throw new AppError('Parâmetro de URL inválido.', 400);
      }
      return true;
    });
    if (matches) return { handler: route.handler, params };
  }
  return undefined;
}
