/// <reference types="vitest/config" />
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: { port: 5173 },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // pdf.js (~640 kB) is lazy-loaded only when the Resume preview tab opens.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("pdfjs-dist") || id.includes("react-pdf")) return "pdf";
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
          if (id.includes("docx-preview")) return "docx";
          if (id.includes("jszip")) return "zip";
          if (id.includes("node_modules/motion") || id.includes("framer-motion") || id.includes("motion-dom")) return "motion";
          if (id.includes("@radix-ui")) return "radix";
          if (id.includes("react-router")) return "router";
          if (id.includes("node_modules/react-dom") || id.includes("node_modules/react/") || id.includes("scheduler")) return "react";
          return undefined;
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});
