import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

// Every .html file in app/ becomes its own page in the build.
// Add a new page = add app/<name>.html (+ src/pages/<name>.ts). Nothing to change here.
const appPages = Object.fromEntries(
  readdirSync(resolve(root, "app"))
    .filter((file) => file.endsWith(".html"))
    .map((file) => [`app/${file.replace(".html", "")}`, resolve(root, "app", file)]),
);

export default defineConfig({
  // GitHub Pages serves the site from /<repo-name>/.
  // The deploy workflow sets BASE_PATH=/classhub/. Locally it's "/".
  base: process.env.BASE_PATH ?? "/",
  plugins: [tailwindcss()],
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
