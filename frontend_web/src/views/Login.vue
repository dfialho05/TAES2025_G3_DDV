<template>
    <div
        class="min-h-[calc(100vh-16rem)] flex items-center justify-center py-12 px-4"
    >
        <div class="max-w-md w-full card p-8 shadow-lg">
            <h1 class="text-3xl font-bold text-center mb-8 text-contrast">
                Login
            </h1>

            <form @submit.prevent="handleLogin" class="space-y-6">
                <div>
                    <label class="block text-sm font-medium mb-2 text-contrast"
                        >Email</label
                    >
                    <input
                        v-model="email"
                        type="email"
                        required
                        class="input"
                        placeholder="seu@email.com"
                    />
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2 text-contrast"
                        >Password</label
                    >
                    <input
                        v-model="password"
                        type="password"
                        required
                        class="input"
                        placeholder="••••••••"
                    />
                </div>

                <button type="submit" class="w-full btn-primary py-3">
                    Entrar
                </button>
            </form>

            <div class="mt-6 text-center text-sm text-contrast-muted">
                Não tem conta?
                <router-link
                    to="/register"
                    class="text-primary-600 hover:text-primary-700 hover:underline font-medium transition-colors"
                >
                    Registar aqui
                </router-link>
            </div>

            <div
                class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm"
            >
                <p class="font-semibold mb-1 text-blue-800 dark:text-blue-200">
                    Demo:
                </p>
                <p class="text-blue-700 dark:text-blue-300">
                    User: user@bisca.com
                </p>
                <p class="text-blue-700 dark:text-blue-300">
                    Admin: admin@bisca.com
                </p>
                <p class="text-blue-700 dark:text-blue-300">
                    Password: qualquer
                </p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/mocks/auth";

const router = useRouter();
const authStore = useAuthStore();

const email = ref("");
const password = ref("");

function handleLogin() {
    authStore.login({ email: email.value, password: password.value });
    router.push("/");
}
</script>
