import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { AppError } from '../errors/app-error.ts';
import type { NewUser, User } from '../types/user.ts';

export class UserRepository {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(user: NewUser): Promise<User> {
    try {
      const [result] = await this.pool.execute<ResultSetHeader>(
        `INSERT INTO usuarios (nome, login, senha, criado_em, alterado_em)
         VALUES (?, ?, ?, ?, ?)`,
        [user.nome, user.login, user.senha, user.criado_em, user.alterado_em],
      );
      return { id: result.insertId, ...user };
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ER_DUP_ENTRY') {
        throw new AppError('Login já cadastrado.', 409);
      }
      throw error;
    }
  }

  async findByLogin(login: string): Promise<User | null> {
    const [rows] = await this.pool.execute<(RowDataPacket & User)[]>(
      `SELECT id, nome, login, senha, criado_em, alterado_em
       FROM usuarios WHERE login = ? LIMIT 1`,
      [login],
    );
    return rows[0] ?? null;
  }
}
