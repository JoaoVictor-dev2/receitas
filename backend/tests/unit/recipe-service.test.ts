import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RecipeRepository } from '../../src/repositories/recipe-repository.ts';
import { RecipeService } from '../../src/services/recipe-service.ts';
import type { Recipe } from '../../src/types/recipe.ts';

describe('RecipeService', () => {
  const repository = {
    findAllByUser: vi.fn<RecipeRepository['findAllByUser']>(),
    findByIdAndUser: vi.fn<RecipeRepository['findByIdAndUser']>(),
    create: vi.fn<RecipeRepository['create']>(),
    updateByIdAndUser: vi.fn<RecipeRepository['updateByIdAndUser']>(),
    deleteByIdAndUser: vi.fn<RecipeRepository['deleteByIdAndUser']>(),
  };
  const categories = { exists: vi.fn<(id: number) => Promise<boolean>>() };
  const service = new RecipeService(repository, categories);
  const created = new Date('2026-09-05T10:00:00Z');
  const now = new Date('2026-09-05T12:00:00Z');
  const original: Recipe = {
    id: 11, id_usuarios: 7, id_categorias: 1, nome: 'Bolo', tempo_preparo_minutos: 30,
    porcoes: 4, modo_preparo: 'Misture.', ingredientes: 'Farinha', criado_em: created, alterado_em: created,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(now);
    repository.create.mockImplementation(async (recipe) => ({ id: 11, ...recipe }));
    repository.findByIdAndUser.mockResolvedValue(original);
    repository.updateByIdAndUser.mockResolvedValue(true);
    repository.deleteByIdAndUser.mockResolvedValue(true);
    categories.exists.mockResolvedValue(true);
  });

  afterEach(() => vi.useRealTimers());

  it('cria a receita para o usuário autenticado com as datas da aplicação', async () => {
    await service.create(7, { modo_preparo: 'Misture.' });
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
      id_usuarios: 7, modo_preparo: 'Misture.', criado_em: now, alterado_em: now,
    }));
  });

  it('rejeita categoria inexistente antes de cadastrar ou editar', async () => {
    categories.exists.mockResolvedValue(false);
    await expect(service.create(7, { modo_preparo: '', id_categorias: 99 })).rejects.toMatchObject({ statusCode: 400 });
    await expect(service.update(11, 7, { modo_preparo: '', id_categorias: 99 })).rejects.toMatchObject({ statusCode: 400 });
    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.updateByIdAndUser).not.toHaveBeenCalled();
  });

  it('retorna 404 quando a consulta restrita ao usuário não encontra a receita', async () => {
    repository.findByIdAndUser.mockResolvedValue(null);
    await expect(service.get(11, 8)).rejects.toMatchObject({ statusCode: 404, message: 'Receita não encontrada.' });
    expect(repository.findByIdAndUser).toHaveBeenCalledWith(11, 8);
  });

  it('edita a receita do proprietário, preserva criação e atualiza alteração em UTC', async () => {
    const input = { modo_preparo: 'Asse.', id_categorias: 2, nome: 'Pão' };
    const result = await service.update(11, 7, input);
    expect(categories.exists).toHaveBeenCalledWith(2);
    expect(repository.updateByIdAndUser).toHaveBeenCalledWith(11, 7, {
      id_categorias: 2, nome: 'Pão', tempo_preparo_minutos: null, porcoes: null,
      modo_preparo: 'Asse.', ingredientes: null, alterado_em: now,
    });
    expect(result).toMatchObject({ id: 11, id_usuarios: 7, criado_em: created, alterado_em: now });
    expect(result.alterado_em.getTime()).toBeGreaterThan(result.criado_em.getTime());
  });

  it('receita alheia retorna 404 antes da validação de categoria e não é modificada', async () => {
    repository.findByIdAndUser.mockResolvedValue(null);
    await expect(service.update(11, 8, { modo_preparo: '', id_categorias: 99 })).rejects.toMatchObject({ statusCode: 404 });
    expect(repository.findByIdAndUser).toHaveBeenCalledWith(11, 8);
    expect(categories.exists).not.toHaveBeenCalled();
    expect(repository.updateByIdAndUser).not.toHaveBeenCalled();
  });

  it('exclui pelo par ID/usuário sem consulta prévia', async () => {
    await expect(service.delete(11, 7)).resolves.toBeUndefined();
    expect(repository.deleteByIdAndUser).toHaveBeenCalledWith(11, 7);
    expect(repository.findByIdAndUser).not.toHaveBeenCalled();
  });

  it('não informa sucesso quando nenhuma receita daquele proprietário foi excluída', async () => {
    repository.deleteByIdAndUser.mockResolvedValue(false);
    await expect(service.delete(11, 8)).rejects.toMatchObject({ statusCode: 404 });
    expect(repository.deleteByIdAndUser).toHaveBeenCalledWith(11, 8);
  });
});
