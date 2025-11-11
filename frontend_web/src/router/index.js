import { createRouter, createWebHistory } from "vue-router";
import HomePage from "@/pages/home/HomePage.vue";
import SingleplayerGamePage from "@/pages/game/SingleplayerGamePage.vue";
import AboutPage from "@/pages/about/AboutPage.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomePage,
    },
    {
      path: "/games",
      children: [
        {
          path: "singleplayer",
          name: "singleplayer",
          component: SingleplayerGamePage,
        },
      ],
    },
    {
      path: "/about",
      name: "about",
      component: AboutPage,
    },
  ],
});

export default router;
