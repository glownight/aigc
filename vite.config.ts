import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

const normalizeId = (id: string) => id.replace(/\\/g, '/')

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'

  return {
    plugins: [
      react({
        jsxRuntime: 'automatic',
      }),
      isProd &&
        (visualizer({
          filename: './dist/stats.html',
          open: false,
          gzipSize: true,
          brotliSize: true,
        }) as Plugin),
    ].filter(Boolean),

    build: {
      target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
      outDir: 'dist',
      cssCodeSplit: true,
      modulePreload: false,
      sourcemap: !isProd,
      chunkSizeWarningLimit: 1000,
      minify: isProd ? 'terser' : false,
      terserOptions: isProd
        ? {
            compress: {
              drop_console: false,
              drop_debugger: true,
              dead_code: true,
              conditionals: true,
              booleans: true,
              if_return: true,
              join_vars: true,
              unused: true,
            },
            mangle: {
              safari10: true,
            },
            format: {
              comments: false,
            },
          }
        : undefined,
      rollupOptions: {
        output: {
          manualChunks: (rawId) => {
            const id = normalizeId(rawId)

            if (
              id.includes('/node_modules/react-router/') ||
              id.includes('/node_modules/react-router-dom/')
            ) {
              return 'router'
            }

            if (
              id.includes('/node_modules/react/') ||
              id.includes('/node_modules/react-dom/') ||
              id.includes('/node_modules/scheduler/')
            ) {
              return 'react-core'
            }

            if (id.includes('/node_modules/framer-motion/')) {
              return 'framer-motion'
            }

            if (
              id.includes('/node_modules/react-markdown/') ||
              id.includes('/node_modules/remark-') ||
              id.includes('/node_modules/rehype-') ||
              id.includes('/node_modules/mdast-') ||
              id.includes('/node_modules/micromark/')
            ) {
              return 'markdown'
            }

            if (id.includes('/node_modules/highlight.js/')) {
              return 'highlight'
            }

            if (id.includes('/node_modules/@mlc-ai/web-llm/')) {
              return 'webllm'
            }

            if (id.includes('/node_modules/three/')) {
              return 'three-bg'
            }

            if (id.includes('/node_modules/')) {
              return 'vendor'
            }
          },
          chunkFileNames: isProd ? 'js/[name]-[hash].js' : 'js/[name].js',
          entryFileNames: isProd ? 'js/[name]-[hash].js' : 'js/[name].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.')
            const ext = info?.[info.length - 1]

            if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(assetInfo.name || '')) {
              return 'images/[name]-[hash][extname]'
            }

            if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name || '')) {
              return 'fonts/[name]-[hash][extname]'
            }

            if (ext === 'css') {
              return 'css/[name]-[hash][extname]'
            }

            return 'assets/[name]-[hash][extname]'
          },
        },
        treeshake: {
          moduleSideEffects: 'no-external',
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
        },
      },
      reportCompressedSize: false,
      cssMinify: true,
    },

    server: {
      port: 5177,
      strictPort: false,
      fs: {
        strict: false,
      },
      hmr: {
        overlay: false,
      },
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },

    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'react/jsx-runtime',
        'react-markdown',
        'remark-gfm',
        'rehype-highlight',
      ],
      exclude: ['@mlc-ai/web-llm'],
      force: false,
    },

    resolve: {
      alias: {
        '@': '/src',
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
    },

    envPrefix: 'VITE_',

    preview: {
      port: 5180,
      strictPort: false,
    },

    esbuild: {
      drop: isProd ? ['debugger'] : [],
      legalComments: 'none',
    },
  }
})
