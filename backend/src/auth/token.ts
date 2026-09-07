import { errors, jwtVerify, SignJWT } from 'jose';
import type { AuthConfig } from '../config.ts';
import { AppError } from '../errors/app-error.ts';
import type { AuthenticatedUser } from '../types/user.ts';

export const tokenLifetimeSeconds = 8 * 60 * 60;
const issuer = 'receitas-api';
const audience = 'receitas-web';

export function createToken(userId: number, config: AuthConfig): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(String(userId))
    .setIssuedAt()
    .setIssuer(issuer)
    .setAudience(audience)
    .setExpirationTime(Math.floor(Date.now() / 1000) + tokenLifetimeSeconds)
    .sign(new TextEncoder().encode(config.jwtSecret));
}

export async function verifyToken(token: string, config: AuthConfig): Promise<AuthenticatedUser> {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(config.jwtSecret), {
      algorithms: ['HS256'],
      issuer,
      audience,
      requiredClaims: ['sub', 'iat', 'exp'],
    });
    const id = Number(payload.sub);
    if (!/^[1-9]\d*$/.test(payload.sub ?? '') || !Number.isSafeInteger(id) || id > 4_294_967_295) {
      throw new AppError('Autenticação inválida ou expirada.', 401);
    }
    return { id };
  } catch (error) {
    if (error instanceof errors.JOSEError) {
      throw new AppError('Autenticação inválida ou expirada.', 401);
    }
    throw error;
  }
}
