import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react({ jsxRuntime: 'automatic' }), tailwindcss()],
  root: __dirname,
  server: {
    port: 5174,
    open: true,
    fs: {
      allow: ['..'],
    },
  },
  resolve: {
    alias: {
      'vod-components': path.resolve(__dirname, '../src'),
      react: path.resolve(__dirname, '../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../node_modules/react-dom'),
    },
  },
});
