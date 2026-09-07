export interface RecipeFields {
  id_categorias: number | null;
  nome: string | null;
  tempo_preparo_minutos: number | null;
  porcoes: number | null;
  modo_preparo: string;
  ingredientes: string | null;
}

export interface Recipe extends RecipeFields {
  id: number;
  id_usuarios: number;
  criado_em: Date;
  alterado_em: Date;
}

export type NewRecipe = Omit<Recipe, 'id'>;
export type RecipeUpdate = RecipeFields & Pick<Recipe, 'alterado_em'>;
