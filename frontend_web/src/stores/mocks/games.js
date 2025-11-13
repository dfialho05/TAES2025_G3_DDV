import { defineStore } from "pinia"
import { ref } from "vue"

export const useGamesStore = defineStore("games", () => {
  const games = ref([
    {
      id: 1,
      variant: "Bisca de 3",
      mode: "Single-player",
      result: "Vitória",
      score: "120-85",
      date: "2024-01-15 14:30",
      duration: "12 min",
    },
    {
      id: 2,
      variant: "Bisca de 9",
      mode: "Multiplayer",
      result: "Derrota",
      score: "95-110",
      date: "2024-01-14 18:20",
      duration: "18 min",
    },
    {
      id: 3,
      variant: "Bisca de 3",
      mode: "Single-player",
      result: "Vitória",
      score: "100-60",
      date: "2024-01-14 10:15",
      duration: "10 min",
    },
    {
      id: 4,
      variant: "Bisca de 9",
      mode: "Multiplayer",
      result: "Vitória",
      score: "115-90",
      date: "2024-01-13 20:45",
      duration: "20 min",
    },
    {
      id: 5,
      variant: "Bisca de 3",
      mode: "Single-player",
      result: "Derrota",
      score: "75-95",
      date: "2024-01-12 16:30",
      duration: "11 min",
    },
  ])

  const leaderboard = ref([
    { rank: 1, nickname: "BiscaMaster", wins: 156, capotes: 42, bandeiras: 89, points: 8520 },
    { rank: 2, nickname: "CardKing", wins: 143, capotes: 38, bandeiras: 76, points: 7890 },
    { rank: 3, nickname: "AcePro", wins: 132, capotes: 35, bandeiras: 71, points: 7340 },
    { rank: 4, nickname: "Player123", wins: 28, capotes: 5, bandeiras: 12, points: 1560 },
    { rank: 5, nickname: "BiscaFan", wins: 98, capotes: 22, bandeiras: 51, points: 5430 },
  ])

  return {
    games,
    leaderboard,
  }
})
