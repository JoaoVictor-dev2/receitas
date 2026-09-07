export interface User {
  id: number;
  nome: string | null;
  login: string;
  senha: string;
  criado_em: Date;
  alterado_em: Date;
}

export type NewUser = Omit<User, 'id'>;
export type PublicUser = Pick<User, 'id' | 'nome' | 'login'>;
export type AuthenticatedUser = Pick<User, 'id'>;
