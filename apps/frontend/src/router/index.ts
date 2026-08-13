import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/connexion",
      name: "connexion",
      component: () => import("@/views/AuthView.vue"),
      meta: { public: true },
    },
    {
      path: "/",
      name: "accueil",
      component: () => import("@/views/HomeView.vue"),
    },
    {
      path: "/generer/:type(scenario|parcours)",
      name: "cadrage",
      component: () => import("@/views/CadrageFormView.vue"),
      props: true,
    },
    {
      path: "/generation/:jobId",
      name: "generation-progression",
      component: () => import("@/views/GenerationProgressView.vue"),
      props: true,
    },
    {
      path: "/documents/:id",
      name: "document-apercu",
      component: () => import("@/views/DocumentPreviewView.vue"),
      props: true,
    },
    {
      path: "/abonnement",
      name: "abonnement",
      component: () => import("@/views/SubscriptionView.vue"),
    },
    {
      path: "/ressources",
      name: "ressources",
      component: () => import("@/views/ResourcesView.vue"),
    },
    {
      path: "/ressources/nouvelle",
      name: "ressource-nouvelle",
      component: () => import("@/views/SubmitResourceView.vue"),
    },
    {
      path: "/moderation",
      name: "moderation",
      component: () => import("@/views/ModerationQueueView.vue"),
    },
  ],
});

/**
 * Garde d'accès global : conforme au cahier des charges (« accès à
 * toute fonctionnalité conditionné à un compte utilisateur »), toute
 * route hors `meta.public` exige une session active.
 */
router.beforeEach((to) => {
  const authStore = useAuthStore();
  if (!to.meta.public && !authStore.estConnecte) {
    return { name: "connexion", query: { redirect: to.fullPath } };
  }
  return true;
});

export default router;
