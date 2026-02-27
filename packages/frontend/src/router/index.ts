import { createRouter, createWebHistory } from "vue-router";
import HomePage from "@/pages/HomePage.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: HomePage,
  },
  {
    path: "/about",
    name: "about",
    component: () => import("@/pages/AboutPage.vue"),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
