import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/products": "http://localhost:5000",
      "/add":      "http://localhost:5000",
      "/stats":    "http://localhost:5000",
      "/audit":    "http://localhost:5000",
    },
  },
});
