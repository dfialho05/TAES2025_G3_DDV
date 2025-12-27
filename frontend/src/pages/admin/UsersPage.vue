<template>
  <div class="p-6 min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
    <div
      v-if="!authStore.isAdmin"
      class="max-w-2xl mx-auto text-center py-24 text-gray-700 dark:text-gray-300"
    >
      <h2 class="text-2xl font-bold mb-2">Acesso Negado</h2>
      <p class="text-sm">Não tens permissões de administrador para aceder a esta área.</p>
      <router-link
        to="/"
        class="inline-block mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >Voltar para Home</router-link
      >
    </div>

    <div v-else class="max-w-7xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Administração</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Gestão de utilizadores e configurações do sistema
          </p>
        </div>

        <nav class="flex gap-2 items-center">
          <router-link
            :to="{ name: 'admin-users' }"
            class="px-3 py-2 rounded-md text-sm font-medium"
            :class="
              isActiveRoute('admin-users')
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            "
          >
            Utilizadores
          </router-link>

          <router-link
            to="/admin"
            class="px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Painel
          </router-link>

          <router-link
            to="/admin/settings"
            class="px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Configurações
          </router-link>
        </nav>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside class="md:col-span-1">
          <div
            class="sticky top-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4"
          >
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200">Secções</h3>
            <ul class="space-y-2 text-sm">
              <li>
                <router-link
                  :to="{ name: 'admin-users' }"
                  class="block px-3 py-2 rounded-md"
                  :class="
                    isActiveRoute('admin-users')
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  "
                >
                  Lista de Utilizadores
                </router-link>
              </li>
              <li>
                <router-link
                  to="/admin/roles"
                  class="block px-3 py-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Perfis & Permissões
                </router-link>
              </li>
              <li>
                <router-link
                  to="/admin/settings"
                  class="block px-3 py-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Configurações
                </router-link>
              </li>
            </ul>
          </div>
        </aside>

        <section class="md:col-span-3">
          <!-- Área principal onde os componentes específicos (ex: UsersListPage / UserDetails) deverão ser renderizados -->
          <div
            class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 min-h-[60vh]"
          >
            <RouterView />
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute, RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const route = useRoute()

// Pequena utilitária para marcar o tab activo
const isActiveRoute = (name) => {
  if (!name) return false
  return route.name === name
}
</script>

<style scoped>
/* Pequenas melhorias visuais para o layout admin */
</style>
