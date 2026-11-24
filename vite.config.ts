import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        background: path.resolve(__dirname, "src/background/serviceWorker.ts"),
      },
      output: {
        entryFileNames: (chunkInfo) =>
          chunkInfo.name === "background"
            ? "background.js"
            : "assets/[name]-[hash].js",
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("firebase")) {
              return "firebase";
            }
            if (id.includes("react") || id.includes("react-dom")) {
              return "react-vendor";
            }
            if (id.includes("@dnd-kit")) {
              return "dnd";
            }
            if (
              id.includes("@fortawesome/fontawesome-svg-core") ||
              id.includes("@fortawesome/react-fontawesome")
            ) {
              return "fontawesome-core";
            }
            // Keep the full solid icon barrel in its own lazy chunk when dynamically imported.
            if (id.includes("@fortawesome/free-solid-svg-icons/index")) {
              return "fontawesome-solid-pack";
            }
            if (id.includes("@fortawesome/free-solid-svg-icons")) {
              return "fontawesome-core";
            }
            return "vendor";
          }
        },
      },
    },
  },
});
