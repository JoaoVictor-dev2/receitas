import { z } from 'zod';

const varchar100 = z.string().refine((value) => [...value].length <= 100, {
  message: 'Informe no máximo 100 caracteres.',
});

const senha = z.string().min(1, 'Informe a senha.').refine(
  (value) => Buffer.byteLength(value, 'utf8') <= 72,
  { message: 'A senha deve ter no máximo 72 bytes em UTF-8.' },
);

export const loginSchema = z.strictObject({
  login: varchar100.refine((value) => value.length > 0, { message: 'Informe o login.' }),
  senha,
});

export const createUserSchema = loginSchema.extend({
  nome: varchar100.nullable().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
