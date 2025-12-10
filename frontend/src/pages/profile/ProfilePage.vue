<template>
  <div class="max-w-7xl mx-auto p-6">
    <div v-if="loadingUser" class="text-center py-20">
      <div
        class="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
      ></div>
      <p class="text-lg text-gray-500 dark:text-gray-300 font-medium">A carregar perfil...</p>
    </div>

    <div v-else-if="displayedUser" class="space-y-8 animate-in fade-in duration-500">
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-gray-700">
        <div class="flex flex-col md:flex-row gap-8 items-center md:items-start">
          <div class="shrink-0 relative group">
            <UserAvatar
              :user="displayedUser"
              size="xl"
              class="border-4 border-white shadow-lg"
              :debug="true"
            />
          </div>

          <div class="flex-1 text-center md:text-left space-y-2 pt-2">
            <div>
              <h1 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-gray-100 ">
                {{ displayedUser.name }}
              </h1>
              <p v-if="displayedUser.nickname" class="text-lg text-primary font-semibold">
                @{{ displayedUser.nickname }}
              </p>
            </div>
            <p class="text-gray-500 dark:text-gray-300 font-mono text-sm bg-slate-50 dark:bg-gray-700 inline-block px-2 py-1 rounded">
              {{ displayedUser.email }}
            </p>

            <div v-if="isOwner" class="pt-4 flex flex-wrap gap-3 justify-center md:justify-start">
              <div v-if="!files">
                <Button
                  @click="open"
                  variant="outline"
                  size="sm"
                  class="bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-600 text-slate-700 dark:text-gray-200"
                >
                  📷 Alterar Foto
                </Button>
              </div>
              <div v-else class="flex gap-2">
                <Button @click="uploadPhoto" size="sm">Guardar Foto</Button>
                <Button
                  @click="reset"
                  variant="ghost"
                  size="sm"
                  class="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900"
                  >Cancelar</Button
                >
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-slate-100 dark:border-gray-700 shadow-sm flex items-center gap-4"
        >
          <div class="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M2 20h20" />
              <path d="m16 8-8 8" />
              <path d="m10.5 5.5 8 8" />
              <path d="M4 14.5l8-8" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-slate-500 font-medium uppercase tracking-wider">Partidas</p>
            <div
              v-if="statisticsStore.isLoading"
              class="h-6 w-16 bg-slate-100 animate-pulse rounded mt-1"
            ></div>
            <p v-else class="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {{ statisticsStore.stats.total_matches }}
            </p>
          </div>
        </div>

        <div
          class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-slate-100 dark:border-gray-700 shadow-sm flex items-center gap-4"
        >
          <div class="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-slate-500 font-medium uppercase tracking-wider">Vitórias</p>
            <div
              v-if="statisticsStore.isLoading"
              class="h-6 w-16 bg-slate-100 animate-pulse rounded mt-1"
            ></div>
            <p v-else class="text-2xl font-bold text-emerald-600">
              {{ statisticsStore.stats.total_wins }}
            </p>
          </div>
        </div>

        <div
          class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-slate-100 dark:border-gray-700 shadow-sm flex items-center gap-4"
        >
          <div class="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 20V10" />
              <path d="M18 20V4" />
              <path d="M6 20v-4" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-slate-500 font-medium uppercase tracking-wider">Win Rate</p>
            <div
              v-if="statisticsStore.isLoading"
              class="h-6 w-16 bg-slate-100 animate-pulse rounded mt-1"
            ></div>
            <p v-else class="text-2xl font-bold text-amber-600">
              {{ statisticsStore.stats.win_rate }}%
            </p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div :class="isOwner ? 'lg:col-span-8' : 'lg:col-span-12'" class="space-y-8">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white dark:bg-gray-800 rounded-xl border shadow-sm h-full">
              <div class="p-4 border-b bg-slate-50/50 dark:bg-gray-700 flex justify-between items-center">
                <h3 class="font-bold text-gray-900 flex items-center gap-2">🎲 Últimos Jogos</h3>
              </div>

              <div class="divide-y divide-slate-50 dark:divide-gray-700">
                <div v-if="gamesStore.loadingRecentGames" class="p-8 text-center text-gray-400 dark:text-gray-300 text-sm">
                  <div class="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                  A carregar jogos...
                </div>
                <div v-else-if="gamesStore.errors.recentGames" class="p-8 text-center text-red-400 text-sm">
                  <div class="mb-2">⚠️ {{ gamesStore.errors.recentGames }}</div>
                  <button @click="loadProfileData" class="text-xs underline hover:no-underline">
                    Tentar novamente
                  </button>
                </div>
                <div v-else-if="gamesStore.recentGames.length === 0" class="p-8 text-center text-gray-400 dark:text-gray-300 text-sm">
                  <div class="mb-2">🎮</div>
                  <div class="font-medium">Nenhum jogo encontrado</div>
                  <div class="text-xs mt-1 text-gray-500 dark:text-gray-300 ">
                    Este utilizador ainda não jogou jogos individuais
                  </div>
                </div>

                <div
                  v-for="game in gamesStore.recentGames"
                  :key="game.id"
                  class="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div class="flex items-center gap-4">
                    <span
                      class="w-3 h-3 rounded-full ring-2 ring-white shadow-sm shrink-0"
                      :class="game.status === 'Ended' ? 'bg-emerald-500' : 'bg-amber-400'"
                      :title="game.status"
                    ></span>
                    <div class="flex flex-col min-w-0 flex-1 text-gray-900 dark:text-gray-100">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-sm truncate">
                          vs
                          <RouterLink
                            v-if="game.opponent?.id"
                            :to="{ name: 'profile', params: { id: game.opponent.id } }"
                            class="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-all duration-200 cursor-pointer bg-blue-50 dark:bg-blue-900 hover:bg-blue-100 dark:hover:bg-blue-800 px-1 py-0.5 rounded inline-flex items-center gap-1"
                          >
                            {{ game.opponent.nickname || game.opponent.name }}
                          </RouterLink>
                          <span v-else class="font-bold">
                            {{ game.opponent ? game.opponent.nickname || game.opponent.name : 'Desconhecido' }}
                          </span>
                        </span>
                        <span
                          class="text-[9px] text-slate-400 dark:text-gray-400 uppercase bg-slate-100 dark:bg-gray-700 px-1.5 py-0.5 rounded shrink-0"
                        >{{ game.type || 'Standard' }}</span>
                      </div>
                      <div class="text-xs text-slate-500 dark:text-gray-400 mb-1">
                        {{ formatDate(game.began_at) }}
                      </div>
                      <div class="text-xs flex items-center gap-2" v-if="getGamePoints(game).hasPoints">
                        <span class="flex items-center gap-1">
                          <span class="w-2 h-2 rounded-full" :class="game.is_winner === null ? 'bg-amber-500' : 'bg-blue-500'"></span>
                          <span class="font-semibold" :class="game.is_winner === null ? 'text-amber-700' : 'text-blue-700'">{{ getGamePoints(game).userPoints }}</span>
                          <span class="text-slate-600 dark:text-gray-300">pts</span>
                        </span>
                        <span class="text-slate-400 dark:text-gray-500">•</span>
                        <span class="flex items-center gap-1">
                          <span class="w-2 h-2 rounded-full" :class="game.is_winner === null ? 'bg-amber-500' : 'bg-gray-500'"></span>
                          <span class="font-semibold" :class="game.is_winner === null ? 'text-amber-700' : 'text-gray-700'">{{ getGamePoints(game).opponentPoints }}</span>
                          <span class="text-slate-500 dark:text-gray-300">pts</span>
                        </span>
                      </div>
                      <div v-else class="text-xs italic text-gray-500 dark:text-gray-300">Pontos não disponíveis</div>
                    </div>
                  </div>

                  <div class="text-right">
                    <span class="text-xs font-bold px-2 py-1 rounded border"
                      :class="game.is_winner === true
                        ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900 dark:text-green-300 dark:border-green-700'
                        : game.is_winner === false
                          ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900 dark:text-red-300 dark:border-red-700'
                          : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-700'">
                      {{ game.is_winner === true ? 'VITÓRIA' : game.is_winner === false ? 'DERROTA' : 'EMPATE' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl border shadow-sm h-full">
              <div class="p-4 border-b bg-slate-50/50 dark:bg-gray-700 flex justify-between items-center">
                <h3 class="font-bold text-gray-900 flex items-center gap-2">🏆 Últimas Partidas</h3>
              </div>

              <div class="divide-y divide-slate-50 dark:divide-gray-700">
                <div v-if="matchesStore.loadingRecentMatches" class="p-8 text-center text-gray-400 dark:text-gray-300 text-sm">
                  <div class="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                  A carregar partidas...
                </div>

                <div v-else-if="matchesStore.errors.recentMatches" class="p-8 text-center text-red-400 text-sm">
                  <div class="mb-2">⚠️ {{ matchesStore.errors.recentMatches }}</div>
                  <button @click="loadProfileData" class="text-xs underline hover:no-underline">
                    Tentar novamente
                  </button>
                </div>

                <div v-else-if="matchesStore.recentMatches.length === 0" class="p-8 text-center text-gray-400 dark:text-gray-300 text-sm">
                  <div class="mb-2">🛡️</div>
                  <div class="font-medium">Nenhuma partida encontrada</div>
                  <div class="text-xs mt-1 text-gray-300 dark:text-gray-500">
                    Este utilizador ainda não participou em partidas
                  </div>
                </div>

                <div
                  v-for="match in matchesStore.recentMatches"
                  :key="match.id"
                  class="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors rounded"
                  @click="toggleMatch(match.id)"
                >
                  <div
                    class="flex items-center justify-between p-3 cursor-pointer bg-white dark:bg-gray-800"
                    @click="toggleMatch(match.id)"
                  >
                    <div class="flex items-center gap-3">
                      <div
                        class="text-slate-400 transition-transform duration-200"
                        :class="{ 'rotate-180': expandedMatchId === match.id }"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </div>

                      <div class="flex flex-col">
                        <div class="flex items-center gap-2">
                          <span
                            class="font-bold text-xs uppercase tracking-wider"
                            :class="
                              isWinner(match) === true
                                ? 'text-green-600'
                                : isWinner(match) === false
                                  ? 'text-red-500'
                                  : 'text-amber-600'
                            "
                          >
                            {{
                              isWinner(match) === true
                                ? 'VITÓRIA'
                                : isWinner(match) === false
                                  ? 'DERROTA'
                                  : 'EMPATE'
                            }}
                          </span>
                          <span
                            class="text-[9px] text-slate-400 dark:text-gray-400 uppercase bg-slate-100 dark:bg-gray-700 px-1.5 py-0.5 rounded shrink-0"
                          >
                            {{ match.type || 'Standard' }}
                          </span>
                        </div>
                        <div class="text-xs text-slate-500 dark:text-gray-400 mb-1">
                          {{ formatDate(match.began_at) }}
                        </div>
                        <div class="text-xs italic text-gray-400 dark:text-gray-500">
                          {{ getMatchResultDescription(match) }}
                        </div>
                      </div>
                    </div>

                    <div class="text-right">
                      <span
                        class="text-xs font-bold px-2 py-1 rounded border"
                        :class="isWinner(match) === true
                          ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900 dark:text-green-300 dark:border-green-700'
                          : isWinner(match) === false
                            ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900 dark:text-red-300 dark:border-red-700'
                            : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-700'"
                      >
                        {{ isWinner(match) === true ? 'VITÓRIA' : isWinner(match) === false ? 'DERROTA' : 'EMPATE' }}
                      </span>
                    </div>
                  </div>

                  <div
                    v-if="expandedMatchId === match.id"
                    class="bg-slate-50/80 border-t border-slate-100 dark:border-gray-700 p-3 space-y-2 animate-in slide-in-from-top-1 duration-200"
                  >
                    <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Detalhes dos Jogos
                    </h4>

                    <div v-if="match.games && match.games.length > 0" class="space-y-2">
                      <div
                        v-for="g in match.games"
                        :key="g.id"
                        class="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
                      >
                        <div class="flex items-center gap-3">
                          <span
                            class="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm shrink-0"
                            :class="g.status === 'Ended' ? 'bg-emerald-500' : 'bg-amber-400'"
                            :title="g.status"
                          ></span>
                          <div class="flex flex-col min-w-0 flex-1">
                            <div class="flex items-center gap-2 mb-1">
                              <span class="text-sm text-slate-800 truncate">
                                Bisca vs
                                <RouterLink
                                  v-if="g.opponent?.id"
                                  :to="{ name: 'profile', params: { id: g.opponent.id } }"
                                  class="font-bold text-blue-600 hover:text-blue-800 hover:underline transition-all duration-200 cursor-pointer bg-blue-50 hover:bg-blue-100 px-1 py-0.5 rounded inline-flex items-center gap-1"
                                  title="Ver perfil de {{ g.opponent.nickname || g.opponent.name }}"
                                >
                                  {{ g.opponent.nickname || g.opponent.name }}
                                  <svg
                                    class="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                      stroke-width="2"
                                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                    />
                                  </svg>
                                </RouterLink>
                                <span v-else class="font-bold">
                                  {{
                                    g.opponent
                                      ? g.opponent.nickname || g.opponent.name
                                      : 'Desconhecido'
                                  }}
                                </span>
                              </span>
                              <span
                                class="text-[9px] text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded shrink-0"
                              >
                                {{ g.type || 'Standard' }}
                              </span>
                            </div>
                            <div class="text-xs text-slate-500 mb-1">
                              {{ formatDate(g.began_at) }}
                            </div>
                            <div
                              class="text-xs flex items-center gap-2"
                              v-if="getGamePoints(g).hasPoints"
                            >
                              <span class="flex items-center gap-1">
                                <span
                                  class="w-2 h-2 rounded-full"
                                  :class="g.is_winner === null ? 'bg-amber-500' : 'bg-blue-500'"
                                ></span>
                                <span
                                  class="font-semibold"
                                  :class="g.is_winner === null ? 'text-amber-700' : 'text-blue-700'"
                                  >{{ getGamePoints(g).userPoints }}</span
                                >
                                <span class="text-slate-600">pts</span>
                              </span>
                              <span class="text-slate-400">•</span>
                              <span class="flex items-center gap-1">
                                <span
                                  class="w-2 h-2 rounded-full"
                                  :class="g.is_winner === null ? 'bg-amber-500' : 'bg-gray-500'"
                                ></span>
                                <span
                                  class="font-semibold"
                                  :class="g.is_winner === null ? 'text-amber-700' : 'text-gray-700'"
                                  >{{ getGamePoints(g).opponentPoints }}</span
                                >
                                <span class="text-slate-600">pts</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div class="text-right">
                          <span
                            class="text-xs font-bold px-2 py-1 rounded border"
                            :class="
                              g.is_winner === true
                                ? 'bg-green-50 text-green-700 border-green-100'
                                : g.is_winner === false
                                  ? 'bg-red-50 text-red-700 border-red-100'
                                  : 'bg-amber-50 text-amber-700 border-amber-100'
                            "
                          >
                            {{
                              g.is_winner === true
                                ? 'VITÓRIA'
                                : g.is_winner === false
                                  ? 'DERROTA'
                                  : 'EMPATE'
                            }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="isOwner" class="lg:col-span-4 space-y-6">
          <div class="bg-white dark:bg-gray-800 rounded-xl border shadow-sm sticky top-6 border-slate-200 dark:border-gray-700">
            <div class="p-5 border-b bg-slate-50/50 dark:bg-gray-700/50">
              <h3 class="font-semibold text-lg text-slate-800 dark:text-gray-100">Editar Dados</h3>
              <p class="text-sm text-slate-500 dark:text-gray-300 mt-0.5">Atualiza as tuas informações</p>
            </div>

            <div class="p-5 space-y-4">
              <div class="space-y-1.5">
                <Label for="name" class="text-xs uppercase text-slate-500 dark:text-gray-400 font-semibold tracking-wider">Nome</Label>
                <Input id="name" v-model="formData.name" class="bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100"/>
              </div>

              <div class="space-y-1.5">
                <Label for="email" class="text-xs uppercase text-slate-500 dark:text-gray-400 font-semibold tracking-wider">Email</Label>
                <Input id="email" v-model="formData.email" type="email" class="bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100"/>
              </div>

              <div class="pt-4 space-y-3">
                <Button @click="saveProfile" class="w-full font-semibold shadow-sm">Guardar Alterações</Button>

                <div v-if="authStore.currentUser?.type !== 'A'" class="pt-2 border-t border-slate-100 dark:border-gray-700">
                  <Button @click="confirmDelete" variant="ghost" class="w-full text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 text-sm h-9">
                    Eliminar Conta
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <div v-else class="text-center py-20">
      <h2 class="text-2xl font-bold text-gray-800">Utilizador não encontrado</h2>
      <Button @click="router.push('/')" variant="link" class="mt-4 text-primary"
        >Voltar à Home</Button
      >
    </div>
  </div>
</template>

<script setup>
import { ref, inject, computed, watch, onUnmounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAPIStore } from '@/stores/api'
import { useMatchesStore } from '@/stores/matches'
import { useGamesStore } from '@/stores/games'
import { useStatisticsStore } from '@/stores/statistics'
import { useFileDialog } from '@vueuse/core'
import { toast } from 'vue-sonner'
import { getErrorMessage, errorLogger, safeAsync } from '@/utils/errorHandling'
import axios from 'axios'

// Componentes UI
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import UserAvatar from '@/components/UserAvatar.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const apiStore = useAPIStore()
const matchesStore = useMatchesStore()
const gamesStore = useGamesStore()
const statisticsStore = useStatisticsStore()

const serverBaseURL = inject('serverBaseURL')
const apiBaseURL = inject('apiBaseURL')

// --- Estados ---
const displayedUser = ref(null)
const loadingUser = ref(true)
const formData = ref({ name: '', email: '' })
const expandedMatchId = ref(null)

// --- Computed ---
const isOwner = computed(() => {
  return (
    authStore.currentUser &&
    displayedUser.value &&
    authStore.currentUser.id === displayedUser.value.id
  )
})

// --- Ação Acordeão ---
const toggleMatch = (matchId) => {
  expandedMatchId.value = expandedMatchId.value === matchId ? null : matchId
}

// --- Função para carregar dados do perfil ---
const loadProfileData = async () => {
  const userId = route.params.id
  if (!userId) return

  errorLogger.info('Iniciando carregamento dos dados do perfil', { userId })

  // Limpar erros anteriores
  gamesStore.clearErrors()
  matchesStore.clearErrors()

  // 1. Carregar Estatísticas (NOVO)
  statisticsStore.fetchUserStats(userId)

  // Usar safeAsync para tratamento robusto de erros
  const [gamesError] = await safeAsync(
    () => gamesStore.fetchRecentGames(userId),
    'Fetch recent games',
  )

  const [matchesError] = await safeAsync(
    () => matchesStore.fetchRecentMatches(userId),
    'Fetch recent matches',
  )

  // Verificar se conseguiu carregar pelo menos alguns dados
  const hasGames = Array.isArray(gamesStore.recentGames) && gamesStore.recentGames.length > 0
  const hasMatches =
    Array.isArray(matchesStore.recentMatches) && matchesStore.recentMatches.length > 0

  if (!hasGames && !hasMatches) {
    if (gamesError || matchesError) {
      // Houve erros - mostrar toast de erro
      const primaryError = gamesError || matchesError
      toast.error(getErrorMessage(primaryError.original))
    } else {
      // Não há dados mas também não houve erros
      errorLogger.info('Nenhum dado encontrado para o utilizador', { userId })
    }
  } else {
    // Sucesso - fazer logs detalhados
    errorLogger.success('Dados do perfil carregados com sucesso', {
      userId,
      gamesCount: gamesStore.recentGames.length,
      matchesCount: matchesStore.recentMatches.length,
    })

    // --- LOGS DETALHADOS DOS OBJETOS ---
    console.log('[ProfilePage] Dados carregados para userId:', userId)

    if (hasGames) {
      console.log('[ProfilePage] JOGOS RECENTES (Objetos completos):')
      console.table(gamesStore.recentGames)
    } else {
      console.log('[ProfilePage] Nenhum jogo encontrado')
    }

    if (hasMatches) {
      console.log('[ProfilePage] PARTIDAS RECENTES (Objetos completos):')
      console.table(matchesStore.recentMatches)
    } else {
      console.log('[ProfilePage] Nenhuma partida encontrada')
    }
  }
}

// --- Carregamento Principal ---
watch(
  () => route.params.id,
  async (newId) => {
    if (!newId) return

    loadingUser.value = true
    displayedUser.value = null
    expandedMatchId.value = null

    // Reset das estatísticas antes de carregar novo utilizador
    statisticsStore.resetStats()

    try {
      // 1. Carregar User
      if (authStore.currentUser && authStore.currentUser.id == newId) {
        displayedUser.value = authStore.currentUser
      } else {
        const url = apiBaseURL ? `${apiBaseURL}/users/${newId}` : `/users/${newId}`
        const response = await axios.get(url)
        displayedUser.value = response.data.data || response.data
      }

      // 2. Preencher Form
      if (isOwner.value) {
        formData.value = {
          name: displayedUser.value.name,
          email: displayedUser.value.email,
        }
      }

      // 3. Carregar Históricos (Jogos e Partidas e Stats)
      loadProfileData()
    } catch (err) {
      console.error('Erro profile:', err)
      toast.error('Erro ao carregar perfil.')
    } finally {
      loadingUser.value = false
    }
  },
  { immediate: true },
)

// Limpar ao sair
onUnmounted(() => {
  statisticsStore.resetStats()
})

// --- Helpers ---
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return (
    d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  )
}

const getOpponentName = (match) => {
  if (!displayedUser.value) return '...'

  // Usar os dados pré-processados da store se disponíveis
  if (match.opponent) {
    return match.opponent.nickname || match.opponent.name
  }

  // Fallback para o método original (compatibilidade)
  const myId = displayedUser.value.id
  const op = match.layer1_user_id === myId ? match.player2 : match.player1
  return op ? op.nickname || op.name : 'Desconhecido'
}

const isWinner = (match) => {
  // Usar dados pré-processados se disponíveis
  if (typeof match.is_winner !== 'undefined') {
    return match.is_winner
  }

  // Fallback para o método original
  const winnerId = match.winner_user_id || match.winner?.id
  return winnerId === displayedUser.value?.id
}

const getGamePoints = (game) => {
  if (
    !displayedUser.value ||
    game.player1_points === null ||
    game.player2_points === null ||
    game.player1_points === undefined ||
    game.player2_points === undefined
  ) {
    return { userPoints: 0, opponentPoints: 0, hasPoints: false }
  }

  const isPlayer1 = game.player1_id == displayedUser.value.id

  if (isPlayer1) {
    return {
      userPoints: game.player1_points || 0,
      opponentPoints: game.player2_points || 0,
      hasPoints: true,
    }
  } else {
    return {
      userPoints: game.player2_points || 0,
      opponentPoints: game.player1_points || 0,
      hasPoints: true,
    }
  }
}

const getMatchResultDescription = (match) => {
  if (!match.match_result) return ''

  const parts = match.match_result.split('-')
  if (parts.length === 2) {
    return `${parts[0]} vitórias, ${parts[1]} derrotas`
  } else if (parts.length === 3) {
    return `${parts[0]} vitórias, ${parts[1]} derrotas, ${parts[2]} empates`
  }
  return match.match_result
}

// --- Edição ---
const { files, open, reset } = useFileDialog({ accept: 'image/*', multiple: false })

const uploadPhoto = async () => {
  if (!files.value || !isOwner.value) return

  const [error] = await safeAsync(async () => {
    const response = await apiStore.uploadProfilePhoto(files.value[0])
    const filename = response.data.filename || response.data.location || response.data
    if (filename) {
      await apiStore.patchUserPhoto(authStore.currentUser.id, filename)
      await authStore.getUser()
      displayedUser.value = authStore.currentUser
      reset()
    }
  }, 'Upload profile photo')

  if (error) {
    toast.error(getErrorMessage(error.original))
  } else {
    toast.success('Foto atualizada!')
  }
}

const saveProfile = async () => {
  if (!isOwner.value) return

  const [error] = await safeAsync(async () => {
    const userToUpdate = { ...authStore.currentUser, ...formData.value }
    await apiStore.putUser(userToUpdate)
    await authStore.getUser()
    displayedUser.value = authStore.currentUser
  }, 'Save profile')

  if (error) {
    toast.error(getErrorMessage(error.original))
  } else {
    toast.success('Perfil guardado!')
  }
}

const confirmDelete = async () => {
  if (!confirm('Eliminar conta?')) return
  const pwd = prompt('Password:')
  if (!pwd) return

  const [error] = await safeAsync(async () => {
    await authStore.deleteAccount(pwd)
    try {
      await authStore.logout()
    } catch {
      // Silently ignore logout errors during account deletion
    }
    router.push('/')
  }, 'Delete account')

  if (error) {
    toast.error(getErrorMessage(error.original))
  }
}
</script>
