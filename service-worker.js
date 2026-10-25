self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("studypilot-v1").then((cache) => {
      return cache.addAll(["./", "./index.html", "./styles.css", "./app.js", "./manifest.webmanifest", "./icon.svg"]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
