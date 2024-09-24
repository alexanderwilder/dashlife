import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // Add if you're using path in your config

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Add any additional configuration if necessary
});