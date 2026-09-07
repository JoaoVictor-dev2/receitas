import bcrypt from 'bcrypt';
import { AppError } from '../errors/app-error.ts';
import type { UserRepository } from '../repositories/user-repository.ts';
import type { CreateUserInput, LoginInput } from '../schemas/user-schemas.ts';
import type { PublicUser, User } from '../types/user.ts';

const bcryptCost = 12;
// Hash válido usado apenas para manter a comparação quando o login não existe.
const dummyHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxvYSqdFA.jXehhHoW.bK/qYC1m';

function publicUser(user: User): PublicUser {
  return { id: user.id, nome: user.nome, login: user.login };
}

export class UserService {
  private readonly repository: Pick<UserRepository, 'create' | 'findByLogin'>;

  constructor(repository: Pick<UserRepository, 'create' | 'findByLogin'>) {
    this.repository = repository;
  }

  async register(input: CreateUserInput): Promise<PublicUser> {
    const senha = await bcrypt.hash(input.senha, bcryptCost);
    // DATETIME no schema original tem precisão de segundos. Usamos UTC.
    const now = new Date(Math.floor(Date.now() / 1000) * 1000);
    const user = await this.repository.create({
      nome: input.nome ?? null,
      login: input.login,
      senha,
      criado_em: now,
      alterado_em: now,
    });
    return publicUser(user);
  }

  async login(input: LoginInput): Promise<PublicUser> {
    const user = await this.repository.findByLogin(input.login);
    const matches = await bcrypt.compare(input.senha, user?.senha ?? dummyHash);
    if (!user || !matches) throw new AppError('Login ou senha inválidos.', 401);
    return publicUser(user);
  }
}
