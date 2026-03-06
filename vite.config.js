import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.js'),
      name: 'VodComponents',
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`
    },
    rollupOptions: {
      external: ['react', 'react-dom', '@mui/material', '@mui/icons-material', 'video.js', 'simplebar-react', 'dayjs', 'tinyduration', 'react-router-dom', '@mui/x-date-pickers', 'react-twemoji', '@feathersjs/feathers', '@feathersjs/rest-client', '@emotion/react', '@emotion/styled', 'prop-types'],
      output: {
        globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
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
        'prop-types': 'PropTypes'
      }
      }
    },
    sourcemap: true
  },
  plugins: [
    dts({
      include: ['src/**/*'],
      outDir: 'dist'
    })
  ]
});