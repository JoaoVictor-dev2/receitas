import type { Pool, RowDataPacket } from 'mysql2/promise';
import type { Category } from '../types/category.ts';

export class CategoryRepository {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async findAll(): Promise<Category[]> {
    const [rows] = await this.pool.execute<(RowDataPacket & Category)[]>(
      'SELECT id, nome FROM categorias ORDER BY id ASC',
    );
    return rows;
  }

  async exists(id: number): Promise<boolean> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT id FROM categorias WHERE id = ?', [id],
    );
    return rows.length > 0;
  }
}
