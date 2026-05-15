import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
    dts({
      include: ['src/**/*'],
      outDir: 'dist',
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: (id) => {
        const externals = [
          'react',
          'react-dom',
          'react/jsx-runtime',
          '@mui/material',
          '@mui/icons-material',
          '@mui/system',
          '@emotion/react',
          '@emotion/styled',
          'simplebar-react',
          'react-router-dom',
        ];
        return externals.some((pkg) => id === pkg || id.startsWith(pkg + '/'));
      },
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) return 'index.css';
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    sourcemap: true,
  },
});
