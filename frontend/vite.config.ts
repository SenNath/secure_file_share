import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import type { ServerOptions } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    https: (() => {
      if (process.env.NODE_ENV === 'development') {
        const keyPath = "../backend/certificates/server.key";
        const certPath = "../backend/certificates/server.crt";
        
        if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
          return {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath)
          } as ServerOptions['https'];
        }
      }
      return undefined;
    })(),
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
    'process.env': process.env
  }
});
