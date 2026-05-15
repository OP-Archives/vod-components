import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react({ jsxRuntime: 'automatic' })],
  root: __dirname,
  server: {
    port: 5174,
    open: true,
  },
  resolve: {
    alias: {
      'vod-components': path.resolve(__dirname, '../src'),
      react: path.resolve(__dirname, '../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../node_modules/react-dom'),
    },
  },
});
