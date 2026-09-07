import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { authCookieName } from '../../src/auth/cookie.ts';
import { UserRepository } from '../../src/repositories/user-repository.ts';
import type { PublicUser } from '../../src/types/user.ts';
import { startTestApp } from './helpers.ts';

describe('cadastro e autenticação com HTTP e MySQL reais', () => {
  let app: Awaited<ReturnType<typeof startTestApp>>;
  let repository: UserRepository;
  let account: PublicUser;
  const credentials = { login: `auth-${randomUUID()}`, senha: 'senha válida 🍰' };
  const uniqueLogin = () => `test-${randomUUID()}`;
  const post = (path: string, input?: unknown, headers: Record<string, string> = {}) => fetch(`${app.baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: input === undefined ? undefined : JSON.stringify(input),
  });

  beforeAll(async () => {
    app = await startTestApp();
    repository = new UserRepository(app.pool);
    const response = await post('/api/usuarios', { ...credentials, nome: 'Ana' });
    expect(response.status).toBe(201);
    account = await response.json() as PublicUser;
  });

  afterAll(async () => { await app?.close(); });

  it('cadastra e persiste hash e datas, retornando somente id, nome e login', async () => {
    const input = { nome: 'João 🍰', login: uniqueLogin(), senha: 'senha sem truncamento' };
    const startedAt = Date.now() - 1000;
    const response = await post('/api/usuarios', input);
    expect(response.status).toBe(201);
    expect(response.headers.get('set-cookie')).toBeNull();
    const body = await response.json() as PublicUser;
    expect(body).toEqual({ id: expect.any(Number), nome: input.nome, login: input.login });
    const persisted = await repository.findByLogin(input.login);
    expect(persisted!.senha).toMatch(/^\$2b\$12\$/);
    expect(persisted!.senha).toHaveLength(60);
    expect(persisted!.criado_em).toEqual(persisted!.alterado_em);
    expect(persisted!.criado_em.getTime()).toBeGreaterThanOrEqual(startedAt);
    expect(persisted!.criado_em.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('retorna 409 ao cadastrar novamente um login existente', async () => {
    const input = { login: uniqueLogin(), senha: 'senha' };
    const created = await post('/api/usuarios', input);
    expect(created.status).toBe(201);
    await created.body?.cancel();
    const conflict = await post('/api/usuarios', input);
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toEqual({ message: 'Login já cadastrado.' });
  });

  it('login retorna dados públicos e cookie JWT HttpOnly, utilizável pelo middleware', async () => {
    const response = await post('/api/auth/login', credentials, { Origin: app.config.corsOrigin });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(account);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('access-control-allow-credentials')).toBe('true');
    const setCookie = response.headers.get('set-cookie')!;
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('Path=/');
    expect(setCookie).toContain('SameSite=Lax');
    expect(setCookie).toContain('Max-Age=28800');
    expect(setCookie).not.toContain('Secure');
    const cookie = setCookie.split(';')[0]!;
    const protectedResponse = await fetch(`${app.baseUrl}/api/receitas`, { headers: { Cookie: cookie } });
    expect(protectedResponse.status).toBe(200);
    expect(await protectedResponse.json()).toEqual([]);
  });

  it('logoff limpa o cookie; sem cookie o middleware volta a responder 401', async () => {
    const login = await post('/api/auth/login', credentials);
    const cookie = login.headers.get('set-cookie')!.split(';')[0]!;
    await login.body?.cancel();
    const response = await post('/api/auth/logout', undefined, { Cookie: cookie });
    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
    expect(response.headers.get('set-cookie')).toContain(`${authCookieName}=;`);
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
    const anonymous = await fetch(`${app.baseUrl}/api/receitas`);
    expect(anonymous.status).toBe(401);
    expect(await anonymous.json()).toEqual({ message: 'Autenticação necessária.' });
  });
});
