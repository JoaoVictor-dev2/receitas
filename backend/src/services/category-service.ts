import type { CategoryRepository } from '../repositories/category-repository.ts';

export class CategoryService {
  private readonly repository: Pick<CategoryRepository, 'findAll'>;

  constructor(repository: Pick<CategoryRepository, 'findAll'>) {
    this.repository = repository;
  }

  list() {
    return this.repository.findAll();
  }
}
