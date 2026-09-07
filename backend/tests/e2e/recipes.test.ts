import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RecipeRepository } from '../../src/repositories/recipe-repository.ts';
import type { RecipeInput } from '../../src/schemas/recipe-schemas.ts';
import type { Category } from '../../src/types/category.ts';
import type { Recipe } from '../../src/types/recipe.ts';
import type { PublicUser } from '../../src/types/user.ts';
import { startTestApp } from './helpers.ts';

type Account = PublicUser & { cookie: string };
type RecipeJson = Omit<Recipe, 'criado_em' | 'alterado_em'> & { criado_em: string; alterado_em: string };

describe('categorias e receitas com HTTP/MySQL reais e dois usuários', () => {
  let app: Awaited<ReturnType<typeof startTestApp>>;
  let repository: RecipeRepository;
  let userA: Account;
  let userB: Account;
  let recipeA: RecipeJson;
  let recipeB: RecipeJson;
  const sharedName = `Bolo isolamento ${randomUUID().slice(0, 8)}`;

  const request = (method: string, path: string, account?: Account, body?: unknown) => fetch(`${app.baseUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(account ? { Cookie: account.cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  async function register(label: string): Promise<Account> {
    const credentials = { login: `${label}-${randomUUID()}`, senha: 'senha do teste' };
    const created = await request('POST', '/api/usuarios', undefined, credentials);
    expect(created.status).toBe(201);
    const account = await created.json() as PublicUser;
    const login = await request('POST', '/api/auth/login', undefined, credentials);
    expect(login.status).toBe(200);
    const cookie = login.headers.get('set-cookie')!.split(';')[0]!;
    await login.body?.cancel();
    return { ...account, cookie };
  }

  async function create(account: Account, input: RecipeInput = { modo_preparo: 'Misture.' }): Promise<RecipeJson> {
    const response = await request('POST', '/api/receitas', account, input);
    expect(response.status).toBe(201);
    return await response.json() as RecipeJson;
  }

  beforeAll(async () => {
    app = await startTestApp();
    repository = new RecipeRepository(app.pool);
    userA = await register('usuario-a');
    userB = await register('usuario-b');
    recipeA = await create(userA, { nome: sharedName, modo_preparo: 'Receita de A.', id_categorias: 1 });
    recipeB = await create(userB, { nome: sharedName, modo_preparo: 'Receita de B.', id_categorias: 2 });
  });

  afterAll(async () => { await app?.close(); });

  it('lista as categorias do MySQL por ID, sem alterar seus dados', async () => {
    const [fromDatabase] = await app.pool.query<(RowDataPacket & Category)[]>('SELECT id, nome FROM categorias ORDER BY id');
    const response = await request('GET', '/api/categorias', userA);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(fromDatabase);
    expect(fromDatabase).toHaveLength(13);
  });

  it('cria com todos os campos e persiste o proprietário autenticado e datas iguais', async () => {
    const input = {
      id_categorias: 1, nome: 'Bolo de laranja', tempo_preparo_minutos: 30, porcoes: 8,
      modo_preparo: 'Misture e asse.', ingredientes: 'Farinha\nLaranja',
    };
    const startedAt = Date.now() - 1000;
    const recipe = await create(userA, input);
    expect(recipe).toEqual({
      ...input, id: expect.any(Number), id_usuarios: userA.id,
      criado_em: expect.any(String), alterado_em: expect.any(String),
    });
    expect(recipe.criado_em).toBe(recipe.alterado_em);
    expect(recipe.criado_em).toMatch(/Z$/);
    expect(Date.parse(recipe.criado_em)).toBeGreaterThanOrEqual(startedAt);
    const persisted = await repository.findByIdAndUser(recipe.id, userA.id);
    expect(persisted).toMatchObject({ ...input, id_usuarios: userA.id });
    expect(persisted!.criado_em.toISOString()).toBe(recipe.criado_em);
  });

  it('lista somente receitas do usuário, mesmo com outro proprietário na query string', async () => {
    const response = await request('GET', `/api/receitas?id_usuarios=${userB.id}`, userA);
    expect(response.status).toBe(200);
    const recipes = await response.json() as RecipeJson[];
    expect(recipes.some(({ id }) => id === recipeA.id)).toBe(true);
    expect(recipes.some(({ id }) => id === recipeB.id)).toBe(false);
    expect(recipes.every(({ id_usuarios }) => id_usuarios === userA.id)).toBe(true);
    expect(recipes.map(({ id }) => id)).toEqual(recipes.map(({ id }) => id).sort((a, b) => a - b));
  });

  it('pesquisa por trecho do nome sem retornar receitas do outro usuário', async () => {
    const term = sharedName.slice(5);
    const responseA = await request('GET', `/api/receitas?q=${encodeURIComponent(term)}`, userA);
    const responseB = await request('GET', `/api/receitas?q=${encodeURIComponent(term)}`, userB);
    expect((await responseA.json() as RecipeJson[]).map(({ id }) => id)).toEqual([recipeA.id]);
    expect((await responseB.json() as RecipeJson[]).map(({ id }) => id)).toEqual([recipeB.id]);
  });

  it('consulta individual retorna a receita do proprietário', async () => {
    const response = await request('GET', `/api/receitas/${recipeA.id}`, userA);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(recipeA);
  });

  it('exclui a receita do proprietário com 204 e consultas posteriores retornam 404', async () => {
    const recipe = await create(userA);
    const response = await request('DELETE', `/api/receitas/${recipe.id}`, userA);
    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
    expect(await repository.findByIdAndUser(recipe.id, userA.id)).toBeNull();
    const removed = await request('GET', `/api/receitas/${recipe.id}`, userA);
    expect(removed.status).toBe(404);
    expect(await removed.json()).toEqual({ message: 'Receita não encontrada.' });
  });

  it('rejeita referência a categoria inexistente com 400', async () => {
    const response = await request('POST', '/api/receitas', userA, { modo_preparo: '', id_categorias: 4294967295 });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: 'Categoria não encontrada.' });
  });

  it('PUT substitui campos editáveis no MySQL e preserva a data de criação', async () => {
    const recipe = await create(userA, {
      nome: 'Original', modo_preparo: 'Misture.', id_categorias: 1,
      ingredientes: 'Farinha', tempo_preparo_minutos: 30, porcoes: 3,
    });
    const input = { nome: 'Alterada', modo_preparo: 'Asse.', id_categorias: null };
    const response = await request('PUT', `/api/receitas/${recipe.id}`, userA, input);
    expect(response.status).toBe(200);
    const updated = await response.json() as RecipeJson;
    const expected = {
      ...input, ingredientes: null, tempo_preparo_minutos: null, porcoes: null,
      id: recipe.id, id_usuarios: userA.id,
    };
    expect(updated).toMatchObject({ ...expected, criado_em: recipe.criado_em });
    const persisted = await repository.findByIdAndUser(recipe.id, userA.id);
    expect(persisted).toMatchObject(expected);
    expect(persisted!.criado_em.toISOString()).toBe(recipe.criado_em);
    expect(persisted!.alterado_em.toISOString()).toBe(updated.alterado_em);
    const readBack = await request('GET', `/api/receitas/${recipe.id}`, userA);
    expect(await readBack.json()).toEqual(updated);
  });

  it('B não consulta, edita ou exclui receita de A e recebe 404', async () => {
    for (const method of ['GET', 'PUT', 'DELETE']) {
      const response = await request(method, `/api/receitas/${recipeA.id}`, userB,
        method === 'PUT' ? { modo_preparo: 'Tentativa de alteração.' } : undefined);
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ message: 'Receita não encontrada.' });
    }
    const missing = await request('GET', '/api/receitas/4294967295', userB);
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ message: 'Receita não encontrada.' });

    const owner = await request('GET', `/api/receitas/${recipeA.id}`, userA);
    expect(await owner.json()).toEqual(recipeA);
  });

  it('o cliente não pode atribuir nem transferir a propriedade via id_usuarios', async () => {
    for (const method of ['POST', 'PUT']) {
      const path = method === 'POST' ? '/api/receitas' : `/api/receitas/${recipeA.id}`;
      const response = await request(method, path, userA, { modo_preparo: '', id_usuarios: userB.id });
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ message: 'Dados inválidos.' });
    }
    const original = await request('GET', `/api/receitas/${recipeA.id}`, userA);
    expect(await original.json()).toEqual(recipeA);
  });

  it('rejeita modo_preparo null com 400', async () => {
    const response = await request('POST', '/api/receitas', userA, { modo_preparo: null });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ message: 'Dados inválidos.' });
  });
});
