export interface User {
  id: number;
  nome: string | null;
  login: string;
}

export interface LoginInput {
  login: string;
  senha: string;
}

export interface CreateUserInput extends LoginInput {
  nome: string | null;
}

export interface Category {
  id: number;
  nome: string | null;
}

// Todos os campos editáveis são enviados também no PUT substitutivo.
export interface CreateRecipeInput {
  nome: string | null;
  id_categorias: number | null;
  tempo_preparo_minutos: number | null;
  porcoes: number | null;
  ingredientes: string | null;
  modo_preparo: string;
}

export type UpdateRecipeInput = CreateRecipeInput;

export interface Recipe extends CreateRecipeInput {
  id: number;
  id_usuarios: number;
  criado_em: string;
  alterado_em: string;
}
