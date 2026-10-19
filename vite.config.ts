import { defineConfig, type Plugin } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

// Every .html file in app/ becomes its own page in the build.
// Add a new page = add app/<name>.html (+ src/pages/<name>.ts). Nothing to change here.
const appPages = Object.fromEntries(
  readdirSync(resolve(root, "app"))
    .filter((file) => file.endsWith(".html"))
    .map((file) => [`app/${file.replace(".html", "")}`, resolve(root, "app", file)]),
);

/** Adds the logo (browser tab icon), manifest and home-screen icon to every page, with the right base path. */
function pwaTags(base: string): Plugin {
  return {
    name: "classhub-pwa-tags",
    transformIndexHtml: () => [
      { tag: "link", attrs: { rel: "icon", type: "image/svg+xml", href: `${base}logo.svg` }, injectTo: "head" },
      { tag: "link", attrs: { rel: "icon", type: "image/png", sizes: "32x32", href: `${base}icons/favicon-32.png` }, injectTo: "head" },
      { tag: "link", attrs: { rel: "manifest", href: `${base}manifest.json` }, injectTo: "head" },
      { tag: "link", attrs: { rel: "apple-touch-icon", href: `${base}icons/apple-touch-icon.png` }, injectTo: "head" },
      { tag: "meta", attrs: { name: "apple-mobile-web-app-capable", content: "yes" }, injectTo: "head" },
    ],
  };
}

/** After the build: list every file in dist/ and a fresh VERSION inside sw.js, so each deploy updates phones. */
function serviceWorker(base: string): Plugin {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(resolve(dir, e.name)) : [resolve(dir, e.name)]));
  return {
    name: "classhub-service-worker",
    apply: "build",
    closeBundle() {
      const dist = resolve(root, "dist");
      const files = walk(dist)
        .map((f) => relative(dist, f).replaceAll("\\", "/"))
        .filter((f) => f !== "sw.js" && !f.startsWith("logos/") && /\.(html|js|css|json|png|svg|ico|woff2?)$/.test(f));
      const path = resolve(dist, "sw.js");
      const source = readFileSync(path, "utf8")
        .replace('const VERSION = "dev";', `const VERSION = "${Date.now().toString(36)}";`)
        .replace("const PRECACHE = [];", `const PRECACHE = ${JSON.stringify([base, ...files.map((f) => base + f)])};`);
      writeFileSync(path, source);
    },
  };
}

const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  // GitHub Pages serves the site from /<repo-name>/.
  // The deploy workflow sets BASE_PATH=/classhub/. Locally it's "/".
  base,
  plugins: [tailwindcss(), pwaTags(base), serviceWorker(base)],
  build: {
    rollupOptions: {
      input: {
        landing: resolve(root, "index.html"),
        school: resolve(root, "school.html"),
        notFound: resolve(root, "404.html"),
        ...appPages,
      },
    },
  },
});
