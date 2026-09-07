import { AppError } from '../errors/app-error.ts';
import type { CategoryRepository } from '../repositories/category-repository.ts';
import type { RecipeRepository } from '../repositories/recipe-repository.ts';
import type { RecipeInput } from '../schemas/recipe-schemas.ts';
import type { Recipe, RecipeUpdate } from '../types/recipe.ts';

export class RecipeService {
  private readonly repository: Pick<RecipeRepository, 'findAllByUser' | 'findByIdAndUser' | 'create' | 'updateByIdAndUser' | 'deleteByIdAndUser'>;
  private readonly categories: Pick<CategoryRepository, 'exists'>;

  constructor(
    repository: Pick<RecipeRepository, 'findAllByUser' | 'findByIdAndUser' | 'create' | 'updateByIdAndUser' | 'deleteByIdAndUser'>,
    categories: Pick<CategoryRepository, 'exists'>,
  ) {
    this.repository = repository;
    this.categories = categories;
  }

  list(userId: number, q?: string): Promise<Recipe[]> {
    return this.repository.findAllByUser(userId, q);
  }

  async get(id: number, userId: number): Promise<Recipe> {
    const recipe = await this.repository.findByIdAndUser(id, userId);
    if (!recipe) throw new AppError('Receita não encontrada.', 404);
    return recipe;
  }

  async create(userId: number, input: RecipeInput): Promise<Recipe> {
    await this.validateCategory(input.id_categorias);
    const now = new Date(Math.floor(Date.now() / 1000) * 1000);
    return this.repository.create({
      id_usuarios: userId,
      id_categorias: input.id_categorias ?? null,
      nome: input.nome ?? null,
      tempo_preparo_minutos: input.tempo_preparo_minutos ?? null,
      porcoes: input.porcoes ?? null,
      modo_preparo: input.modo_preparo,
      ingredientes: input.ingredientes ?? null,
      criado_em: now,
      alterado_em: now,
    });
  }

  async update(id: number, userId: number, input: RecipeInput): Promise<Recipe> {
    const original = await this.get(id, userId);
    await this.validateCategory(input.id_categorias);
    const changes: RecipeUpdate = {
      id_categorias: input.id_categorias ?? null,
      nome: input.nome ?? null,
      tempo_preparo_minutos: input.tempo_preparo_minutos ?? null,
      porcoes: input.porcoes ?? null,
      modo_preparo: input.modo_preparo,
      ingredientes: input.ingredientes ?? null,
      alterado_em: new Date(Math.floor(Date.now() / 1000) * 1000),
    };
    const updated = await this.repository.updateByIdAndUser(id, userId, changes);
    if (!updated) throw new AppError('Receita não encontrada.', 404);
    return { ...original, ...changes };
  }

  async delete(id: number, userId: number): Promise<void> {
    const deleted = await this.repository.deleteByIdAndUser(id, userId);
    if (!deleted) throw new AppError('Receita não encontrada.', 404);
  }

  private async validateCategory(id: number | null | undefined): Promise<void> {
    if (id != null && !await this.categories.exists(id)) {
      throw new AppError('Categoria não encontrada.', 400);
    }
  }
}
