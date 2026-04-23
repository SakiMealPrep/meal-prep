const CACHE_NAME = "smart-meal-planner-v1";
const APP_SHELL = [
  "/",
  "/index.html",
  "/recipes.html",
  "/meal-plan.html",
  "/shopping-list.html",
  "/settings.html",
  "/about.html",
  "/add-recipe.html",
  "/edit-recipe.html",
  "/inventory.html",
  "/css/style.css",
  "/js/main.js",
  "/js/theme.js",
  "/js/settings.js",
  "/js/pwa.js",
  "/js/supabase.js",
  "/js/recipes.js",
  "/js/meal-plan.js",
  "/js/shopping.js",
  "/js/inventory.js",
  "/js/add-recipe.js",
  "/assets/icons/icon-192.png",
  "/assets/icons/icon-512.png",
  "/assets/icons/icon-32.png",
  "/assets/icons/icon-180.png",
  "/manifest.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/index.html")))
  );
});
