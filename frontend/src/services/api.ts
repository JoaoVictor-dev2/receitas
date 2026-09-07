import type { Category, CreateRecipeInput, CreateUserInput, LoginInput, Recipe, UpdateRecipeInput, User } from '../types/api';

const baseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Não foi possível conectar à API. Tente novamente.', 0);
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null) as {
      message?: string; errors?: { field: string; message: string }[];
    } | null;
    const details = data?.errors?.map(({ field, message }) => `${field ? `${field}: ` : ''}${message}`).join(' ');
    throw new ApiError(response.status >= 500 ? 'O servidor encontrou um problema. Tente novamente.'
      : details || data?.message || 'Não foi possível concluir a solicitação.', response.status);
  }
  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}

export const api = {
  register: (input: CreateUserInput) => request<User>('/api/usuarios', 'POST', input),
  login: (input: LoginInput) => request<User>('/api/auth/login', 'POST', input),
  logout: () => request<void>('/api/auth/logout', 'POST'),
  categories: () => request<Category[]>('/api/categorias'),
  recipes: (q = '') => request<Recipe[]>(`/api/receitas${q ? `?${new URLSearchParams({ q })}` : ''}`),
  recipe: (id: string | number) => request<Recipe>(`/api/receitas/${encodeURIComponent(id)}`),
  createRecipe: (input: CreateRecipeInput) => request<Recipe>('/api/receitas', 'POST', input),
  updateRecipe: (id: string | number, input: UpdateRecipeInput) => request<Recipe>(`/api/receitas/${encodeURIComponent(id)}`, 'PUT', input),
  deleteRecipe: (id: number) => request<void>(`/api/receitas/${id}`, 'DELETE'),
};
