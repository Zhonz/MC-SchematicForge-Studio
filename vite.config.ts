import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: './',
  plugins: [
    react({
      // 优化React的编译，提升开发体验
      babel: {
        babelrc: false,
        configFile: false,
      },
      // 热更新优化
      fastRefresh: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'ES2020',
    minify: 'esbuild',
    esbuild: {
      // 优化压缩
      drop: ['console', 'debugger'],
      legalComments: 'none',
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          three: ['three'],
          utils: ['zustand'],
        },
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
      // 优化打包
      treeshake: true,
    },
    sourcemap: process.env.NODE_ENV === 'development',
    chunkSizeWarningLimit: 800,
    // 预加载优化
    polyfillModulePreload: true,
  },
  server: {
    port: 5173,
    open: true,
    // 开发环境优化
    host: true,
    cors: true,
  },
  optimizeDeps: {
    // 预构建依赖，提升开发速度
    include: ['react', 'react-dom', 'three', 'zustand'],
    exclude: [],
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
})
