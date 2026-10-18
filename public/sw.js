// ClassHub service worker. README section 17.
// The build (vite.config.ts) replaces VERSION and PRECACHE below, so every deploy
// gets a new cache and phones pick up the new files. Edit the rules, not those two lines.
const VERSION = "dev";
const PRECACHE = [];

const SHELL_CACHE = `classhub-shell-${VERSION}`;
const RUNTIME_CACHE = "classhub-runtime";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("classhub-shell-") && k !== SHELL_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Sheet data: always the network. src/lib/data.ts keeps its own saved copy.
  if (url.hostname.endsWith("google.com") || url.hostname.endsWith("googleusercontent.com")) return;

  // Our own files (pages, JS, CSS, icons): cache first. ?hub=... is ignored when matching,
  // so one cached page serves every hub.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request, { ignoreSearch: true }).then((hit) => hit ?? fetch(request).catch(() => offlineFallback(request))),
    );
    return;
  }

  // Everything else (fonts, ...): network, with the last good copy as a fallback.
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
        }
        return res;
      })
      .catch(() => caches.match(request).then((hit) => hit ?? Response.error())),
  );
});

/** A page we never cached while offline: show the cached 404 page instead of the browser's error. */
function offlineFallback(request) {
  if (request.mode !== "navigate") return Response.error();
  return caches.match(new URL("404.html", self.registration.scope).href).then((hit) => hit ?? Response.error());
}
