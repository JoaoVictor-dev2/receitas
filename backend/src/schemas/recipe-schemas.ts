import { z } from 'zod';

const unsignedInt = z.number().int().min(0).max(4_294_967_295);
const mysqlText = z.string().refine((value) => Buffer.byteLength(value, 'utf8') <= 65_535, {
  message: 'Informe no máximo 65535 bytes em UTF-8.',
});

// PUT substitui os mesmos campos editáveis aceitos no cadastro.
export const recipeSchema = z.strictObject({
  id_categorias: unsignedInt.min(1).nullable().optional(),
  nome: z.string().refine((value) => [...value].length <= 45, {
    message: 'Informe no máximo 45 caracteres.',
  }).nullable().optional(),
  tempo_preparo_minutos: unsignedInt.nullable().optional(),
  porcoes: unsignedInt.nullable().optional(),
  modo_preparo: mysqlText,
  ingredientes: mysqlText.nullable().optional(),
});

export const recipeParamsSchema = z.object({
  id: z.string().regex(/^[1-9]\d*$/, 'ID inválido.')
    .transform(Number).pipe(unsignedInt.min(1)),
});

export type RecipeInput = z.infer<typeof recipeSchema>;
