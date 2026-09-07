import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AuthConfig } from '../config.ts';
import { tokenLifetimeSeconds } from './token.ts';

export const authCookieName = 'receitas_token';

export function readAuthCookie(request: IncomingMessage): string | undefined {
  const cookies = (request.headers.cookie ?? '').split(';').map((cookie) => cookie.trim());
  const matches = cookies.filter((cookie) => cookie.startsWith(`${authCookieName}=`));
  return matches.length === 1 ? matches[0]!.slice(authCookieName.length + 1) : undefined;
}

function attributes(config: AuthConfig): string {
  return `Path=/; HttpOnly; SameSite=Lax${config.cookieSecure ? '; Secure' : ''}`;
}

export function setAuthCookie(response: ServerResponse, token: string, config: AuthConfig): void {
  response.setHeader('Set-Cookie', `${authCookieName}=${token}; ${attributes(config)}; Max-Age=${tokenLifetimeSeconds}`);
}

export function clearAuthCookie(response: ServerResponse, config: AuthConfig): void {
  response.setHeader('Set-Cookie', `${authCookieName}=; ${attributes(config)}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
}
