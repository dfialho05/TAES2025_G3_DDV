import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/mocks/auth";

// Layouts
import DefaultLayout from "../components/layouts/DefaultLayout.vue";
import AdminLayout from "../components/layouts/AdminLayout.vue";

// Views
import Home from "../views/Home.vue";
import Login from "../views/Login.vue";
import Register from "../views/Register.vue";
import Profile from "../views/Profile.vue";
import DeleteAccount from "../views/DeleteAccount.vue";
import Coins from "../views/Coins.vue";
import Play from "../views/Play.vue";
import Game from "../views/Game.vue";
import GameTest from "../views/GameTest.vue";
import GameSimple from "../views/GameSimple.vue";
import CardDemo from "../views/CardDemo.vue";
import History from "../views/History.vue";
import Leaderboards from "../views/Leaderboards.vue";
import Statistics from "../views/Statistics.vue";
import Spectator from "../views/Spectator.vue";

// Admin Views
import AdminDashboard from "../views/admin/Dashboard.vue";
import AdminUsers from "../views/admin/Users.vue";
import AdminTransactions from "../views/admin/Transactions.vue";
import AdminGames from "../views/admin/Games.vue";
import AdminStatistics from "../views/admin/Statistics.vue";

const routes = [
  {
    path: "/",
    component: DefaultLayout,
    children: [
      { path: "", name: "home", component: Home },
      { path: "login", name: "login", component: Login },
      { path: "register", name: "register", component: Register },
      {
        path: "profile",
        name: "profile",
        component: Profile,
        meta: { requiresAuth: true },
      },
      {
        path: "delete-account",
        name: "delete-account",
        component: DeleteAccount,
        meta: { requiresAuth: true },
      },
      {
        path: "coins",
        name: "coins",
        component: Coins,
        meta: { requiresAuth: true },
      },
      {
        path: "play",
        name: "play",
        component: Play,
        meta: { requiresAuth: true },
      },
      {
        path: "game/:id",
        name: "game",
        component: Game,
        meta: { requiresAuth: true },
      },
      {
        path: "game",
        name: "game-test",
        component: Game,
      },
      {
        path: "game-test",
        name: "game-test-simple",
        component: GameTest,
      },
      {
        path: "game-simple",
        name: "game-simple",
        component: GameSimple,
      },
      {
        path: "card-demo",
        name: "card-demo",
        component: CardDemo,
      },
      {
        path: "history",
        name: "history",
        component: History,
        meta: { requiresAuth: true },
      },
      { path: "leaderboards", name: "leaderboards", component: Leaderboards },
      { path: "statistics", name: "statistics", component: Statistics },
      { path: "spectator", name: "spectator", component: Spectator },
    ],
  },
  {
    path: "/admin",
    component: AdminLayout,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: "", redirect: "/admin/dashboard" },
      { path: "dashboard", name: "admin-dashboard", component: AdminDashboard },
      { path: "users", name: "admin-users", component: AdminUsers },
      {
        path: "transactions",
        name: "admin-transactions",
        component: AdminTransactions,
      },
      { path: "games", name: "admin-games", component: AdminGames },
      {
        path: "statistics",
        name: "admin-statistics",
        component: AdminStatistics,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next("/login");
  } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next("/");
  } else {
    next();
  }
});

export default router;
