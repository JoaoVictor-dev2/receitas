import bcrypt from 'bcrypt';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserRepository } from '../../src/repositories/user-repository.ts';
import { UserService } from '../../src/services/user-service.ts';
import type { User } from '../../src/types/user.ts';

describe('UserService', () => {
  const repository = {
    create: vi.fn<UserRepository['create']>(),
    findByLogin: vi.fn<UserRepository['findByLogin']>(),
  };
  const service = new UserService(repository);
  let user: User;

  beforeAll(async () => {
    user = {
      id: 7, nome: 'Ana', login: 'ana', senha: await bcrypt.hash('senha correta', 12),
      criado_em: new Date('2026-09-05T12:00:00Z'), alterado_em: new Date('2026-09-05T12:00:00Z'),
    };
  });

  beforeEach(() => {
    vi.resetAllMocks();
    repository.create.mockImplementation(async (input) => ({ id: 7, ...input }));
  });

  it('persiste bcrypt com custo 12 e datas iguais; retorna somente os dados públicos', async () => {
    const startedAt = Date.now() - 1000;
    const result = await service.register({ nome: 'Ana', login: 'ana', senha: 'senha correta' });
    const saved = repository.create.mock.calls[0]![0];
    expect(saved.senha).not.toBe('senha correta');
    expect(bcrypt.getRounds(saved.senha)).toBe(12);
    expect(await bcrypt.compare('senha correta', saved.senha)).toBe(true);
    expect(saved.criado_em).toEqual(saved.alterado_em);
    expect(saved.criado_em.getTime()).toBeGreaterThanOrEqual(startedAt);
    expect(saved.criado_em.getTime()).toBeLessThanOrEqual(Date.now());
    expect(result).toEqual({ id: 7, nome: 'Ana', login: 'ana' });
  });

  it('autentica comparando a senha com bcrypt e não devolve o hash', async () => {
    repository.findByLogin.mockResolvedValue(user);
    await expect(service.login({ login: 'ana', senha: 'senha correta' })).resolves.toEqual({ id: 7, nome: 'Ana', login: 'ana' });
    expect(repository.findByLogin).toHaveBeenCalledWith('ana');
  });

  it.each(['senha incorreta', 'usuário inexistente'])('usa o mesmo erro para %s', async (reason) => {
    repository.findByLogin.mockResolvedValue(reason === 'usuário inexistente' ? null : user);
    await expect(service.login({ login: 'ana', senha: 'incorreta' })).rejects.toMatchObject({
      message: 'Login ou senha inválidos.', statusCode: 401,
    });
  });
});
