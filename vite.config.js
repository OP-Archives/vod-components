import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      babel: {
        plugins: [['babel-plugin-react-compiler', { target: '19' }]],
      },
    }),
    tailwindcss(),
    dts({
      include: ['src/**/*'],
      outDir: 'dist',
      insertTypesEntry: true,
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
          'lucide-react',
          'react-router-dom',
          'react-youtube',
          '@twemoji/api',
          'hls.js',
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
