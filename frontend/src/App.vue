<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';
import { api } from './services/api';
import { requestError, router } from './router';

const route = useRoute();
const leaving = ref(false);
const error = ref('');
async function logout() {
  leaving.value = true;
  error.value = '';
  try {
    await api.logout();
    await router.replace('/login');
  } catch (cause) {
    error.value = await requestError(cause);
  } finally {
    leaving.value = false;
  }
}
</script>

<template>
  <a class="skip-link no-print" href="#conteudo">Pular para o conteúdo</a>
  <header class="site-header no-print">
    <RouterLink class="brand" to="/receitas" aria-label="Caderno de receitas, início">
      <svg viewBox="0 0 32 32" width="32" height="32" fill="none" aria-hidden="true">
        <path d="M6 5h17a3 3 0 0 1 3 3v19H9a3 3 0 0 1-3-3V5Zm0 18h20M11 5v18M15 11h7M15 16h5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span>Caderno <span class="brand-light">de receitas</span></span>
    </RouterLink>
    <nav aria-label="Navegação principal">
      <template v-if="route.meta.authenticated">
        <RouterLink to="/receitas">Minhas receitas</RouterLink>
        <button class="button secondary small" :disabled="leaving" @click="logout">{{ leaving ? 'Saindo…' : 'Sair' }}</button>
      </template>
      <template v-else>
        <RouterLink to="/login">Entrar</RouterLink>
        <RouterLink class="button secondary small" to="/cadastro">Criar conta</RouterLink>
      </template>
    </nav>
  </header>
  <main id="conteudo" class="page">
    <p v-if="error" class="message error no-print" role="alert">{{ error }}</p>
    <RouterView :key="route.path" />
  </main>
  <footer class="site-footer no-print">Receitas guardadas. Sabores para repetir.</footer>
</template>
