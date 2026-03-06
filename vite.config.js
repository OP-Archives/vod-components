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
      name: 'VodComponents',
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: (id) => {
        const externals = [
          'react',
          'react-dom',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
          '@mui/material',
          '@mui/icons-material',
          '@mui/system',
          '@mui/utils',
          'video.js',
          'simplebar-react',
          'dayjs',
          'tinyduration',
          'react-router-dom',
          '@mui/x-date-pickers',
          'react-twemoji',
          '@feathersjs/feathers',
          '@feathersjs/rest-client',
          '@emotion/react',
          '@emotion/styled',
          'prop-types',
        ];
        return externals.some((pkg) => id === pkg || id.startsWith(pkg + '/'));
      },
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'ReactJsxRuntime',
          '@mui/material': '@mui/material',
          '@mui/icons-material': '@mui/icons-material',
          'video.js': 'videojs',
          'simplebar-react': 'SimpleBar',
          dayjs: 'dayjs',
          tinyduration: 'tinyduration',
          'react-router-dom': 'ReactRouterDOM',
          '@mui/x-date-pickers': '@mui/x-date-pickers',
          'react-twemoji': 'ReactTwemoji',
          '@feathersjs/feathers': 'FeathersJS',
          '@feathersjs/rest-client': 'RestClient',
          '@emotion/react': 'EmotionReact',
          '@emotion/styled': 'EmotionStyled',
          'prop-types': 'PropTypes',
        },
      },
    },
    sourcemap: true,
  },
});
