import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0', // Listen on all interfaces
    port: 3000,      // Use port 3000 for the development server
    hmr: {
      protocol: 'wss',   // Use WebSocket Secure protocol
      host: '66adc58a-4277-466d-9316-764327f12d64-00-3s35booxl2x8t.riker.replit.dev',
      clientPort: 443,   // HMR over port 443
    },
  },
});