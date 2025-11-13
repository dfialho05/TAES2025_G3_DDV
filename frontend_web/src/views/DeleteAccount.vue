<template>
    <div class="container mx-auto px-4 py-8 max-w-2xl">
        <div
            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 border border-gray-200 dark:border-gray-700"
        >
            <div class="text-center mb-8">
                <div
                    class="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                    <svg
                        class="w-8 h-8 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>
                <h1 class="text-3xl font-bold mb-2">Apagar Conta</h1>
                <p class="text-gray-600 dark:text-gray-400">
                    Esta ação é irreversível
                </p>
            </div>

            <div
                class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6"
            >
                <p class="text-sm text-red-800 dark:text-red-200">
                    <strong>Aviso:</strong> Ao apagar a sua conta, todos os seus
                    dados, incluindo histórico de jogos, estatísticas e moedas
                    serão permanentemente removidos. Esta ação não pode ser
                    desfeita.
                </p>
            </div>

            <div class="space-y-4 mb-6">
                <div>
                    <label class="block text-sm font-medium mb-2"
                        >Confirme o seu email</label
                    >
                    <input
                        v-model="confirmEmail"
                        type="email"
                        :placeholder="authStore.user.email"
                        class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700"
                    />
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2"
                        >Password</label
                    >
                    <input
                        v-model="password"
                        type="password"
                        class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700"
                    />
                </div>

                <div class="flex items-start gap-2">
                    <input
                        v-model="confirmed"
                        type="checkbox"
                        id="confirm"
                        class="mt-1"
                    />
                    <label
                        for="confirm"
                        class="text-sm text-gray-600 dark:text-gray-400"
                    >
                        Compreendo que esta ação é permanente e não pode ser
                        desfeita
                    </label>
                </div>
            </div>

            <div class="flex gap-3">
                <button
                    @click="handleDelete"
                    :disabled="!canDelete"
                    :class="[
                        'flex-1 px-6 py-3 rounded-lg font-semibold transition-colors',
                        canDelete
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed',
                    ]"
                >
                    Apagar Conta Permanentemente
                </button>
                <router-link
                    to="/profile"
                    class="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-center"
                >
                    Cancelar
                </router-link>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/mocks/auth";

const router = useRouter();
const authStore = useAuthStore();

const confirmEmail = ref("");
const password = ref("");
const confirmed = ref(false);

const canDelete = computed(() => {
    return (
        confirmEmail.value === authStore.user.email &&
        password.value.length > 0 &&
        confirmed.value
    );
});

function handleDelete() {
    if (canDelete.value) {
        alert("Conta apagada (mock)");
        authStore.logout();
        router.push("/");
    }
}
</script>
