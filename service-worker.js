const CACHE_NAME = "boratec-v185";

const APP_SHELL = [
    "./",
    "./index.html",
    "./login.html",
    "./manifest.json",
    "./icons/icon-192.png",
    "./icons/icon-512.png",
    "./icons/icon-maskable-512.png",
    "./icons/apple-touch-icon.png"
];

self.addEventListener("install", event => {

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
    );

    self.skipWaiting();
});


self.addEventListener("activate", event => {

    event.waitUntil(
        caches.keys()
            .then(keys =>
                Promise.all(
                    keys
                        .filter(key => key !== CACHE_NAME)
                        .map(key => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    );
});


self.addEventListener("fetch", event => {

    const request = event.request;

    if (request.method !== "GET") {
        return;
    }

    const url = new URL(request.url);

    if (url.origin !== self.location.origin) {
        return;
    }


    // Sempre buscar HTML mais recente.
    if (request.mode === "navigate") {

        event.respondWith(
            fetch(request, { cache: "no-store" })
                .then(response => {

                    const copy = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache =>
                            cache.put(request, copy)
                        );

                    return response;
                })
                .catch(async () => {

                    const cached =
                        await caches.match(request);

                    return cached ||
                        caches.match("./index.html");
                })
        );

        return;
    }


    // app.js, manifest e service-worker:
    // nunca deixar o PWA preso em versão antiga.
    if (
        url.pathname.endsWith("/app.js") ||
        url.pathname.endsWith("/manifest.json") ||
        url.pathname.endsWith("/service-worker.js")
    ) {

        event.respondWith(
            fetch(request, { cache: "no-store" })
                .then(response => {

                    const copy = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache =>
                            cache.put(request, copy)
                        );

                    return response;
                })
                .catch(() =>
                    caches.match(request)
                )
        );

        return;
    }


    // Ícones e arquivos estáticos podem usar cache.
    event.respondWith(
        caches.match(request)
            .then(cached => {

                if (cached) {
                    return cached;
                }

                return fetch(request)
                    .then(response => {

                        const copy =
                            response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache =>
                                cache.put(request, copy)
                            );

                        return response;
                    });
            })
    );
});
