import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量（如果需要的话）
  // const env = loadEnv(mode, process.cwd(), '')
  const isProd = mode === 'production'

  return {
    plugins: [
      react({
        // 在生产环境使用自动 JSX runtime
        jsxRuntime: 'automatic',
      }),
      // 打包分析插件（可选）
      isProd &&
      visualizer({
        filename: './dist/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      }) as Plugin,
    ].filter(Boolean),

    // 构建配置
    build: {
      // 目标浏览器
      target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
      // 输出目录
      outDir: 'dist',
      // 启用/禁用 CSS 代码拆分
      cssCodeSplit: true,
      // 启用源码映射（仅在开发模式）
      sourcemap: !isProd,
      // 设置chunk大小限制
      chunkSizeWarningLimit: 1000,
      // 压缩配置
      minify: isProd ? 'terser' : false,
      terserOptions: isProd
        ? {
          compress: {
            // 移除 console 和 debugger（保留 error 和 warn）
            drop_console: true,
            drop_debugger: true,
            // 移除无用的代码
            dead_code: true,
            // 优化条件表达式
            conditionals: true,
            // 优化布尔值
            booleans: true,
            // 优化 if 语句
            if_return: true,
            // 合并连续变量声明
            join_vars: true,
            // 移除无用的函数参数
            unused: true,
          },
          mangle: {
            // 混淆变量名
            safari10: true,
          },
          format: {
            // 移除注释
            comments: false,
          },
        }
        : undefined,
      // Rollup 配置
      rollupOptions: {
        output: {
          // 手动分块，将大型依赖分离
          manualChunks: (id) => {
            // React 核心库 - 高优先级，首先加载
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-core'
            }
            // 路由库 - 中等优先级
            if (id.includes('react-router')) {
              return 'router'
            }
            // Framer Motion 动画库
            if (id.includes('framer-motion')) {
              return 'framer-motion'
            }
            // Markdown 相关 - 按需加载
            if (
              id.includes('react-markdown') ||
              id.includes('remark') ||
              id.includes('rehype')
            ) {
              return 'markdown'
            }
            // 代码高亮 - 按需加载
            if (id.includes('highlight.js')) {
              return 'highlight'
            }
            // WebLLM - 最低优先级，延迟加载
            if (id.includes('@mlc-ai/web-llm')) {
              return 'webllm'
            }
            // 其他 node_modules 的大型库
            if (id.includes('node_modules')) {
              return 'vendor'
            }
          },
          // 文件命名
          chunkFileNames: isProd ? 'js/[name]-[hash].js' : 'js/[name].js',
          entryFileNames: isProd ? 'js/[name]-[hash].js' : 'js/[name].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.')
            const ext = info?.[info.length - 1]
            if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(assetInfo.name || '')) {
              return `images/[name]-[hash][extname]`
            }
            if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name || '')) {
              return `fonts/[name]-[hash][extname]`
            }
            if (ext === 'css') {
              return `css/[name]-[hash][extname]`
            }
            return `assets/[name]-[hash][extname]`
          },
        },
        // Tree-shaking 优化
        treeshake: {
          moduleSideEffects: 'no-external',
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
        },
      },
      // 性能优化
      reportCompressedSize: false, // 关闭文件大小报告，提升构建速度
      cssMinify: true, // CSS 压缩
    },

    // 开发服务器优化
    server: {
      // 端口
      port: 5177,
      // 严格的端口占用处理
      strictPort: false,
      // 预构建优化
      fs: {
        strict: false,
      },
      // 热更新优化
      hmr: {
        overlay: false,
      },
      // 预加载配置
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },

    // 依赖优化
    optimizeDeps: {
      // 预构建必要的库
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'react/jsx-runtime',
        'react-markdown',
        'remark-gfm',
        'rehype-highlight',
      ],
      // 排除大型库，延迟加载
      exclude: ['@mlc-ai/web-llm'],
      // 强制预构建优化
      force: false,
    },

    // 解析配置
    resolve: {
      // 路径别名
      alias: {
        '@': '/src',
      },
      // 扩展名
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
    },

    // 环境变量前缀
    envPrefix: 'VITE_',

    // 预加载配置
    preview: {
      port: 5180,
      strictPort: false,
    },

    // 性能优化
    esbuild: {
      // 生产环境移除 console
      drop: isProd ? ['console', 'debugger'] : [],
      // 压缩选项
      legalComments: 'none',
    },
  }
})
