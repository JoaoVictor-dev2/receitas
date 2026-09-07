import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type { NewRecipe, Recipe, RecipeUpdate } from '../types/recipe.ts';

export class RecipeRepository {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async findAllByUser(userId: number, q?: string): Promise<Recipe[]> {
    let sql = `SELECT id, id_usuarios, id_categorias, nome, tempo_preparo_minutos,
                      porcoes, modo_preparo, ingredientes, criado_em, alterado_em
               FROM receitas WHERE id_usuarios = ?`;
    const values: (number | string)[] = [userId];
    if (q) {
      sql += " AND nome LIKE ? ESCAPE '!'";
      values.push(`%${q.replace(/[!%_]/g, '!$&')}%`);
    }
    sql += ' ORDER BY id ASC';
    const [rows] = await this.pool.execute<(RowDataPacket & Recipe)[]>(sql, values);
    return rows;
  }

  async findByIdAndUser(id: number, userId: number): Promise<Recipe | null> {
    const [rows] = await this.pool.execute<(RowDataPacket & Recipe)[]>(
      `SELECT id, id_usuarios, id_categorias, nome, tempo_preparo_minutos,
              porcoes, modo_preparo, ingredientes, criado_em, alterado_em
       FROM receitas WHERE id = ? AND id_usuarios = ?`,
      [id, userId],
    );
    return rows[0] ?? null;
  }

  async create(recipe: NewRecipe): Promise<Recipe> {
    const [result] = await this.pool.execute<ResultSetHeader>(
      `INSERT INTO receitas (id_usuarios, id_categorias, nome, tempo_preparo_minutos,
                             porcoes, modo_preparo, ingredientes, criado_em, alterado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [recipe.id_usuarios, recipe.id_categorias, recipe.nome, recipe.tempo_preparo_minutos,
        recipe.porcoes, recipe.modo_preparo, recipe.ingredientes, recipe.criado_em, recipe.alterado_em],
    );
    return { id: result.insertId, ...recipe };
  }

  async updateByIdAndUser(id: number, userId: number, recipe: RecipeUpdate): Promise<boolean> {
    const [result] = await this.pool.execute<ResultSetHeader>(
      `UPDATE receitas
       SET id_categorias = ?, nome = ?, tempo_preparo_minutos = ?, porcoes = ?,
           modo_preparo = ?, ingredientes = ?, alterado_em = ?
       WHERE id = ? AND id_usuarios = ?`,
      [recipe.id_categorias, recipe.nome, recipe.tempo_preparo_minutos, recipe.porcoes,
        recipe.modo_preparo, recipe.ingredientes, recipe.alterado_em, id, userId],
    );
    // mysql2 usa FOUND_ROWS por padrão: um PUT idêntico também encontra a receita.
    return result.affectedRows > 0;
  }

  async deleteByIdAndUser(id: number, userId: number): Promise<boolean> {
    const [result] = await this.pool.execute<ResultSetHeader>(
      'DELETE FROM receitas WHERE id = ? AND id_usuarios = ?', [id, userId],
    );
    return result.affectedRows > 0;
  }
}
