import { createRouter, createWebHistory } from 'vue-router';
import { ApiError } from '../services/api';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/receitas' },
    { path: '/login', component: () => import('../views/LoginView.vue') },
    { path: '/cadastro', component: () => import('../views/RegisterView.vue') },
    { path: '/receitas', component: () => import('../views/RecipeListView.vue'), meta: { authenticated: true } },
    { path: '/receitas/nova', component: () => import('../views/RecipeEditView.vue'), meta: { authenticated: true } },
    { path: '/receitas/:id', component: () => import('../views/RecipeDetailView.vue'), meta: { authenticated: true } },
    { path: '/receitas/:id/editar', component: () => import('../views/RecipeEditView.vue'), meta: { authenticated: true } },
    { path: '/:pathMatch(.*)*', component: () => import('../views/NotFoundView.vue') },
  ],
  scrollBehavior: () => ({ top: 0 }),
});

export async function requestError(error: unknown): Promise<string> {
  if (error instanceof ApiError && error.status === 401) {
    await router.replace('/login');
    return 'Sua sessão terminou. Entre novamente.';
  }
  return error instanceof ApiError ? error.message : 'Não foi possível concluir a solicitação. Tente novamente.';
}
