import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import type { ServerOptions } from 'vite';

// Function to safely load SSL certificates
const loadSSLCertificates = () => {
  console.log('Current working directory:', process.cwd());
  console.log('Checking for certificates in /certificates/');
  
  try {
    if (fs.existsSync('/certificates/server.key') && fs.existsSync('/certificates/server.crt')) {
      console.log('Found SSL certificates in /certificates/');
      return {
        key: fs.readFileSync('/certificates/server.key'),
        cert: fs.readFileSync('/certificates/server.crt')
      } as ServerOptions['https'];
    }
    console.log('Certificates not found in /certificates/');
    return undefined;
  } catch (error) {
    console.log('Error loading certificates:', error);
    return undefined;
  }
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    https: loadSSLCertificates(),
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
