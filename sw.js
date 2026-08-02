// Service worker minimal pour Cinétoile : permet à la page de se réafficher
// même en cas de coupure réseau très brève, et donne un vrai comportement
// "d'application installée" sur iPhone/Android.

const CACHE_NAME = 'cinetoile-cache-v1';
const FILES_TO_CACHE = ['./', './index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Stratégie "réseau d'abord, secours sur le cache" : on privilégie toujours
// la dernière version en ligne (pour ne jamais servir une version périmée
// du jeu), et on ne se rabat sur la copie locale qu'en cas de coupure réseau.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
