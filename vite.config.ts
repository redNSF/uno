import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import glsl from 'vite-plugin-glsl';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    glsl({
      include: ['**/*.vert.glsl', '**/*.frag.glsl', '**/*.glsl'],
      warnDuplicatedImports: true,
      defaultExtension: 'glsl',
      compress: false,
      watch: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@game': path.resolve(__dirname, './src/game'),
      '@three': path.resolve(__dirname, './src/three'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@audio': path.resolve(__dirname, './src/audio'),
      '@animations': path.resolve(__dirname, './src/animations'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@textures': path.resolve(__dirname, './src/textures'),
      '@party': path.resolve(__dirname, './src/party'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'postprocessing': ['@react-three/postprocessing', 'postprocessing'],
          'gsap': ['gsap', '@gsap/react'],
          'physics': ['cannon-es'],
          'audio': ['howler'],
          'ui': ['react', 'react-dom', 'zustand'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei', 'gsap'],
  },
});
