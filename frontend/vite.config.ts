import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import type { ServerOptions } from 'vite';

// Function to safely load SSL certificates
const loadSSLCertificates = () => {
  const currentDir = process.cwd();
  console.log('Current working directory:', currentDir);

  // Check if running locally
  const isLocalDev = currentDir.includes('/secure_file_share/frontend');
  const certPath = isLocalDev ? '../backend/certificates' : '/certificates';
  
  console.log(`Checking for certificates in: ${certPath}`);
  
  try {
    if (fs.existsSync(`${certPath}/server.key`) && fs.existsSync(`${certPath}/server.crt`)) {
      console.log('Found SSL certificates!');
      return {
        key: fs.readFileSync(`${certPath}/server.key`),
        cert: fs.readFileSync(`${certPath}/server.crt`)
      } as ServerOptions['https'];
    }
    console.log('Certificates not found');
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
