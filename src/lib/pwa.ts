// Registers the service worker so pages load offline. README section 17.
// Only in the built site: during `npm run dev` a worker would serve stale files.
import { BASE } from "./links";

export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${BASE}sw.js`, { scope: BASE }).catch((error) => console.warn("ClassHub: offline mode unavailable", error));
  });
}
