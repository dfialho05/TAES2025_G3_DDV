<template>
    <div
        class="min-h-[calc(100vh-16rem)] flex items-center justify-center py-12 px-4"
    >
        <div class="max-w-md w-full card p-8 shadow-lg">
            <h1 class="text-3xl font-bold text-center mb-8 text-contrast">
                Criar Conta
            </h1>

            <form @submit.prevent="handleRegister" class="space-y-6">
                <div>
                    <label class="block text-sm font-medium mb-2 text-contrast"
                        >Email</label
                    >
                    <input
                        v-model="formData.email"
                        type="email"
                        required
                        class="input"
                    />
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2 text-contrast"
                        >Nickname</label
                    >
                    <input
                        v-model="formData.nickname"
                        type="text"
                        required
                        class="input"
                    />
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2 text-contrast"
                        >Nome</label
                    >
                    <input
                        v-model="formData.name"
                        type="text"
                        required
                        class="input"
                    />
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2 text-contrast"
                        >Password</label
                    >
                    <input
                        v-model="formData.password"
                        type="password"
                        required
                        class="input"
                    />
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2 text-contrast"
                        >Avatar URL (opcional)</label
                    >
                    <input
                        v-model="formData.avatar"
                        type="text"
                        class="input"
                        placeholder="https://exemplo.com/avatar.jpg"
                    />
                </div>

                <button type="submit" class="w-full btn-primary py-3">
                    Registar
                </button>
            </form>

            <div class="mt-6 text-center text-sm text-contrast-muted">
                Já tem conta?
                <router-link
                    to="/login"
                    class="text-primary-600 hover:text-primary-700 hover:underline font-medium transition-colors"
                >
                    Fazer login
                </router-link>
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

const formData = ref({
    email: "",
    nickname: "",
    name: "",
    password: "",
    avatar: "",
});

function handleRegister() {
    authStore.register(formData.value);
    router.push("/");
}
</script>
