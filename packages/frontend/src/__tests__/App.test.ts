import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import { createRouter, createWebHistory } from "vue-router";
import App from "../App.vue";
import AboutPage from "../pages/AboutPage.vue";
import HomePage from "../pages/HomePage.vue";

function createTestRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: "/", component: HomePage },
      { path: "/about", component: AboutPage },
    ],
  });
}

describe("App", () => {
  it("renders the app with header navigation", async () => {
    const router = createTestRouter();
    router.push("/");
    await router.isReady();

    render(App, {
      global: {
        plugins: [router],
      },
    });

    const voiceBoxElements = screen.getAllByText("Voice Box");
    expect(voiceBoxElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("About")).toBeInTheDocument();
  });

  it("renders the home page content at root path", async () => {
    const router = createTestRouter();
    router.push("/");
    await router.isReady();

    render(App, {
      global: {
        plugins: [router],
      },
    });

    expect(screen.getByText("Anonymous voice box for organizations.")).toBeInTheDocument();
  });
});
