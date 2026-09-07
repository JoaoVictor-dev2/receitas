import type { IncomingMessage } from 'node:http';
import { readAuthCookie } from '../auth/cookie.ts';
import { verifyToken } from '../auth/token.ts';
import type { AuthConfig } from '../config.ts';
import { AppError } from '../errors/app-error.ts';
import type { AuthenticatedUser } from '../types/user.ts';

export async function authenticate(request: IncomingMessage, config: AuthConfig): Promise<AuthenticatedUser> {
  const token = readAuthCookie(request);
  if (!token) throw new AppError('Autenticação necessária.', 401);
  return verifyToken(token, config);
}
