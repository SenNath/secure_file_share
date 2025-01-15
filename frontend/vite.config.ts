import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    https: {
      key: fs.readFileSync("../backend/certificates/server.key"),
      cert: fs.readFileSync("../backend/certificates/server.crt"),
    },
    proxy: {
      '/api': {
        target: 'https://localhost:8000',
        secure: false,
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // This adds proper shim for process.env
    'process.env': process.env
  }
});
