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
      entry: path.resolve(__dirname, 'src/index.js'),
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
          'video.js',
          'simplebar-react',
          'react-router-dom',
          'react-twemoji',
          'prop-types',
        ];
        return externals.some((pkg) => id === pkg || id.startsWith(pkg + '/'));
      },
    },
    sourcemap: true,
  },
});
